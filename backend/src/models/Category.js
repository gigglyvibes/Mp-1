const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema(
  {
    category: { type: String, required: true, unique: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    jobs: { type: [String], required: true, default: [] },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Category", categorySchema);
