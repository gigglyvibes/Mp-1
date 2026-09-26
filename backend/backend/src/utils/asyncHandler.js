/**
 * Wraps an async controller/middleware so rejected promises are
 * forwarded to Express's error-handling middleware instead of crashing.
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
