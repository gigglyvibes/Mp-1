const userRepository = require("../repositories/user.repository");
const Student = require("../models/Student");
const Business = require("../models/Business");
const ApiError = require("../utils/ApiError");
const { generateAccessToken, generateRefreshToken } = require("../utils/generateToken");
const { USER_ROLES } = require("../config/constants");
const otpService = require("./otp.service");
const crypto = require("crypto");
const { normalizeUpi } = require("../utils/upi");

const buildAuthTokens = (user) => {
  const payload = { id: user._id, role: user.role };
  return {
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken(payload),
  };
};

/**
 * Registers a Student. Expects an Aadhaar document to already be uploaded
 * (handled by the controller via upload.service) and OTP to already be
 * verified for at least one channel before this is called.
 */
const registerStudent = async (payload) => {
  const existing = await userRepository.findByEmailOrPhone(payload.email, payload.phone);
  if (existing) throw ApiError.conflict("An account with this email or phone already exists.");

  const verifiedChannel = payload.verifiedChannel;
  if (!["email", "phone"].includes(verifiedChannel)) {
    throw ApiError.badRequest("A verified OTP channel is required.");
  }
  const verifiedIdentifier = verifiedChannel === "email" ? payload.email : payload.phone;
  await otpService.consumeVerifiedOtp({
    identifier: verifiedIdentifier,
    channel: verifiedChannel,
    purpose: "registration",
  });

  const student = await Student.create({
    email: payload.email,
    phone: payload.phone,
    password: payload.password,
    role: USER_ROLES.STUDENT,
    name: payload.name,
    age: payload.age,
    gender: payload.gender,
    about: payload.about,
    collegeName: payload.collegeName,
    upiId: normalizeUpi(payload.upiId),
    location: payload.location,
    geoLocation: { type: "Point", coordinates: [payload.longitude, payload.latitude] },
    documents: payload.documents,
    isEmailVerified: payload.verifiedChannel === "email",
    isPhoneVerified: payload.verifiedChannel === "phone",
  });

  return student;
};

const registerBusiness = async (payload) => {
  const existing = await userRepository.findByEmailOrPhone(payload.email, payload.phone);
  if (existing) throw ApiError.conflict("An account with this email or phone already exists.");

  const verifiedChannel = payload.verifiedChannel;
  if (!["email", "phone"].includes(verifiedChannel)) {
    throw ApiError.badRequest("A verified OTP channel is required.");
  }
  const verifiedIdentifier = verifiedChannel === "email" ? payload.email : payload.phone;
  await otpService.consumeVerifiedOtp({
    identifier: verifiedIdentifier,
    channel: verifiedChannel,
    purpose: "registration",
  });

  const business = await Business.create({
    email: payload.email,
    phone: payload.phone,
    password: payload.password,
    role: USER_ROLES.BUSINESS,
    businessName: payload.businessName,
    ownerName: payload.ownerName,
    businessType: payload.businessType || "General",
    businessDescription: payload.businessDescription,
    location: payload.location,
    geoLocation: { type: "Point", coordinates: [payload.longitude, payload.latitude] },
    profilePicture: payload.profilePicture,
    isEmailVerified: payload.verifiedChannel === "email",
    isPhoneVerified: payload.verifiedChannel === "phone",
  });

  return business;
};

const login = async ({ identifier, password }) => {
  const user = await userRepository.findByEmailOrPhone(identifier);
  if (!user) throw ApiError.unauthorized("Invalid credentials.");

  const isMatch = await user.comparePassword(password);
  if (!isMatch) throw ApiError.unauthorized("Invalid credentials.");

  if (user.isSuspended) throw ApiError.forbidden("Your account has been suspended.");

  user.lastLoginAt = new Date();
  const { accessToken, refreshToken } = buildAuthTokens(user);
  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  return { user, accessToken, refreshToken };
};

const refreshAccessToken = async (userId, incomingRefreshToken) => {
  const user = await userRepository.findById(userId).select("+refreshToken");
  if (!user || user.refreshToken !== incomingRefreshToken) {
    throw ApiError.unauthorized("Invalid refresh token.");
  }
  const { accessToken, refreshToken } = buildAuthTokens(user);
  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });
  return { accessToken, refreshToken };
};

const logout = async (userId) => {
  await userRepository.updateById(userId, { refreshToken: null });
};

const forgotPassword = async (email) => {
  const user = await userRepository.findByEmail(email);
  if (!user) return; // Do not reveal whether the email exists.

  const resetToken = crypto.randomBytes(32).toString("hex");
  const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");

  user.passwordResetToken = hashedToken;
  user.passwordResetExpires = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
  await user.save({ validateBeforeSave: false });

  const { sendEmail } = require("./email.service");
  const resetUrl = `${process.env.CLIENT_URL || "http://localhost:5173"}/reset-password?token=${resetToken}`;
  await sendEmail({
    to: user.email,
    subject: "Reset your password",
    html: `<p>Click the link below to reset your password (valid for 30 minutes):</p><p><a href="${resetUrl}">${resetUrl}</a></p>`,
    text: `Reset your password using this link (valid for 30 minutes): ${resetUrl}`,
  });

  return resetToken;
};

const resetPassword = async ({ token, newPassword }) => {
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
  const User = require("../models/User");
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: new Date() },
  }).select("+password +passwordResetToken +passwordResetExpires");

  if (!user) throw ApiError.badRequest("Reset token is invalid or has expired.");

  user.password = newPassword;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  return user;
};

module.exports = {
  registerStudent,
  registerBusiness,
  login,
  refreshAccessToken,
  logout,
  forgotPassword,
  resetPassword,
  buildAuthTokens,
};
