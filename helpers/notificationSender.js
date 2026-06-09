// helpers/notificationSender.js
// Reusable helper: creates a Notification document.
// Call this whenever a system event should alert a user.

const Notification           = require('../models/Notification');
const NotificationPreference = require('../models/NotificationPreference');

/**
 * @param {Object} params
 * @param {string}   params.recipientId      – users._id of the person being notified
 * @param {string}   params.notificationType – must be in ENUMS.notificationType
 * @param {string}   params.referenceType    – must be in ENUMS.referenceType
 * @param {string}   params.referenceId      – _id of the referenced document
 * @param {string}   params.message          – human-readable notification text
 * @param {string}   [params.deliveryChannel] – defaults to user's preference or "in_app"
 */
const sendNotification = async ({
  recipientId,
  notificationType,
  referenceType,
  referenceId,
  message,
  deliveryChannel,
}) => {
  try {
    // Respect user's channel preference if no channel explicitly provided
    if (!deliveryChannel) {
      const prefs = await NotificationPreference.findOne({ userId: recipientId });
      deliveryChannel = prefs ? prefs.preferredChannel : 'in_app';
    }

    await Notification.create({
      recipientId,
      notificationType,
      referenceType,
      referenceId,
      message,
      deliveryChannel,
    });
  } catch (err) {
    // Notification failures must NEVER break the main request.
    console.error('⚠️  notificationSender failed:', err.message);
  }
};

module.exports = sendNotification;
