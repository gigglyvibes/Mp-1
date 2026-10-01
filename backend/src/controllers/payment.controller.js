const asyncHandler = require("../utils/asyncHandler");
const ApiResponse = require("../utils/ApiResponse");
const ApiError = require("../utils/ApiError");
const Agreement = require("../models/Agreement");
const PaymentConfirmation = require("../models/PaymentConfirmation");
const { notifyUser } = require("../sockets/notification.socket");
const { APPLICATION_STATUS } = require("../config/constants");
const Application = require("../models/Application");

/**
 * @route GET /api/v1/payments/agreement/:agreementId
 * Fetches the PaymentConfirmation record for an agreement, creating it if it doesn't exist yet
 * and the job work is approved/completed. Handles duplicate key race conditions gracefully.
 */
const getPaymentConfirmation = asyncHandler(async (req, res) => {
  const agreement = await Agreement.findById(req.params.agreementId);
  if (!agreement) throw ApiError.notFound("Agreement not found.");

  const userId = req.user._id.toString();
  const isBusiness = agreement.business.toString() === userId;
  const isStudent = agreement.student.toString() === userId;
  const isAdmin = req.user.role === "admin";

  if (!isBusiness && !isStudent && !isAdmin) {
    throw ApiError.forbidden("You are not a party to this agreement.");
  }

  let record = await PaymentConfirmation.findOne({ agreement: agreement._id })
    .populate("student", "name email phone upiId")
    .populate("business", "name email phone businessName");

  if (!record) {
    const application = await Application.findById(agreement.application);
    if (application && application.status === APPLICATION_STATUS.COMPLETED) {
      try {
        await PaymentConfirmation.create({
          agreement: agreement._id,
          job: agreement.job,
          business: agreement.business,
          student: agreement.student,
          agreedPaymentAmount: agreement.agreedPaymentAmount,
        });
      } catch (err) {
        if (err.code !== 11000) {
          throw err;
        }
      }
      record = await PaymentConfirmation.findOne({ agreement: agreement._id })
        .populate("student", "name email phone upiId")
        .populate("business", "name email phone businessName");
    }
  }

  new ApiResponse(200, record, "Payment confirmation fetched.").send(res);
});

/**
 * @route POST /api/v1/payments/:agreementId
 * Lazily creates the PaymentConfirmation record tied to a signed agreement.
 */
const initPaymentConfirmation = asyncHandler(async (req, res) => {
  const agreement = await Agreement.findById(req.params.agreementId);
  if (!agreement) throw ApiError.notFound("Agreement not found.");
  if (!agreement.isFullyAccepted) throw ApiError.badRequest("Agreement must be signed by both parties first.");

  const userId = req.user._id.toString();
  const isBusiness = agreement.business.toString() === userId;
  const isStudent = agreement.student.toString() === userId;
  const isAdmin = req.user.role === "admin";

  if (!isBusiness && !isStudent && !isAdmin) {
    throw ApiError.forbidden("You are not a party to this agreement.");
  }

  const application = await Application.findById(agreement.application);
  if (!application || application.status !== APPLICATION_STATUS.COMPLETED) {
    throw ApiError.badRequest("Payment confirmation becomes available only after the business approves this student's completed work.");
  }

  try {
    await PaymentConfirmation.create({
      agreement: agreement._id,
      job: agreement.job,
      business: agreement.business,
      student: agreement.student,
      agreedPaymentAmount: agreement.agreedPaymentAmount,
    });
  } catch (err) {
    if (err.code !== 11000) {
      throw err;
    }
  }

  const record = await PaymentConfirmation.findOne({ agreement: agreement._id })
    .populate("student", "name email phone upiId")
    .populate("business", "name email phone businessName");

  new ApiResponse(200, record, "Payment confirmation record ready.").send(res);
});

/**
 * @route PATCH /api/v1/payments/:id/confirm
 * The platform does NOT process payments - this records each
 * party's statement that payment was made / received.
 * Uses atomic updates to avoid race conditions.
 */
