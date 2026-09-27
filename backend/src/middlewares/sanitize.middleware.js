const xss = require("xss");

/**
 * Replacement for the unmaintained "xss-clean" package (deprecated,
 * no longer receives security updates). This does the same job —
 * recursively strips/escapes HTML & script content from incoming
 * request data — using the actively maintained "xss" library.
 *
 * Mutates req.body / req.query / req.params in place, same as
 * xss-clean did, so no other code needs to change.
 */
const sanitizeValue = (value) => {
  if (typeof value === "string") {
    return xss(value);
  }
  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }
  if (value && typeof value === "object") {
    for (const key of Object.keys(value)) {
      value[key] = sanitizeValue(value[key]);
    }
    return value;
  }
  return value;
};

const xssSanitizer = () => (req, res, next) => {
  if (req.body) req.body = sanitizeValue(req.body);
  if (req.query) sanitizeValue(req.query);
  if (req.params) sanitizeValue(req.params);
  next();
};

module.exports = xssSanitizer;
