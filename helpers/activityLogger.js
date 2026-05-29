import ActivityLog from "../models/activityLog.js";

const ActivityLogger = async ({
  activityType,
  actorId,
  targetType,
  targetId,
  description,
  metadata = {},
}) => {
  await ActivityLog.create({
    activityType,
    actorId,
    targetType,
    targetId,
    description,
    metadata,
  });
};

export default ActivityLogger;
