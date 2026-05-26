const mongoose = require('mongoose')

// ⚠️ INSERT ONLY — tamper-proof audit trail
// No updatedAt, no deletedAt, no PUT/PATCH/DELETE routes ever
// All writes go through helpers/activityLogger.js only — no direct client POST
const activityLogSchema = new mongoose.Schema(
  {
    activityType: {
      type: String,
      enum: [
        'project_created',
        'project_status_changed',
        'task_created',
        'task_status_changed',
        'volunteer_assigned',
        'attendance_logged',
        'milestone_completed',
        'report_generated',
        'donor_linked',
      ],
      required: true,
    },
    actorId:    { type: String, required: true }, // ref: users._id — who performed the action
    targetType: {
      type: String,
      enum: ['project', 'task', 'volunteer', 'milestone', 'report'],
      required: true,
    },
    targetId:    { type: String, required: true }, // _id of the affected document
    description: { type: String, required: true }, // human-readable e.g. "John marked Task X as completed"
    metadata:    { type: mongoose.Schema.Types.Mixed, default: {} }, // optional extra context
    createdAt:   { type: Date, default: Date.now },
  },
  {
    timestamps: false, // manually managing createdAt only
  }
)

// Indexes
activityLogSchema.index({ actorId: 1 })
activityLogSchema.index({ targetId: 1 })
activityLogSchema.index({ activityType: 1 })
activityLogSchema.index({ createdAt: -1 }) // most recent first

module.exports = mongoose.model('ActivityLog', activityLogSchema)
