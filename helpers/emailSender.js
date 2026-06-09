// helpers/emailSender.js
// Email sending is currently DISABLED (no SMTP configured for this deployment).
// These functions keep their original names/signatures so the rest of the app
// works unchanged, but they return immediately instead of attempting a real
// SMTP connection (which would otherwise hang and time out).
//
// To re-enable real email later: restore the Nodemailer transporter below,
// set EMAIL_HOST / EMAIL_PORT / EMAIL_USER / EMAIL_PASS / EMAIL_FROM, and
// have sendEmail() actually call transporter.sendMail() again.

const EMAIL_ENABLED = false; // flip to true once real SMTP credentials are set

const sendEmail = async ({ to, subject }) => {
  if (!EMAIL_ENABLED) {
    console.log(`✉️  [email disabled] Would have sent "${subject}" to ${to}`);
    return null;
  }
  // Real sending intentionally omitted while disabled.
  return null;
};

const sendInviteEmail = async (email, role, token) => {
  console.log(`✉️  [email disabled] Invite for ${email} (role: ${role}) – token: ${token}`);
  return null;
};

const sendPasswordResetEmail = async (email, token) => {
  console.log(`✉️  [email disabled] Password reset for ${email} – token: ${token}`);
  return null;
};

const sendAccountActivatedEmail = async (email, role) => {
  console.log(`✉️  [email disabled] Account activated for ${email} (role: ${role})`);
  return null;
};

const sendDeadlineReminderEmail = async (email, taskTitle) => {
  console.log(`✉️  [email disabled] Deadline reminder for ${email} – task: ${taskTitle}`);
  return null;
};

module.exports = {
  sendEmail,
  sendInviteEmail,
  sendPasswordResetEmail,
  sendAccountActivatedEmail,
  sendDeadlineReminderEmail,
};