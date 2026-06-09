// helpers/programHealth.js
// Computes programHealthStatus for a given project.
// Rules (from playbook Part 3):
//   "completed"        → project.status === "completed"
//   "on_track"         → taskCompletionRate >= 0.70 AND attendance in last 14 days
//   "at_risk"          → taskCompletionRate 0.40–0.69 OR milestone overdue > 7 days
//   "needs_attention"  → taskCompletionRate < 0.40 OR no attendance in 30 days OR milestone overdue > 14 days

const Task          = require('../models/Task');
const AttendanceLog = require('../models/AttendanceLog');

/**
 * @param {Object} project – Mongoose document from projects collection
 * @returns {Promise<string>} programHealthStatus
 */
const computeProgramHealth = async (project) => {
  if (project.status === 'completed') return 'completed';

  const now = new Date();

  // ── Task completion rate ──────────────────────────────────
  const allTasks       = await Task.find({ projectId: String(project._id) });
  const totalTasks     = allTasks.length;
  const completedTasks = allTasks.filter(t => t.status === 'completed').length;
  const taskRate       = totalTasks === 0 ? 1 : completedTasks / totalTasks;

  // ── Recent attendance (last 14 / last 30 days) ────────────
  const fourteenDaysAgo = new Date(now - 14 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo   = new Date(now - 30 * 24 * 60 * 60 * 1000);

  const recentAttendance14 = await AttendanceLog.findOne({
    projectId:   String(project._id),
    sessionDate: { $gte: fourteenDaysAgo },
  });
  const recentAttendance30 = await AttendanceLog.findOne({
    projectId:   String(project._id),
    sessionDate: { $gte: thirtyDaysAgo },
  });

  const hasAttendance14 = !!recentAttendance14;
  const hasAttendance30 = !!recentAttendance30;

  // ── Overdue milestones ────────────────────────────────────
  const sevenDaysAgo    = new Date(now - 7  * 24 * 60 * 60 * 1000);
  const fourteenDaysAgo2 = new Date(now - 14 * 24 * 60 * 60 * 1000);

  const milestoneOverdue7  = project.milestones.some(
    m => !m.isCompleted && m.dueDate && m.dueDate < sevenDaysAgo
  );
  const milestoneOverdue14 = project.milestones.some(
    m => !m.isCompleted && m.dueDate && m.dueDate < fourteenDaysAgo2
  );

  // ── Determine status ──────────────────────────────────────
  if (taskRate < 0.40 || !hasAttendance30 || milestoneOverdue14) return 'needs_attention';
  if (taskRate < 0.70 || milestoneOverdue7)                       return 'at_risk';
  if (taskRate >= 0.70 && hasAttendance14)                         return 'on_track';

  return 'at_risk'; // fallback
};

module.exports = computeProgramHealth;
