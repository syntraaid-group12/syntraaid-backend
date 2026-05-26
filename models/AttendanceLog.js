// models/AttendanceLog.js
// SOURCE: SyntraAid Master Technical Playbook v2.0 - Collection 5: attendanceLogs
//
// RULES FROM PLAYBOOK:
// - INSERT ONLY. No updatedAt field (intentional).
// - No UPDATE or DELETE operations on this collection. Ever.
// - References stored as String (not ObjectId) per playbook Part 2 convention.
// - totalHoursLogged is NEVER stored here — always aggregated on the fly.
// - loggedAt is system-set, never user-edited.

const mongoose = require('mongoose')

const attendanceLogSchema = new mongoose.Schema({
  volunteerId: {
    type: String,       // ref: users._id — stored as String per playbook
    required: true,
  },
  projectId: {
    type: String,       // ref: projects._id — stored as String per playbook
    required: true,
  },
  sessionDate: {
    type: Date,         // the date the session occurred — required
    required: true,
  },
  hoursLogged: {
    type: Number,       // must be > 0 e.g. 2.5
    required: true,
    min: [0.1, 'hoursLogged must be greater than 0'],
  },
  notes: {
    type: String,       // optional — used for corrections referencing original entry
    default: null,
  },
  loggedBy: {
    type: String,       // ref: users._id — volunteer or coordinator who logged it
    required: true,
  },
  loggedAt: {
    type: Date,         // system-set, never user-edited
    default: Date.now,
  },
  // NOTE: NO updatedAt — this collection is INSERT ONLY per playbook rule
})

// Indexes from playbook
attendanceLogSchema.index({ volunteerId: 1 })
attendanceLogSchema.index({ projectId: 1 })
attendanceLogSchema.index({ sessionDate: 1 })
attendanceLogSchema.index({ volunteerId: 1, projectId: 1 }) // compound index

// Disable updatedAt — this collection is INSERT ONLY
// Using { timestamps: false } intentionally
module.exports = mongoose.model('AttendanceLog', attendanceLogSchema, 'attendanceLogs')
//                                                                      ↑ exact collection name from playbook
