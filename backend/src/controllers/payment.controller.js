const asyncHandler = require("../utils/asyncHandler");
const ApiResponse = require("../utils/ApiResponse");
const ApiError = require("../utils/ApiError");
const Agreement = require("../models/Agreement");
const PaymentConfirmation = require("../models/PaymentConfirmation");
const { notifyUser } = require("../sockets/notification.socket");
const { APPLICATION_STATUS } = require("../config/constants");
const Application = require("../models/Application");

/**
 * @route POST /api/v1/payments/:agreementId
 * Lazily creates the PaymentConfirmation record tied to a signed agreement.
 */
const initPaymentConfirmation = asyncHandler(async (req, res) => {
  const agreement = await Agreement.findById(req.params.agreementId);
  if (!agreement) throw ApiError.notFound("Agreement not found.");
  if (!agreement.isFullyAccepted) throw ApiError.badRequest("Agreement must be signed by both parties first.");
  if (agreement.business.toString() !== req.user._id.toString()) {
    throw ApiError.forbidden("Only the business on this agreement can initialize payment confirmation.");
  }

  const application = await Application.findById(agreement.application);
  if (!application || application.status !== APPLICATION_STATUS.COMPLETED) {
    throw ApiError.badRequest("Payment confirmation becomes available only after the business approves this student's completed work.");
  }

  let record = await PaymentConfirmation.findOne({ agreement: agreement._id });
  if (!record) {
    record = await PaymentConfirmation.create({
      agreement: agreement._id,
      job: agreement.job,
      business: agreement.business,
      student: agreement.student,
      agreedPaymentAmount: agreement.agreedPaymentAmount,
    });
  }

  new ApiResponse(200, record, "Payment confirmation record ready.").send(res);
});

/**
 * @route PATCH /api/v1/payments/:id/confirm
 * The platform does NOT process payments - this only records each
 * party's statement that payment was made / received.
 */
const confirmPayment = asyncHandler(async (req, res) => {
  const record = await PaymentConfirmation.findById(req.params.id);
  if (!record) throw ApiError.notFound("Payment confirmation record not found.");

  const linkedApplication = await Application.findOne({
    job: record.job,
    student: record.student,
    status: APPLICATION_STATUS.COMPLETED,
  }).populate("job", "title price");
  if (!linkedApplication) {
    throw ApiError.badRequest("Payment can only be confirmed after this student's work is completed and approved.");
  }

  const userId = req.user._id.toString();
  const isBusiness = record.business.toString() === userId;
  const isStudent = record.student.toString() === userId;

  if (!isBusiness && !isStudent) throw ApiError.forbidden("You are not a party to this payment confirmation.");

  if (isBusiness) {
    if (record.businessConfirmation.confirmed) {
      throw ApiError.badRequest("The business has already confirmed this payment.");
    }
    record.businessConfirmation.confirmed = true;
    record.businessConfirmation.confirmedAt = new Date();
  } else {
    if (record.studentConfirmation.confirmed) {
      throw ApiError.badRequest("The student has already confirmed this payment.");
    }
    record.studentConfirmation.confirmed = true;
    record.studentConfirmation.confirmedAt = new Date();
  }

  const fullyConfirmed = record.checkCompletion();
  await record.save();

  if (fullyConfirmed) {
    await notifyUser({
      recipient: record.student,
      type: "PAYMENT_COMPLETED",
      title: "Payment confirmed",
      message: `Both parties confirmed the payment for "${linkedApplication.job.title}".`,
      relatedJob: record.job,
      relatedApplication: linkedApplication._id,
    });
    await notifyUser({
      recipient: record.business,
      type: "PAYMENT_COMPLETED",
      title: "Payment confirmed",
      message: `Both parties confirmed the payment for "${linkedApplication.job.title}".`,
      relatedJob: record.job,
      relatedApplication: linkedApplication._id,
    });
  } else {
    const otherPartyId = isBusiness ? record.student : record.business;
    await notifyUser({
      recipient: otherPartyId,
      type: "PAYMENT_CONFIRMED",
      title: "Payment confirmation pending your response",
      message: "The other party submitted their payment confirmation. Please confirm on your end.",
      relatedJob: record.job,
    });
  }

  new ApiResponse(200, record, "Confirmation recorded.").send(res);
});

module.exports = { initPaymentConfirmation, confirmPayment };
