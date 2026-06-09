// models/ActivityLog.js
// ⚠️  INSERT ONLY, tamper-proof audit trail.
// No UPDATE or DELETE operations on this collection. Ever.
// All writes go through helpers/activityLogger.js only.
const mongoose = require('mongoose');
const ENUMS    = require('../constants/enums');

const activityLogSchema = new mongoose.Schema({
  activityType: { type: String, enum: ENUMS.activityType, required: true },
  actorId:      { type: String, required: true }, // ref → users._id
  targetType:   { type: String, enum: ENUMS.targetType, required: true },
  targetId:     { type: String, required: true }, // _id of the affected document
  description:  { type: String, required: true }, // human-readable e.g. "John marked Task X as completed"
  metadata:     { type: mongoose.Schema.Types.Mixed, default: {} }, // optional extra context
  createdAt:    { type: Date, default: Date.now },
  // NO updatedAt, NO deletedAt
});

activityLogSchema.index({ actorId: 1 });
activityLogSchema.index({ targetId: 1 });
activityLogSchema.index({ activityType: 1 });
activityLogSchema.index({ createdAt: -1 }); // most recent first

module.exports = mongoose.model('ActivityLog', activityLogSchema);
