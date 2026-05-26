const mongoose = require('mongoose')

const userSchema = new mongoose.Schema(
  {
    email:        { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: {
      type:    String,
      enum:    ['admin', 'coordinator', 'volunteer', 'donor'],
      required: true,
    },
    isActive:    { type: Boolean, default: false }, // admin must activate
    inviteToken: { type: String, default: null },   // UUID, single-use, null after registration
    invitedBy:   { type: String, default: null },   // ref: users._id
    deletedAt:   { type: Date,   default: null },   // null = active, set = soft deleted
  },
  { timestamps: true } // createdAt + updatedAt
)

// Indexes
userSchema.index({ email: 1 },       { unique: true })
userSchema.index({ role: 1 })
userSchema.index({ inviteToken: 1 })

module.exports = mongoose.model('User', userSchema)
