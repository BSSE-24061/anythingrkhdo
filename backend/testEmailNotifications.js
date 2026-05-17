/**
 * Email Notification System Test Utility
 *
 * Run this file to test if your email notification system is working:
 * node testEmailNotifications.js
 */

require("dotenv").config();
const sendEmail = require("./src/utils/sendEmail");
const db = require("./src/config/db");

const testEmailNotifications = async () => {
  console.log(" Starting Email Notifications Test...\n");

  // Test 1: Check environment variables
  console.log("Test 1: Checking Environment Variables");
  console.log("----------------------------------------");

  if (!process.env.EMAIL_USER) {
    console.log(" EMAIL_USER is not set");
  } else {
    console.log(` EMAIL_USER: ${process.env.EMAIL_USER}`);
  }

  if (!process.env.EMAIL_PASS) {
    console.log(" EMAIL_PASS is not set");
  } else {
    console.log(" EMAIL_PASS: [SET]");
  }

  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log(
      "\n  Email notifications will be skipped without these variables!\n",
    );
    process.exit(1);
  }

  // Test 2: Send test email
  console.log("\nTest 2: Sending Test Email");
  console.log("----------------------------------------");

  try {
    // Get a test user email from database
    const userResult = await db.query(
      "SELECT user_id, email, full_name FROM users LIMIT 1",
    );

    if (userResult.rows.length === 0) {
      console.log(" No users found in database. Please create a user first.");
      process.exit(1);
    }

    const testUser = userResult.rows[0];
    console.log(`Found test user: ${testUser.full_name} (${testUser.email})\n`);

    // Send test email
    const emailSent = await sendEmail(
      testUser.email,
      "HealthLog: Test Email Notification",
      "This is a test message to verify your email notification system is working.",
      `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; }
            .header { border-left: 4px solid #1976d2; padding-left: 16px; margin-bottom: 20px; }
            .title { font-size: 24px; font-weight: bold; color: #1976d2; }
            .body { background-color: #f9f9f9; padding: 15px; border-radius: 4px; margin: 15px 0; }
            .footer { font-size: 12px; color: #999; text-align: center; margin-top: 20px; border-top: 1px solid #ddd; padding-top: 10px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <p>Hi ${testUser.full_name},</p>
              <div class="title"> Test Email Notification</div>
            </div>
            <div class="body">
              <p>This is a test email to verify that your HealthLog email notification system is working correctly!</p>
              <p>If you received this email, your email configuration is set up properly.</p>
            </div>
            <p>You can now start receiving notifications for:</p>
            <ul>
              <li>Health Alerts (vital sign warnings)</li>
              <li>Appointment Updates</li>
              <li>Medication Reminders</li>
              <li>System Notifications</li>
            </ul>
            <div class="footer">
              <p>This is an automated notification from HealthLog. Please do not reply to this email.</p>
              <p>&copy; 2026 HealthLog. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    );

    if (emailSent) {
      console.log(` Test email sent successfully to ${testUser.email}`);
      console.log("\n Email notification system is working!\n");
    } else {
      console.log(" Failed to send test email");
      console.log("Check the error message above for details.\n");
      process.exit(1);
    }
  } catch (error) {
    console.log(" Error during test:");
    console.log(error.message);
    console.log("\nPlease check:");
    console.log("1. Your EMAIL_USER and EMAIL_PASS in .env");
    console.log("2. Your internet connection");
    console.log("3. Gmail 2FA and App Password settings");
    process.exit(1);
  }

  // Test 3: Test notification creation with email
  console.log("Test 3: Testing Notification Creation with Email");
  console.log("----------------------------------------");

  try {
    const Notification = require("./src/models/notificationModel");

    const userResult = await db.query("SELECT user_id FROM users LIMIT 1");

    const testUserId = userResult.rows[0].user_id;

    await Notification.createNotification({
      user_id: testUserId,
      type: "info",
      title: "System Test Notification",
      body: "This notification was created by the test utility. An email should have been sent.",
      reference_type: "test",
    });

    console.log(" Notification created successfully");
    console.log("Check your email inbox for the notification\n");
  } catch (error) {
    console.log(" Error creating notification:");
    console.log(error.message + "\n");
  }

  console.log(" All tests completed!\n");
  console.log("Next steps:");
  console.log("1. Check your email inbox for test messages");
  console.log("2. Verify the email templates look good");
  console.log("3. Test the system by creating actual notifications/alerts");
  console.log("\nFor more information, see: EMAIL_NOTIFICATIONS_SETUP.md\n");

  process.exit(0);
};

testEmailNotifications().catch((error) => {
  console.error("Test failed:", error);
  process.exit(1);
});
