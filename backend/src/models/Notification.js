const mongoose = require("mongoose");

/**
 * In-app notifications delivered in real-time via Socket.io and
 * persisted for notification history / badge counts.
 */
const notificationSchema = new mongoose.Schema(
  {
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: {
      type: String,
      enum: [
        "NEW_NEARBY_JOB",
        "APPLICATION_RECEIVED",
        "APPLICATION_ACCEPTED",
        "APPLICATION_REJECTED",
        "APPLICATION_REMOVED",
        "AGREEMENT_SIGNED",
        "AGREEMENT_ACTIVE",
        "PAYMENT_CONFIRMED",
        "PAYMENT_COMPLETED",
        "WORK_COMPLETION_REQUESTED",
        "WORK_COMPLETION_APPROVED",
        "JOB_COMPLETED",
        "RATING_RECEIVED",
        "DOCUMENT_VERIFIED",
        "DOCUMENT_REJECTED",
        "ACCOUNT_SUSPENDED",
        "GENERAL",
      ],
      required: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    relatedJob: { type: mongoose.Schema.Types.ObjectId, ref: "Job" },
    relatedApplication: { type: mongoose.Schema.Types.ObjectId, ref: "Application" },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model("Notification", notificationSchema);
