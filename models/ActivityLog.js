// models/ActivityLog.js
// SOURCE: SyntraAid Master Technical Playbook v2.0 - Collection 6: activityLogs
//
// RULES FROM PLAYBOOK:
// - INSERT ONLY — tamper-proof audit trail.
// - No updatedAt, no deletedAt.
// - No client ever calls a create endpoint directly.
// - All writes go through helpers/activityLogger.js ONLY.
// - Router file must only define GET routes. No POST from any client.

const mongoose = require('mongoose')

const activityLogSchema = new mongoose.Schema({
  activityType: {
    type: String,
    // Enum enforced in the helper (activityLogger.js), not here — per playbook rule
    required: true,
  },
  actorId: {
    type: String,     // ref: users._id — who performed the action
    required: true,
  },
  targetType: {
    type: String,     // enum: "project"|"task"|"volunteer"|"milestone"|"report"
    required: true,
  },
  targetId: {
    type: String,     // _id of the affected document
    required: true,
  },
  description: {
    type: String,     // human-readable e.g. "John marked Task X as completed"
    required: true,
  },
  metadata: {
    type: Object,     // optional extra context (any additional fields)
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  // NO updatedAt — INSERT ONLY, tamper-proof per playbook
})

// Indexes from playbook
activityLogSchema.index({ actorId: 1 })
activityLogSchema.index({ targetId: 1 })
activityLogSchema.index({ activityType: 1 })
activityLogSchema.index({ createdAt: -1 }) // most recent first

module.exports = mongoose.model('ActivityLog', activityLogSchema, 'activityLogs')
//                                                                  ↑ exact collection name from playbook
