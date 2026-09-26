const mongoose = require("mongoose");

/**
 * Short-lived OTP records for email/phone verification and password reset.
 * A TTL index automatically deletes expired documents.
 */
const otpSchema = new mongoose.Schema(
  {
    identifier: { type: String, required: true, index: true }, // email or phone
    channel: { type: String, enum: ["email", "phone"], required: true },
    purpose: {
      type: String,
      enum: ["registration", "login", "password_reset"],
      default: "registration",
    },
    otpHash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    attempts: { type: Number, default: 0 },
    verified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("Otp", otpSchema);
