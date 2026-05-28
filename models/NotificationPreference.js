// models/NotificationPreference.js
const mongoose = require('mongoose');
const ENUMS    = require('../constants/enums');

const notificationPreferenceSchema = new mongoose.Schema(
  {
    userId:             { type: String, required: true, unique: true }, // ref → users._id
    taskAssigned:       { type: Boolean, default: true },
    deadlineReminder:   { type: Boolean, default: true },
    taskBlocked:        { type: Boolean, default: true },
    milestoneCompleted: { type: Boolean, default: true },
    preferredChannel:   { type: String, enum: ENUMS.deliveryChannel, default: 'in_app' },
  },
  { timestamps: { createdAt: false, updatedAt: true } } // only updatedAt needed
);

//notificationPreferenceSchema.index({ userId: 1 }, { unique: true });

module.exports = mongoose.model('NotificationPreference', notificationPreferenceSchema);
