const mongoose = require("mongoose");

/**
 * A message submitted through the public Contact page.
 * Not tied to a User account — the sender may be logged out.
 */
const contactMessageSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: { type: String, required: true, trim: true, lowercase: true, maxlength: 254 },
    message: { type: String, required: true, trim: true, maxlength: 2000 },
    status: {
      type: String,
      enum: ["new", "read"],
      default: "new",
    },
  },
  { timestamps: true }
);

contactMessageSchema.index({ createdAt: -1 });

module.exports = mongoose.model("ContactMessage", contactMessageSchema);
