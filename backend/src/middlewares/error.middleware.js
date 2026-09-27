const ApiError = require("../utils/ApiError");

/**
 * Catches unmatched routes.
 */
const notFound = (req, res, next) => {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
};

/**
 * Centralized error handler. Normalizes Mongoose/JWT/Multer errors into
 * the ApiError shape so responses are always consistent.
 */
const errorHandler = (err, req, res, next) => {
  let error = err;

  if (!(error instanceof ApiError)) {
    let statusCode = error.statusCode || 500;
    let message = error.message || "Internal Server Error";

    if (error.name === "ValidationError") {
      statusCode = 400;
      message = Object.values(error.errors).map((e) => e.message).join(", ");
    } else if (error.code === 11000) {
      statusCode = 409;
      const field = Object.keys(error.keyValue || {})[0];
      message = `Duplicate value for field: ${field}`;
    } else if (error.name === "CastError") {
      statusCode = 400;
      message = `Invalid value for field: ${error.path}`;
    } else if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
      statusCode = 401;
      message = "Invalid or expired authentication token.";
    }

    error = new ApiError(statusCode, message);
  }

  if (process.env.NODE_ENV === "development") {
    console.error(err);
  }

  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message,
    errors: error.errors || [],
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

module.exports = { notFound, errorHandler };
