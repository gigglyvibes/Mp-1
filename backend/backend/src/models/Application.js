const mongoose = require("mongoose");
const { APPLICATION_STATUS, WORK_COMPLETION_STATUS } = require("../config/constants");

/**
 * Tracks a Student's application to a Job and its status transitions
 * through the flow: applied -> accepted/rejected -> completed.
 */
const applicationSchema = new mongoose.Schema(
  {
    job: { type: mongoose.Schema.Types.ObjectId, ref: "Job", required: true, index: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    business: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    status: {
      type: String,
      enum: Object.values(APPLICATION_STATUS),
      default: APPLICATION_STATUS.APPLIED,
    },

    coverNote: { type: String, maxlength: 500, default: "" },
    respondedAt: { type: Date },

    // Work completion is a separate state so the student can request completion
    // without making the job completed until the business explicitly approves it.
    workCompletionStatus: {
      type: String,
      enum: Object.values(WORK_COMPLETION_STATUS),
      default: WORK_COMPLETION_STATUS.IN_PROGRESS,
    },
    completionRequestedAt: { type: Date },
    completionApprovedAt: { type: Date },

    distanceKm: { type: Number }, // distance at time of application, for reference
  },
  { timestamps: true }
);

applicationSchema.index({ job: 1, student: 1 }, { unique: true });

module.exports = mongoose.model("Application", applicationSchema);
