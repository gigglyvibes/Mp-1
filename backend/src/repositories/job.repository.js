const Job = require("../models/Job");

class JobRepository {
  create(data) {
    return Job.create(data);
  }

  findById(id) {
    return Job.findById(id).populate("business", "businessName ownerName profilePicture");
  }

  updateById(id, update) {
    return Job.findByIdAndUpdate(id, update, { new: true, runValidators: true });
  }

  deleteById(id) {
    return Job.findByIdAndDelete(id);
  }

  async paginate({ filter = {}, page = 1, limit = 10, sort = { createdAt: -1 } }) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      Job.find(filter).sort(sort).skip(skip).limit(limit).populate("business", "businessName profilePicture"),
      Job.countDocuments(filter),
    ]);
    return {
      items,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / limit),
    };
  }

  findByBusiness(businessId) {
    return Job.find({ business: businessId }).sort({ createdAt: -1 });
  }

  async expireOverdueJobs() {
    const now = new Date();
    return Job.updateMany(
      {
        status: { $in: ["published", "active"] },
        endDateTime: { $lt: now },
      },
      { $set: { status: "expired" } }
    );
  }
}

module.exports = new JobRepository();
