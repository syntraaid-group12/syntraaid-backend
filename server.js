// ─────────────────────────────────────────────────────────────
//  SyntraAid Backend – server.js
//  Entry point: wires up Express, middleware, routes, DB.
// ─────────────────────────────────────────────────────────────
require('dotenv').config();
const express    = require('express');
const cors       = require('cors');
const rateLimit  = require('express-rate-limit');
const connectDB   = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

// ── Route files ──────────────────────────────────────────────
const authRoutes         = require('./routes/auth.routes');
const userRoutes         = require('./routes/users.routes');
const volunteerRoutes    = require('./routes/volunteers.routes');
const projectRoutes      = require('./routes/projects.routes');
const taskRoutes         = require('./routes/tasks.routes');
const attendanceRoutes   = require('./routes/attendance.routes');
const activityLogRoutes  = require('./routes/activityLogs.routes');
const reportRoutes       = require('./routes/reports.routes');
const donorRoutes        = require('./routes/donors.routes');
const notificationRoutes = require('./routes/notifications.routes');
const contactRoutes      = require('./routes/contact.routes');
const coordinatorRoutes  = require('./routes/coordinator.routes');

// ── Connect to MongoDB ────────────────────────────────────────
connectDB();

const app = express();

// ── Core Middleware ───────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ── Rate Limiters ─────────────────────────────────────────────
// Strict limiter for auth routes (prevent brute-force)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max:      20,
  message:  { success: false, message: 'Too many requests from this IP. Try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders:   false,
});

// General API limiter
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max:      120,
  message:  { success: false, message: 'Rate limit exceeded. Slow down.' },
  standardHeaders: true,
  legacyHeaders:   false,
});

// ── Health Check ──────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({ status: 'SyntraAid API running', version: '2.0', env: process.env.NODE_ENV });
});

// ── Mount Routes ──────────────────────────────────────────────
app.use('/api/auth',          authLimiter, authRoutes);
app.use('/api/users',         apiLimiter,  userRoutes);
app.use('/api/volunteers',    apiLimiter,  volunteerRoutes);
app.use('/api/projects',      apiLimiter,  projectRoutes);
app.use('/api/tasks',         apiLimiter,  taskRoutes);
app.use('/api/attendance',    apiLimiter,  attendanceRoutes);
app.use('/api/activity-logs', apiLimiter,  activityLogRoutes);
app.use('/api/reports',       apiLimiter,  reportRoutes);
app.use('/api/donors',        apiLimiter,  donorRoutes);
app.use('/api/notifications', apiLimiter,  notificationRoutes);
app.use('/api/contact',       authLimiter, contactRoutes); // public form, strict limit
app.use('/api/coordinator',   apiLimiter,  coordinatorRoutes);

// ── 404 handler ───────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// ── Global Error Handler (must be last) ───────────────────────
app.use(errorHandler);

// ── Start Server ──────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅  SyntraAid API listening on port ${PORT} [${process.env.NODE_ENV}]`);
});
