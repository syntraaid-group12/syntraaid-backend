import Notification from "../models/notification.js";
import NotificationPreference from "../models/notificationPreference.js";
import ENUMS from "../constants/enums.js";

// ── GET /api/notifications ─────────────────────────────────────────────────
const getMyNotifications = async (req, res) => {
  try {
    const {isRead, notificationType} = req.query;
    const filter = {recipientId: req.user.id}; // SELF ONLY

    if (isRead !== undefined) filter.isRead = isRead === "true";

    if (notificationType) {
      if (!ENUMS.notificationType.includes(notificationType)) {
        return res.status(400).json({
          message: `Invalid notificationType. Must be one of: ${ENUMS.notificationType.join(", ")}`,
        });
      }
      filter.notificationType = notificationType;
    }

    const notifications = await Notification.find(filter).sort({createdAt: -1});

    const unreadCount = await Notification.countDocuments({
      recipientId: req.user.id,
      isRead: false,
    });

    return res
      .status(200)
      .json({unreadCount, count: notifications.length, notifications});
  } catch (err) {
    return res.status(500).json({message: "Server error.", error: err.message});
  }
};

// ── PATCH /api/notifications/:id/read ─────────────────────────────────────
const markOneRead = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification)
      return res.status(404).json({message: "Notification not found."});

    // Security — only mark YOUR OWN notification
    if (notification.recipientId !== req.user.id) {
      return res
        .status(403)
        .json({message: "Access denied. Not your notification."});
    }

    notification.isRead = true;
    await notification.save();

    return res
      .status(200)
      .json({message: "Notification marked as read.", notification});
  } catch (err) {
    return res.status(500).json({message: "Server error.", error: err.message});
  }
};

// ── PATCH /api/notifications/read-all ─────────────────────────────────────
const markAllRead = async (req, res) => {
  try {
    const result = await Notification.updateMany(
      {recipientId: req.user.id, isRead: false},
      {$set: {isRead: true}},
    );

    return res.status(200).json({
      message: "All notifications marked as read.",
      updatedCount: result.modifiedCount,
    });
  } catch (err) {
    return res.status(500).json({message: "Server error.", error: err.message});
  }
};

// ── GET /api/users/:id/notification-preferences ───────────────────────────
const getPreferences = async (req, res) => {
  try {
    if (req.params.id !== req.user.id) {
      return res.status(403).json({
        message: "Access denied. You can only view your own preferences.",
      });
    }

    // Auto-create defaults if none exist
    let prefs = await NotificationPreference.findOne({userId: req.params.id});
    if (!prefs)
      prefs = await NotificationPreference.create({userId: req.params.id});

    return res.status(200).json(prefs);
  } catch (err) {
    return res.status(500).json({message: "Server error.", error: err.message});
  }
};

// ── PUT /api/users/:id/notification-preferences ───────────────────────────
const updatePreferences = async (req, res) => {
  try {
    if (req.params.id !== req.user.id) {
      return res.status(403).json({
        message: "Access denied. You can only update your own preferences.",
      });
    }

    const {
      taskAssigned,
      deadlineReminder,
      taskBlocked,
      milestoneCompleted,
      preferredChannel,
    } = req.body;

    if (preferredChannel && !ENUMS.deliveryChannel.includes(preferredChannel)) {
      return res.status(400).json({
        message: `Invalid preferredChannel. Must be one of: ${ENUMS.deliveryChannel.join(", ")}`,
      });
    }

    const updates = {};
    if (taskAssigned !== undefined) updates.taskAssigned = taskAssigned;
    if (deadlineReminder !== undefined)
      updates.deadlineReminder = deadlineReminder;
    if (taskBlocked !== undefined) updates.taskBlocked = taskBlocked;
    if (milestoneCompleted !== undefined)
      updates.milestoneCompleted = milestoneCompleted;
    if (preferredChannel) updates.preferredChannel = preferredChannel;

    const prefs = await NotificationPreference.findOneAndUpdate(
      {userId: req.params.id},
      {$set: updates},
      {new: true, upsert: true},
    );

    return res
      .status(200)
      .json({message: "Preferences updated.", preferences: prefs});
  } catch (err) {
    return res.status(500).json({message: "Server error.", error: err.message});
  }
};

export {
  getMyNotifications,
  markOneRead,
  markAllRead,
  getPreferences,
  updatePreferences,
};
