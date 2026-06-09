// helpers/emailSender.js
// Centralised email sender using Nodemailer.
// Fill in .env: EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS, EMAIL_FROM
// Works with Gmail App Password, Brevo, Resend, SendGrid SMTP, etc.

const nodemailer = require('nodemailer');

// ── Create reusable transporter ───────────────────────────────
const createTransporter = () =>
  nodemailer.createTransport({
    host:   process.env.EMAIL_HOST,
    port:   Number(process.env.EMAIL_PORT) || 587,
    secure: Number(process.env.EMAIL_PORT) === 465,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

/**
 * Core send function.
 * @param {Object} options
 * @param {string}   options.to
 * @param {string}   options.subject
 * @param {string}   options.html
 * @param {string}   [options.text]
 */
const sendEmail = async ({ to, subject, html, text }) => {
  try {
    const transporter = createTransporter();
    const info = await transporter.sendMail({
      from:    process.env.EMAIL_FROM || '"SyntraAid" <no-reply@syntraaid.org>',
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]+>/g, ''),
    });
    console.log(`📧  Email sent to ${to} – MessageId: ${info.messageId}`);
    return info;
  } catch (err) {
    console.error(`❌  emailSender failed (to: ${to}):`, err.message);
  }
};

const sendInviteEmail = async (email, role, token) => {
  const registerUrl = `${process.env.FRONTEND_URL}/auth/register.html?token=${token}`;
  await sendEmail({
    to:      email,
    subject: 'You have been invited to SyntraAid',
    html: `
      <h2>Welcome to SyntraAid</h2>
      <p>You have been invited as a <strong>${role}</strong>.</p>
      <p>Click below to complete your registration. This link is single-use.</p>
      <a href="${registerUrl}" style="display:inline-block;padding:12px 24px;background:#4F46E5;color:#fff;text-decoration:none;border-radius:6px;font-weight:bold;">Complete Registration</a>
      <p style="margin-top:24px;color:#6B7280;font-size:12px;">If you did not expect this, you can safely ignore this email.</p>
    `,
  });
};

const sendPasswordResetEmail = async (email, token) => {
  const resetUrl = `${process.env.FRONTEND_URL}/auth/reset-password.html?token=${token}`;
  await sendEmail({
    to:      email,
    subject: 'SyntraAid – Password Reset Request',
    html: `
      <h2>Reset Your Password</h2>
      <p>We received a request to reset your SyntraAid password.</p>
      <a href="${resetUrl}" style="display:inline-block;padding:12px 24px;background:#4F46E5;color:#fff;text-decoration:none;border-radius:6px;font-weight:bold;">Reset Password</a>
      <p style="margin-top:16px;color:#6B7280;font-size:12px;">This link expires in 1 hour. If you didn't request this, ignore this email.</p>
    `,
  });
};

const sendAccountActivatedEmail = async (email, role) => {
  const loginUrl = `${process.env.FRONTEND_URL}/auth/login.html`;
  await sendEmail({
    to:      email,
    subject: 'Your SyntraAid account is now active',
    html: `
      <h2>Account Activated</h2>
      <p>Your SyntraAid <strong>${role}</strong> account has been activated by an administrator.</p>
      <a href="${loginUrl}" style="display:inline-block;padding:12px 24px;background:#4F46E5;color:#fff;text-decoration:none;border-radius:6px;font-weight:bold;">Log In Now</a>
    `,
  });
};

const sendDeadlineReminderEmail = async (email, taskTitle, dueDate) => {
  await sendEmail({
    to:      email,
    subject: `SyntraAid – Deadline Reminder: "${taskTitle}"`,
    html: `
      <h2>Task Deadline Approaching</h2>
      <p>Your task <strong>"${taskTitle}"</strong> is due on <strong>${new Date(dueDate).toDateString()}</strong>.</p>
      <a href="${process.env.FRONTEND_URL}/auth/login.html" style="display:inline-block;padding:12px 24px;background:#4F46E5;color:#fff;text-decoration:none;border-radius:6px;font-weight:bold;">Open SyntraAid</a>
    `,
  });
};

module.exports = {
  sendEmail,
  sendInviteEmail,
  sendPasswordResetEmail,
  sendAccountActivatedEmail,
  sendDeadlineReminderEmail,
};
