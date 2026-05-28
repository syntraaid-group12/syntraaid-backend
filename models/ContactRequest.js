// models/ContactRequest.js – SCR-PUB-04 Contact / Request Access form
const mongoose = require('mongoose');
const ENUMS    = require('../constants/enums');

const contactRequestSchema = new mongoose.Schema({
  name:             { type: String, required: true, trim: true },
  email:            { type: String, required: true, lowercase: true, trim: true },
  organizationName: { type: String, required: true, trim: true },
  role:             { type: String, default: '' },   // e.g. "NGO Admin", "Coordinator", "Donor"
  message:          { type: String, default: '' },
  status:           { type: String, enum: ENUMS.contactRequestStatus, default: 'new' },
  submittedAt:      { type: Date, default: Date.now },
});

module.exports = mongoose.model('ContactRequest', contactRequestSchema);
