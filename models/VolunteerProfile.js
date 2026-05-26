const mongoose = require('mongoose')

const volunteerProfileSchema = new mongoose.Schema(
  {
    userId:    { type: String, required: true, unique: true }, // ref: users._id
    firstName: { type: String, required: true },
    lastName:  { type: String, required: true },
    bio:       { type: String, default: '' },

    // Array of skill tags e.g. ["teaching", "first aid"]
    skills: { type: [String], default: [] },

    // e.g. ["MON", "WED", "FRI"]
    availabilityDays: { type: [String], default: [] },

    // e.g. ["morning", "afternoon"]
    availabilityTimes: { type: [String], default: [] },

    // e.g. ["50 Hours", "Project Champion"]
    recognitionBadges: { type: [String], default: [] },

    // NOTE: totalHoursLogged is NEVER stored here.
    // Always computed: db.attendanceLogs.aggregate SUM of hoursLogged where volunteerId = userId
  },
  { timestamps: true }
)

// Indexes
volunteerProfileSchema.index({ userId: 1 },           { unique: true })
volunteerProfileSchema.index({ skills: 1 })
volunteerProfileSchema.index({ availabilityDays: 1 })

module.exports = mongoose.model('VolunteerProfile', volunteerProfileSchema)
