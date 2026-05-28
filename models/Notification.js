// models/Notification.js
const mongoose = require('mongoose');
const ENUMS    = require('../constants/enums');

const notificationSchema = new mongoose.Schema({
  recipientId:      { type: String, required: true }, // ref → users._id
  notificationType: { type: String, enum: ENUMS.notificationType, required: true },
  referenceType:    { type: String, enum: ENUMS.referenceType, required: true },
  referenceId:      { type: String, required: true }, // _id of referenced document
  message:          { type: String, required: true },
  isRead:           { type: Boolean, default: false },
  deliveryChannel:  { type: String, enum: ENUMS.deliveryChannel, default: 'in_app' },
  createdAt:        { type: Date, default: Date.now },
});

notificationSchema.index({ recipientId: 1 });
notificationSchema.index({ isRead: 1 });
notificationSchema.index({ createdAt: -1 });
notificationSchema.index({ recipientId: 1, isRead: 1 });

module.exports = mongoose.model('Notification', notificationSchema);
