// models/Donation.js
// Lightweight, text-only donation record for the manual donation flow.
// No file uploads. A donor submits a confirmation after paying; an admin
// cross-checks against the bank account and acknowledges it.
const mongoose = require('mongoose');

const donationSchema = new mongoose.Schema(
  {
    donorId:        { type: String, required: true }, // ref -> users._id (role: donor)
    referenceCode:  { type: String, required: true }, // e.g. SYN-8F1A4D, donor includes this in their bank transfer description
    amount:         { type: Number, required: true, min: [1, 'amount must be greater than 0'] },
    datePaid:       { type: Date, required: true },
    senderName:     { type: String, required: true, trim: true }, // bank/account name the donor paid from
    note:           { type: String, default: '' },
    status:         { type: String, enum: ['pending', 'acknowledged'], default: 'pending' },
    projectId:      { type: String, default: null }, // optional: admin can link the donation to a project on acknowledge
    acknowledgedBy: { type: String, default: null }, // ref -> users._id (admin)
    acknowledgedAt: { type: Date,   default: null },
  },
  { timestamps: true }
);

donationSchema.index({ donorId: 1 });
donationSchema.index({ status: 1 });
donationSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Donation', donationSchema);
