const { body } = require("express-validator");

const submitContactMessageValidator = [
  body("name").trim().notEmpty().withMessage("Name is required").isLength({ max: 100 }).withMessage("Name is too long"),
  body("email").isEmail().withMessage("A valid email is required").normalizeEmail(),
  body("message")
    .trim()
    .notEmpty()
    .withMessage("Message is required")
    .isLength({ min: 10, max: 2000 })
    .withMessage("Message must be between 10 and 2000 characters"),
];

module.exports = { submitContactMessageValidator };
