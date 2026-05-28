// controllers/notifications.controller.js
const Notification = require('../models/Notification');

// GET /api/notifications  [self]
exports.getNotifications = async (req, res, next) => {
  try {
    const filter = { recipientId: String(req.user._id) };
    if (req.query.isRead !== undefined) filter.isRead = req.query.isRead === 'true';

    const notifications = await Notification.find(filter).sort({ createdAt: -1 }).limit(100);
    const unreadCount   = await Notification.countDocuments({ recipientId: String(req.user._id), isRead: false });

    res.json({ success: true, count: notifications.length, unreadCount, data: notifications });
  } catch (err) { next(err); }
};

// PATCH /api/notifications/:id/read  [self]
exports.markOneRead = async (req, res, next) => {
  try {
    const notif = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipientId: String(req.user._id) },
      { isRead: true },
      { new: true }
    );
    if (!notif) return res.status(404).json({ success: false, message: 'Notification not found' });
    res.json({ success: true, data: notif });
  } catch (err) { next(err); }
};

// PATCH /api/notifications/read-all  [self]
exports.markAllRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      { recipientId: String(req.user._id), isRead: false },
      { isRead: true }
    );
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (err) { next(err); }
};
