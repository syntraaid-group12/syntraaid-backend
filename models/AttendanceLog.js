// models/AttendanceLog.js
// ⚠️  INSERT ONLY. No PUT/PATCH/DELETE routes exist for this collection.
// Corrections are new documents with a `notes` field referencing the original entry _id.
const mongoose = require('mongoose');

const attendanceLogSchema = new mongoose.Schema({
  volunteerId:  { type: String, required: true }, // ref → users._id
  projectId:    { type: String, required: true }, // ref → projects._id
  sessionDate:  { type: Date,   required: true },
  hoursLogged:  {
    type: Number,
    required: true,
    min: [0.01, 'hoursLogged must be greater than 0'],
  },
  notes:     { type: String, default: '' },  // for corrections: "Correction for entry [_id]"
  loggedBy:  { type: String, required: true }, // ref → users._id (volunteer or coordinator)
  loggedAt:  { type: Date, default: Date.now }, // system-set, never user-edited
  // NO updatedAt – this collection is INSERT ONLY
});

attendanceLogSchema.index({ volunteerId: 1 });
attendanceLogSchema.index({ projectId: 1 });
attendanceLogSchema.index({ sessionDate: 1 });
attendanceLogSchema.index({ volunteerId: 1, projectId: 1 });

module.exports = mongoose.model('AttendanceLog', attendanceLogSchema);
