const jobRepository = require("../repositories/job.repository");
const ApiError = require("../utils/ApiError");
const calculateDuration = require("../utils/calculateDuration");
const { findNearbyStudents } = require("./geo.service");
const { notifyNearbyStudents } = require("../sockets/notification.socket");
const { JOB_STATUS, DEFAULT_SEARCH_RADIUS_KM } = require("../config/constants");

/**
 * Creates a job, auto-calculates its estimated duration, and (when
 * published) finds + notifies nearby students in real time.
 */
const createJob = async (businessId, payload) => {
  const geoLocation = { type: "Point", coordinates: [payload.longitude, payload.latitude] };

  const job = await jobRepository.create({
    business: businessId,
    title: payload.title,
    category: payload.category,
    job: payload.job,
    description: payload.description,
    address: payload.address,
    geoLocation,
    price: payload.price,
    requiredStudents: payload.requiredStudents,
    startDateTime: payload.startDateTime,
    endDateTime: payload.endDateTime,
    estimatedDuration: calculateDuration(payload.startDateTime, payload.endDateTime),
    workingHours: payload.workingHours,
    contactNumber: payload.contactNumber,
    images: payload.images || [],
    specialInstructions: payload.specialInstructions,
    genderPreference: payload.genderPreference,
    skillsRequired: payload.skillsRequired,
    status: payload.saveAsDraft ? JOB_STATUS.DRAFT : JOB_STATUS.PUBLISHED,
  });

  if (job.status === JOB_STATUS.PUBLISHED) {
    await matchAndNotifyNearbyStudents(job);
  }

  return job;
};

/**
 * Finds students within the default (or job-specific) radius and pushes
 * a real-time notification + toast alert to each of them.
 */
const matchAndNotifyNearbyStudents = async (job) => {
  const students = await findNearbyStudents({
    coordinates: job.geoLocation.coordinates,
    radiusKm: DEFAULT_SEARCH_RADIUS_KM,
    genderPreference: job.genderPreference,
  });

  if (students.length > 0) {
    await notifyNearbyStudents(students, job);
  }
  return students;
};

const publishJob = async (jobId, businessId) => {
  const job = await jobRepository.findById(jobId);
  if (!job) throw ApiError.notFound("Job not found.");
  if (job.business._id.toString() !== businessId.toString()) {
    throw ApiError.forbidden("You are not allowed to modify this job.");
  }

  job.status = JOB_STATUS.PUBLISHED;
  await job.save();
  await matchAndNotifyNearbyStudents(job);
  return job;
};

const updateJob = async (jobId, businessId, updates) => {
  const job = await jobRepository.findById(jobId);
  if (!job) throw ApiError.notFound("Job not found.");
  if (job.business._id.toString() !== businessId.toString()) {
    throw ApiError.forbidden("You are not allowed to modify this job.");
  }
  if ([JOB_STATUS.COMPLETED, JOB_STATUS.CANCELLED].includes(job.status)) {
    throw ApiError.badRequest(`Cannot edit a job that is already ${job.status}.`);
  }

  const allowedFields = [
    "title", "category", "job", "description", "address", "price",
    "requiredStudents", "startDateTime", "endDateTime", "workingHours",
    "contactNumber", "specialInstructions", "genderPreference", "skillsRequired",
  ];
  for (const field of allowedFields) {
    if (Object.prototype.hasOwnProperty.call(updates, field)) {
      job[field] = updates[field];
    }
  }

  if (updates.startDateTime || updates.endDateTime) {
    job.estimatedDuration = calculateDuration(
      updates.startDateTime || job.startDateTime,
      updates.endDateTime || job.endDateTime
    );
  }
  await job.save();
  return job;
};

const cancelJob = async (jobId, businessId) => {
  const job = await jobRepository.findById(jobId);
  if (!job) throw ApiError.notFound("Job not found.");
  if (job.business._id.toString() !== businessId.toString()) {
    throw ApiError.forbidden("You are not allowed to modify this job.");
  }
  job.status = JOB_STATUS.CANCELLED;
  await job.save();
  return job;
};

module.exports = { createJob, matchAndNotifyNearbyStudents, publishJob, updateJob, cancelJob };
