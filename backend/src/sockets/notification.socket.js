const { getIO } = require("./index");
const Notification = require("../models/Notification");

/**
 * Dispatches a notification to a specific user via Socket.io and saves it to MongoDB.
 */
const notifyUser = async ({ recipient, type, title, message, data = {} }) => {
  try {
    const recipientId = recipient?._id ? recipient._id.toString() : recipient.toString();

    // Persist to MongoDB
    const notification = await Notification.create({
      recipient: recipientId,
      type,
      title,
      message,
      data,
    });

    // Real-time broadcast if socket is connected
    const io = getIO();
    if (io) {
      io.to(`user:${recipientId}`).emit("notification:new", notification);
    }

    return notification;
  } catch (err) {
    console.error("[Socket Notification] Failed to dispatch user notification:", err.message);
    return null;
  }
};

/**
 * Notifies a list of nearby students about a new published job.
 */
const notifyNearbyStudents = async (students, job) => {
  try {
    const io = getIO();
    const notifications = await Promise.all(
      students.map(async (student) => {
        const studentId = student._id.toString();
        const notification = await Notification.create({
          recipient: studentId,
          type: "JOB_ALERT",
          title: "New Job Nearby!",
          message: `${job.businessName || "A nearby business"} posted a new job: "${job.title}" (₹${job.totalPay})`,
          data: {
            jobId: job._id,
            jobTitle: job.title,
            distance: student.distance,
          },
        });

        if (io) {
          io.to(`user:${studentId}`).emit("notification:new", notification);
        }

        return notification;
      })
    );

    return notifications;
  } catch (err) {
    console.error("[Socket Notification] Failed to notify nearby students:", err.message);
    return [];
  }
};

module.exports = { notifyUser, notifyNearbyStudents };
