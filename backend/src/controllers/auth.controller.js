const asyncHandler = require("../utils/asyncHandler");
const ApiResponse = require("../utils/ApiResponse");
const ApiError = require("../utils/ApiError");
const authService = require("../services/auth.service");
const otpService = require("../services/otp.service");
const { uploadMultiple } = require("../services/upload.service");

/**
 * @route POST /api/v1/auth/otp/request
 * Sends an OTP to email or phone for registration/login/password reset.
 */
const requestOtp = asyncHandler(async (req, res) => {
  const { identifier, channel, purpose } = req.body;
  const result = await otpService.requestOtp({ identifier, channel, purpose });
  new ApiResponse(200, result, `OTP sent via ${channel}.`).send(res);
});

/**
 * @route POST /api/v1/auth/otp/verify
 * Verifies a submitted OTP (used as a precondition before registration).
 */
const verifyOtp = asyncHandler(async (req, res) => {
  const { identifier, channel, purpose, code } = req.body;
  await otpService.verifyOtp({ identifier, channel, purpose, code });
  new ApiResponse(200, { verified: true }, "OTP verified successfully.").send(res);
});

/**
 * @route POST /api/v1/auth/register/student
 * Requires: prior OTP verification for email or phone, and an Aadhaar Card.
 */
const registerStudent = asyncHandler(async (req, res) => {
  const files = req.files || {};
  if (!files.aadhaarCard?.[0]) {
    throw ApiError.badRequest("Aadhaar Card is required.");
  }
  const [aadhaarUpload] = await uploadMultiple([files.aadhaarCard[0]], "documents/aadhaar");

  const student = await authService.registerStudent({
    ...req.body,
    latitude: Number(req.body.latitude),
    longitude: Number(req.body.longitude),
    age: Number(req.body.age),
    documents: { aadhaarCard: aadhaarUpload },
  });

  const { accessToken, refreshToken } = authService.buildAuthTokens(student);
  student.refreshToken = refreshToken;
  await student.save({ validateBeforeSave: false });

  new ApiResponse(
    201,
    { user: student.toSafeObject(), accessToken, refreshToken },
    "Student registered successfully. Verification is pending."
  ).send(res);
});

/**
 * @route POST /api/v1/auth/register/business
 */
const registerBusiness = asyncHandler(async (req, res) => {
  let profilePicture = { url: "", publicId: "" };
  if (req.files?.profilePicture?.[0]) {
    [profilePicture] = await uploadMultiple([req.files.profilePicture[0]], "business/profile");
  }

  const business = await authService.registerBusiness({
    ...req.body,
    latitude: Number(req.body.latitude),
    longitude: Number(req.body.longitude),
    profilePicture,
  });

  const { accessToken, refreshToken } = authService.buildAuthTokens(business);
  business.refreshToken = refreshToken;
  await business.save({ validateBeforeSave: false });

  new ApiResponse(
    201,
    { user: business.toSafeObject(), accessToken, refreshToken },
    "Business account registered successfully."
  ).send(res);
});

/**
 * @route POST /api/v1/auth/login
 */
const login = asyncHandler(async (req, res) => {
  const { identifier, password } = req.body;
  const { user, accessToken, refreshToken } = await authService.login({ identifier, password });
  new ApiResponse(200, { user: user.toSafeObject(), accessToken, refreshToken }, "Login successful.").send(res);
});

/**
 * @route POST /api/v1/auth/refresh-token
 */
const refreshToken = asyncHandler(async (req, res) => {
  const { userId, refreshToken: token } = req.body;
  const tokens = await authService.refreshAccessToken(userId, token);
  new ApiResponse(200, tokens, "Token refreshed.").send(res);
});

/**
 * @route POST /api/v1/auth/logout
 */
const logout = asyncHandler(async (req, res) => {
  await authService.logout(req.user._id);
  new ApiResponse(200, null, "Logged out successfully.").send(res);
});

/**
 * @route POST /api/v1/auth/forgot-password
 */
const forgotPassword = asyncHandler(async (req, res) => {
  await authService.forgotPassword(req.body.email);
  new ApiResponse(200, null, "If an account with that email exists, a reset link has been sent.").send(res);
});

/**
 * @route POST /api/v1/auth/reset-password
 */
const resetPassword = asyncHandler(async (req, res) => {
  const { token, newPassword } = req.body;
  await authService.resetPassword({ token, newPassword });
  new ApiResponse(200, null, "Password has been reset successfully.").send(res);
});

/**
 * @route GET /api/v1/auth/me
 */
const getMe = asyncHandler(async (req, res) => {
  new ApiResponse(200, req.user.toSafeObject(), "Current user fetched.").send(res);
});

module.exports = {
  requestOtp,
  verifyOtp,
  registerStudent,
  registerBusiness,
  login,
  refreshToken,
  logout,
  forgotPassword,
  resetPassword,
  getMe,
};
