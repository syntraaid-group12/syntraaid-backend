// models/Task.js
const mongoose = require('mongoose');
const ENUMS    = require('../constants/enums');

const assignedBySchema = new mongoose.Schema({
  volunteerId: { type: String },
  assignedBy:  { type: String },
  assignedAt:  { type: Date, default: Date.now },
}, { _id: false });

const taskSchema = new mongoose.Schema(
  {
    projectId:   { type: String, required: true },  // ref → projects._id
    milestoneId: { type: String, default: null },   // ref → projects.milestones._id (optional)
    title:       { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    status:      { type: String, enum: ENUMS.taskStatus, default: 'not_started' },
    dueDate:     { type: Date },
    notes:       { type: String, default: '' },
    assignees:   [{ type: String }],   // array of users._id strings
    assignedBy:  [assignedBySchema],   // parallel array tracking assignment metadata
    completedAt: { type: Date, default: null }, // set when status → "completed"
    createdBy:   { type: String, required: true }, // ref → users._id
  },
  { timestamps: true }
);

taskSchema.index({ projectId: 1 });
taskSchema.index({ status: 1 });
taskSchema.index({ assignees: 1 });
taskSchema.index({ dueDate: 1 });
taskSchema.index({ milestoneId: 1 });

module.exports = mongoose.model('Task', taskSchema);
