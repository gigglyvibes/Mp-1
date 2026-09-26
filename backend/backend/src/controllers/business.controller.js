const asyncHandler = require("../utils/asyncHandler");
const ApiResponse = require("../utils/ApiResponse");
const ApiError = require("../utils/ApiError");
const Business = require("../models/Business");
const jobRepository = require("../repositories/job.repository");
const { uploadMultiple } = require("../services/upload.service");
const { JOB_STATUS } = require("../config/constants");

/**
 * @route GET /api/v1/businesses/profile
 */
const getProfile = asyncHandler(async (req, res) => {
  new ApiResponse(200, req.user.toSafeObject(), "Profile fetched successfully.").send(res);
});

/**
 * @route PATCH /api/v1/businesses/profile
 */
const updateProfile = asyncHandler(async (req, res) => {
  const allowedFields = ["businessName", "ownerName", "businessType", "businessDescription", "location"];
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
    const [uploaded] = await uploadMultiple([req.files.profilePicture[0]], "business/profile");
    updates.profilePicture = uploaded;
  }

  const business = await Business.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true });
  new ApiResponse(200, business.toSafeObject(), "Profile updated successfully.").send(res);
});

/**
 * @route GET /api/v1/businesses/analytics
 * Simple dashboard analytics: totals by job status.
 */
const getAnalytics = asyncHandler(async (req, res) => {
  const Job = require("../models/Job");
  const [total, published, active, completed, cancelled, draft] = await Promise.all([
    Job.countDocuments({ business: req.user._id }),
    Job.countDocuments({ business: req.user._id, status: JOB_STATUS.PUBLISHED }),
    Job.countDocuments({ business: req.user._id, status: JOB_STATUS.ACTIVE }),
    Job.countDocuments({ business: req.user._id, status: JOB_STATUS.COMPLETED }),
    Job.countDocuments({ business: req.user._id, status: JOB_STATUS.CANCELLED }),
    Job.countDocuments({ business: req.user._id, status: JOB_STATUS.DRAFT }),
  ]);

  new ApiResponse(
    200,
    { total, draft, published, active, completed, cancelled },
    "Analytics fetched successfully."
  ).send(res);
});

/**
 * @route GET /api/v1/businesses/:id
 */
const getBusinessById = asyncHandler(async (req, res) => {
  const business = await Business.findById(req.params.id).select(
    "businessName ownerName businessType businessDescription profilePicture averageRatingGiven totalJobsPosted totalJobsCompleted"
  );
  if (!business) throw ApiError.notFound("Business not found.");
  new ApiResponse(200, business, "Business profile fetched.").send(res);
});

module.exports = { getProfile, updateProfile, getAnalytics, getBusinessById };
