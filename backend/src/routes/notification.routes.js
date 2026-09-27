const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/auth.middleware");
const notificationController = require("../controllers/notification.controller");

router.get("/", protect, notificationController.getMyNotifications);
router.patch("/:id/read", protect, notificationController.markAsRead);
router.patch("/read-all", protect, notificationController.markAllAsRead);

module.exports = router;
