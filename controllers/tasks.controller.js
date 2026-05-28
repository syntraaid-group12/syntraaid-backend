// controllers/tasks.controller.js
const Task     = require('../models/Task');
const Project  = require('../models/Project');
const User     = require('../models/User');
const ENUMS    = require('../constants/enums');
const logActivity    = require('../helpers/activityLogger');
const sendNotification = require('../helpers/notificationSender');
const { sendTaskAssignedEmail } = require('../helpers/emailSender');

// GET /api/tasks  [admin, coordinator]
// Filters: ?projectId= &status= &assignee=
exports.listTasks = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.projectId) filter.projectId = req.query.projectId;
    if (req.query.milestoneId) filter.milestoneId = req.query.milestoneId;
    if (req.query.status) {
      if (!ENUMS.taskStatus.includes(req.query.status))
        return res.status(400).json({ success: false, message: 'Invalid status filter' });
      filter.status = req.query.status;
    }
    if (req.query.assignee)   filter.assignees = req.query.assignee;

    const tasks = await Task.find(filter).sort({ dueDate: 1 });
    res.json({ success: true, count: tasks.length, data: tasks });
  } catch (err) { next(err); }
};

// POST /api/tasks  [admin, coordinator]
exports.createTask = async (req, res, next) => {
  try {
    if (!req.body.projectId)
      return res.status(400).json({ success: false, message: 'projectId is required' });

    const task = await Task.create({ ...req.body, createdBy: String(req.user._id) });

    await logActivity({
      activityType: 'task_created',
      actorId:      String(req.user._id),
      targetType:   'task',
      targetId:     String(task._id),
      description:  `${req.user.email} created task "${task.title}"`,
    });

    res.status(201).json({ success: true, data: task });
  } catch (err) { next(err); }
};

// GET /api/tasks/:id  [admin, coordinator, assigned volunteer]
exports.getTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    // Volunteers can only view tasks they are assigned to
    if (req.user.role === 'volunteer' && !task.assignees.includes(String(req.user._id)))
      return res.status(403).json({ success: false, message: 'Access denied' });

    res.json({ success: true, data: task });
  } catch (err) { next(err); }
};

// PUT /api/tasks/:id  [admin, coordinator]
exports.updateTask = async (req, res, next) => {
  try {
    delete req.body.status; // status changes go through PATCH /status
    const task = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    res.json({ success: true, data: task });
  } catch (err) { next(err); }
};

// PATCH /api/tasks/:id/status  [admin, coordinator, assigned volunteer]
exports.updateStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!status || !ENUMS.taskStatus.includes(status))
      return res.status(400).json({ success: false, message: `Invalid status. Allowed: ${ENUMS.taskStatus.join(', ')}` });

    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    // Volunteers can only change status of their own assigned tasks
    if (req.user.role === 'volunteer' && !task.assignees.includes(String(req.user._id)))
      return res.status(403).json({ success: false, message: 'Access denied' });

    const oldStatus   = task.status;
    task.status       = status;
    if (status === 'completed') task.completedAt = new Date();
    await task.save();

    // ⚠️  RULE: if task → "blocked", immediately notify the project coordinator
    if (status === 'blocked') {
      const project = await Project.findById(task.projectId);
      if (project && project.coordinatorId) {
        await sendNotification({
          recipientId:      project.coordinatorId,
          notificationType: 'task_blocked',
          referenceType:    'task',
          referenceId:      String(task._id),
          message:          `Task "${task.title}" in project "${project.title}" is blocked and needs attention.`,
        });
      }
    }

    await logActivity({
      activityType: 'task_status_changed',
      actorId:      String(req.user._id),
      targetType:   'task',
      targetId:     String(task._id),
      description:  `${req.user.email} changed task "${task.title}" status: ${oldStatus} → ${status}`,
      metadata:     { oldStatus, newStatus: status },
    });

    res.json({ success: true, data: task });
  } catch (err) { next(err); }
};

// POST /api/tasks/:id/assign  [admin, coordinator]
exports.assignVolunteers = async (req, res, next) => {
  try {
    const { volunteerIds } = req.body; // array of user _id strings
    if (!volunteerIds || !Array.isArray(volunteerIds))
      return res.status(400).json({ success: false, message: 'volunteerIds array is required' });

    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    for (const vid of volunteerIds) {
      if (!task.assignees.includes(vid)) {
        task.assignees.push(vid);
        task.assignedBy.push({ volunteerId: vid, assignedBy: String(req.user._id), assignedAt: new Date() });

        // Notify the volunteer (in-app + email)
        await sendNotification({
          recipientId:      vid,
          notificationType: 'task_assigned',
          referenceType:    'task',
          referenceId:      String(task._id),
          message:          `You have been assigned to task "${task.title}"`,
        });

        // Send email notification
        try {
          const project  = await Project.findById(task.projectId).select('title');
          const volUser  = await User.findById(vid).select('email');
          if (volUser && project) {
            await sendTaskAssignedEmail(volUser.email, task.title, project.title);
          }
        } catch (emailErr) {
          console.error('Task assigned email failed:', emailErr.message);
        }
      }
    }
    await task.save();

    await logActivity({
      activityType: 'volunteer_assigned',
      actorId:      String(req.user._id),
      targetType:   'task',
      targetId:     String(task._id),
      description:  `${req.user.email} assigned volunteers [${volunteerIds.join(', ')}] to task "${task.title}"`,
    });

    res.json({ success: true, data: task });
  } catch (err) { next(err); }
};

// DELETE /api/tasks/:id/assign/:volunteerId  [admin, coordinator]
exports.removeVolunteer = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    task.assignees  = task.assignees.filter(v => v !== req.params.volunteerId);
    task.assignedBy = task.assignedBy.filter(a => a.volunteerId !== req.params.volunteerId);
    await task.save();

    res.json({ success: true, data: task });
  } catch (err) { next(err); }
};
