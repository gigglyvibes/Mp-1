const Application = require("../models/Application");

class ApplicationRepository {
  create(data) {
    return Application.create(data);
  }

  findById(id) {
    return Application.findById(id).populate("job").populate("student", "-password").populate("business", "-password");
  }

  findOne(query) {
    return Application.findOne(query);
  }

  findByJob(jobId) {
    return Application.find({ job: jobId }).populate("student", "name email phone averageRating profilePicture");
  }

  findByStudent(studentId, status) {
    const query = { student: studentId };
    if (status) query.status = status;
    return Application.find(query).populate("job").sort({ createdAt: -1 });
  }

  findCompletionRequestsForBusiness(businessId) {
    return Application.find({
      business: businessId,
      workCompletionStatus: "completion_requested",
    })
      .populate("job")
      .populate("student", "name email phone averageRating profilePicture")
      .sort({ completionRequestedAt: 1 });
  }

  updateById(id, update) {
    return Application.findByIdAndUpdate(id, update, { new: true, runValidators: true });
  }
}

module.exports = new ApplicationRepository();
