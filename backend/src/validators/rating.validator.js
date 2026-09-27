const { body } = require("express-validator");

const createRatingValidator = [
  body("stars").isInt({ min: 1, max: 5 }).withMessage("Stars must be between 1 and 5."),
  body("review").optional().isLength({ max: 1000 }),
];

module.exports = { createRatingValidator };
