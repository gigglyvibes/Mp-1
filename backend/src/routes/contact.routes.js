const express = require("express");
const router = express.Router();
const contactController = require("../controllers/contact.controller");
const { submitContactMessageValidator } = require("../validators/contact.validator");
const validate = require("../middlewares/validate.middleware");
const { contactLimiter } = require("../middlewares/rateLimiter.middleware");

router.post("/", contactLimiter, submitContactMessageValidator, validate, contactController.submitContactMessage);

module.exports = router;
