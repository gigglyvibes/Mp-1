const asyncHandler = require("../utils/asyncHandler");
const ApiResponse = require("../utils/ApiResponse");
const ApiError = require("../utils/ApiError");
const applicationRepository = require("../repositories/application.repository");
const jobRepository = require("../repositories/job.repository");
const calculateDistanceKm = require("../utils/calculateDistance");
const { notifyUser } = require("../sockets/notification.socket");
const { APPLICATION_STATUS, JOB_STATUS, WORK_COMPLETION_STATUS } = require("../config/constants");
const Agreement = require("../models/Agreement");
const Application = require("../models/Application");

const AGREEMENT_TERMS = `1. Both parties agree to the job scope, location, dates, working hours, and payment shown in this agreement.
2. The business is responsible for verifying the completed work before confirming payment.
3. The student agrees to perform the assigned work honestly and responsibly.
4. Any change to the agreed terms should be mutually accepted by both parties.
5. The platform records the agreement but does not guarantee work quality or resolve private payment disputes.
6. Either party may withdraw or remove the accepted assignment before the scheduled job start date. Once the scheduled job date arrives, the assignment is locked under the normal workflow.
7. The agreed payment amount shown above is the amount payable to this individual Student after the Business approves that Student's completed work.`;

/**
 * @route POST /api/v1/applications/:jobId
 * Student applies to a job. Flow: Student -> Apply Job.
 */
const applyToJob = asyncHandler(async (req, res) => {
  const job = await jobRepository.findById(req.params.jobId);
  if (!job) throw ApiError.notFound("Job not found.");
  if (job.status !== JOB_STATUS.PUBLISHED) throw ApiError.badRequest("This job is not currently accepting applications.");
  const now = new Date();
  const jobEndDate = new Date(job.endDateTime);
  if (Number.isNaN(jobEndDate.getTime()) || now > jobEndDate) {
    throw ApiError.badRequest("This job has already ended and is no longer accepting applications.");
  }

  const existing = await applicationRepository.findOne({ job: job._id, student: req.user._id });
  if (existing) throw ApiError.conflict("You have already applied to this job.");

  const studentCoordinates = req.user.geoLocation?.coordinates;
  const jobCoordinates = job.geoLocation?.coordinates;
  if (!Array.isArray(studentCoordinates) || studentCoordinates.length !== 2 ||
      !Array.isArray(jobCoordinates) || jobCoordinates.length !== 2) {
    throw ApiError.badRequest("A valid location is required to apply to this job.");
  }

  const distanceKm = calculateDistanceKm(studentCoordinates, jobCoordinates);

  const application = await applicationRepository.create({
    job: job._id,
    student: req.user._id,
    business: job.business._id || job.business,
    coverNote: req.body.coverNote,
    distanceKm,
  });

  await notifyUser({
    recipient: job.business._id || job.business,
    type: "APPLICATION_RECEIVED",
    title: "New application received",
    message: `${req.user.name} applied for "${job.title}".`,
    relatedJob: job._id,
    relatedApplication: application._id,
  });

  new ApiResponse(201, application, "Application submitted successfully.").send(res);
});

/**
 * @route GET /api/v1/applications/job/:jobId
 * Businessman views all applicants for a job.
 */
const getApplicantsForJob = asyncHandler(async (req, res) => {
  const job = await jobRepository.findById(req.params.jobId);
  if (!job) throw ApiError.notFound("Job not found.");
  const jobBusinessId = job.business?._id || job.business;
  if (jobBusinessId.toString() !== req.user._id.toString()) {
    throw ApiError.forbidden("You are not allowed to view applicants for this job.");
  }
  const applications = await applicationRepository.findByJob(req.params.jobId);
  new ApiResponse(200, applications, "Applicants fetched successfully.").send(res);
});

/**
 * @route GET /api/v1/applications/my-applications
 * Student views applied/accepted/ongoing/completed jobs.
 */
const getMyApplications = asyncHandler(async (req, res) => {
  await jobRepository.expireOverdueJobs();
  const { status } = req.query;
  const applications = await applicationRepository.findByStudent(req.user._id, status);
  new ApiResponse(200, applications, "Your applications fetched successfully.").send(res);
});

/**
 * @route PATCH /api/v1/applications/:id/respond
 * Businessman accepts or rejects an application.
 * Flow: Businessman -> Accept / Reject -> Student receives status update.
 */
