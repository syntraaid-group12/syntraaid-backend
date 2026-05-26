const mongoose = require('mongoose')

const reportSchema = new mongoose.Schema(
  {
    reportType: {
      type: String,
      enum: ['impact_report', 'attendance_export', 'kpi_summary'],
      required: true,
    },
    generatedBy:    { type: String, required: true }, // ref: users._id
    projectId:      { type: String, default: null },  // ref: projects._id — null means org-wide
    dateRangeStart: { type: Date },
    dateRangeEnd:   { type: Date },
    fileUrl:        { type: String, default: null },  // URL to generated PDF or CSV
    generatedAt:    { type: Date, default: Date.now },
  },
  {
    timestamps: false,
  }
)

// Indexes
reportSchema.index({ generatedBy: 1 })
reportSchema.index({ projectId: 1 })
reportSchema.index({ generatedAt: -1 })

module.exports = mongoose.model('Report', reportSchema)
