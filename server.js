require('dotenv').config()
const express    = require('express')
const cors       = require('cors')
const connectDB  = require('./config/db')
const errorHandler = require('./middleware/errorHandler')

const app = express()

// ── Connect to MongoDB Atlas ─────────────────────────────────────────────────
connectDB()

// ── Global Middleware ────────────────────────────────────────────────────────
app.use(cors())
app.use(express.json())

// ── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth',          require('./routes/auth.routes'))
app.use('/api/users',         require('./routes/users.routes'))
app.use('/api/volunteers',    require('./routes/volunteers.routes'))
app.use('/api/projects',      require('./routes/projects.routes'))
app.use('/api/tasks',         require('./routes/tasks.routes'))
app.use('/api/attendance',    require('./routes/attendance.routes'))
app.use('/api/activity-logs', require('./routes/activityLogs.routes'))
app.use('/api/reports',       require('./routes/reports.routes'))
app.use('/api/donors',        require('./routes/donors.routes'))
app.use('/api/notifications', require('./routes/notifications.routes'))
app.use('/api/contact',       require('./routes/contact.routes'))

// ── Health check ─────────────────────────────────────────────────────────────
app.get('/', (req, res) => res.json({ message: 'SyntraAid API is running.' }))

// ── Global error handler (must be last) ──────────────────────────────────────
app.use(errorHandler)

// ── Start server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000
app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