const respondToApplication = asyncHandler(async (req, res) => {
  const { decision } = req.body; // "accepted" | "rejected" | "removed"
  if (![APPLICATION_STATUS.ACCEPTED, APPLICATION_STATUS.REJECTED, APPLICATION_STATUS.REMOVED].includes(decision)) {
    throw ApiError.badRequest("Decision must be 'accepted', 'rejected', or 'removed'.");
  }

  const application = await applicationRepository.findById(req.params.id);
  if (!application) throw ApiError.notFound("Application not found.");
  if (application.business._id.toString() !== req.user._id.toString()) {
    throw ApiError.forbidden("You are not allowed to respond to this application.");
  }
  if (decision === APPLICATION_STATUS.REMOVED) {
    if (application.status !== APPLICATION_STATUS.ACCEPTED) {
      throw ApiError.badRequest("Only accepted applications can be removed.");
    }
    const removalJob = await jobRepository.findById(application.job._id);
    if (!removalJob) throw ApiError.notFound("Job not found.");
    const now = new Date();
    const startDate = new Date(removalJob.startDateTime);
    if (Number.isNaN(startDate.getTime()) || now >= startDate) {
      throw ApiError.badRequest("Accepted students can only be removed before the job start date.");
    }
    // The signed agreement explicitly permits cancellation/removal before the
    // scheduled job date, so a fully signed agreement does not block this action.
    const removed = await Application.findOneAndUpdate(
      { _id: application._id, status: APPLICATION_STATUS.ACCEPTED },
      { $set: { status: APPLICATION_STATUS.REMOVED, respondedAt: new Date() } },
      { new: true }
    );
    if (!removed) throw ApiError.conflict("This application has already changed state.");
    await jobRepository.updateById(removalJob._id, { $inc: { acceptedStudentsCount: -1 } });

    await notifyUser({
      recipient: application.student._id,
      type: "APPLICATION_REMOVED",
      title: "Application removed",
      message: `Your accepted application for "${application.job.title}" was removed by the business before the job start date.`,
      relatedJob: application.job._id,
      relatedApplication: application._id,
    });

    return new ApiResponse(200, removed, "Accepted student removed from the job.").send(res);
  }

  if (application.status !== APPLICATION_STATUS.APPLIED) {
    throw ApiError.badRequest(`Application has already been ${application.status}.`);
  }

  if (decision === APPLICATION_STATUS.ACCEPTED) {
    const job = await jobRepository.findById(application.job._id);
    if (!job) throw ApiError.notFound("Job not found.");
    const jobBusinessId = job.business?._id || job.business;
    if (jobBusinessId.toString() !== req.user._id.toString()) {
      throw ApiError.forbidden("You are not allowed to accept applications for this job.");
    }
    if (job.status !== JOB_STATUS.PUBLISHED) {
      throw ApiError.badRequest("Applications can only be accepted while the job is published.");
    }
    if (job.acceptedStudentsCount >= job.requiredStudents) {
      throw ApiError.badRequest("This job has already reached the required number of students.");
    }
    const now = new Date();
    const startDate = new Date(job.startDateTime);
    if (Number.isNaN(startDate.getTime()) || now >= startDate) {
      throw ApiError.badRequest("Students cannot be accepted after the job start date.");
    }

    // Reserve one accepted slot atomically so two simultaneous acceptance
    // requests cannot push the job beyond its required student count.
    const reservedJob = await require("../models/Job").findOneAndUpdate(
      {
        _id: job._id,
        business: req.user._id,
        status: JOB_STATUS.PUBLISHED,
        $expr: { $lt: ["$acceptedStudentsCount", "$requiredStudents"] },
      },
      { $inc: { acceptedStudentsCount: 1 } },
      { new: true }
    );
    if (!reservedJob) {
      throw ApiError.conflict("This job no longer has an available student position.");
    }

    application.status = APPLICATION_STATUS.ACCEPTED;
    application.respondedAt = new Date();
    await application.save();

    await Agreement.findOneAndUpdate(
      { application: application._id },
      {
        job: job._id,
        application: application._id,
        business: application.business._id,
        student: application.student._id,
        jobTitle: job.title,
        jobDescription: job.description,
        jobLocation: job.address,
        jobStartDateTime: job.startDateTime,
        jobEndDateTime: job.endDateTime,
        workingHours: job.workingHours || "",
        agreedPaymentAmount: job.price,
        businessName: application.business.businessName,
        studentName: application.student.name,
        termsAndConditions: AGREEMENT_TERMS,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  } else {
    application.status = decision;
    application.respondedAt = new Date();
    await application.save();
  }

  await notifyUser({
    recipient: application.student._id,
    type: decision === APPLICATION_STATUS.ACCEPTED ? "APPLICATION_ACCEPTED" : "APPLICATION_REJECTED",
    title: `Application ${decision}`,
    message: `Your application for "${application.job.title}" was ${decision}.`,
    relatedJob: application.job._id,
    relatedApplication: application._id,
  });

  new ApiResponse(200, application, `Application ${decision}.`).send(res);
});

/**
 * @route PATCH /api/v1/applications/:id/withdraw
 * Student withdraws an application they submitted.
 */
const withdrawApplication = asyncHandler(async (req, res) => {
  const application = await applicationRepository.findById(req.params.id);
  if (!application) throw ApiError.notFound("Application not found.");
  if (application.student._id.toString() !== req.user._id.toString()) {
    throw ApiError.forbidden("You are not allowed to withdraw this application.");
  }
  if (![APPLICATION_STATUS.APPLIED, APPLICATION_STATUS.ACCEPTED].includes(application.status)) {
    throw ApiError.badRequest("Only pending or accepted applications can be withdrawn.");
  }

  // Withdrawal is allowed only before the job's start calendar date.
  // The date is the cutoff rather than the exact start time.
  const job = await jobRepository.findById(application.job._id);
  if (!job) throw ApiError.notFound("Job not found.");

  const now = new Date();
  const startDate = new Date(job.startDateTime);
  if (Number.isNaN(startDate.getTime())) {
    throw ApiError.badRequest("This job has an invalid start date.");
  }
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const jobStartDay = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());

  if (today >= jobStartDay) {
    throw ApiError.badRequest("Applications can only be withdrawn before the job start date.");
  }

  const wasAccepted = application.status === APPLICATION_STATUS.ACCEPTED;
  const withdrawn = await Application.findOneAndUpdate(
    { _id: application._id, status: { $in: [APPLICATION_STATUS.APPLIED, APPLICATION_STATUS.ACCEPTED] } },
    { $set: { status: APPLICATION_STATUS.WITHDRAWN } },
    { new: true }
  );
  if (!withdrawn) throw ApiError.conflict("This application has already changed state.");

  if (wasAccepted) {
    await jobRepository.updateById(job._id, { $inc: { acceptedStudentsCount: -1 } });
  }
  new ApiResponse(200, withdrawn, "Application withdrawn.").send(res);
});

/**
 * @route GET /api/v1/applications/completion-requests
 * Business sees students who have marked an active job as completed.
 */
const getCompletionRequests = asyncHandler(async (req, res) => {
  const applications = await applicationRepository.findCompletionRequestsForBusiness(req.user._id);
  new ApiResponse(200, applications, "Pending work completion requests fetched successfully.").send(res);
});

/**
 * @route PATCH /api/v1/applications/:id/complete
 * Student requests business approval after finishing the work.
 */
const requestWorkCompletion = asyncHandler(async (req, res) => {
  const application = await applicationRepository.findById(req.params.id);
  if (!application) throw ApiError.notFound("Application not found.");
  if (application.student._id.toString() !== req.user._id.toString()) {
    throw ApiError.forbidden("Only the assigned student can mark this work as completed.");
  }
  if (application.status !== APPLICATION_STATUS.ACCEPTED) {
    throw ApiError.badRequest("Only an active accepted job can be marked as completed.");
  }
  const agreement = await Agreement.findOne({ application: application._id });
  if (!agreement || !agreement.isFullyAccepted) {
    throw ApiError.badRequest("Both parties must sign the work agreement before completion can be requested.");
  }
  const completionJob = await jobRepository.findById(application.job._id);
  if (!completionJob) throw ApiError.notFound("Job not found.");
  if (completionJob.status !== JOB_STATUS.ACTIVE) {
    throw ApiError.badRequest("This job is no longer active.");
  }
  if (new Date(completionJob.endDateTime) < new Date()) {
    completionJob.status = JOB_STATUS.EXPIRED;
    await completionJob.save();
    throw ApiError.badRequest("This job has expired because its end date and time have passed.");
  }
  if (application.workCompletionStatus === WORK_COMPLETION_STATUS.COMPLETION_REQUESTED) {
    throw ApiError.conflict("Work completion has already been submitted and is awaiting business approval.");
  }
  if (application.workCompletionStatus === WORK_COMPLETION_STATUS.APPROVED) {
    throw ApiError.badRequest("This job has already been approved as completed.");
  }

  application.workCompletionStatus = WORK_COMPLETION_STATUS.COMPLETION_REQUESTED;
  application.completionRequestedAt = new Date();
  await application.save();

  await notifyUser({
    recipient: application.business._id,
    type: "WORK_COMPLETION_REQUESTED",
    title: "Work completion request",
    message: `${application.student.name} marked "${application.job.title}" as completed. Please approve the completion.`,
    relatedJob: application.job._id,
    relatedApplication: application._id,
  });

  new ApiResponse(200, application, "Work completion request sent to the business.").send(res);
});

/**
 * @route PATCH /api/v1/applications/:id/approve-completion
 * Business approves the student's completion request. This is the only action
 * that moves the job/application to the completed state.
 */
const approveWorkCompletion = asyncHandler(async (req, res) => {
  const application = await applicationRepository.findById(req.params.id);
  if (!application) throw ApiError.notFound("Application not found.");
  if (application.business._id.toString() !== req.user._id.toString()) {
    throw ApiError.forbidden("Only the business that posted this job can approve completion.");
  }
  if (application.status !== APPLICATION_STATUS.ACCEPTED) {
    throw ApiError.badRequest("This application is not an active job.");
  }
  if (application.workCompletionStatus !== WORK_COMPLETION_STATUS.COMPLETION_REQUESTED) {
    throw ApiError.badRequest("There is no pending work completion request for this job.");
  }

  const job = await jobRepository.findById(application.job._id);
  if (!job) throw ApiError.notFound("Job not found.");
  const now = new Date();
  const jobExpired = new Date(job.endDateTime) < now;
  const requestWasOnTime = application.completionRequestedAt && new Date(application.completionRequestedAt) <= new Date(job.endDateTime);
  if (job.status !== JOB_STATUS.ACTIVE && !(job.status === JOB_STATUS.EXPIRED && requestWasOnTime)) {
    throw ApiError.badRequest("Only an active job with a valid completion request can be approved.");
  }
  if (jobExpired && !requestWasOnTime) {
    throw ApiError.badRequest("This job has expired and the completion request was submitted too late.");
  }

  application.workCompletionStatus = WORK_COMPLETION_STATUS.APPROVED;
  application.completionApprovedAt = new Date();
  application.status = APPLICATION_STATUS.COMPLETED;
  await application.save();

  // A job can require more than one student. Approving one student's work
  // completes that student's application; the Job becomes completed only
  // after every accepted student has been approved.
  const acceptedApplications = await Application.find({
    job: application.job._id,
    status: { $in: [APPLICATION_STATUS.ACCEPTED, APPLICATION_STATUS.COMPLETED] },
  });
  const allStudentsCompleted = acceptedApplications.length > 0 && acceptedApplications.every(
    (item) => item.status === APPLICATION_STATUS.COMPLETED
  );

  if (allStudentsCompleted) {
    job.status = JOB_STATUS.COMPLETED;
    await job.save();
  }

  const Business = require("../models/Business");
  const Student = require("../models/Student");
  const updates = [
    Student.findByIdAndUpdate(application.student._id, { $inc: { completedJobsCount: 1 } }),
    notifyUser({
      recipient: application.student._id,
      type: "WORK_COMPLETION_APPROVED",
      title: "Work approved",
      message: `Your work for "${application.job.title}" was approved by the business. You can now be rated for this job.`,
      relatedJob: application.job._id,
      relatedApplication: application._id,
    }),
  ];

  if (allStudentsCompleted) {
    updates.push(
      Business.findByIdAndUpdate(application.business._id, { $inc: { totalJobsCompleted: 1 } }),
      notifyUser({
        recipient: application.business._id,
        type: "JOB_COMPLETED",
        title: "Job completed",
        message: `All students assigned to "${application.job.title}" have completed the work.`,
        relatedJob: application.job._id,
      })
    );
  }

  await Promise.all(updates);

  new ApiResponse(200, application, allStudentsCompleted
    ? "Work approved. The job is now completed and ready for rating."
    : "Work approved. This student's job assignment is completed and ready for rating.").send(res);
});

module.exports = {
  applyToJob,
  getApplicantsForJob,
  getMyApplications,
  getCompletionRequests,
  requestWorkCompletion,
  approveWorkCompletion,
  respondToApplication,
  withdrawApplication,
};
