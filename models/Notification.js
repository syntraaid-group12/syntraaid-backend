const mongoose = require('mongoose')

const notificationSchema = new mongoose.Schema(
  {
    recipientId: { type: String, required: true }, // ref: users._id
    notificationType: {
      type: String,
      enum: [
        'task_assigned',
        'deadline_reminder',
        'task_blocked',
        'milestone_completed',
        'project_status_changed',
        'donor_milestone_alert',
      ],
      required: true,
    },
    referenceType: {
      type: String,
      enum: ['task', 'project', 'milestone'],
      required: true,
    },
    referenceId: { type: String, required: true }, // _id of the referenced document
    message:     { type: String, required: true }, // human-readable notification text
    isRead:      { type: Boolean, default: false },
    deliveryChannel: {
      type:    String,
      enum:    ['in_app',],
      default: 'in_app',
    },
    createdAt: { type: Date, default: Date.now },
  },
  {
    timestamps: false,
  }
)

// Indexes
notificationSchema.index({ recipientId: 1 })
notificationSchema.index({ isRead: 1 })
notificationSchema.index({ createdAt: -1 })
notificationSchema.index({ recipientId: 1, isRead: 1 })

module.exports = mongoose.model('Notification', notificationSchema)
