const asyncHandler = require("../utils/asyncHandler");
const ApiResponse = require("../utils/ApiResponse");
const ApiError = require("../utils/ApiError");
const User = require("../models/User");
const Job = require("../models/Job");
const userRepository = require("../repositories/user.repository");
const { notifyUser } = require("../sockets/notification.socket");
const { USER_ROLES, VERIFICATION_STATUS, JOB_STATUS } = require("../config/constants");

/**
 * @route GET /api/v1/admin/dashboard
 */
const getDashboard = asyncHandler(async (req, res) => {
  const [totalStudents, totalBusinesses, pendingVerifications, totalJobs, activeJobs, completedJobs, suspendedAccounts] =
    await Promise.all([
      User.countDocuments({ role: USER_ROLES.STUDENT }),
      User.countDocuments({ role: USER_ROLES.BUSINESS }),
      User.countDocuments({ verificationStatus: VERIFICATION_STATUS.PENDING, role: USER_ROLES.STUDENT }),
      Job.countDocuments({}),
      Job.countDocuments({ status: JOB_STATUS.ACTIVE }),
      Job.countDocuments({ status: JOB_STATUS.COMPLETED }),
      User.countDocuments({ isSuspended: true }),
    ]);

  new ApiResponse(
    200,
    { totalStudents, totalBusinesses, pendingVerifications, totalJobs, activeJobs, completedJobs, suspendedAccounts },
    "Dashboard analytics fetched."
  ).send(res);
});

/**
 * @route GET /api/v1/admin/users?role=&verificationStatus=&page=&limit=
 */
const listUsers = asyncHandler(async (req, res) => {
  const { role, verificationStatus, page = 1, limit = 20 } = req.query;
  const pageNumber = Number(page);
  const limitNumber = Number(limit);
  if (!Number.isInteger(pageNumber) || pageNumber < 1 || !Number.isInteger(limitNumber) || limitNumber < 1 || limitNumber > 100) {
    throw ApiError.badRequest("page must be >= 1 and limit must be between 1 and 100.");
  }
  const [items, total] = await Promise.all([
    userRepository.list({ role, verificationStatus, page: pageNumber, limit: limitNumber }),
    userRepository.count({ ...(role && { role }), ...(verificationStatus && { verificationStatus }) }),
  ]);
  new ApiResponse(200, { items, total, page: pageNumber }, "Users fetched.").send(res);
});

/**
 * @route PATCH /api/v1/admin/users/:id/verify
 * Verifies (or rejects) a student's uploaded Aadhaar document.
 */
const verifyDocuments = asyncHandler(async (req, res) => {
  const { decision, reason } = req.body; // "verified" | "rejected"
  if (![VERIFICATION_STATUS.VERIFIED, VERIFICATION_STATUS.REJECTED].includes(decision)) {
    throw ApiError.badRequest("Decision must be 'verified' or 'rejected'.");
  }

  const user = await userRepository.findById(req.params.id);
  if (!user) throw ApiError.notFound("User not found.");
  if (user.role !== USER_ROLES.STUDENT) {
    throw ApiError.badRequest("Only student identity documents can be verified here.");
  }
  if (decision === VERIFICATION_STATUS.VERIFIED && !user.documents?.aadhaarCard?.url) {
    throw ApiError.badRequest("Aadhaar Card is required before verification.");
  }
  user.verificationStatus = decision;
  await user.save();

  await notifyUser({
    recipient: user._id,
    type: decision === VERIFICATION_STATUS.VERIFIED ? "DOCUMENT_VERIFIED" : "DOCUMENT_REJECTED",
    title: decision === VERIFICATION_STATUS.VERIFIED ? "Student verification completed" : "Student verification rejected",
    message:
      decision === VERIFICATION_STATUS.VERIFIED
        ? "Your Aadhaar has been reviewed and your identity and age eligibility have been verified."
        : `Your documents were rejected. Reason: ${reason || "Not specified"}`,
  });

  new ApiResponse(200, user.toSafeObject(), `Student verification ${decision}.`).send(res);
});

/**
 * @route PATCH /api/v1/admin/users/:id/suspend
 */
const suspendUser = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  const user = await userRepository.updateById(req.params.id, {
    isSuspended: true,
    suspensionReason: reason || "Violation of platform terms.",
  });
  if (!user) throw ApiError.notFound("User not found.");

  await notifyUser({
    recipient: user._id,
    type: "ACCOUNT_SUSPENDED",
    title: "Account suspended",
    message: `Your account has been suspended. Reason: ${user.suspensionReason}`,
  });

  new ApiResponse(200, user.toSafeObject(), "User suspended.").send(res);
});

/**
 * @route PATCH /api/v1/admin/users/:id/unsuspend
 */
const unsuspendUser = asyncHandler(async (req, res) => {
  const user = await userRepository.updateById(req.params.id, { isSuspended: false, suspensionReason: "" });
  if (!user) throw ApiError.notFound("User not found.");
  new ApiResponse(200, user.toSafeObject(), "User reinstated.").send(res);
});

/**
 * @route GET /api/v1/admin/jobs?status=&page=&limit=
 */
const listAllJobs = asyncHandler(async (req, res) => {
  const jobRepository = require("../repositories/job.repository");
  const { status, page = 1, limit = 20 } = req.query;
  const result = await jobRepository.paginate({ filter: status ? { status } : {}, page: Number(page), limit: Number(limit) });
  new ApiResponse(200, result, "Jobs fetched.").send(res);
});

/**
 * @route DELETE /api/v1/admin/jobs/:id
 * Admin can remove a job that violates platform terms.
 */
const removeJob = asyncHandler(async (req, res) => {
  const job = await Job.findByIdAndDelete(req.params.id);
  if (!job) throw ApiError.notFound("Job not found.");
  new ApiResponse(200, null, "Job removed.").send(res);
});

module.exports = { getDashboard, listUsers, verifyDocuments, suspendUser, unsuspendUser, listAllJobs, removeJob };
