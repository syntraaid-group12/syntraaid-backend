// controllers/auth.controller.js
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const User    = require('../models/User');
const NotificationPreference = require('../models/NotificationPreference');
// const { sendPasswordResetEmail } = require('../helpers/emailSender');
const { sendInviteEmail, sendPasswordResetEmail } = require('../helpers/emailSender');

// ── Helper: sign JWT ──────────────────────────────────────────
const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

// POST /api/auth/register
// Public – register via invite token
exports.register = async (req, res, next) => {
  try {
    const { token, password } = req.body;
    if (!token || !password)
      return res.status(400).json({ success: false, message: 'Invite token and password are required' });

    if (password.length < 8)
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters' });

    const user = await User.findOne({ inviteToken: token });
    if (!user)
      return res.status(400).json({ success: false, message: 'Invalid or expired invite token' });

    user.passwordHash = await bcrypt.hash(password, 12);
    user.inviteToken  = null;    // single-use: clear token after use
    user.isActive     = false;   // admin must still activate the account
    await user.save();

    // Create default notification preferences for the new user
    await NotificationPreference.create({ userId: String(user._id) });

    res.status(201).json({
      success: true,
      message: 'Registration complete. An administrator will activate your account shortly.',
    });
  } catch (err) { next(err); }
};

// POST /api/auth/login
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ success: false, message: 'Email and password are required' });

    const user = await User.findOne({ email: email.toLowerCase().trim(), deletedAt: null });
    if (!user)
      return res.status(401).json({ success: false, message: 'Invalid credentials' });

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match)
      return res.status(401).json({ success: false, message: 'Invalid credentials' });

    if (!user.isActive)
      return res.status(403).json({ success: false, message: 'Account not yet activated. Contact an administrator.' });

    const jwtToken = signToken(user._id);

    res.json({
      success: true,
      token: jwtToken,
      user: {
        _id:      user._id,
        email:    user.email,
        role:     user.role,
        isActive: user.isActive,
      },
    });
  } catch (err) { next(err); }
};

// GET /api/auth/invite/:token
// Public – validate invite token, return email + role for the registration form
exports.validateInvite = async (req, res, next) => {
  try {
    const user = await User.findOne({ inviteToken: req.params.token });
    if (!user)
      return res.status(400).json({ success: false, message: 'Invalid or expired invite token' });

    res.json({ success: true, email: user.email, role: user.role });
  } catch (err) { next(err); }
};

// POST /api/auth/forgot-password
// Public – generate reset token and email it
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email)
      return res.status(400).json({ success: false, message: 'Email is required' });

    const user = await User.findOne({ email: email.toLowerCase().trim(), deletedAt: null });

    // Always respond 200 to prevent email enumeration attacks
    if (!user) {
      return res.json({ success: true, message: 'If that email exists, a reset link has been sent.' });
    }

    const resetToken  = uuidv4();
    user.inviteToken  = resetToken;
    await user.save();

    try {
      await sendPasswordResetEmail(user.email, resetToken);
    } catch (emailErr) {
      // Don't expose email failures to the client; log server-side only
      console.error('Password reset email failed:', emailErr.message);
    }

    res.json({ success: true, message: 'If that email exists, a reset link has been sent.' });
  } catch (err) { next(err); }
};

// POST /api/auth/reset-password
// Public – set new password using reset token
exports.resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;
    if (!token || !password)
      return res.status(400).json({ success: false, message: 'Token and new password are required' });

    if (password.length < 8)
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters' });

    const user = await User.findOne({ inviteToken: token });
    if (!user)
      return res.status(400).json({ success: false, message: 'Invalid or expired reset token' });

    user.passwordHash = await bcrypt.hash(password, 12);
    user.inviteToken  = null;
    await user.save();

    res.json({ success: true, message: 'Password reset successful. You can now log in.' });
  } catch (err) { next(err); }
};
