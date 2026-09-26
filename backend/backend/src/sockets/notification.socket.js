const Notification = require("../models/Notification");
const { emitToUser } = require("./index");

/**
 * Persists a notification and pushes it in real-time to the recipient's
 * connected sockets (toast alert + badge count on the frontend).
 */
const notifyUser = async ({ recipient, type, title, message, relatedJob, relatedApplication }) => {
  const notification = await Notification.create({
    recipient,
    type,
    title,
    message,
    relatedJob,
    relatedApplication,
  });

  emitToUser(recipient.toString(), "notification:new", notification);
  return notification;
};

/**
 * Notifies a batch of nearby students about a freshly published job.
 */
const notifyNearbyStudents = async (students, job) => {
  const notifications = await Promise.all(
    students.map((student) =>
      notifyUser({
        recipient: student._id,
        type: "NEW_NEARBY_JOB",
        title: "New job near you",
        message: `${job.title} was just posted near your location.`,
        relatedJob: job._id,
      })
    )
  );
  return notifications;
};

module.exports = { notifyUser, notifyNearbyStudents };
