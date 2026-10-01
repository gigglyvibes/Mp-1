const asyncHandler = require("../utils/asyncHandler");
const ApiResponse = require("../utils/ApiResponse");
const ApiError = require("../utils/ApiError");
const Student = require("../models/Student");
const { uploadMultiple } = require("../services/upload.service");

/**
 * @route GET /api/v1/students/profile
 */
const getProfile = asyncHandler(async (req, res) => {
  new ApiResponse(200, req.user.toSafeObject(), "Profile fetched successfully.").send(res);
});

/**
 * @route PATCH /api/v1/students/profile
 */
const updateProfile = asyncHandler(async (req, res) => {
  const allowedFields = ["name", "about", "collegeName", "location", "upiId"];
  const updates = {};

  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  });

  const hasLatitude = req.body.latitude !== undefined;
  const hasLongitude = req.body.longitude !== undefined;
  if (hasLatitude !== hasLongitude) {
    throw ApiError.badRequest("Latitude and longitude must be provided together.");
  }
  if (hasLatitude && hasLongitude) {
    const latitude = Number(req.body.latitude);
    const longitude = Number(req.body.longitude);
    if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90 || !Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
      throw ApiError.badRequest("Latitude or longitude is invalid.");
    }
    updates.geoLocation = {
      type: "Point",
      coordinates: [longitude, latitude],
    };
  }

  if (req.files?.profilePicture?.[0]) {
    const [uploaded] = await uploadMultiple([req.files.profilePicture[0]], "students/profile");
    updates.profilePicture = uploaded;
  }

  const student = await Student.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true });
  new ApiResponse(200, student.toSafeObject(), "Profile updated successfully.").send(res);
});

/**
 * @route GET /api/v1/students/:id
 * Public-facing student profile (for a business viewing an applicant).
 */
const getStudentById = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.params.id).select(
    "name age gender about collegeName upiId profilePicture averageRating totalRatings completedJobsCount verificationStatus"
  );
  if (!student) throw ApiError.notFound("Student not found.");
  new ApiResponse(200, student, "Student profile fetched.").send(res);
});

module.exports = { getProfile, updateProfile, getStudentById };
