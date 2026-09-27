const express = require("express");
const router = express.Router();
const multer = require("multer");
const upload = require("../middlewares/upload.middleware");
const { authLimiter, otpLimiter } = require("../middlewares/rateLimiter.middleware");
const validate = require("../middlewares/validate.middleware");
const { protect } = require("../middlewares/auth.middleware");
const {
  registerStudentValidator,
  registerBusinessValidator,
  loginValidator,
  otpRequestValidator,
  otpVerifyValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
} = require("../validators/auth.validator");
const authController = require("../controllers/auth.controller");

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Registration, login, OTP verification, and password management
 */

router.post("/otp/request", otpLimiter, otpRequestValidator, validate, authController.requestOtp);
router.post("/otp/verify", otpLimiter, otpVerifyValidator, validate, authController.verifyOtp);

router.post(
  "/register/student",
  upload.fields([
    { name: "aadhaarCard", maxCount: 1 },
  ]),
  registerStudentValidator,
  validate,
  authController.registerStudent
);

router.post(
  "/register/business",
  upload.fields([{ name: "profilePicture", maxCount: 1 }]),
  registerBusinessValidator,
  validate,
  authController.registerBusiness
);

router.post("/login", authLimiter, loginValidator, validate, authController.login);
router.post("/refresh-token", authController.refreshToken);
router.post("/logout", protect, authController.logout);
router.post("/forgot-password", authLimiter, forgotPasswordValidator, validate, authController.forgotPassword);
router.post("/reset-password", authLimiter, resetPasswordValidator, validate, authController.resetPassword);
router.get("/me", protect, authController.getMe);

module.exports = router;
