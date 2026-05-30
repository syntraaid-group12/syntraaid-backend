// controllers/projects.controller.js
const Project        = require('../models/Project');
const Task           = require('../models/Task');
const DonorProjectLink = require('../models/DonorProjectLink');
const ENUMS          = require('../constants/enums');
const logActivity    = require('../helpers/activityLogger');
const sendNotification = require('../helpers/notificationSender');
const computeProgramHealth = require('../helpers/programHealth');

// ── Project status state machine ──────────────────────────────
// Valid transitions only (prevents random status jumps)
const VALID_TRANSITIONS = {
  planning:   ['active', 'cancelled'],
  active:     ['on_hold', 'completed', 'cancelled'],
  on_hold:    ['active', 'cancelled'],
  completed:  [],
  cancelled:  [],
};

// GET /api/projects  [admin, coordinator]
exports.listProjects = async (req, res, next) => {
  try {
    const filter = { deletedAt: null };
    if (req.query.status) {
      if (!ENUMS.projectStatus.includes(req.query.status))
        return res.status(400).json({ success: false, message: 'Invalid status filter' });
      filter.status = req.query.status;
    }
    if (req.query.coordinatorId) filter.coordinatorId = req.query.coordinatorId;

    const projects = await Project.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, count: projects.length, data: projects });
  } catch (err) { next(err); }
};

// POST /api/projects  [admin, coordinator]
exports.createProject = async (req, res, next) => {
  try {
    const project = await Project.create({ ...req.body, createdBy: String(req.user._id) });

    await logActivity({
      activityType: 'project_created',
      actorId:      String(req.user._id),
      targetType:   'project',
      targetId:     String(project._id),
      description:  `${req.user.email} created project "${project.title}"`,
    });

    res.status(201).json({ success: true, data: project });
  } catch (err) { next(err); }
};

// GET /api/projects/:id  [admin, coordinator]
exports.getProject = async (req, res, next) => {
  try {
    const project = await Project.findOne({ _id: req.params.id, deletedAt: null });
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

    const programHealthStatus = await computeProgramHealth(project);
    res.json({ success: true, data: { ...project.toObject(), programHealthStatus } });
  } catch (err) { next(err); }
};

// PUT /api/projects/:id  [admin, coordinator]
exports.updateProject = async (req, res, next) => {
  try {
    // Prevent direct status changes via PUT (use PATCH /status instead)
    delete req.body.status;

    const project = await Project.findOneAndUpdate(
      { _id: req.params.id, deletedAt: null },
      req.body,
      { new: true, runValidators: true }
    );
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

    await logActivity({
      activityType: 'project_status_changed',
      actorId:      String(req.user._id),
      targetType:   'project',
      targetId:     String(project._id),
      description:  `${req.user.email} updated project "${project.title}"`,
    });

    res.json({ success: true, data: project });
  } catch (err) { next(err); }
};

// PATCH /api/projects/:id/status  [admin, coordinator]
exports.changeStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!status || !ENUMS.projectStatus.includes(status))
      return res.status(400).json({ success: false, message: `Invalid status. Allowed: ${ENUMS.projectStatus.join(', ')}` });

    const project = await Project.findOne({ _id: req.params.id, deletedAt: null });
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

    // State machine check
    if (!VALID_TRANSITIONS[project.status].includes(status))
      return res.status(400).json({ success: false, message: `Cannot transition from "${project.status}" to "${status}"` });

    // Rule: Cannot activate without a coordinator
    if (status === 'active' && !project.coordinatorId)
      return res.status(400).json({ success: false, message: 'A coordinator must be assigned before activating this project.' });

    const oldStatus  = project.status;
    project.status   = status;
    await project.save();

    await logActivity({
      activityType: 'project_status_changed',
      actorId:      String(req.user._id),
      targetType:   'project',
      targetId:     String(project._id),
      description:  `${req.user.email} changed project "${project.title}" status: ${oldStatus} → ${status}`,
      metadata:     { oldStatus, newStatus: status },
    });

    res.json({ success: true, data: project });
  } catch (err) { next(err); }
};

// DELETE /api/projects/:id  [admin] – soft delete
exports.deleteProject = async (req, res, next) => {
  try {
    const project = await Project.findOneAndUpdate(
      { _id: req.params.id, deletedAt: null },
      { deletedAt: new Date() },
      { new: true }
    );
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
    res.json({ success: true, message: 'Project deleted (soft)' });
  } catch (err) { next(err); }
};

