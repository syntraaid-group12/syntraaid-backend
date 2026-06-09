// controllers/attendance.controller.js
// ⚠️  INSERT ONLY. No update or delete operations exist on this collection.
const AttendanceLog = require('../models/AttendanceLog');
const logActivity   = require('../helpers/activityLogger');
const PDFDocument   = require('pdfkit');
const { Parser }    = require('json2csv');

// GET /api/attendance  [admin, coordinator]
// Filters: ?projectId= &volunteerId= &startDate= &endDate=
exports.listAttendance = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.projectId)   filter.projectId  = req.query.projectId;
    if (req.query.volunteerId) filter.volunteerId = req.query.volunteerId;
    if (req.query.startDate || req.query.endDate) {
      filter.sessionDate = {};
      if (req.query.startDate) filter.sessionDate.$gte = new Date(req.query.startDate);
      if (req.query.endDate)   filter.sessionDate.$lte = new Date(req.query.endDate);
    }

    const logs = await AttendanceLog.find(filter).sort({ sessionDate: -1 });

    // Compute total
    const total = logs.reduce((sum, l) => sum + l.hoursLogged, 0);

    res.json({ success: true, count: logs.length, totalHoursLogged: total, data: logs });
  } catch (err) { next(err); }
};

// POST /api/attendance  [volunteer, coordinator]
exports.logAttendance = async (req, res, next) => {
  try {
    const { volunteerId, projectId, sessionDate, hoursLogged, notes } = req.body;

    if (!volunteerId || !projectId || !sessionDate || !hoursLogged)
      return res.status(400).json({ success: false, message: 'volunteerId, projectId, sessionDate, and hoursLogged are required' });

    if (hoursLogged <= 0)
      return res.status(400).json({ success: false, message: 'hoursLogged must be greater than 0' });

    // Volunteers can only log attendance for themselves
    if (req.user.role === 'volunteer' && volunteerId !== String(req.user._id))
      return res.status(403).json({ success: false, message: 'Volunteers can only log their own attendance' });

    const log = await AttendanceLog.create({
      volunteerId,
      projectId,
      sessionDate: new Date(sessionDate),
      hoursLogged: Number(hoursLogged),
      notes:       notes || '',
      loggedBy:    String(req.user._id),
    });

    await logActivity({
      activityType: 'attendance_logged',
      actorId:      String(req.user._id),
      targetType:   'volunteer',
      targetId:     volunteerId,
      description:  `${req.user.email} logged ${hoursLogged} hours for volunteer ${volunteerId} on project ${projectId}`,
      metadata:     { hoursLogged, sessionDate, projectId },
    });

    res.status(201).json({ success: true, data: log });
  } catch (err) { next(err); }
};

// GET /api/attendance/export  [admin]
// ?format=csv|pdf &projectId= &startDate= &endDate=
exports.exportAttendance = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.projectId)   filter.projectId  = req.query.projectId;
    if (req.query.startDate || req.query.endDate) {
      filter.sessionDate = {};
      if (req.query.startDate) filter.sessionDate.$gte = new Date(req.query.startDate);
      if (req.query.endDate)   filter.sessionDate.$lte = new Date(req.query.endDate);
    }

    const logs   = await AttendanceLog.find(filter).sort({ sessionDate: -1 });
    const format = req.query.format === 'pdf' ? 'pdf' : 'csv';

    if (format === 'csv') {
      const fields = ['_id', 'volunteerId', 'projectId', 'sessionDate', 'hoursLogged', 'notes', 'loggedBy', 'loggedAt'];
      const parser = new Parser({ fields });
      const csv    = parser.parse(logs.map(l => l.toObject()));
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="attendance-export.csv"');
      return res.send(csv);
    }

    // PDF export
    const doc = new PDFDocument({ margin: 40 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="attendance-export.pdf"');
    doc.pipe(res);

    doc.fontSize(18).text('SyntraAid – Attendance Report', { align: 'center' });
    doc.moveDown();
    doc.fontSize(10).text(`Generated: ${new Date().toISOString()}`, { align: 'right' });
    doc.moveDown();

    logs.forEach(log => {
      doc.fontSize(10).text(
        `Date: ${log.sessionDate.toDateString()} | Volunteer: ${log.volunteerId} | Hours: ${log.hoursLogged} | Project: ${log.projectId}`,
        { continued: false }
      );
    });

    doc.end();
  } catch (err) { next(err); }
};
