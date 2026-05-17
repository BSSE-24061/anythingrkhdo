const db = require("../config/db");
const sendEmail = require("../utils/sendEmail");

// Helper function to send notification emails
const sendNotificationEmail = async (userId, title, body, type) => {
  try {
    // Get user email from database
    const userQuery = "SELECT email, full_name FROM users WHERE user_id = $1";
    const userResult = await db.query(userQuery, [userId]);

    if (!userResult.rows[0]) {
      console.warn(`User ${userId} not found for email notification`);
      return false;
    }

    const { email, full_name } = userResult.rows[0];

    if (!email) {
      console.warn(`No email found for user ${userId}`);
      return false;
    }

    // Generate email subject and HTML content based on notification type
    const subject = `HealthLog: ${title}`;
    const htmlContent = generateEmailTemplate(title, body, type, full_name);

    // Send email
    const emailSent = await sendEmail(
      email,
      subject,
      body || title,
      htmlContent,
    );
    return emailSent;
  } catch (error) {
    console.error(
      `Error sending email notification for user ${userId}:`,
      error.message,
    );
    return false; // Don't let email errors break notification creation
  }
};

// Generate HTML email template based on notification type
const generateEmailTemplate = (title, body, type, fullName) => {
  const typeStyles = {
    alert: {
      color: "#d32f2f",
      icon: "⚠️",
    },
    info: {
      color: "#1976d2",
      icon: "ℹ️",
    },
    appointment: {
      color: "#f57c00",
      icon: "📅",
    },
    medication: {
      color: "#388e3c",
      icon: "💊",
    },
  };

  const style = typeStyles[type] || typeStyles.info;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          border: 1px solid #ddd;
          border-radius: 8px;
        }
        .header {
          border-left: 4px solid ${style.color};
          padding-left: 16px;
          margin-bottom: 20px;
        }
        .title {
          font-size: 24px;
          font-weight: bold;
          color: ${style.color};
          margin: 10px 0;
        }
        .body {
          background-color: #f9f9f9;
          padding: 15px;
          border-radius: 4px;
          margin: 15px 0;
        }
        .footer {
          font-size: 12px;
          color: #999;
          text-align: center;
          margin-top: 20px;
          border-top: 1px solid #ddd;
          padding-top: 10px;
        }
        .button {
          display: inline-block;
          padding: 12px 24px;
          background-color: ${style.color};
          color: white;
          text-decoration: none;
          border-radius: 4px;
          margin-top: 10px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <p>Hi ${fullName},</p>
          <div class="title">${style.icon} ${title}</div>
        </div>
        <div class="body">
          ${body ? `<p>${body}</p>` : ""}
        </div>
        <p>Please log in to HealthLog to view more details or take action.</p>
        <div class="footer">
          <p>This is an automated notification from HealthLog. Please do not reply to this email.</p>
          <p>&copy; 2026 HealthLog. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

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

  const notification = result.rows[0];

  // Send email notification asynchronously (don't wait or break if it fails)
  if (notification && user_id) {
    setImmediate(async () => {
      await sendNotificationEmail(user_id, title, body, type || "info");
    });
  }

  return notification;
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
