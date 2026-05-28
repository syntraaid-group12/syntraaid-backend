// controllers/donors.controller.js
// ⚠️  Donor API responses NEVER include volunteer email, phone, or personal contact.
// ⚠️  Donors have NO POST/PUT/PATCH/DELETE rights. Enforced via roleGuard in routes.
const User             = require('../models/User');
const DonorProjectLink = require('../models/DonorProjectLink');
const Project          = require('../models/Project');
const Task             = require('../models/Task');
const AttendanceLog    = require('../models/AttendanceLog');
const ActivityLog      = require('../models/ActivityLog');
const ENUMS            = require('../constants/enums');
const logActivity      = require('../helpers/activityLogger');
const computeProgramHealth = require('../helpers/programHealth');

// Strip personal volunteer fields before returning to donor
const stripPersonalFields = (obj) => {
  const { email, phone, passwordHash, inviteToken, ...safe } = obj;
  return safe;
};

// GET /api/donors  [admin]
exports.listDonors = async (req, res, next) => {
  try {
    const donors = await User.find({ role: 'donor', deletedAt: null }).select('-passwordHash -inviteToken');
    res.json({ success: true, count: donors.length, data: donors });
  } catch (err) { next(err); }
};

// GET /api/donors/:id/dashboard  [donor self]
exports.getDonorDashboard = async (req, res, next) => {
  try {
    if (String(req.user._id) !== req.params.id)
      return res.status(403).json({ success: false, message: 'Access denied' });

    const links = await DonorProjectLink.find({ donorId: req.params.id, isActive: true });
    const projectIds = links.map(l => l.projectId);
    const projects = await Project.find({ _id: { $in: projectIds }, deletedAt: null })
      .select('title status startDate endDate milestones');

    const summaries = await Promise.all(projects.map(async (p) => {
      const link   = links.find(l => l.projectId === String(p._id));
      const health = await computeProgramHealth(p);
      const result = { projectId: p._id, title: p.title, status: p.status, programHealthStatus: health, visibilitySettings: link.visibilitySettings };

      if (link.visibilitySettings.showMilestoneProgress)
        result.milestones = p.milestones.map(m => ({ title: m.title, isCompleted: m.isCompleted, dueDate: m.dueDate }));

      if (link.visibilitySettings.showVolunteerCount) {
        const proj = await Project.findById(p._id).select('volunteers');
        result.volunteerCount = proj?.volunteers?.length || 0;
      }

      if (link.visibilitySettings.showAttendanceHours) {
        const agg = await AttendanceLog.aggregate([
          { $match: { projectId: String(p._id) } },
          { $group: { _id: null, total: { $sum: '$hoursLogged' } } },
        ]);
        result.totalHoursLogged = agg[0]?.total || 0;
      }

      return result;
    }));

    res.json({ success: true, data: { donorId: req.params.id, projects: summaries } });
  } catch (err) { next(err); }
};

// GET /api/donors/:id/projects  [admin, donor self]
exports.getDonorProjects = async (req, res, next) => {
  try {
    const isSelf  = String(req.user._id) === req.params.id;
    const isAdmin = req.user.role === 'admin';
    if (!isSelf && !isAdmin)
      return res.status(403).json({ success: false, message: 'Access denied' });

    const links = await DonorProjectLink.find({ donorId: req.params.id, isActive: true });
    res.json({ success: true, count: links.length, data: links });
  } catch (err) { next(err); }
};

