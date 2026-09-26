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
    throw ApiError.forbidden("Only the businessman who posted this job can rate the student.");
  }
  if (application.status !== APPLICATION_STATUS.COMPLETED) {
    throw ApiError.badRequest("You can only rate a student after the student's work is completed and approved.");
  }

  const existing = await Rating.findOne({ application: application._id });
  if (existing) throw ApiError.conflict("You have already rated this student for this job.");

  const rating = await Rating.create({
    job: application.job._id,
    application: application._id,
    business: req.user._id,
    student: application.student._id,
    stars: req.body.stars,
    review: req.body.review,
  });

  await notifyUser({
    recipient: application.student._id,
    type: "RATING_RECEIVED",
    title: "You received a new rating",
    message: `${req.user.businessName || "A business"} rated you ${req.body.stars} star(s) for "${application.job.title}".`,
    relatedJob: application.job._id,
    relatedApplication: application._id,
  });

  new ApiResponse(201, rating, "Rating submitted successfully.").send(res);
});

/**
 * @route GET /api/v1/ratings/student/:studentId
 */
const getStudentRatings = asyncHandler(async (req, res) => {
  const ratings = await Rating.find({ student: req.params.studentId })
    .populate("business", "businessName profilePicture")
    .sort({ createdAt: -1 });
  new ApiResponse(200, ratings, "Ratings fetched successfully.").send(res);
});

module.exports = { rateStudent, getStudentRatings };
