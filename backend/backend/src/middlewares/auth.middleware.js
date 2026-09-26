const { verifyToken } = require("../utils/generateToken");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");
const User = require("../models/User");

/**
 * Verifies the JWT access token from the Authorization header
 * and attaches the authenticated user to req.user.
 */
const protect = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw ApiError.unauthorized("Authentication token missing.");
  }

  const token = authHeader.split(" ")[1];

  let decoded;
  try {
    decoded = verifyToken(token, process.env.JWT_SECRET);
  } catch (err) {
    throw ApiError.unauthorized("Invalid or expired token.");
  }

  const user = await User.findById(decoded.id);
  if (!user) throw ApiError.unauthorized("User no longer exists.");
  if (user.isSuspended) throw ApiError.forbidden("Your account has been suspended.");
  if (!user.isActive) throw ApiError.forbidden("Your account is inactive.");

  req.user = user;
  next();
});

module.exports = { protect };
