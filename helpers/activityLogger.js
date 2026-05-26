// helpers/activityLogger.js
// SOURCE: SyntraAid Master Technical Playbook v2.0 - Part 3 Business Logic Rules
//
// RULE: No client ever calls a create endpoint for activityLogs.
// RULE: All writes to activityLogs go through THIS function ONLY.
// RULE: Every project/task/volunteer/attendance/milestone action must call this.
//
// HOW TO USE IN A CONTROLLER:
//   const activityLogger = require('../helpers/activityLogger')
//   await activityLogger({
//     activityType: 'attendance_logged',
//     actorId: req.user.id,
//     targetType: 'project',
//     targetId: projectId,
//     description: 'Jane logged 3 hours on Food Drive 2025',
//     metadata: { hoursLogged: 3, sessionDate: '2025-06-15' }  // optional
//   })

const ActivityLog = require('../models/ActivityLog')
const ENUMS = require('../constants/enums')

const activityLogger = async ({ activityType, actorId, targetType, targetId, description, metadata = null }) => {
  // Validate activityType against playbook enum list
  if (!ENUMS.activityType.includes(activityType)) {
    console.error(`[activityLogger] Invalid activityType: "${activityType}". Must be one of: ${ENUMS.activityType.join(', ')}`)
    return // fail silently — never crash the main request because of a log failure
  }

  // Validate targetType against playbook enum list
  if (!ENUMS.targetType.includes(targetType)) {
    console.error(`[activityLogger] Invalid targetType: "${targetType}". Must be one of: ${ENUMS.targetType.join(', ')}`)
    return
  }

  try {
    await ActivityLog.create({
      activityType,
      actorId,
      targetType,
      targetId,
      description,
      metadata,
      // createdAt defaults to Date.now() in the model
    })
  } catch (err) {
    // Log the error but never crash the main request
    console.error('[activityLogger] Failed to write activity log:', err.message)
  }
}

module.exports = activityLogger
