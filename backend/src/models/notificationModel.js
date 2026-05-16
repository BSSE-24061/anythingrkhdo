const db = require("../config/db");

const createNotification = async (notificationData) => {
  const { user_id, type, title, body, reference_id, reference_type } =
    notificationData;
  const query = `
        INSERT INTO notifications (user_id, type, title, body, reference_id, reference_type)
        VALUES ($1, $2::notification_type, $3, $4, $5, $6)
        RETURNING *;
    `;
  const result = await db.query(query, [
    user_id,
    type || "info",
    title,
    body || null,
    reference_id || null,
    reference_type || null,
  ]);
  return result.rows[0];
};

// Get all notifications for a specific user
const getUserNotifications = async (userId) => {
  const query = `
        SELECT * FROM notifications 
        WHERE user_id = $1 
        ORDER BY created_at DESC;
    `;
  const result = await db.query(query, [userId]);
  return result.rows;
};

const getUnreadCount = async (userId) => {
  const result = await db.query(
    "SELECT COUNT(*)::int AS unread_count FROM notifications WHERE user_id = $1 AND is_read = FALSE",
    [userId],
  );
  return result.rows[0];
};

// Mark a notification as read when the user clicks it
const markAsRead = async (notificationId) => {
  const query = `
        UPDATE notifications 
        SET is_read = TRUE 
        WHERE notification_id = $1 
        RETURNING *;
    `;
  const result = await db.query(query, [notificationId]);
  return result.rows[0];
};

const markAllAsRead = async (userId) => {
  const query = `
        UPDATE notifications
        SET is_read = TRUE
        WHERE user_id = $1 AND is_read = FALSE
        RETURNING *;
    `;
  const result = await db.query(query, [userId]);
  return result.rows;
};

module.exports = {
  createNotification,
  getUserNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
};
