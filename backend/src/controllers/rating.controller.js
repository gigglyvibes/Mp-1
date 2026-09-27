const asyncHandler = require("../utils/asyncHandler");
const ApiResponse = require("../utils/ApiResponse");
const ApiError = require("../utils/ApiError");
const Rating = require("../models/Rating");
const applicationRepository = require("../repositories/application.repository");
const { notifyUser } = require("../sockets/notification.socket");
const { APPLICATION_STATUS } = require("../config/constants");

/**
 * @route POST /api/v1/ratings/:applicationId
 * Business rates the Student after the business approves work completion.
 */
const rateStudent = asyncHandler(async (req, res) => {
  const application = await applicationRepository.findById(req.params.applicationId);
  if (!application) throw ApiError.notFound("Application not found.");
  if (application.business._id.toString() !== req.user._id.toString()) {
    throw ApiError.forbidden("Only the business who posted this job can rate the student.");
  }
  if (application.status !== APPLICATION_STATUS.COMPLETED) {
    throw ApiError.badRequest("You can only rate a student after the student's work is completed and approved.");
  }

  const existing = await Rating.findOne({ application: application._id, ratedBy: "business" });
  if (existing) throw ApiError.conflict("You have already rated this student for this job.");

  const rating = await Rating.create({
    job: application.job._id,
    application: application._id,
    business: req.user._id,
    student: application.student._id,
    ratedBy: "business",
    stars: req.body.stars,
    review: req.body.review || "",
    tags: req.body.tags || [],
  });

  await notifyUser({
    recipient: application.student._id,
    type: "RATING_RECEIVED",
    title: "You received a new rating ⭐",
    message: `${req.user.businessName || "The business"} gave you ${req.body.stars} star(s) for "${application.job.title}".`,
    relatedJob: application.job._id,
    relatedApplication: application._id,
  });

  new ApiResponse(201, rating, "Rating submitted successfully.").send(res);
});

/**
 * @route POST /api/v1/ratings/business/:applicationId
 * Student rates the Business after the job is completed.
 */
const rateBusiness = asyncHandler(async (req, res) => {
  const application = await applicationRepository.findById(req.params.applicationId);
  if (!application) throw ApiError.notFound("Application not found.");
  if (application.student._id.toString() !== req.user._id.toString()) {
    throw ApiError.forbidden("Only the student assigned to this job can rate the business.");
  }
  if (application.status !== APPLICATION_STATUS.COMPLETED) {
    throw ApiError.badRequest("You can only rate the business after the job is completed.");
  }

  const existing = await Rating.findOne({ application: application._id, ratedBy: "student" });
  if (existing) throw ApiError.conflict("You have already rated the business for this job.");

  const rating = await Rating.create({
    job: application.job._id,
    application: application._id,
    business: application.business._id,
    student: req.user._id,
    ratedBy: "student",
    stars: req.body.stars,
    review: req.body.review || "",
    tags: req.body.tags || [],
  });

  await notifyUser({
    recipient: application.business._id,
    type: "RATING_RECEIVED",
    title: "Student submitted a review ⭐",
    message: `${req.user.name || "A student"} gave your business ${req.body.stars} star(s) for "${application.job.title}".`,
    relatedJob: application.job._id,
    relatedApplication: application._id,
  });

  new ApiResponse(201, rating, "Rating submitted successfully.").send(res);
});

/**
 * @route GET /api/v1/ratings/application/:applicationId
 * Get both ratings for a specific application.
 */
const getApplicationRatings = asyncHandler(async (req, res) => {
  const ratings = await Rating.find({ application: req.params.applicationId });
  new ApiResponse(200, ratings, "Ratings retrieved successfully.").send(res);
});

/**
 * @route GET /api/v1/ratings/student/:studentId
 */
const getStudentRatings = asyncHandler(async (req, res) => {
  const ratings = await Rating.find({ student: req.params.studentId, ratedBy: "business" })
    .populate("business", "businessName profilePicture")
    .sort({ createdAt: -1 });
  new ApiResponse(200, ratings, "Ratings fetched successfully.").send(res);
});

module.exports = { rateStudent, rateBusiness, getApplicationRatings, getStudentRatings };
