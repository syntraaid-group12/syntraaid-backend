import mongoose from "mongoose";

const notificationPreferenceSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true, // one record per user
  },
  taskAssigned: {
    type: Boolean,
    default: true,
  },
  deadlineReminder: {
    type: Boolean,
    default: true,
  },
  taskBlocked: {
    type: Boolean,
    default: true,
  },
  milestoneCompleted: {
    type: Boolean,
    default: true,
  },
  preferredChannel: {
    type: String, // enum: "in_app"|"email"|"both"
    default: "in_app",
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Index from playbook
notificationPreferenceSchema.index({userId: 1}, {unique: true});

// Update updatedAt on every save
notificationPreferenceSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

const NotificationPreference = mongoose.model(
  "NotificationPreference",
  notificationPreferenceSchema,
  "notificationPreferences",
);

export default NotificationPreference;
