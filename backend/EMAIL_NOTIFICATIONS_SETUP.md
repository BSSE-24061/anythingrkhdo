# Email Notifications System Setup

## Overview
The HealthLog system now automatically sends email notifications for:
- **Alerts** - Critical health warnings (low oxygen, high blood pressure, etc.)
- **Appointments** - Confirmation and cancellation notifications
- **Medications** - Missed dose alerts
- **General Notifications** - System messages and updates

## Setup Instructions

### 1. Enable Gmail SMTP

#### Step 1: Enable 2-Factor Authentication
1. Go to your Google Account: https://myaccount.google.com
2. Click "Security" in the left menu
3. Scroll down to "How you sign in to Google"
4. Enable "2-Step Verification" (if not already enabled)

#### Step 2: Generate App Password
1. Go to https://myaccount.google.com/apppasswords
2. Select "Mail" and "Windows Computer" (or your OS)
3. Google will generate a 16-character password
4. Copy this password (you'll need it for the .env file)

#### Step 3: Configure Environment Variables
Add these to your `.env` file in the backend folder:

```env
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_16_character_app_password
```

**Example:**
```env
EMAIL_USER=johndoe@gmail.com
EMAIL_PASS=abcd efgh ijkl mnop
```

### 2. How It Works

#### Automatic Email Sending
When a notification is created in the system, the following happens:
1. Notification is saved to the database
2. User's email is fetched from the database
3. HTML email template is generated based on notification type
4. Email is sent asynchronously (doesn't block the API response)
5. If email fails, it logs an error but doesn't break notification creation

#### Email Templates
Different notification types have different email templates:
- **Alert** - Red border, warning icon (⚠️)
- **Appointment** - Orange border, calendar icon (📅)
- **Medication** - Green border, pill icon (💊)
- **Info** - Blue border, info icon (ℹ️)

### 3. Triggers

#### Vital Alert Emails
When a patient logs vitals with concerning values, emails are automatically sent:
- **Low Oxygen** (< 92%) - Critical alert
- **High Blood Pressure** (> 180 systolic) - High priority alert
- **Abnormal Heart Rate** (> 120 or < 50 bpm) - Medium priority alert
- **Abnormal Glucose** (< 70 or > 300 mg/dL) - High priority alert

#### Appointment Emails
Emails are sent when:
- Appointment is confirmed by doctor
- Appointment is cancelled by doctor

#### Medication Emails
Emails are sent when:
- Patient misses a scheduled medication dose

### 4. Testing Email Functionality

#### Test from Backend
Add this to a route temporarily to test:

```javascript
const sendEmail = require("../utils/sendEmail");

// Test sending an email
const testEmail = await sendEmail(
  "test@example.com",
  "Test Email",
  "This is a test message",
  "<h1>This is HTML content</h1>"
);
console.log("Email sent:", testEmail);
```

#### Using the API
Create a notification via the API:

```bash
curl -X POST http://localhost:3001/api/notifications/create \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 1,
    "type": "alert",
    "title": "Test Alert",
    "body": "This is a test notification email"
  }'
```

### 5. Troubleshooting

#### Email Not Sending?

1. **Check Environment Variables**
   - Verify `EMAIL_USER` and `EMAIL_PASS` are set in `.env`
   - Restart the backend server after changing `.env`

2. **Verify Gmail App Password**
   - Make sure 2FA is enabled on your Google Account
   - Generate a new app password if the old one doesn't work
   - Use the 16-character password without spaces

3. **Check Server Logs**
   - Look for error messages in the terminal running the backend
   - Email errors won't crash the system, but will be logged

4. **Common Issues**
   - ❌ "Invalid credentials" - Check EMAIL_USER and EMAIL_PASS
   - ❌ "Permission denied" - Enable 2FA and generate app password
   - ❌ "Email skipped" - Check if user record has valid email in database

### 6. Disable Email Notifications (Development)

If you want to test without sending real emails, comment out the email sending in `notificationModel.js`:

```javascript
// In src/models/notificationModel.js, line in createNotification:
// setImmediate(async () => {
//   await sendNotificationEmail(user_id, title, body, type || "info");
// });
```

### 7. Email Customization

To customize email templates, edit the `generateEmailTemplate` function in:
`backend/src/models/notificationModel.js`

You can modify:
- Email colors and styling
- Email icons (emoji)
- HTML layout
- Footer text

### 8. Production Considerations

#### Using Alternative Email Services
The system uses Gmail by default, but you can modify `sendEmail.js` to use:
- SendGrid
- AWS SES
- Mailgun
- Any other SMTP service

#### Rate Limiting
For production, consider adding:
- Email queue system (Bull, RabbitMQ)
- Rate limiting to prevent spam
- Email verification confirmation

#### Database Migration
If you need to store email sending history:

```sql
CREATE TABLE email_logs (
  email_log_id SERIAL PRIMARY KEY,
  notification_id INT REFERENCES notifications(notification_id),
  user_id UUID REFERENCES users(user_id),
  recipient_email VARCHAR(255),
  subject VARCHAR(255),
  sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status VARCHAR(50),
  error_message TEXT
);
```

## API Endpoints

### Create Notification
```
POST /api/notifications
Body: {
  "user_id": "uuid",
  "type": "alert|info|appointment|medication",
  "title": "Notification Title",
  "body": "Optional body text",
  "reference_id": "optional_reference",
  "reference_type": "optional_type"
}
```

### Get User Notifications
```
GET /api/notifications/user/:userId
```

### Mark as Read
```
PATCH /api/notifications/:notificationId/read
```

### Mark All as Read
```
PATCH /api/notifications/user/:userId/read-all
```

## Files Modified

1. **backend/src/models/notificationModel.js**
   - Added `sendNotificationEmail()` function
   - Added `generateEmailTemplate()` function
   - Modified `createNotification()` to send emails asynchronously

2. **backend/.env.example**
   - Added EMAIL_USER and EMAIL_PASS configuration

## No Breaking Changes

✅ All existing functionality preserved
✅ Email sending is optional (skipped if EMAIL_USER/EMAIL_PASS not set)
✅ Email errors don't prevent notifications from being created
✅ All API endpoints work the same way
✅ No database schema changes required
