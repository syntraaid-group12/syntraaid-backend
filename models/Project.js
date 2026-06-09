// models/Project.js
const mongoose = require('mongoose');
const ENUMS    = require('../constants/enums');

// Milestones are embedded (they never need to be queried independently across projects)
const milestoneSchema = new mongoose.Schema({
  title:       { type: String, required: true },
  description: { type: String, default: '' },
  dueDate:     { type: Date },
  isCompleted: { type: Boolean, default: false },
  completedAt: { type: Date, default: null },
  sortOrder:   { type: Number, default: 0 },
});

const assignedAtSchema = new mongoose.Schema({
  volunteerId: { type: String },
  assignedBy:  { type: String },
  assignedAt:  { type: Date, default: Date.now },
}, { _id: false });

const projectSchema = new mongoose.Schema(
  {
    title:         { type: String, required: true, trim: true },
    description:   { type: String, default: '' },
    goals:         { type: String, default: '' },
    status:        { type: String, enum: ENUMS.projectStatus, default: 'planning' },
    startDate:     { type: Date },
    endDate:       { type: Date },
    coordinatorId: { type: String, default: null }, // ref → users._id
    createdBy:     { type: String, required: true }, // ref → users._id
    milestones:    [milestoneSchema],
    volunteers:    [{ type: String }],     // array of users._id strings
    assignedAt:    [assignedAtSchema],     // parallel array tracking assignment metadata
    deletedAt:     { type: Date, default: null }, // null = active; set = soft deleted
  },
  { timestamps: true }
);

projectSchema.index({ status: 1 });
projectSchema.index({ coordinatorId: 1 });
projectSchema.index({ createdBy: 1 });
projectSchema.index({ volunteers: 1 });

module.exports = mongoose.model('Project', projectSchema);
