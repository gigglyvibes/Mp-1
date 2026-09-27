const { validationResult } = require("express-validator");
const ApiError = require("../utils/ApiError");

/**
 * Runs after express-validator chains; collects any validation errors
 * and forwards a single, consistent ApiError.
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();

  const formatted = errors.array().map((e) => ({ field: e.path, message: e.msg }));
  next(ApiError.badRequest("Validation failed", formatted));
};

module.exports = validate;
