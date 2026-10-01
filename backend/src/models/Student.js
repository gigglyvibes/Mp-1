const mongoose = require("mongoose");
const User = require("./User");
const { USER_ROLES } = require("../config/constants");

/**
 * Student discriminator - extends base User with student-specific fields:
 * identity documents, age validation, college info, UPI details, and rating aggregates.
 */
const studentSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  age: {
    type: Number,
    required: true,
    min: [18, "Student must be at least 18 years old"],
    max: [26, "Student must not be older than 26 years"],
  },
  gender: {
    type: String,
    enum: ["male", "female", "other"],
    required: true,
  },
  about: { type: String, maxlength: 500, default: "" },
  collegeName: { type: String, trim: true },
  upiId: { type: String, trim: true, default: "" },
  documents: {
    aadhaarCard: {
      url: { type: String, required: true },
      publicId: { type: String },
    },
  },
  profilePicture: {
    url: { type: String, default: "" },
    publicId: { type: String, default: "" },
  },
  averageRating: { type: Number, default: 0, min: 0, max: 5 },
  totalRatings: { type: Number, default: 0 },
  completedJobsCount: { type: Number, default: 0 },
});

const Student = User.discriminator(USER_ROLES.STUDENT, studentSchema);

module.exports = Student;
