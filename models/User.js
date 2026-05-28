// models/User.js
const mongoose = require('mongoose');
const ENUMS    = require('../constants/enums');

const userSchema = new mongoose.Schema(
  {
    email:        { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role:         { type: String, enum: ENUMS.userRole, required: true },
    isActive:     { type: Boolean, default: false },
    inviteToken:  { type: String, default: null },   // UUID, single-use, null after registration
    invitedBy:    { type: String, default: null },   // _id string ref → users
    deletedAt:    { type: Date,   default: null },   // null = active; set = soft deleted
  },
  { timestamps: true } // auto-manages createdAt + updatedAt
);

// Indexes (additional – unique on email is already set via `unique: true` above)
userSchema.index({ role: 1 });
userSchema.index({ inviteToken: 1 });

module.exports = mongoose.model('User', userSchema);
