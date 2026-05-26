const mongoose = require('mongoose')

const milestoneSchema = new mongoose.Schema(
  {
    title:       { type: String, required: true },
    description: { type: String, default: '' },
    dueDate:     { type: Date },
    isCompleted: { type: Boolean, default: false },
    completedAt: { type: Date, default: null },
    sortOrder:   { type: Number, default: 0 },
  },
  { _id: true }
)

const assignedAtSchema = new mongoose.Schema(
  {
    volunteerId: { type: String, required: true },
    assignedBy:  { type: String, required: true },
    assignedAt:  { type: Date, default: Date.now },
  },
  { _id: false }
)

const projectSchema = new mongoose.Schema(
  {
    title:       { type: String, required: true },
    description: { type: String, default: '' },
    goals:       { type: String, default: '' },
    status: {
      type:    String,
      enum:    ['planning', 'active', 'on_hold', 'completed', 'cancelled'],
      default: 'planning',
    },
    startDate:     { type: Date },
    endDate:       { type: Date },
    coordinatorId: { type: String, default: null }, // required before status → "active"
    createdBy:     { type: String, required: true },
    milestones:    { type: [milestoneSchema], default: [] },
    volunteers:    { type: [String], default: [] },  // array of users._id strings
    assignedAt:    { type: [assignedAtSchema], default: [] },
    deletedAt:     { type: Date, default: null },
  },
  { timestamps: true }
)

projectSchema.index({ status: 1 })
projectSchema.index({ coordinatorId: 1 })
projectSchema.index({ createdBy: 1 })
projectSchema.index({ volunteers: 1 })

module.exports = mongoose.model('Project', projectSchema)
