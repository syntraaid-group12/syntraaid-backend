// controllers/users.controller.js
const bcrypt  = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const User                   = require('../models/User');
const NotificationPreference = require('../models/NotificationPreference');
const ENUMS                  = require('../constants/enums');
const { sendInviteEmail, sendAccountActivatedEmail } = require('../helpers/emailSender');
// const { sendInviteEmail }    = require('../helpers/emailSender');

// GET /api/users  [admin]
exports.listUsers = async (req, res, next) => {
  try {
    const users = await User.find({ deletedAt: null }).select('-passwordHash -inviteToken');
    res.json({ success: true, count: users.length, data: users });
  } catch (err) { next(err); }
};

// POST /api/users/invite  [admin]
exports.inviteUser = async (req, res, next) => {
  try {
    const { email, role } = req.body;

    if (!email || !role)
      return res.status(400).json({ success: false, message: 'email and role are required' });

    if (!ENUMS.userRole.includes(role))
      return res.status(400).json({ success: false, message: `Invalid role. Allowed: ${ENUMS.userRole.join(', ')}` });

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing)
      return res.status(409).json({ success: false, message: 'A user with that email already exists' });

    const inviteToken = uuidv4();
    const user = await User.create({
      email:        email.toLowerCase(),
      passwordHash: await bcrypt.hash(uuidv4(), 12), // placeholder hash
      role,
      isActive:     false,
      inviteToken,
      invitedBy:    String(req.user._id),
    });

    // Send invite email
    try {
      await sendInviteEmail(email, inviteToken, role);
    } catch (emailErr) {
      console.error('Invite email failed (token still valid):', emailErr.message);
    }

    res.status(201).json({
      success: true,
      message: `Invite sent to ${email}`,
      data: { _id: user._id, email: user.email, role: user.role, inviteToken },
    });
  } catch (err) { next(err); }
};

// GET /api/users/:id  [admin, self]
exports.getUser = async (req, res, next) => {
  try {
    const isSelf  = String(req.user._id) === req.params.id;
    const isAdmin = req.user.role === 'admin';
    if (!isSelf && !isAdmin)
      return res.status(403).json({ success: false, message: 'Access denied' });

    const user = await User.findOne({ _id: req.params.id, deletedAt: null }).select('-passwordHash -inviteToken');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    res.json({ success: true, data: user });
  } catch (err) { next(err); }
};

// PUT /api/users/:id  [admin, self]
exports.updateUser = async (req, res, next) => {
  try {
    const isSelf  = String(req.user._id) === req.params.id;
    const isAdmin = req.user.role === 'admin';
    if (!isSelf && !isAdmin)
      return res.status(403).json({ success: false, message: 'Access denied' });

    const forbidden = ['passwordHash', 'role', 'inviteToken', 'invitedBy', 'isActive'];
    forbidden.forEach(f => delete req.body[f]);

    const user = await User.findOneAndUpdate(
      { _id: req.params.id, deletedAt: null },
      req.body,
      { new: true, runValidators: true }
    ).select('-passwordHash -inviteToken');

    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, data: user });
  } catch (err) { next(err); }
};

// PATCH /api/users/:id/activate  [admin]
exports.activateUser = async (req, res, next) => {
  try {
    const { isActive } = req.body;
    if (typeof isActive !== 'boolean')
      return res.status(400).json({ success: false, message: 'isActive (boolean) is required' });

    const user = await User.findOneAndUpdate(
      { _id: req.params.id, deletedAt: null },
      { isActive },
      { new: true }
    ).select('-passwordHash -inviteToken');

    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // Notify the user by email when their account is activated
    if (isActive) {
      try {
        await sendAccountActivatedEmail(user.email, user.role);
      } catch (emailErr) {
        console.error('Activation email failed:', emailErr.message);
      }
    }

    res.json({ success: true, message: `Account ${isActive ? 'activated' : 'deactivated'}`, data: user });
  } catch (err) { next(err); }
};

// GET /api/users/:id/notification-preferences  [self]
exports.getNotificationPrefs = async (req, res, next) => {
  try {
    if (String(req.user._id) !== req.params.id)
      return res.status(403).json({ success: false, message: 'Access denied' });

    let prefs = await NotificationPreference.findOne({ userId: req.params.id });
    if (!prefs) prefs = await NotificationPreference.create({ userId: req.params.id });

    res.json({ success: true, data: prefs });
  } catch (err) { next(err); }
};

// PUT /api/users/:id/notification-preferences  [self]
exports.updateNotificationPrefs = async (req, res, next) => {
  try {
    if (String(req.user._id) !== req.params.id)
      return res.status(403).json({ success: false, message: 'Access denied' });

    const allowed = ['taskAssigned', 'deadlineReminder', 'taskBlocked', 'milestoneCompleted', 'preferredChannel'];
    const update  = {};
    allowed.forEach(k => { if (req.body[k] !== undefined) update[k] = req.body[k]; });

    if (update.preferredChannel && !ENUMS.deliveryChannel.includes(update.preferredChannel))
      return res.status(400).json({ success: false, message: `Invalid deliveryChannel. Allowed: ${ENUMS.deliveryChannel.join(', ')}` });

    const prefs = await NotificationPreference.findOneAndUpdate(
      { userId: req.params.id },
      update,
      { new: true, upsert: true, runValidators: true }
    );
    res.json({ success: true, data: prefs });
  } catch (err) { next(err); }
};
