// controllers/reports.controller.js
const Report        = require('../models/Report');
const AttendanceLog = require('../models/AttendanceLog');
const Task          = require('../models/Task');
const Project       = require('../models/Project');
const VolunteerProfile = require('../models/VolunteerProfile');
const DonorProjectLink = require('../models/DonorProjectLink');
const logActivity   = require('../helpers/activityLogger');
const ENUMS         = require('../constants/enums');
const PDFDocument   = require('pdfkit');
const { Parser }    = require('json2csv');

// GET /api/reports  [admin]
exports.listReports = async (req, res, next) => {
  try {
    const reports = await Report.find().sort({ generatedAt: -1 });
    res.json({ success: true, count: reports.length, data: reports });
  } catch (err) { next(err); }
};

// GET /api/reports/kpis  [admin]
// Returns org-wide KPI aggregations
exports.getKPIs = async (req, res, next) => {
  try {
    const [
      totalProjects,
      activeProjects,
      completedProjects,
      totalTasks,
      completedTasks,
      totalVolunteers,
      totalHoursAgg,
      totalDonorLinks,
    ] = await Promise.all([
      Project.countDocuments({ deletedAt: null }),
      Project.countDocuments({ status: 'active', deletedAt: null }),
      Project.countDocuments({ status: 'completed', deletedAt: null }),
      Task.countDocuments(),
      Task.countDocuments({ status: 'completed' }),
      VolunteerProfile.countDocuments(),
      AttendanceLog.aggregate([{ $group: { _id: null, total: { $sum: '$hoursLogged' } } }]),
      DonorProjectLink.countDocuments({ isActive: true }),
    ]);

    const totalHoursLogged   = totalHoursAgg[0]?.total || 0;
    const taskCompletionRate = totalTasks > 0 ? (completedTasks / totalTasks) : 0;

    res.json({
      success: true,
      data: {
        totalProjects, activeProjects, completedProjects,
        totalTasks, completedTasks, taskCompletionRate: Math.round(taskCompletionRate * 100) + '%',
        totalVolunteers, totalHoursLogged, totalDonorLinks,
      },
    });
  } catch (err) { next(err); }
};

// GET /api/reports/contributions  [admin, coordinator]
exports.getContributions = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.projectId) filter.projectId = req.query.projectId;

    // Group total hours per volunteer per project
    const agg = await AttendanceLog.aggregate([
      { $match: filter },
      { $group: { _id: { volunteerId: '$volunteerId', projectId: '$projectId' }, totalHours: { $sum: '$hoursLogged' }, sessionCount: { $sum: 1 } } },
      { $sort: { totalHours: -1 } },
    ]);

    res.json({ success: true, count: agg.length, data: agg });
  } catch (err) { next(err); }
};

// POST /api/reports/generate  [admin]
exports.generateReport = async (req, res, next) => {
  try {
    const { reportType, projectId, dateRangeStart, dateRangeEnd, format = 'pdf' } = req.body;

    if (!ENUMS.reportType.includes(reportType))
      return res.status(400).json({ success: false, message: `Invalid reportType. Allowed: ${ENUMS.reportType.join(', ')}` });

    // Build data set based on reportType
    const filter = {};
    if (projectId)     filter.projectId  = projectId;
    if (dateRangeStart || dateRangeEnd) {
      filter.sessionDate = {};
      if (dateRangeStart) filter.sessionDate.$gte = new Date(dateRangeStart);
      if (dateRangeEnd)   filter.sessionDate.$lte = new Date(dateRangeEnd);
    }

    const logs = await AttendanceLog.find(filter).sort({ sessionDate: -1 });

    // Save report metadata
    const report = await Report.create({
      reportType,
      generatedBy: String(req.user._id),
      projectId:   projectId || null,
      dateRangeStart: dateRangeStart ? new Date(dateRangeStart) : null,
      dateRangeEnd:   dateRangeEnd   ? new Date(dateRangeEnd)   : null,
      fileUrl: `generated-in-stream`, // In a real app, store to S3 / GCS
    });

    await logActivity({
      activityType: 'report_generated',
      actorId:      String(req.user._id),
      targetType:   'report',
      targetId:     String(report._id),
      description:  `${req.user.email} generated a ${reportType} report`,
    });

    // Stream the file directly in the response
    if (format === 'csv') {
      const fields = ['_id', 'volunteerId', 'projectId', 'sessionDate', 'hoursLogged', 'notes', 'loggedAt'];
      const parser = new Parser({ fields });
      const csv    = parser.parse(logs.map(l => l.toObject()));
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${reportType}-${Date.now()}.csv"`);
      return res.send(csv);
    }

    // Default: PDF
    const doc = new PDFDocument({ margin: 40 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${reportType}-${Date.now()}.pdf"`);
    doc.pipe(res);

    doc.fontSize(20).text(`SyntraAid – ${reportType.replace(/_/g, ' ').toUpperCase()}`, { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(10).text(`Generated by: ${req.user.email}   |   ${new Date().toUTCString()}`, { align: 'center' });
    if (projectId)     doc.text(`Project filter: ${projectId}`);
    if (dateRangeStart) doc.text(`Date range: ${dateRangeStart} → ${dateRangeEnd || 'now'}`);
    doc.moveDown();
    doc.moveTo(40, doc.y).lineTo(560, doc.y).stroke();
    doc.moveDown();

    logs.forEach(log => {
      doc.fontSize(9).text(
        `${log.sessionDate.toDateString().padEnd(18)} | Vol: ${log.volunteerId} | ${log.hoursLogged}h | Proj: ${log.projectId}`
      );
    });

    if (logs.length === 0) doc.fontSize(12).text('No attendance records found for the given filters.', { align: 'center' });

    doc.end();
  } catch (err) { next(err); }
};
