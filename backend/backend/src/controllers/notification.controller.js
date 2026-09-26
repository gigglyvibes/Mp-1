const asyncHandler = require("../utils/asyncHandler");
const ApiResponse = require("../utils/ApiResponse");
const Notification = require("../models/Notification");
const ApiError = require("../utils/ApiError");

/**
 * @route GET /api/v1/notifications
 * Returns notification history for the authenticated user, paginated.
 */
const getMyNotifications = asyncHandler(async (req, res) => {
  const { page, limit } = req.query;
  const pageNumber = Math.max(1, Number.parseInt(page, 10) || 1);
  const limitNumber = Math.min(50, Math.max(1, Number.parseInt(limit, 10) || 20));
  const skip = (pageNumber - 1) * limitNumber;

  const [items, total, unreadCount] = await Promise.all([
    Notification.find({ recipient: req.user._id }).sort({ createdAt: -1 }).skip(skip).limit(limitNumber),
    Notification.countDocuments({ recipient: req.user._id }),
    Notification.countDocuments({ recipient: req.user._id, isRead: false }),
  ]);

  new ApiResponse(200, { items, total, unreadCount, page: pageNumber, limit: limitNumber }, "Notifications fetched.").send(res);
});

/**
 * @route PATCH /api/v1/notifications/:id/read
 */
const markAsRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, recipient: req.user._id },
    { isRead: true },
    { new: true }
  );
  if (!notification) throw ApiError.notFound("Notification not found.");
  new ApiResponse(200, notification, "Notification marked as read.").send(res);
});

/**
 * @route PATCH /api/v1/notifications/read-all
 */
const markAllAsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ recipient: req.user._id, isRead: false }, { isRead: true });
  new ApiResponse(200, null, "All notifications marked as read.").send(res);
});

module.exports = { getMyNotifications, markAsRead, markAllAsRead };
