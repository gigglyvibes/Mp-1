const { body } = require("express-validator");
const { MIN_STUDENT_AGE, MAX_STUDENT_AGE } = require("../config/constants");
const { UPI_REGEX } = require("../utils/upi");

const commonAccountFields = [
  body("email").isEmail().withMessage("A valid email is required").normalizeEmail(),
  body("phone").matches(/^[6-9]\d{9}$/).withMessage("Phone must be a valid 10-digit mobile number"),
  body("password").isLength({ min: 8 }).withMessage("Password must be at least 8 characters long"),
];

const registerStudentValidator = [
  ...commonAccountFields,
  body("name").trim().notEmpty().withMessage("Name is required"),
  body("age")
    .isInt({ min: MIN_STUDENT_AGE, max: MAX_STUDENT_AGE })
    .withMessage(`Age must be between ${MIN_STUDENT_AGE} and ${MAX_STUDENT_AGE}`),
  body("gender").isIn(["male", "female", "other"]).withMessage("Gender is required"),
  body("location").trim().notEmpty().withMessage("Location is required"),
  body("latitude").isFloat({ min: -90, max: 90 }).withMessage("Latitude must be between -90 and 90"),
  body("longitude").isFloat({ min: -180, max: 180 }).withMessage("Longitude must be between -180 and 180"),
  body("upiId")
    .trim()
    .notEmpty()
    .withMessage("UPI ID is required for direct student payouts")
    .matches(UPI_REGEX)
    .withMessage("Enter a valid UPI ID (e.g. yourname@okhdfcbank or 9876543210@paytm)"),
];

const registerBusinessValidator = [
  ...commonAccountFields,
  body("businessName").trim().notEmpty().withMessage("Business name is required"),
  body("ownerName").trim().notEmpty().withMessage("Owner name is required"),
  body("location").trim().notEmpty().withMessage("Location is required"),
  body("latitude").isFloat({ min: -90, max: 90 }).withMessage("Latitude must be between -90 and 90"),
  body("longitude").isFloat({ min: -180, max: 180 }).withMessage("Longitude must be between -180 and 180"),
];

const loginValidator = [
  body("identifier").notEmpty().withMessage("Email or phone is required"),
  body("password").notEmpty().withMessage("Password is required"),
];

const otpRequestValidator = [
  body("identifier").notEmpty().withMessage("Email or phone is required"),
  body("channel").isIn(["email", "phone"]).withMessage("Channel must be 'email' or 'phone'"),
];

const otpVerifyValidator = [
  ...otpRequestValidator,
  body("code").isLength({ min: 6, max: 6 }).withMessage("OTP must be 6 digits"),
];

const forgotPasswordValidator = [
  body("email").isEmail().withMessage("A valid email is required"),
];

const resetPasswordValidator = [
  body("token").notEmpty().withMessage("Reset token is required"),
  body("newPassword").isLength({ min: 8 }).withMessage("Password must be at least 8 characters long"),
];

module.exports = {
  registerStudentValidator,
  registerBusinessValidator,
  loginValidator,
  otpRequestValidator,
  otpVerifyValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
};
