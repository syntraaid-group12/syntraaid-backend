// routes/attendance.routes.js
// SOURCE: SyntraAid Master Technical Playbook v2.0
//
// ⚠️  PLAYBOOK RULE: No PUT, PATCH, or DELETE routes for attendance. Ever.
// ⚠️  This file must ONLY define GET and POST routes. No exceptions.
// ⚠️  Corrections are new documents with a note field saying "Correction for entry [_id]"

const express = require('express')
const router = express.Router()
const { protect, roleGuard } = require('../middleware/auth')
const {
  logAttendance,
  getAllAttendance,
  getTotalHours,
  exportAttendance,
} = require('../controllers/attendance.controller')

// ─────────────────────────────────────────────
// GET /api/attendance
// Access: admin, coordinator
// All logs with optional filters: projectId, volunteerId, startDate, endDate
// ─────────────────────────────────────────────
router.get(
  '/',
  protect,
  roleGuard(['admin', 'coordinator']),
  getAllAttendance
)

// ─────────────────────────────────────────────
// GET /api/attendance/export
// Access: admin only
// Export all logs as JSON (reports module handles PDF/CSV)
// ─────────────────────────────────────────────
router.get(
  '/export',
  protect,
  roleGuard(['admin']),
  exportAttendance
)

// ─────────────────────────────────────────────
// GET /api/attendance/total/:volunteerId
// Access: admin, coordinator, volunteer
// Returns totalHoursLogged computed via aggregation — NEVER stored as a field
// ─────────────────────────────────────────────
router.get(
  '/total/:volunteerId',
  protect,
  roleGuard(['admin', 'coordinator', 'volunteer']),
  getTotalHours
)

// ─────────────────────────────────────────────
// POST /api/attendance
// Access: volunteer, coordinator, admin
// Log a new attendance session — INSERT ONLY
// ─────────────────────────────────────────────
router.post(
  '/',
  protect,
  roleGuard(['volunteer', 'coordinator', 'admin']),
  logAttendance
)

// ─────────────────────────────────────────────
// ⛔ NO PUT /api/attendance/:id   — intentionally missing
// ⛔ NO PATCH /api/attendance/:id — intentionally missing
// ⛔ NO DELETE /api/attendance/:id — intentionally missing
// Playbook rule: attendanceLogs is INSERT ONLY. Corrections are new entries.
// ─────────────────────────────────────────────

module.exports = router