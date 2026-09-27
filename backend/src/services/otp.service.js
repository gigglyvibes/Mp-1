const bcrypt = require("bcryptjs");
const Otp = require("../models/Otp");
const generateOtp = require("../utils/generateOtp");
const ApiError = require("../utils/ApiError");
const { sendOtpEmail } = require("./email.service");
const { sendOtpSms } = require("./sms.service");

const EXPIRY_MINUTES = Number(process.env.OTP_EXPIRY_MINUTES) || 10;

/**
 * Generates, persists (hashed) and dispatches an OTP over the given
 * channel ("email" | "phone").
 */
const requestOtp = async ({ identifier, channel, purpose = "registration" }) => {
  const otp = generateOtp(6);
  const otpHash = await bcrypt.hash(otp, 10);
  const expiresAt = new Date(Date.now() + EXPIRY_MINUTES * 60 * 1000);

  // Invalidate previous unverified OTPs for the same identifier/purpose.
  await Otp.deleteMany({ identifier, channel, purpose, verified: false });

  await Otp.create({ identifier, channel, purpose, otpHash, expiresAt });

  if (channel === "email") {
    await sendOtpEmail(identifier, otp);
  } else {
    await sendOtpSms(identifier, otp);
  }

  return { identifier, channel, expiresAt };
};

/**
 * Verifies a submitted OTP against the stored hash. Enforces a max
 * attempt count to slow brute-force guessing.
 */
const verifyOtp = async ({ identifier, channel, purpose = "registration", code }) => {
  const record = await Otp.findOne({ identifier, channel, purpose, verified: false }).sort({ createdAt: -1 });

  if (!record) throw ApiError.badRequest("No pending OTP found. Please request a new one.");
  if (record.expiresAt < new Date()) throw ApiError.badRequest("OTP has expired. Please request a new one.");
  if (record.attempts >= 5) throw ApiError.badRequest("Too many incorrect attempts. Please request a new OTP.");

  const isMatch = await bcrypt.compare(code, record.otpHash);
  if (!isMatch) {
    record.attempts += 1;
    await record.save();
    throw ApiError.badRequest("Invalid OTP code.");
  }

  record.verified = true;
  await record.save();
  return true;
};

/**
 * Consumes a previously verified OTP for a specific identifier/channel/purpose.
 * Registration must prove the same identifier was verified instead of trusting
 * a client-supplied "verifiedChannel" flag.
 */
const consumeVerifiedOtp = async ({ identifier, channel, purpose = "registration" }) => {
  const record = await Otp.findOneAndDelete({
    identifier,
    channel,
    purpose,
    verified: true,
    expiresAt: { $gt: new Date() },
  });

  if (!record) {
    throw ApiError.badRequest("Please verify your email or phone with OTP before registering.");
  }

  return true;
};

module.exports = { requestOtp, verifyOtp, consumeVerifiedOtp };
