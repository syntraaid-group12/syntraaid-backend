// scripts/deadlineReminder.js
// Sends deadline reminder notifications for tasks due in the next 48 hours.
// Run via a cron job, Railway cron, or node-cron.
//
// To schedule with node-cron, add to server.js:
//   const cron = require('node-cron');
//   cron.schedule('0 8 * * *', () => require('./scripts/deadlineReminder')());
//
// Or run manually:  node scripts/deadlineReminder.js

require('dotenv').config();
const mongoose = require('mongoose');

const Task                   = require('../models/Task');
const User                   = require('../models/User');
const NotificationPreference = require('../models/NotificationPreference');
const sendNotification       = require('../helpers/notificationSender');
const { sendDeadlineReminderEmail } = require('../helpers/emailSender');

const runDeadlineReminders = async () => {
  const standalone = require.main === module;
  if (standalone) await mongoose.connect(process.env.MONGO_URI);

  try {
    const now           = new Date();
    const in48Hours     = new Date(now.getTime() + 48 * 60 * 60 * 1000);

    // Find all incomplete tasks due within 48 hours
    const upcomingTasks = await Task.find({
      status:  { $in: ['not_started', 'in_progress'] },
      dueDate: { $gte: now, $lte: in48Hours },
    });

    console.log(`[deadlineReminder] Found ${upcomingTasks.length} tasks due in 48h`);

    for (const task of upcomingTasks) {
      for (const volunteerId of task.assignees) {
        // Check if this volunteer has deadline reminders enabled
        const prefs = await NotificationPreference.findOne({ userId: volunteerId });
        if (prefs && !prefs.deadlineReminder) continue;

        // Create in-app notification
        await sendNotification({
          recipientId:      volunteerId,
          notificationType: 'deadline_reminder',
          referenceType:    'task',
          referenceId:      String(task._id),
          message:          `Task "${task.title}" is due on ${new Date(task.dueDate).toDateString()}. Please update its status.`,
        });

        // Send email reminder if preference is email or both
        const channel = prefs?.preferredChannel || 'in_app';
        if (channel === 'email' || channel === 'both') {
          const user = await User.findById(volunteerId).select('email');
          if (user) {
            await sendDeadlineReminderEmail(user.email, task.title, task.dueDate);
          }
        }
      }
    }

    console.log('[deadlineReminder] Complete');
  } catch (err) {
    console.error('[deadlineReminder] Error:', err.message);
  }

  if (standalone) {
    await mongoose.disconnect();
    process.exit(0);
  }
};

module.exports = runDeadlineReminders;

// Allow direct execution
if (require.main === module) {
  runDeadlineReminders();
}
