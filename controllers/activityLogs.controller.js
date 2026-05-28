// controllers/activityLogs.controller.js
// ⚠️  READ ONLY for clients.
// All writes go through helpers/activityLogger.js internally only.
const ActivityLog = require('../models/ActivityLog');

// GET /api/activity-logs  [admin, coordinator]
// Filters: ?targetId= &activityType= &startDate= &endDate= &limit=
exports.listActivityLogs = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.targetId)    filter.targetId    = req.query.targetId;
    if (req.query.actorId)     filter.actorId     = req.query.actorId;
    if (req.query.activityType) filter.activityType = req.query.activityType;
    if (req.query.startDate || req.query.endDate) {
      filter.createdAt = {};
      if (req.query.startDate) filter.createdAt.$gte = new Date(req.query.startDate);
      if (req.query.endDate)   filter.createdAt.$lte = new Date(req.query.endDate);
    }

    const limit = Math.min(parseInt(req.query.limit) || 50, 200);
    const logs  = await ActivityLog.find(filter).sort({ createdAt: -1 }).limit(limit);

    res.json({ success: true, count: logs.length, data: logs });
  } catch (err) { next(err); }
};
