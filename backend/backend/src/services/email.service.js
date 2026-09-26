const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: Number(process.env.SMTP_PORT) === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/**
 * Sends a transactional email. Failures are logged but not thrown to
 * avoid blocking the request flow (e.g. registration) on SMTP issues;
 * callers decide whether the failure is fatal for their use case.
 */
const sendEmail = async ({ to, subject, html, text }) => {
  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to,
      subject,
      html,
      text,
    });
    return info;
  } catch (err) {
    console.error(`[EmailService] Failed to send email to ${to}:`, err.message);
    throw err;
  }
};

const sendOtpEmail = (to, otp) =>
  sendEmail({
    to,
    subject: "Your Verification Code - Geo Micro Job Platform",
    html: `<div style="font-family:sans-serif">
      <h2>Verify your email</h2>
      <p>Your OTP code is:</p>
      <h1 style="letter-spacing:4px">${otp}</h1>
      <p>This code expires in ${process.env.OTP_EXPIRY_MINUTES || 10} minutes. If you did not request this, please ignore this email.</p>
    </div>`,
    text: `Your OTP code is ${otp}. It expires in ${process.env.OTP_EXPIRY_MINUTES || 10} minutes.`,
  });

const sendContactMessageEmail = (to, { name, email, message }) =>
  sendEmail({
    to,
    subject: `New contact message from ${name}`,
    html: `<div style="font-family:sans-serif">
      <h2>New contact form submission</h2>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Message:</strong></p>
      <p style="white-space:pre-wrap">${message}</p>
    </div>`,
    text: `New contact form submission\nName: ${name}\nEmail: ${email}\nMessage: ${message}`,
  });

module.exports = { sendEmail, sendOtpEmail, sendContactMessageEmail };
