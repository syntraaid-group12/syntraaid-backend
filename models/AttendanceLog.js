const mongoose = require('mongoose')

// ⚠️ INSERT ONLY — no updatedAt, no PUT/PATCH/DELETE routes ever
const attendanceLogSchema = new mongoose.Schema(
  {
    volunteerId:  { type: String, required: true }, // ref: users._id
    projectId:    { type: String, required: true }, // ref: projects._id
    sessionDate:  { type: Date,   required: true }, // the date the session occurred
    hoursLogged:  {
      type:     Number,
      required: true,
      min:      [0.1, 'hoursLogged must be greater than 0'],
    },
    notes:    { type: String, default: '' }, // use for corrections referencing original entry
    loggedBy: { type: String, required: true }, // ref: users._id (volunteer or coordinator)
    loggedAt: { type: Date, default: Date.now }, // system set, never user-edited
  },
  {
    timestamps: false, // NO updatedAt — this collection is INSERT ONLY
  }
)

// Indexes
attendanceLogSchema.index({ volunteerId: 1 })
attendanceLogSchema.index({ projectId: 1 })
attendanceLogSchema.index({ sessionDate: 1 })
attendanceLogSchema.index({ volunteerId: 1, projectId: 1 })

module.exports = mongoose.model('AttendanceLog', attendanceLogSchema)
