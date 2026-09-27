const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const { USER_ROLES, VERIFICATION_STATUS } = require("../config/constants");

/**
 * Base User model (discriminator base) shared by Student, Business and Admin.
 * Role-specific fields live on the discriminator schemas (Student.js, Business.js).
 */
const geoPointSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ["Point"], default: "Point" },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true,
      default: [0, 0],
    },
  },
  { _id: false }
);

const options = { discriminatorKey: "role", timestamps: true, collection: "users" };

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email"],
    },
    phone: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      match: [/^[6-9]\d{9}$/, "Please provide a valid 10-digit mobile number"],
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
      select: false,
    },
    role: {
      type: String,
      enum: Object.values(USER_ROLES),
      required: true,
    },
    location: {
      type: String, // human-readable address
      default: "",
    },
    geoLocation: {
      type: geoPointSchema,
    },
    isEmailVerified: { type: Boolean, default: false },
    isPhoneVerified: { type: Boolean, default: false },
    verificationStatus: {
      type: String,
      enum: Object.values(VERIFICATION_STATUS),
      default: VERIFICATION_STATUS.PENDING,
    },
    isActive: { type: Boolean, default: true },
    isSuspended: { type: Boolean, default: false },
    suspensionReason: { type: String, default: "" },
    lastLoginAt: { type: Date },
    refreshToken: { type: String, select: false },
    passwordResetToken: { type: String, select: false },
    passwordResetExpires: { type: Date, select: false },
  },
  options
);

userSchema.index({ geoLocation: "2dsphere" });

userSchema.pre("save", async function hashPassword(next) {
  if (!this.isModified("password")) return next();
  const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS) || 10;
  this.password = await bcrypt.hash(this.password, saltRounds);
  next();
});

userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.toSafeObject = function toSafeObject() {
  const obj = this.toObject();
  delete obj.password;
  delete obj.refreshToken;
  delete obj.passwordResetToken;
  delete obj.passwordResetExpires;
  // Identity documents are sensitive and are never part of normal session/profile payloads.
  delete obj.documents;
  return obj;
};

const User = mongoose.model("User", userSchema);

module.exports = User;
