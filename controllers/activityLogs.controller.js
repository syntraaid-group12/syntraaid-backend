// controllers/activityLogs.controller.js
// SOURCE: SyntraAid Master Technical Playbook v2.0
//
// PLAYBOOK RULES FOR THIS CONTROLLER:
// 1. GET routes ONLY — no POST, PUT, PATCH, DELETE from any client ever.
// 2. All writes go through helpers/activityLogger.js only.
// 3. This controller only reads — it never writes.

const ActivityLog = require('../models/ActivityLog')
const ENUMS = require('../constants/enums')

// ─────────────────────────────────────────────
// GET /api/activity-logs
// Access: admin, coordinator
// All logs — filterable by targetId, activityType, dateRange
// ─────────────────────────────────────────────
const getAllActivityLogs = async (req, res) => {
  try {
    const { targetId, activityType, startDate, endDate, actorId, targetType } = req.query
    const filter = {}

    if (targetId) filter.targetId = targetId
    if (actorId) filter.actorId = actorId
    if (targetType) filter.targetType = targetType

    // Validate activityType if provided
    if (activityType) {
      if (!ENUMS.activityType.includes(activityType)) {
        return res.status(400).json({
          message: `Invalid activityType. Must be one of: ${ENUMS.activityType.join(', ')}`,
        })
      }
      filter.activityType = activityType
    }

    // Date range filter on createdAt
    if (startDate || endDate) {
      filter.createdAt = {}
      if (startDate) filter.createdAt.$gte = new Date(startDate)
      if (endDate) filter.createdAt.$lte = new Date(endDate)
    }

    // Sort by most recent first — per playbook index: { createdAt: -1 }
    const logs = await ActivityLog.find(filter).sort({ createdAt: -1 })

    return res.status(200).json({ count: logs.length, logs })
  } catch (err) {
    return res.status(500).json({ message: 'Server error.', error: err.message })
  }
}

// ─────────────────────────────────────────────
// GET /api/activity-logs/:id
// Access: admin, coordinator
// Get a single activity log entry
// ─────────────────────────────────────────────
const getActivityLogById = async (req, res) => {
  try {
    const log = await ActivityLog.findById(req.params.id)

    if (!log) {
      return res.status(404).json({ message: 'Activity log not found.' })
    }

    return res.status(200).json(log)
  } catch (err) {
    return res.status(500).json({ message: 'Server error.', error: err.message })
  }
}

module.exports = {
  getAllActivityLogs,
  getActivityLogById,
}