const confirmPayment = asyncHandler(async (req, res) => {
  const recordBefore = await PaymentConfirmation.findById(req.params.id);
  if (!recordBefore) throw ApiError.notFound("Payment confirmation record not found.");

  if (recordBefore.isDisputed) {
    throw ApiError.badRequest("This payment is currently disputed and cannot be confirmed until resolved.");
  }

  const linkedApplication = await Application.findOne({
    job: recordBefore.job,
    student: recordBefore.student,
    status: APPLICATION_STATUS.COMPLETED,
  }).populate("job", "title price");

  if (!linkedApplication) {
    throw ApiError.badRequest("Payment can only be confirmed after this student's work is completed and approved.");
  }

  const userId = req.user._id.toString();
  const isBusiness = recordBefore.business.toString() === userId;
  const isStudent = recordBefore.student.toString() === userId;

  if (!isBusiness && !isStudent) throw ApiError.forbidden("You are not a party to this payment confirmation.");

  const { paymentMethod, upiReference } = req.body || {};

  const updateFields = {};
  const query = { _id: recordBefore._id };

  if (isBusiness) {
    if (recordBefore.businessConfirmation && recordBefore.businessConfirmation.confirmed) {
      throw ApiError.badRequest("The business has already confirmed this payment.");
    }

    if (paymentMethod) {
      if (!["upi", "cash"].includes(paymentMethod)) {
        throw ApiError.badRequest("Payment method must be either 'upi' or 'cash'.");
      }
      updateFields.paymentMethod = paymentMethod;

      if (paymentMethod === "upi") {
        if (!upiReference || !/^\d{12}$/.test(String(upiReference).trim())) {
          throw ApiError.badRequest("A valid 12-digit numeric UPI/UTR transaction reference number is required for UPI payments.");
        }
        updateFields.upiReference = String(upiReference).trim();
      }
    }

    query["businessConfirmation.confirmed"] = false;
    updateFields["businessConfirmation.confirmed"] = true;
    updateFields["businessConfirmation.confirmedAt"] = new Date();
  } else {
    if (recordBefore.studentConfirmation && recordBefore.studentConfirmation.confirmed) {
      throw ApiError.badRequest("The student has already confirmed this payment.");
    }
    query["studentConfirmation.confirmed"] = false;
    updateFields["studentConfirmation.confirmed"] = true;
    updateFields["studentConfirmation.confirmedAt"] = new Date();
  }

  // Atomic update using $set to prevent concurrent overwrite race condition
  const updatedRecord = await PaymentConfirmation.findOneAndUpdate(
    query,
    { $set: updateFields },
    { new: true }
  );

  if (!updatedRecord) {
    throw ApiError.badRequest("Confirmation could not be processed. It may have already been confirmed.");
  }

  // Atomically check completion
  let finalRecord = updatedRecord;
  if (
    updatedRecord.businessConfirmation &&
    updatedRecord.businessConfirmation.confirmed &&
    updatedRecord.studentConfirmation &&
    updatedRecord.studentConfirmation.confirmed &&
    !updatedRecord.isFullyConfirmed
  ) {
    finalRecord = await PaymentConfirmation.findByIdAndUpdate(
      updatedRecord._id,
      {
        $set: {
          isFullyConfirmed: true,
          fullyConfirmedAt: new Date(),
        },
      },
      { new: true }
    );
  }

  const populated = await PaymentConfirmation.findById(finalRecord._id)
    .populate("student", "name email phone upiId")
    .populate("business", "name email phone businessName");

  if (populated.isFullyConfirmed) {
    await notifyUser({
      recipient: populated.student._id || populated.student,
      type: "PAYMENT_COMPLETED",
      title: "Payment settled",
      message: `Both parties confirmed the payment for "${linkedApplication.job.title}".`,
      relatedJob: populated.job,
      relatedApplication: linkedApplication._id,
    });
    await notifyUser({
      recipient: populated.business._id || populated.business,
      type: "PAYMENT_COMPLETED",
      title: "Payment settled",
      message: `Both parties confirmed the payment for "${linkedApplication.job.title}".`,
      relatedJob: populated.job,
      relatedApplication: linkedApplication._id,
    });
  } else {
    const otherPartyId = isBusiness ? populated.student._id || populated.student : populated.business._id || populated.business;
    await notifyUser({
      recipient: otherPartyId,
      type: "PAYMENT_CONFIRMED",
      title: "Payment confirmation pending your response",
      message: "The other party submitted their payment confirmation. Please verify and confirm on your end.",
      relatedJob: populated.job,
    });
  }

  new ApiResponse(200, populated, "Confirmation recorded.").send(res);
});

/**
 * @route PATCH /api/v1/payments/:id/dispute
 * Allows either party to dispute a payment.
 */
const disputePayment = asyncHandler(async (req, res) => {
  const record = await PaymentConfirmation.findById(req.params.id);
  if (!record) throw ApiError.notFound("Payment confirmation record not found.");

  const userId = req.user._id.toString();
  const isBusiness = record.business.toString() === userId;
  const isStudent = record.student.toString() === userId;
  const isAdmin = req.user.role === "admin";

  if (!isBusiness && !isStudent && !isAdmin) {
    throw ApiError.forbidden("You are not authorized to dispute this payment.");
  }

  const { reason } = req.body || {};
  if (!reason || reason.trim().length < 5) {
    throw ApiError.badRequest("Please provide a clear reason for disputing this payment (minimum 5 characters).");
  }

  record.isDisputed = true;
  record.disputeReason = reason.trim();
  record.disputedBy = req.user._id;
  record.disputedAt = new Date();
  record.disputeStatus = "pending_review";
  await record.save();

  const populated = await PaymentConfirmation.findById(record._id)
    .populate("student", "name email phone upiId")
    .populate("business", "name email phone businessName");

  const otherPartyId = isBusiness ? record.student : record.business;
  await notifyUser({
    recipient: otherPartyId,
    type: "PAYMENT_DISPUTED",
    title: "Payment Disputed",
    message: `Payment confirmation was disputed: "${record.disputeReason}". Platform admin will review.`,
    relatedJob: record.job,
  });

  new ApiResponse(200, populated, "Payment dispute submitted for administrative review.").send(res);
});

/**
 * @route GET /api/v1/payments/disputed
 * (Admin only) Lists all disputed payments.
 */
const listDisputedPayments = asyncHandler(async (req, res) => {
  const disputes = await PaymentConfirmation.find({ isDisputed: true })
    .populate("student", "name email phone upiId")
    .populate("business", "name email phone businessName")
    .populate("job", "title price category")
    .sort({ disputedAt: -1 });

  new ApiResponse(200, disputes, "Disputed payments fetched.").send(res);
});

module.exports = {
  getPaymentConfirmation,
  initPaymentConfirmation,
  confirmPayment,
  disputePayment,
  listDisputedPayments,
};
