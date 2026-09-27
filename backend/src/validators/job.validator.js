const { body } = require("express-validator");

/**
 * Mirrors the "Create Job" validation rules from the product spec.
 */
const createJobValidator = [
  body("title").trim().notEmpty().withMessage("Job Title is required."),
  body("category").trim().notEmpty().withMessage("Category is required."),
  body("job").trim().notEmpty().withMessage("Job is required."),
  body("description")
    .trim()
    .isLength({ min: 20 })
    .withMessage("Description must contain at least 20 characters."),
  body("address").trim().notEmpty().withMessage("Location must be selected using the map."),
  body("latitude").isFloat({ min: -90, max: 90 }).withMessage("Latitude must be between -90 and 90."),
  body("longitude").isFloat({ min: -180, max: 180 }).withMessage("Longitude must be between -180 and 180."),
  body("price").isFloat({ gt: 0 }).withMessage("Price must be greater than ₹0."),
  body("requiredStudents").isInt({ gt: 0 }).withMessage("Required Students must be greater than 0."),
  body("startDateTime")
    .isISO8601()
    .withMessage("Job Start Date is required.")
    .custom((value) => {
      const startDate = new Date(value);
      if (Number.isNaN(startDate.getTime())) return false;
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      return startDate >= todayStart;
    })
    .withMessage("Job Start Date cannot be in the past."),
  body("endDateTime")
    .isISO8601()
    .withMessage("Job End Date is required.")
    .custom((value, { req }) => {
      const startDate = new Date(req.body.startDateTime);
      const endDate = new Date(value);
      return !Number.isNaN(startDate.getTime()) && !Number.isNaN(endDate.getTime()) && endDate >= startDate;
    })
    .withMessage("Job End Date cannot be before the Job Start Date."),
  body("contactNumber")
    .matches(/^[6-9]\d{9}$/)
    .withMessage("Contact Number must be a valid 10-digit mobile number."),
  body("genderPreference").optional().isIn(["male", "female", "any"]),
];

module.exports = { createJobValidator };
