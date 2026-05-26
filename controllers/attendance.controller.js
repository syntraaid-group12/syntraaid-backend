// controllers/attendance.controller.js
// SOURCE: SyntraAid Master Technical Playbook v2.0
//
// PLAYBOOK RULES FOR THIS CONTROLLER:
// 1. INSERT ONLY — no update, no delete logic here ever.
// 2. totalHoursLogged is NEVER stored — always computed via aggregation.
// 3. After every successful log, call activityLogger with activityType: 'attendance_logged'.
// 4. hoursLogged must be > 0.
// 5. loggedAt is system-set — never from req.body.

const AttendanceLog = require('../models/AttendanceLog')
const activityLogger = require('../helpers/activityLogger')
const ENUMS = require('../constants/enums')

// ─────────────────────────────────────────────
// POST /api/attendance
// Access: volunteer, coordinator
// Logs a new attendance session — INSERT ONLY
// ─────────────────────────────────────────────
const logAttendance = async (req, res) => {
  try {
    const { volunteerId, projectId, sessionDate, hoursLogged, notes } = req.body

    // --- Validation ---
    if (!volunteerId || !projectId || !sessionDate || !hoursLogged) {
      return res.status(400).json({
        message: 'volunteerId, projectId, sessionDate, and hoursLogged are all required.',
      })
    }

    if (hoursLogged <= 0) {
      return res.status(400).json({
        message: 'hoursLogged must be greater than 0.',
      })
    }

    // --- Create the log (INSERT ONLY — no update path exists) ---
    const log = await AttendanceLog.create({
      volunteerId,
      projectId,
      sessionDate: new Date(sessionDate),
      hoursLogged,
      notes: notes || null,
      loggedBy: req.user.id,  // from JWT middleware — who is making the request
      // loggedAt defaults to Date.now() in the model — never from req.body
    })

    // --- Rule 4: Always call activityLogger after attendance_logged ---
    await activityLogger({
      activityType: 'attendance_logged',
      actorId: req.user.id,
      targetType: 'project',
      targetId: projectId,
      description: `User ${req.user.id} logged ${hoursLogged} hour(s) on project ${projectId}`,
      metadata: { hoursLogged, sessionDate, volunteerId },
    })

    return res.status(201).json({
      message: 'Attendance logged successfully.',
      log,
    })
  } catch (err) {
    return res.status(500).json({ message: 'Server error.', error: err.message })
  }
}

// ─────────────────────────────────────────────
// GET /api/attendance
// Access: admin, coordinator
// All logs — filterable by projectId, volunteerId, dateRange
// ─────────────────────────────────────────────
const getAllAttendance = async (req, res) => {
  try {
    const { projectId, volunteerId, startDate, endDate } = req.query
    const filter = {}

    if (projectId) filter.projectId = projectId
    if (volunteerId) filter.volunteerId = volunteerId

    // Date range filter on sessionDate
    if (startDate || endDate) {
      filter.sessionDate = {}
      if (startDate) filter.sessionDate.$gte = new Date(startDate)
      if (endDate) filter.sessionDate.$lte = new Date(endDate)
    }

    const logs = await AttendanceLog.find(filter).sort({ sessionDate: -1 })

    return res.status(200).json({ count: logs.length, logs })
  } catch (err) {
    return res.status(500).json({ message: 'Server error.', error: err.message })
  }
}

// ─────────────────────────────────────────────
// GET /api/attendance/total/:volunteerId
// Computes totalHoursLogged on the fly — NEVER stored as a field
// Rule 8 from playbook: always aggregated from attendanceLogs
// ─────────────────────────────────────────────
const getTotalHours = async (req, res) => {
  try {
    const { volunteerId } = req.params
    const { projectId } = req.query

    const matchStage = { volunteerId }
    if (projectId) matchStage.projectId = projectId

    // Aggregate SUM of hoursLogged — this is the ONLY correct way per playbook
    const result = await AttendanceLog.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalHoursLogged: { $sum: '$hoursLogged' }, // field name per playbook naming table
          totalSessions: { $sum: 1 },
        },
      },
    ])

    const totalHoursLogged = result[0]?.totalHoursLogged || 0
    const totalSessions = result[0]?.totalSessions || 0

    return res.status(200).json({
      volunteerId,
      projectId: projectId || 'all projects',
      totalHoursLogged, // exact field name from playbook Cross-Team Naming table
      totalSessions,
    })
  } catch (err) {
    return res.status(500).json({ message: 'Server error.', error: err.message })
  }
}

// ─────────────────────────────────────────────
// GET /api/attendance/export
// Access: admin only
// Returns all logs for CSV/PDF export (query: projectId, dateRange)
// ─────────────────────────────────────────────
const exportAttendance = async (req, res) => {
  try {
    const { projectId, startDate, endDate } = req.query
    const filter = {}

    if (projectId) filter.projectId = projectId
    if (startDate || endDate) {
      filter.sessionDate = {}
      if (startDate) filter.sessionDate.$gte = new Date(startDate)
      if (endDate) filter.sessionDate.$lte = new Date(endDate)
    }

    const logs = await AttendanceLog.find(filter).sort({ sessionDate: -1 })

    // Return raw JSON — report generation (PDF/CSV) handled by reports module
    return res.status(200).json({
      exportedAt: new Date(),
      count: logs.length,
      logs,
    })
  } catch (err) {
    return res.status(500).json({ message: 'Server error.', error: err.message })
  }
}

module.exports = {
  logAttendance,
  getAllAttendance,
  getTotalHours,
  exportAttendance,
}
