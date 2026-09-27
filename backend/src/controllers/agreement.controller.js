const asyncHandler = require("../utils/asyncHandler");
const ApiResponse = require("../utils/ApiResponse");
const ApiError = require("../utils/ApiError");
const Agreement = require("../models/Agreement");
const applicationRepository = require("../repositories/application.repository");
const jobRepository = require("../repositories/job.repository");
const { notifyUser } = require("../sockets/notification.socket");
const { APPLICATION_STATUS, JOB_STATUS } = require("../config/constants");

const TERMS_TEXT = `1. This platform only connects Business Owners and Students.
2. The platform does not guarantee work quality.
3. Business Owners are responsible for verifying work before confirming payment.
4. Students must perform assigned work honestly.
5. Fraudulent activities may permanently suspend accounts.
6. Student Aadhaar information is used only for identity verification and age eligibility review.
7. User information must remain secure.
8. Either party may withdraw or remove the accepted assignment before the scheduled job start date. Once the scheduled job date arrives, the assignment is locked under the normal workflow.
9. The agreed payment amount shown in this agreement is payable to this individual Student after the Business approves that Student's completed work.`;

/**
 * @route POST /api/v1/agreements/:applicationId
 * Auto-generates the Digital Work Agreement once an application is accepted.
 */
const createAgreement = asyncHandler(async (req, res) => {
  const application = await applicationRepository.findById(req.params.applicationId);
  if (!application) throw ApiError.notFound("Application not found.");
  if (application.status !== APPLICATION_STATUS.ACCEPTED) {
    throw ApiError.badRequest("An agreement can only be created for an accepted application.");
  }
  if (application.business._id.toString() !== req.user._id.toString()) {
    throw ApiError.forbidden("Only the business that owns this application can create its agreement.");
  }

  const existing = await Agreement.findOne({ application: application._id });
  if (existing) return new ApiResponse(200, existing, "Agreement already exists.").send(res);

  const job = application.job;
  const agreement = await Agreement.create({
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
    termsAndConditions: TERMS_TEXT,
  });

  new ApiResponse(201, agreement, "Digital Work Agreement created. Both parties must now sign.").send(res);
});

/**
 * @route GET /api/v1/agreements/:id
 */
const getAgreement = asyncHandler(async (req, res) => {
  const agreement = await Agreement.findById(req.params.id);
  if (!agreement) throw ApiError.notFound("Agreement not found.");

  const userId = req.user._id.toString();
  if (![agreement.business.toString(), agreement.student.toString()].includes(userId)) {
    throw ApiError.forbidden("You are not a party to this agreement.");
  }

  new ApiResponse(200, agreement, "Agreement fetched.").send(res);
});

/**
 * @route GET /api/v1/agreements/application/:applicationId
 * Gets the agreement belonging to an accepted application.
 */
const getAgreementByApplication = asyncHandler(async (req, res) => {
  const agreement = await Agreement.findOne({ application: req.params.applicationId });
  if (!agreement) throw ApiError.notFound("Agreement not found. The application may not be accepted yet.");

  const userId = req.user._id.toString();
  if (![agreement.business.toString(), agreement.student.toString()].includes(userId)) {
    throw ApiError.forbidden("You are not a party to this agreement.");
  }

  new ApiResponse(200, agreement, "Agreement fetched.").send(res);
});

/**
 * @route PATCH /api/v1/agreements/:id/sign
 * Either party clicks "I Agree" and provides their full name as a digital signature.
 */
const signAgreement = asyncHandler(async (req, res) => {
  const { fullName } = req.body;
  const agreement = await Agreement.findById(req.params.id);
  if (!agreement) throw ApiError.notFound("Agreement not found.");

  const userId = req.user._id.toString();
  const isBusiness = agreement.business.toString() === userId;
  const isStudent = agreement.student.toString() === userId;

  if (!isBusiness && !isStudent) {
    throw ApiError.forbidden("You are not a party to this agreement.");
  }

  const job = await jobRepository.findById(agreement.job);
  if (!job) throw ApiError.notFound("Job not found.");
  if (new Date(agreement.jobStartDateTime) <= new Date()) {
    throw ApiError.badRequest("The agreement can only be signed before the scheduled job start date.");
  }
  if (![JOB_STATUS.PUBLISHED, JOB_STATUS.ACTIVE].includes(job.status)) {
    throw ApiError.badRequest("This job is no longer eligible for agreement signing.");
  }
  if (new Date(job.startDateTime) < new Date()) {
    throw ApiError.badRequest("The job start date has already passed.");
  }

  if (isBusiness && agreement.businessSignature?.fullName) {
    throw ApiError.badRequest("The business has already signed this agreement.");
  }
  if (isStudent && agreement.studentSignature?.fullName) {
    throw ApiError.badRequest("The student has already signed this agreement.");
  }

  if (isBusiness) {
    agreement.businessSignature = { fullName, agreedAt: new Date() };
  } else {
    agreement.studentSignature = { fullName, agreedAt: new Date() };
  }

  const nowFullyAccepted = agreement.checkCompletion();
  await agreement.save();

  if (nowFullyAccepted) {
    const Application = require("../models/Application");
    const accepted = await Application.find({
      job: agreement.job,
      status: { $in: [APPLICATION_STATUS.ACCEPTED, APPLICATION_STATUS.COMPLETED] },
    }).select("_id status");
    const agreements = await Agreement.find({
      application: { $in: accepted.map((item) => item._id) },
    }).select("application isFullyAccepted");
    const signedByApplication = new Map(
      agreements.map((item) => [item.application.toString(), item.isFullyAccepted])
    );
    const allAgreementsSigned =
      accepted.length > 0 &&
      accepted.every((item) => signedByApplication.get(item._id.toString()) === true);

    if (allAgreementsSigned) {
      job.status = JOB_STATUS.ACTIVE;
      await job.save();

      await Promise.all([
        notifyUser({
          recipient: agreement.business,
          type: "AGREEMENT_ACTIVE",
          title: "Job is now active",
          message: `Both parties signed the agreement for "${agreement.jobTitle}". All accepted students' agreements are signed, so the job is now active.`,
          relatedJob: agreement.job,
        }),
        notifyUser({
          recipient: agreement.student,
          type: "AGREEMENT_ACTIVE",
          title: "Job is now active",
          message: `Both parties signed the agreement for "${agreement.jobTitle}". All accepted students' agreements are signed, so the job is now active.`,
          relatedJob: agreement.job,
        }),
      ]);
    } else {
      await notifyUser({
        recipient: agreement.business,
        type: "AGREEMENT_SIGNED",
        title: "Agreement signed",
        message: `Both parties signed this agreement for "${agreement.jobTitle}". The job will become active after all accepted students' agreements are signed.`,
        relatedJob: agreement.job,
      });
    }
  } else {
    const otherPartyId = isBusiness ? agreement.student : agreement.business;
    await notifyUser({
      recipient: otherPartyId,
      type: "AGREEMENT_SIGNED",
      title: "Agreement awaiting your signature",
      message: `The other party signed the agreement for "${agreement.jobTitle}". Please review and sign.`,
      relatedJob: agreement.job,
    });
  }

  new ApiResponse(200, agreement, "Agreement signed successfully.").send(res);
});

module.exports = { createAgreement, getAgreement, getAgreementByApplication, signAgreement };
