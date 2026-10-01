const mongoose = require("mongoose");

/**
 * The platform never processes payments. This model records
 * mutual confirmation statements from both parties after the student's
 * work has been approved by the business, along with UPI transaction details.
 */
const paymentConfirmationSchema = new mongoose.Schema(
  {
    agreement: { type: mongoose.Schema.Types.ObjectId, ref: "Agreement", required: true, unique: true },
    job: { type: mongoose.Schema.Types.ObjectId, ref: "Job", required: true },
    business: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    agreedPaymentAmount: { type: Number, min: 0 },
    paymentMethod: {
      type: String,
      enum: ["upi", "cash"],
      default: "upi",
    },
    upiReference: { type: String, trim: true, default: "" },
    businessConfirmation: {
      confirmed: { type: Boolean, default: false },
      statement: { type: String, default: "I confirm that I have paid the agreed amount to the Student." },
      confirmedAt: { type: Date },
    },
    studentConfirmation: {
      confirmed: { type: Boolean, default: false },
      statement: { type: String, default: "I confirm that I have received the agreed payment." },
      confirmedAt: { type: Date },
    },
    isFullyConfirmed: { type: Boolean, default: false },
    fullyConfirmedAt: { type: Date },
  },
  { timestamps: true }
);

paymentConfirmationSchema.methods.checkCompletion = function checkCompletion() {
  this.isFullyConfirmed = Boolean(
    this.businessConfirmation.confirmed && this.studentConfirmation.confirmed
  );
  if (this.isFullyConfirmed && !this.fullyConfirmedAt) {
    this.fullyConfirmedAt = new Date();
  }
  return this.isFullyConfirmed;
};

module.exports = mongoose.model("PaymentConfirmation", paymentConfirmationSchema);
