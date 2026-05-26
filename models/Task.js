const mongoose = require('mongoose')

const assignedBySchema = new mongoose.Schema(
  {
    volunteerId: { type: String, required: true },
    assignedBy:  { type: String, required: true },
    assignedAt:  { type: Date, default: Date.now },
  },
  { _id: false }
)

const taskSchema = new mongoose.Schema(
  {
    projectId:   { type: String, required: true }, // ref: projects._id
    milestoneId: { type: String, default: null },  // ref: projects.milestones._id (optional)
    title:       { type: String, required: true },
    description: { type: String, default: '' },
    status: {
      type:    String,
      enum:    ['not_started', 'in_progress', 'blocked', 'completed'],
      default: 'not_started',
    },
    dueDate:     { type: Date },
    notes:       { type: String, default: '' },
    assignees:   { type: [String], default: [] }, // array of users._id strings
    assignedBy:  { type: [assignedBySchema], default: [] },
    completedAt: { type: Date, default: null },   // null until status → "completed"
    createdBy:   { type: String, required: true },
  },
  { timestamps: true }
)

// Indexes
taskSchema.index({ projectId: 1 })
taskSchema.index({ status: 1 })
taskSchema.index({ assignees: 1 })
taskSchema.index({ dueDate: 1 })
taskSchema.index({ milestoneId: 1 })

module.exports = mongoose.model('Task', taskSchema)
