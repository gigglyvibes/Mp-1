const User = require("../models/User");

/**
 * Data-access layer for User (and its Student/Business/Admin discriminators).
 * Controllers/services talk to the repository instead of Mongoose directly,
 * keeping persistence concerns isolated and swappable.
 */
class UserRepository {
  findByEmail(email) {
    return User.findOne({ email }).select("+password");
  }

  findByPhone(phone) {
    return User.findOne({ phone }).select("+password");
  }

  findByEmailOrPhone(email, phone) {
    if (phone) {
      return User.findOne({ $or: [{ email }, { phone }] }).select("+password");
    }
    return User.findOne({ $or: [{ email }, { phone: email }] }).select("+password");
  }

  findById(id) {
    return User.findById(id);
  }

  create(data) {
    return User.create(data);
  }

  updateById(id, update) {
    return User.findByIdAndUpdate(id, update, { new: true, runValidators: true });
  }

  deleteById(id) {
    return User.findByIdAndDelete(id);
  }

  list({ role, verificationStatus, isSuspended, page = 1, limit = 20 } = {}) {
    const query = {};
    if (role) query.role = role;
    if (verificationStatus) query.verificationStatus = verificationStatus;
    if (typeof isSuspended === "boolean") query.isSuspended = isSuspended;

    return User.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);
  }

  count(query = {}) {
    return User.countDocuments(query);
  }
}

module.exports = new UserRepository();
