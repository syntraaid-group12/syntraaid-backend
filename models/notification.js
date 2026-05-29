import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  recipientId: {
    type: String, // ref: users._id
    required: true,
  },
  notificationType: {
    type: String, // enum enforced in notificationSender.js
    required: true,
  },
  referenceType: {
    type: String, // enum: "task"|"project"|"milestone"
    required: true,
  },
  referenceId: {
    type: String, // _id of the referenced document
    required: true,
  },
  message: {
    type: String, // human-readable text
    required: true,
  },
  isRead: {
    type: Boolean,
    default: false, // always false on creation
  },
  deliveryChannel: {
    type: String, // enum: "in_app"|"email"|"both"
    default: "in_app",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  // NO updatedAt — only isRead is ever patched
});

// Indexes from playbook
notificationSchema.index({recipientId: 1});
notificationSchema.index({isRead: 1});
notificationSchema.index({createdAt: -1});
notificationSchema.index({recipientId: 1, isRead: 1});

const Notification = mongoose.model(
  "Notification",
  notificationSchema,
  "notifications",
);

export default Notification;
