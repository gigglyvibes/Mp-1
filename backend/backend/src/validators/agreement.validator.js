const { body } = require("express-validator");

const signAgreementValidator = [
  body("fullName").trim().notEmpty().withMessage("Full name is required as a digital signature."),
];

module.exports = { signAgreementValidator };
