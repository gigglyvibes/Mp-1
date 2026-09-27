const mongoose = require("mongoose");
const User = require("./User");
const { USER_ROLES } = require("../config/constants");

const adminSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  permissions: {
    type: [String],
    default: ["manage_users", "manage_jobs", "verify_documents", "view_analytics"],
  },
});

const Admin = User.discriminator(USER_ROLES.ADMIN, adminSchema);

module.exports = Admin;