// GET /api/projects/:id/volunteer-view  [volunteer]
exports.getVolunteerView = async (req, res, next) => {
  try {
    const project = await Project.findOne({ _id: req.params.id, deletedAt: null })
      .select('title description status startDate endDate milestones goals');
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

    // Only show tasks assigned to this volunteer
    const tasks = await Task.find({ projectId: req.params.id, assignees: String(req.user._id) })
      .select('title status dueDate description');

    res.json({ success: true, data: { project, tasks } });
  } catch (err) { next(err); }
};

// POST /api/projects/:id/volunteers  [admin, coordinator]
exports.assignVolunteer = async (req, res, next) => {
  try {
    const { volunteerId } = req.body;
    if (!volunteerId)
      return res.status(400).json({ success: false, message: 'volunteerId is required' });

    const project = await Project.findOne({ _id: req.params.id, deletedAt: null });
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

    if (project.volunteers.includes(volunteerId))
      return res.status(409).json({ success: false, message: 'Volunteer already assigned' });

    project.volunteers.push(volunteerId);
    project.assignedAt.push({ volunteerId, assignedBy: String(req.user._id), assignedAt: new Date() });
    await project.save();

    await logActivity({
      activityType: 'volunteer_assigned',
      actorId:      String(req.user._id),
      targetType:   'volunteer',
      targetId:     volunteerId,
      description:  `${req.user.email} assigned volunteer ${volunteerId} to project "${project.title}"`,
    });

    res.json({ success: true, data: project });
  } catch (err) { next(err); }
};

// DELETE /api/projects/:id/volunteers/:volunteerId  [admin, coordinator]
exports.removeVolunteer = async (req, res, next) => {
  try {
    const project = await Project.findOne({ _id: req.params.id, deletedAt: null });
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

    project.volunteers  = project.volunteers.filter(v => v !== req.params.volunteerId);
    project.assignedAt  = project.assignedAt.filter(a => a.volunteerId !== req.params.volunteerId);
    await project.save();

    res.json({ success: true, data: project });
  } catch (err) { next(err); }
};

// POST /api/projects/:id/milestones  [admin, coordinator]
exports.addMilestone = async (req, res, next) => {
  try {
    const project = await Project.findOne({ _id: req.params.id, deletedAt: null });
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

    project.milestones.push(req.body);
    await project.save();
    res.status(201).json({ success: true, data: project.milestones[project.milestones.length - 1] });
  } catch (err) { next(err); }
};

// PUT /api/projects/:id/milestones/:milestoneId  [admin, coordinator]
exports.updateMilestone = async (req, res, next) => {
  try {
    const project = await Project.findOne({ _id: req.params.id, deletedAt: null });
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

    const milestone = project.milestones.id(req.params.milestoneId);
    if (!milestone) return res.status(404).json({ success: false, message: 'Milestone not found' });

    Object.assign(milestone, req.body);
    await project.save();
    res.json({ success: true, data: milestone });
  } catch (err) { next(err); }
};

// PATCH /api/projects/:id/milestones/:milestoneId/complete  [admin, coordinator]
exports.completeMilestone = async (req, res, next) => {
  try {
    const project = await Project.findOne({ _id: req.params.id, deletedAt: null });
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

    const milestone = project.milestones.id(req.params.milestoneId);
    if (!milestone) return res.status(404).json({ success: false, message: 'Milestone not found' });

    milestone.isCompleted = true;
    milestone.completedAt = new Date();
    await project.save();

    // Notify all active donors linked to this project
    const links = await DonorProjectLink.find({ projectId: String(project._id), isActive: true });
    for (const link of links) {
      await sendNotification({
        recipientId:      link.donorId,
        notificationType: 'donor_milestone_alert',
        referenceType:    'milestone',
        referenceId:      String(milestone._id),
        message:          `Milestone "${milestone.title}" in project "${project.title}" has been completed!`,
      });
    }

    await logActivity({
      activityType: 'milestone_completed',
      actorId:      String(req.user._id),
      targetType:   'milestone',
      targetId:     String(milestone._id),
      description:  `${req.user.email} completed milestone "${milestone.title}" in project "${project.title}"`,
    });

    res.json({ success: true, data: milestone });
  } catch (err) { next(err); }
};

// GET /api/projects/:id/dashboard  [admin]
exports.getAdminDashboard = async (req, res, next) => {
  try {
    const project = await Project.findOne({ _id: req.params.id, deletedAt: null });
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

    const tasks  = await Task.find({ projectId: String(project._id) });
    const total  = tasks.length;
    const byStatus = tasks.reduce((acc, t) => { acc[t.status] = (acc[t.status] || 0) + 1; return acc; }, {});

    const programHealthStatus = await computeProgramHealth(project);

    res.json({
      success: true,
      data: { project, taskStats: { total, ...byStatus }, programHealthStatus },
    });
  } catch (err) { next(err); }
};
