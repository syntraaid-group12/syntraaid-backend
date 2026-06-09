// helpers/activityLogger.js
// Reusable helper: writes one entry to the activityLogs collection.
// Call this at the END of every controller action that mutates data.
// ⚠️  No client ever calls a create endpoint for activityLogs directly.

const ActivityLog = require('../models/ActivityLog');

/**
 * @param {Object} params
 * @param {string} params.activityType  – must be in ENUMS.activityType
 * @param {string} params.actorId       – _id of the user performing the action
 * @param {string} params.targetType    – must be in ENUMS.targetType
 * @param {string} params.targetId      – _id of the affected document
 * @param {string} params.description   – human-readable description
 * @param {Object} [params.metadata]    – optional extra context
 */
const logActivity = async ({ activityType, actorId, targetType, targetId, description, metadata = {} }) => {
  try {
    await ActivityLog.create({ activityType, actorId, targetType, targetId, description, metadata });
  } catch (err) {
    // Activity logging failures must NEVER break the main request.
    // Log to console only.
    console.error('⚠️  activityLogger failed:', err.message);
  }
};

module.exports = logActivity;
