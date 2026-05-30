// controllers/volunteers.controller.js
const VolunteerProfile = require('../models/VolunteerProfile');
const AttendanceLog    = require('../models/AttendanceLog');
const Task             = require('../models/Task');
const Project          = require('../models/Project');
const User             = require('../models/User');
const computeProgramHealth = require('../helpers/programHealth');

// Helper: compute total hours for a volunteer
const getTotalHours = async (userId) => {
  const agg = await AttendanceLog.aggregate([
    { $match: { volunteerId: String(userId) } },
    { $group: { _id: null, total: { $sum: '$hoursLogged' } } },
  ]);
  return agg.length > 0 ? agg[0].total : 0;
};

// GET /api/volunteers  [admin, coordinator]
// Supports ?skills=&availabilityDays=&search= query params
exports.listVolunteers = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.skills)           filter.skills = { $in: req.query.skills.split(',') };
    if (req.query.availabilityDays) filter.availabilityDays = { $in: req.query.availabilityDays.split(',') };

    let profiles = await VolunteerProfile.find(filter);

    // Optional name search
    if (req.query.search) {
      const s = req.query.search.toLowerCase();
      profiles = profiles.filter(p =>
        p.firstName.toLowerCase().includes(s) || p.lastName.toLowerCase().includes(s)
      );
    }

    res.json({ success: true, count: profiles.length, data: profiles });
  } catch (err) { next(err); }
};

// GET /api/volunteers/:id  [admin, coordinator, self]
exports.getVolunteer = async (req, res, next) => {
  try {
    const isSelf        = String(req.user._id) === req.params.id;
    const isAdminOrCoord = ['admin', 'coordinator'].includes(req.user.role);
    if (!isSelf && !isAdminOrCoord)
      return res.status(403).json({ success: false, message: 'Access denied' });

    const profile = await VolunteerProfile.findOne({ userId: req.params.id });
    if (!profile) return res.status(404).json({ success: false, message: 'Volunteer profile not found' });

    const totalHoursLogged = await getTotalHours(req.params.id);
    res.json({ success: true, data: { ...profile.toObject(), totalHoursLogged } });
  } catch (err) { next(err); }
};

// POST /api/volunteers/:id/profile  [self]
exports.createProfile = async (req, res, next) => {
  try {
    if (String(req.user._id) !== req.params.id)
      return res.status(403).json({ success: false, message: 'Access denied' });

    const existing = await VolunteerProfile.findOne({ userId: req.params.id });
    if (existing)
      return res.status(409).json({ success: false, message: 'Profile already exists. Use PUT to update.' });

    const profile = await VolunteerProfile.create({ ...req.body, userId: req.params.id });
    res.status(201).json({ success: true, data: profile });
  } catch (err) { next(err); }
};

// PUT /api/volunteers/:id/profile  [admin, self]
exports.updateProfile = async (req, res, next) => {
  try {
    const isSelf  = String(req.user._id) === req.params.id;
    const isAdmin = req.user.role === 'admin';
    if (!isSelf && !isAdmin)
      return res.status(403).json({ success: false, message: 'Access denied' });

    delete req.body.userId; // never allow changing the owner
    const profile = await VolunteerProfile.findOneAndUpdate(
      { userId: req.params.id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!profile) return res.status(404).json({ success: false, message: 'Profile not found' });

    res.json({ success: true, data: profile });
  } catch (err) { next(err); }
};

// GET /api/volunteers/:id/dashboard  [self]
exports.getDashboard = async (req, res, next) => {
  try {
    if (String(req.user._id) !== req.params.id)
      return res.status(403).json({ success: false, message: 'Access denied' });

    const profile          = await VolunteerProfile.findOne({ userId: req.params.id });
    const totalHoursLogged = await getTotalHours(req.params.id);

    // Find projects this volunteer is assigned to
    const projects = await Project.find({ volunteers: req.params.id, deletedAt: null })
      .select('title status');

    // Upcoming tasks
    const upcomingTasks = await Task.find({
      assignees: req.params.id,
      status:    { $ne: 'completed' },
    }).sort({ dueDate: 1 }).limit(5);

    res.json({
      success: true,
      data: { profile, totalHoursLogged, projects, upcomingTasks },
    });
  } catch (err) { next(err); }
};

// GET /api/volunteers/:id/attendance  [admin, coordinator, self]
exports.getAttendance = async (req, res, next) => {
  try {
    const isSelf        = String(req.user._id) === req.params.id;
    const isAdminOrCoord = ['admin', 'coordinator'].includes(req.user.role);
    if (!isSelf && !isAdminOrCoord)
      return res.status(403).json({ success: false, message: 'Access denied' });

    const filter = { volunteerId: req.params.id };
    if (req.query.projectId) filter.projectId = req.query.projectId;
    if (req.query.startDate || req.query.endDate) {
      filter.sessionDate = {};
      if (req.query.startDate) filter.sessionDate.$gte = new Date(req.query.startDate);
      if (req.query.endDate)   filter.sessionDate.$lte = new Date(req.query.endDate);
    }

    const logs = await AttendanceLog.find(filter).sort({ sessionDate: -1 });
    const totalHoursLogged = await getTotalHours(req.params.id);
    res.json({ success: true, count: logs.length, totalHoursLogged, data: logs });
  } catch (err) { next(err); }
};

// GET /api/volunteers/:id/tasks  [self]
exports.getTasks = async (req, res, next) => {
  try {
    if (String(req.user._id) !== req.params.id)
      return res.status(403).json({ success: false, message: 'Access denied' });

    const tasks = await Task.find({ assignees: req.params.id }).sort({ dueDate: 1 });
    res.json({ success: true, count: tasks.length, data: tasks });
  } catch (err) { next(err); }
};
