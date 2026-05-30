// controllers/coordinator.controller.js
// Coordinator dashboard data aggregation.
// Coordinators manage their assigned projects and the volunteers within them.

const Project       = require('../models/Project');
const Task          = require('../models/Task');
const AttendanceLog = require('../models/AttendanceLog');
const ActivityLog   = require('../models/ActivityLog');
const VolunteerProfile = require('../models/VolunteerProfile');
const computeProgramHealth = require('../helpers/programHealth');

// GET /api/coordinator/dashboard  [coordinator]
// Returns summary of all projects the coordinator manages
exports.getDashboard = async (req, res, next) => {
  try {
    const coordinatorId = String(req.user._id);

    // All non-deleted projects assigned to this coordinator
    const projects = await Project.find({ coordinatorId, deletedAt: null });

    // Build enriched summary per project
    const projectSummaries = await Promise.all(projects.map(async (p) => {
      const tasks         = await Task.find({ projectId: String(p._id) });
      const totalTasks    = tasks.length;
      const completedTasks = tasks.filter(t => t.status === 'completed').length;
      const blockedTasks  = tasks.filter(t => t.status === 'blocked').length;
      const overdueTasks  = tasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'completed').length;
      const health        = await computeProgramHealth(p);

      return {
        _id:              p._id,
        title:            p.title,
        status:           p.status,
        startDate:        p.startDate,
        endDate:          p.endDate,
        programHealthStatus: health,
        volunteerCount:   p.volunteers.length,
        taskStats: { totalTasks, completedTasks, blockedTasks, overdueTasks },
        completionRate:   totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
      };
    }));

    // Aggregate all tasks across coordinator's projects that are blocked
    const blockedTasks = await Task.find({
      projectId: { $in: projects.map(p => String(p._id)) },
      status: 'blocked',
    }).sort({ updatedAt: -1 }).limit(10);

    // Recent activity across coordinator's projects
    const recentActivity = await ActivityLog.find({
      targetId: { $in: projects.map(p => String(p._id)) },
    }).sort({ createdAt: -1 }).limit(15);

    res.json({
      success: true,
      data: {
        coordinatorId,
        totalProjects:  projects.length,
        activeProjects: projects.filter(p => p.status === 'active').length,
        projects:       projectSummaries,
        blockedTasks,
        recentActivity,
      },
    });
  } catch (err) { next(err); }
};

// GET /api/coordinator/projects  [coordinator]
// Lists all projects for this coordinator with filtering
exports.getProjects = async (req, res, next) => {
  try {
    const filter = { coordinatorId: String(req.user._id), deletedAt: null };
    if (req.query.status) filter.status = req.query.status;

    const projects = await Project.find(filter).sort({ createdAt: -1 });

    const enriched = await Promise.all(projects.map(async (p) => {
      const health = await computeProgramHealth(p);
      const tasks  = await Task.find({ projectId: String(p._id) });
      return {
        ...p.toObject(),
        programHealthStatus: health,
        taskCount: tasks.length,
        completedTaskCount: tasks.filter(t => t.status === 'completed').length,
      };
    }));

    res.json({ success: true, count: enriched.length, data: enriched });
  } catch (err) { next(err); }
};
