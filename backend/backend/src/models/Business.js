const mongoose = require("mongoose");
const User = require("./User");
const { USER_ROLES } = require("../config/constants");

/**
 * Businessman discriminator - extends base User with business profile fields.
 */
const businessSchema = new mongoose.Schema({
  businessName: { type: String, required: true, trim: true },
  ownerName: { type: String, required: true, trim: true },
  businessType: { type: String, default: "General", trim: true },
  businessDescription: { type: String, maxlength: 1000, default: "" },

  profilePicture: {
    url: { type: String, default: "" },
    publicId: { type: String, default: "" },
  },

  averageRatingGiven: { type: Number, default: 0 },
  totalJobsPosted: { type: Number, default: 0 },
  totalJobsCompleted: { type: Number, default: 0 },
});

const Business = User.discriminator(USER_ROLES.BUSINESS, businessSchema);

module.exports = Business;
