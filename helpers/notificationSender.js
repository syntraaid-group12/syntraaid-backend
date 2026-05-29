import Notification from "../models/notification.js";
import NotificationPreference from "../models/notificationPreference.js";
import ENUMS from "../constants/enums.js";

const NotificationSender = async ({
  recipientId,
  notificationType,
  referenceType,
  referenceId,
  message,
  deliveryChannel = "in_app",
}) => {
  // Validate notificationType
  if (!ENUMS.notificationType.includes(notificationType)) {
    console.error(
      `[notificationSender] Invalid notificationType: "${notificationType}"`,
    );
    return;
  }

  // Validate referenceType
  if (!ENUMS.referenceType.includes(referenceType)) {
    console.error(
      `[notificationSender] Invalid referenceType: "${referenceType}"`,
    );
    return;
  }

  try {
    // Check user's preferences before sending
    const prefs = await NotificationPreference.findOne({userId: recipientId});

    if (prefs) {
      const prefMap = {
        task_assigned: "taskAssigned",
        deadline_reminder: "deadlineReminder",
        task_blocked: "taskBlocked",
        milestone_completed: "milestoneCompleted",
        donor_milestone_alert: "milestoneCompleted",
        project_status_changed: null, // always send
      };

      const prefField = prefMap[notificationType];

      // If user turned this notification type off, skip it
      if (prefField && prefs[prefField] === false) {
        console.log(
          `[notificationSender] User ${recipientId} disabled "${notificationType}". Skipping.`,
        );
        return;
      }

      deliveryChannel = prefs.preferredChannel || deliveryChannel;
    }

    await Notification.create({
      recipientId,
      notificationType,
      referenceType,
      referenceId,
      message,
      isRead: false,
      deliveryChannel,
    });
  } catch (err) {
    console.error("[notificationSender] Failed:", err.message);
  }
};

export default NotificationSender;
