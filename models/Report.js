// models/Report.js
const mongoose = require('mongoose');
const ENUMS    = require('../constants/enums');

const reportSchema = new mongoose.Schema({
  reportType:     { type: String, enum: ENUMS.reportType, required: true },
  generatedBy:    { type: String, required: true }, // ref → users._id
  projectId:      { type: String, default: null },  // null = org-wide report
  dateRangeStart: { type: Date },
  dateRangeEnd:   { type: Date },
  fileUrl:        { type: String, default: '' },    // URL to generated PDF or CSV
  generatedAt:    { type: Date, default: Date.now },
});

reportSchema.index({ generatedBy: 1 });
reportSchema.index({ projectId: 1 });
reportSchema.index({ generatedAt: -1 });

module.exports = mongoose.model('Report', reportSchema);
