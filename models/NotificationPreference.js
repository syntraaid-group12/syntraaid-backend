const mongoose = require('mongoose')

const notificationPreferenceSchema = new mongoose.Schema(
  {
    userId:             { type: String, required: true, unique: true }, // ref: users._id (one record per user)
    taskAssigned:       { type: Boolean, default: true },
    deadlineReminder:   { type: Boolean, default: true },
    taskBlocked:        { type: Boolean, default: true },
    milestoneCompleted: { type: Boolean, default: true },
    preferredChannel: {
      type:    String,
      enum:    ['in_app',],
      default: 'in_app',
    },
  },
  {
    timestamps: true, // updatedAt only needed here
  }
)

// Indexes
notificationPreferenceSchema.index({ userId: 1 }, { unique: true })

module.exports = mongoose.model('NotificationPreference', notificationPreferenceSchema)
