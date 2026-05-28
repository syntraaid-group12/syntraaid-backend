// models/VolunteerProfile.js
const mongoose = require('mongoose');

const volunteerProfileSchema = new mongoose.Schema(
  {
    userId:            { type: String, required: true, unique: true }, // ref → users._id
    firstName:         { type: String, required: true, trim: true },
    lastName:          { type: String, required: true, trim: true },
    bio:               { type: String, default: '' },
    skills:            [{ type: String }],           // e.g. ["teaching", "first aid"]
    availabilityDays:  [{ type: String }],           // e.g. ["MON", "WED", "FRI"]
    availabilityTimes: [{ type: String }],           // e.g. ["morning", "afternoon"]
    recognitionBadges: [{ type: String }],           // e.g. ["50 Hours", "Project Champion"]
    // NOTE: totalHoursLogged is NEVER stored here.
    // Always compute via: db.attendanceLogs.aggregate SUM of hoursLogged where volunteerId = userId
  },
  { timestamps: true }
);

// volunteerProfileSchema.index({ userId: 1 }, { unique: true });
volunteerProfileSchema.index({ skills: 1 });
volunteerProfileSchema.index({ availabilityDays: 1 });

module.exports = mongoose.model('VolunteerProfile', volunteerProfileSchema);