// GET /api/donors/:id/projects/:projectId  [donor self]
exports.getDonorProjectDetail = async (req, res, next) => {
  try {
    if (String(req.user._id) !== req.params.id)
      return res.status(403).json({ success: false, message: 'Access denied' });

    const link = await DonorProjectLink.findOne({ donorId: req.params.id, projectId: req.params.projectId, isActive: true });
    if (!link) return res.status(404).json({ success: false, message: 'Donor project link not found' });

    const project = await Project.findById(req.params.projectId).select('title description goals status startDate endDate milestones volunteers');
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

    const health = await computeProgramHealth(project);
    const vis    = link.visibilitySettings;
    const result = { title: project.title, description: project.description, goals: project.goals, status: project.status, programHealthStatus: health };

    if (vis.showMilestoneProgress) result.milestones = project.milestones;
    if (vis.showVolunteerCount)    result.volunteerCount = project.volunteers.length;
    if (vis.showAttendanceHours) {
      const agg = await AttendanceLog.aggregate([
        { $match: { projectId: String(project._id) } },
        { $group: { _id: null, total: { $sum: '$hoursLogged' } } },
      ]);
      result.totalHoursLogged = agg[0]?.total || 0;
    }
    if (vis.showActivityFeed) {
      result.recentActivity = await ActivityLog.find({ targetId: String(project._id) }).sort({ createdAt: -1 }).limit(10).select('activityType description createdAt');
    }

    res.json({ success: true, data: result });
  } catch (err) { next(err); }
};

// GET /api/donors/:id/projects/:projectId/history  [donor self]
exports.getDonorProjectHistory = async (req, res, next) => {
  try {
    if (String(req.user._id) !== req.params.id)
      return res.status(403).json({ success: false, message: 'Access denied' });

    const logs = await ActivityLog.find({ targetId: req.params.projectId }).sort({ createdAt: -1 }).limit(50);
    res.json({ success: true, count: logs.length, data: logs });
  } catch (err) { next(err); }
};

// GET /api/donors/:id/summary  [donor self]
exports.getDonorSummary = async (req, res, next) => {
  try {
    if (String(req.user._id) !== req.params.id)
      return res.status(403).json({ success: false, message: 'Access denied' });

    const links       = await DonorProjectLink.find({ donorId: req.params.id, isActive: true });
    const projectIds  = links.map(l => l.projectId);
    const projects    = await Project.find({ _id: { $in: projectIds } }).select('title status');

    res.json({ success: true, data: { totalLinkedProjects: links.length, projects } });
  } catch (err) { next(err); }
};

// POST /api/donors/:id/projects  [admin] – link donor to project
exports.linkDonorToProject = async (req, res, next) => {
  try {
    const { projectId, visibilitySettings } = req.body;
    if (!projectId)
      return res.status(400).json({ success: false, message: 'projectId is required' });

    // Validate donor exists and has donor role
    const donor = await User.findOne({ _id: req.params.id, role: 'donor', deletedAt: null });
    if (!donor) return res.status(404).json({ success: false, message: 'Donor not found' });

    const link = await DonorProjectLink.create({
      donorId:    req.params.id,
      projectId,
      linkedBy:   String(req.user._id),
      visibilitySettings,
    });

    await logActivity({
      activityType: 'donor_linked',
      actorId:      String(req.user._id),
      targetType:   'project',
      targetId:     projectId,
      description:  `Admin ${req.user.email} linked donor ${req.params.id} to project ${projectId}`,
    });

    res.status(201).json({ success: true, data: link });
  } catch (err) { next(err); }
};

// PUT /api/donors/:id/projects/:projectId  [admin] – update visibility settings
exports.updateVisibilitySettings = async (req, res, next) => {
  try {
    const link = await DonorProjectLink.findOneAndUpdate(
      { donorId: req.params.id, projectId: req.params.projectId },
      { visibilitySettings: req.body.visibilitySettings },
      { new: true, runValidators: true }
    );
    if (!link) return res.status(404).json({ success: false, message: 'Donor project link not found' });
    res.json({ success: true, data: link });
  } catch (err) { next(err); }
};

// PATCH /api/donors/:id/projects/:projectId/unlink  [admin]
exports.unlinkDonor = async (req, res, next) => {
  try {
    const link = await DonorProjectLink.findOneAndUpdate(
      { donorId: req.params.id, projectId: req.params.projectId },
      { isActive: false },
      { new: true }
    );
    if (!link) return res.status(404).json({ success: false, message: 'Donor project link not found' });
    res.json({ success: true, message: 'Donor unlinked from project', data: link });
  } catch (err) { next(err); }
};
