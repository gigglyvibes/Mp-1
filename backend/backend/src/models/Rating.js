const mongoose = require("mongoose");
require("./Student");

/**
 * A Businessman rates a Student after job completion.
 * Aggregated into Student.averageRating via post-save hook.
 */
const ratingSchema = new mongoose.Schema(
  {
    job: { type: mongoose.Schema.Types.ObjectId, ref: "Job", required: true },
    application: { type: mongoose.Schema.Types.ObjectId, ref: "Application", required: true, unique: true },
    business: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },

    stars: { type: Number, required: true, min: 1, max: 5 },
    review: { type: String, maxlength: 1000, default: "" },
  },
  { timestamps: true }
);

ratingSchema.statics.recalculateStudentRating = async function recalculateStudentRating(studentId) {
  const Student = mongoose.model("student");
  const stats = await this.aggregate([
    { $match: { student: new mongoose.Types.ObjectId(studentId) } },
    { $group: { _id: "$student", avg: { $avg: "$stars" }, count: { $sum: 1 } } },
  ]);

  const avg = stats[0]?.avg || 0;
  const count = stats[0]?.count || 0;

  await Student.findByIdAndUpdate(studentId, {
    averageRating: Number(avg.toFixed(2)),
    totalRatings: count,
  });
};

ratingSchema.post("save", function postSaveHook(doc) {
  // Fire-and-forget hooks cannot affect the already-sent response, but make
  // failures observable instead of becoming unhandled promise rejections.
  doc.constructor.recalculateStudentRating(doc.student).catch((err) => {
    console.error("[Rating] Failed to recalculate student rating:", err);
  });
});

module.exports = mongoose.model("Rating", ratingSchema);
