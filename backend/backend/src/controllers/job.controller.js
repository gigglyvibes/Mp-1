const asyncHandler = require("../utils/asyncHandler");
const ApiResponse = require("../utils/ApiResponse");
const ApiError = require("../utils/ApiError");
const jobRepository = require("../repositories/job.repository");
const jobService = require("../services/job.service");
const { uploadMultiple } = require("../services/upload.service");
const { findNearbyJobs } = require("../services/geo.service");
const { JOB_STATUS } = require("../config/constants");

/**
 * @route POST /api/v1/jobs
 * Businessman creates a job (Publish Job or Save as Draft).
 */
const createJob = asyncHandler(async (req, res) => {
  let images = [];
  if (req.files?.length) {
    if (req.files.length > 5) throw ApiError.badRequest("Maximum of 5 images can be uploaded.");
    images = await uploadMultiple(req.files, "jobs");
  }

  const job = await jobService.createJob(req.user._id, {
    ...req.body,
    latitude: Number(req.body.latitude),
    longitude: Number(req.body.longitude),
    price: Number(req.body.price),
    requiredStudents: Number(req.body.requiredStudents),
    saveAsDraft: req.body.saveAsDraft === "true" || req.body.saveAsDraft === true,
    images,
    skillsRequired: req.body.skillsRequired
      ? String(req.body.skillsRequired).split(",").map((s) => s.trim())
      : [],
  });

  new ApiResponse(201, job, job.status === JOB_STATUS.DRAFT ? "Job saved as draft." : "Job published successfully.").send(res);
});

/**
 * @route GET /api/v1/jobs
 * Supports pagination, search, category filter, and status filter.
 */
const listJobs = asyncHandler(async (req, res) => {
  await jobRepository.expireOverdueJobs();
  const { page = 1, limit = 10, category, search, status = JOB_STATUS.PUBLISHED } = req.query;
  const pageNumber = Number(page);
  const limitNumber = Number(limit);
  if (!Number.isInteger(pageNumber) || pageNumber < 1 || !Number.isInteger(limitNumber) || limitNumber < 1 || limitNumber > 100) {
    throw ApiError.badRequest("page must be >= 1 and limit must be between 1 and 100.");
  }

  const filter = { status };
  if (category) filter.category = category;
  if (search) {
    const escapedSearch = String(search).slice(0, 100).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    filter.title = { $regex: escapedSearch, $options: "i" };
  }

  const result = await jobRepository.paginate({ filter, page: pageNumber, limit: limitNumber });
  new ApiResponse(200, result, "Jobs fetched successfully.").send(res);
});

/**
 * @route GET /api/v1/jobs/nearby?latitude=&longitude=&radiusKm=
 */
const nearbyJobs = asyncHandler(async (req, res) => {
  await jobRepository.expireOverdueJobs();
  const { latitude, longitude, radiusKm } = req.query;
  const lat = Number(latitude);
  const lon = Number(longitude);
  const radius = radiusKm === undefined ? undefined : Number(radiusKm);
  if (!Number.isFinite(lat) || lat < -90 || lat > 90 || !Number.isFinite(lon) || lon < -180 || lon > 180) {
    throw ApiError.badRequest("Valid latitude and longitude are required.");
  }
  if (radius !== undefined && (!Number.isFinite(radius) || radius <= 0 || radius > 100)) {
    throw ApiError.badRequest("radiusKm must be greater than 0 and no more than 100.");
  }

  const jobs = await findNearbyJobs({
    coordinates: [lon, lat],
    radiusKm: radius,
    extraMatch: { status: JOB_STATUS.PUBLISHED },
  });

  new ApiResponse(200, jobs, "Nearby jobs fetched successfully.").send(res);
});

/**
 * @route GET /api/v1/jobs/:id
 */
const getJobById = asyncHandler(async (req, res) => {
  await jobRepository.expireOverdueJobs();
  const job = await jobRepository.findById(req.params.id);
  if (!job) throw ApiError.notFound("Job not found.");
  job.viewsCount += 1;
  await job.save();
  new ApiResponse(200, job, "Job fetched successfully.").send(res);
});

/**
 * @route GET /api/v1/jobs/business/my-jobs
 */
const myJobs = asyncHandler(async (req, res) => {
  await jobRepository.expireOverdueJobs();
  const jobs = await jobRepository.findByBusiness(req.user._id);
  new ApiResponse(200, jobs, "Your jobs fetched successfully.").send(res);
});

/**
 * @route PATCH /api/v1/jobs/:id
 */
const updateJob = asyncHandler(async (req, res) => {
  const job = await jobService.updateJob(req.params.id, req.user._id, req.body);
  new ApiResponse(200, job, "Job updated successfully.").send(res);
});

/**
 * @route PATCH /api/v1/jobs/:id/publish
 */
const publishJob = asyncHandler(async (req, res) => {
  const job = await jobService.publishJob(req.params.id, req.user._id);
  new ApiResponse(200, job, "Job published and nearby students notified.").send(res);
});

/**
 * @route PATCH /api/v1/jobs/:id/cancel
 */
const cancelJob = asyncHandler(async (req, res) => {
  const job = await jobService.cancelJob(req.params.id, req.user._id);
  new ApiResponse(200, job, "Job cancelled.").send(res);
});

module.exports = { createJob, listJobs, nearbyJobs, getJobById, myJobs, updateJob, publishJob, cancelJob };
