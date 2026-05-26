// routes/activityLogs.routes.js
// SOURCE: SyntraAid Master Technical Playbook v2.0
//
// ⚠️  PLAYBOOK RULE: Router file must only define GET routes.
// ⚠️  All writes go through helpers/activityLogger.js only.
// ⚠️  No POST, PUT, PATCH, DELETE from any client. Ever.

const express = require('express')
const router = express.Router()
const { protect, roleGuard } = require('../middleware/auth')
const {
  getAllActivityLogs,
  getActivityLogById,
} = require('../controllers/activityLogs.controller')

// ─────────────────────────────────────────────
// GET /api/activity-logs
// Access: admin, coordinator
// All logs with optional filters: targetId, activityType, actorId, targetType, startDate, endDate
// ─────────────────────────────────────────────
router.get(
  '/',
  protect,
  roleGuard(['admin', 'coordinator']),
  getAllActivityLogs
)

// ─────────────────────────────────────────────
// GET /api/activity-logs/:id
// Access: admin, coordinator
// Single activity log entry
// ─────────────────────────────────────────────
router.get(
  '/:id',
  protect,
  roleGuard(['admin', 'coordinator']),
  getActivityLogById
)

// ─────────────────────────────────────────────
// ⛔ NO POST /api/activity-logs  — intentionally missing
// ⛔ NO PUT /api/activity-logs/:id — intentionally missing
// ⛔ NO DELETE /api/activity-logs/:id — intentionally missing
// Playbook rule: activityLogs is written internally only via activityLogger.js helper.
// ─────────────────────────────────────────────

module.exports = router
