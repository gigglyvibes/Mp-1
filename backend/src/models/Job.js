const mongoose = require("mongoose");
const { JOB_STATUS } = require("../config/constants");

const geoPointSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ["Point"], default: "Point" },
    coordinates: { type: [Number], required: true }, // [longitude, latitude]
  },
  { _id: false }
);

/**
 * Job model. Location is stored as GeoJSON so nearby students can be
 * matched with a $geoNear / $near query against the 2dsphere index.
 */
const jobSchema = new mongoose.Schema(
  {
    business: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },

    title: { type: String, required: true, trim: true, maxlength: 120 },
    category: { type: String, required: true },
    job: { type: String, required: true }, // specific job type under the category
    description: { type: String, required: true, minlength: 20 },

    address: { type: String, required: true },
    geoLocation: {
      type: geoPointSchema,
      required: true,
    },

    price: { type: Number, required: true, min: 1 },

    requiredStudents: { type: Number, required: true, min: 1 },
    acceptedStudentsCount: { type: Number, default: 0 },

    startDateTime: { type: Date, required: true },
    endDateTime: { type: Date, required: true },

    estimatedDuration: { type: String }, // auto-calculated, human-readable
    workingHours: { type: String, default: "" },

    contactNumber: {
      type: String,
      required: true,
      match: [/^[6-9]\d{9}$/, "Contact number must be a valid 10-digit mobile number"],
    },

    images: {
      type: [
        {
          url: String,
          publicId: String,
        },
      ],
      validate: {
        validator: (arr) => arr.length <= 5,
        message: "Maximum of 5 images can be uploaded.",
      },
      default: [],
    },

    specialInstructions: { type: String, default: "" },
    genderPreference: { type: String, enum: ["male", "female", "any"], default: "any" },
    skillsRequired: { type: [String], default: [] },

    status: {
      type: String,
      enum: Object.values(JOB_STATUS),
      default: JOB_STATUS.DRAFT,
    },

    viewsCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

jobSchema.index({ geoLocation: "2dsphere" });
jobSchema.index({ status: 1, createdAt: -1 });
jobSchema.index({ category: 1 });

// Basic cross-field validation mirroring the spec's rules.
jobSchema.pre("validate", function crossFieldValidation(next) {
  if (this.endDateTime < this.startDateTime) {
    return next(new Error("Job End Date & Time cannot be before the Job Start Date & Time."));
  }
  next();
});

module.exports = mongoose.model("Job", jobSchema);
