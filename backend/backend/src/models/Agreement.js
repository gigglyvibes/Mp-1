const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

/**
 * Digital Work Agreement - both Student and Businessman must digitally
 * sign before a job's status becomes "active".
 */
const agreementSchema = new mongoose.Schema(
  {
    agreementId: { type: String, default: uuidv4, unique: true },
    job: { type: mongoose.Schema.Types.ObjectId, ref: "Job", required: true },
    application: { type: mongoose.Schema.Types.ObjectId, ref: "Application", required: true, unique: true },
    business: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    jobTitle: { type: String, required: true },
    jobDescription: { type: String, required: true },
    jobLocation: { type: String, required: true },
    jobStartDateTime: { type: Date, required: true },
    jobEndDateTime: { type: Date, required: true },
    workingHours: { type: String, default: "" },
    agreedPaymentAmount: { type: Number, required: true },

    businessName: { type: String, required: true },
    studentName: { type: String, required: true },
    termsAndConditions: { type: String, required: true },

    businessSignature: {
      fullName: { type: String },
      agreedAt: { type: Date },
    },
    studentSignature: {
      fullName: { type: String },
      agreedAt: { type: Date },
    },

    isFullyAccepted: { type: Boolean, default: false },
    fullyAcceptedAt: { type: Date },
  },
  { timestamps: true }
);

agreementSchema.methods.checkCompletion = function checkCompletion() {
  this.isFullyAccepted = Boolean(
    this.businessSignature?.fullName && this.studentSignature?.fullName
  );
  if (this.isFullyAccepted && !this.fullyAcceptedAt) {
    this.fullyAcceptedAt = new Date();
  }
  return this.isFullyAccepted;
};

module.exports = mongoose.model("Agreement", agreementSchema);
