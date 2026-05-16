const Notification = require("../models/notificationModel");

const createNotification = async (req, res) => {
  try {
    const { user_id, type, title } = req.body;

    if (!user_id || !type || !title) {
      return res
        .status(400)
        .json({ error: "User ID, type, and title are required" });
    }

    const notification = await Notification.createNotification(req.body);
    res
      .status(201)
      .json({ message: "Notification created successfully", notification });
  } catch (error) {
    console.error("Error creating notification:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const fetchUserNotifications = async (req, res) => {
  try {
    const notifications = await Notification.getUserNotifications(
      req.params.userId,
    );
    res.status(200).json(notifications);
  } catch (error) {
    console.error("Error fetching notifications:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const fetchUnreadCount = async (req, res) => {
  try {
    const unread = await Notification.getUnreadCount(req.params.userId);
    res.status(200).json(unread);
  } catch (error) {
    console.error("Error fetching unread count:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const markNotificationRead = async (req, res) => {
  try {
    const updated = await Notification.markAsRead(req.params.notificationId);
    res
      .status(200)
      .json({ message: "Notification marked as read", notification: updated });
  } catch (error) {
    console.error("Error updating notification:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const markAllNotificationsRead = async (req, res) => {
  try {
    const notifications = await Notification.markAllAsRead(req.params.userId);
    res
      .status(200)
      .json({ message: "Notifications marked as read", notifications });
  } catch (error) {
    console.error("Error marking notifications as read:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = {
  createNotification,
  fetchUserNotifications,
  fetchUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
};
