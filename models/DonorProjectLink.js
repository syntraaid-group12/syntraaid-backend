const mongoose = require('mongoose')

const donorProjectLinkSchema = new mongoose.Schema(
  {
    donorId:   { type: String, required: true }, // ref: users._id (role must be "donor")
    projectId: { type: String, required: true }, // ref: projects._id
    linkedBy:  { type: String, required: true }, // ref: users._id (must be admin)
    linkedAt:  { type: Date, default: Date.now },
    isActive:  { type: Boolean, default: true }, // set false to unlink without deleting

    // Controls what data the donor can see
    visibilitySettings: {
      showMilestoneProgress: { type: Boolean, default: true },
      showVolunteerCount:    { type: Boolean, default: true },
      showAttendanceHours:   { type: Boolean, default: true },
      showActivityFeed:      { type: Boolean, default: true },
      showProgramHealth:     { type: Boolean, default: true },
    },
  },
  {
    timestamps: false,
  }
)

// Indexes
donorProjectLinkSchema.index({ donorId: 1 })
donorProjectLinkSchema.index({ projectId: 1 })
donorProjectLinkSchema.index({ donorId: 1, projectId: 1 }, { unique: true })

module.exports = mongoose.model('DonorProjectLink', donorProjectLinkSchema)
