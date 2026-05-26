// server.js
// SOURCE: SyntraAid Master Technical Playbook v2.0 - Part 3
// Entry point. Starts Express server.

const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
require('dotenv').config()

const app = express()

// Middleware
app.use(cors())
app.use(express.json())

// ─────────────────────────────────────────────
// Routes — per playbook Part 3 route file names
// ─────────────────────────────────────────────
app.use('/api/attendance',    require('./routes/attendance.routes'))
app.use('/api/activity-logs', require('./routes/activityLogs.routes'))

// Module 7 — Notifications
app.use('/api/notifications',  require('./routes/notifications.routes'))
app.use('/api/users/:id/notification-preferences', require('./routes/notificationPreferences.routes'))

// Module 8 — Recognition Engine
app.use('/api/recognition', require('./routes/recognition.routes'))

// Dev only — remove before production
app.use('/test', require('./routes/test.routes'))

// Health check
app.get('/', (req, res) => res.json({ message: 'SyntraAid API running ✅' }))

// ─────────────────────────────────────────────
// Connect to MongoDB Atlas and start server
// ─────────────────────────────────────────────
const PORT = process.env.PORT || 5000
const MONGO_URI = process.env.MONGO_URI

if (!MONGO_URI) {
  console.error('❌ MONGO_URI is not set in your .env file')
  process.exit(1)
}

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('MongoDB Atlas connected ✅')
    app.listen(PORT, () => console.log(`SyntraAid server running on port ${PORT} ✅`))
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err.message)
    process.exit(1)
  })