const nodemailer = require("nodemailer");

const createTransporter = () =>
  nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

const sendEmail = async (to, subject, message, html) => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.warn("Email skipped: EMAIL_USER and EMAIL_PASS must be set");
      return false;
    }

    if (!to) {
      console.warn("Email skipped: recipient email is missing");
      return false;
    }

    const mailOptions = {
      from: `"HealthLog" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text: message,
      html,
    };

    const transporter = createTransporter();
    await transporter.sendMail(mailOptions);

    console.log("Email sent successfully to:", to);
    return true;
  } catch (error) {
    console.error("Email sending failed:", error.message);
    return false;
  }
};

module.exports = sendEmail;
