const mongoose = require('mongoose')

const contactRequestSchema = new mongoose.Schema(
  {
    name:             { type: String, required: true },
    email:            { type: String, required: true },
    organizationName: { type: String, required: true },
    role:             { type: String, default: '' }, // e.g. "NGO Admin", "Coordinator", "Donor"
    message:          { type: String, default: '' },
    status: {
      type:    String,
      enum:    ['new', 'reviewed', 'actioned'],
      default: 'new',
    },
    submittedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: false,
  }
)

module.exports = mongoose.model('ContactRequest', contactRequestSchema)
