const express = require("express");
const router = express.Router();
const notificationController = require("../controllers/notificationController");

// POST /api/notifications - Create a notification
router.post("/", notificationController.createNotification);

// GET /api/notifications/user/:userId - Fetch alerts for the bell icon
router.get("/user/:userId", notificationController.fetchUserNotifications);

// GET /api/notifications/user/:userId/unread-count - Fetch unread count
router.get(
  "/user/:userId/unread-count",
  notificationController.fetchUnreadCount,
);

// PATCH /api/notifications/:notificationId/read - Mark alert as read
router.patch(
  "/:notificationId/read",
  notificationController.markNotificationRead,
);

// PATCH /api/notifications/user/:userId/read-all - Mark all notifications as read
router.patch(
  "/user/:userId/read-all",
  notificationController.markAllNotificationsRead,
);

module.exports = router;
