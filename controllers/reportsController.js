import Report from "../models/reports.js";

import ActivityLog from "../models/activityLog.js";

import PDFDocument from "pdfkit";

/*
GET /api/reports
List all generated reports
Access: admin
*/
const getReports = async (req, res) => {
  try {
    const reports = await Report.find().sort({
      generatedAt: -1,
    }); /* fetch all reports from database and sort from newest newest to oldest */
    res.status(200).json(reports);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch reports",
    });
  }
};

/*
POST /api/reports/generate
Generate new report
Access: admin
*/
const generateReport = async (req, res) => {
  try {
    const {reportType, projectId, dateRangeStart, dateRangeEnd, fileUrl} =
      req.body;

    const report = await Report.create({
      reportType,
      generatedBy: req.user._id,
      projectId: projectId || null /*  specific project id or null if absent */,
      dateRangeStart,
      dateRangeEnd,
      fileUrl,
    });

    // activityLogs rule from playbook
    await ActivityLog.create({
      activityType: "report_generated" /*  type of activity */,
      actorId: req.user._id /*  who performed the activity */,
      targetType: "report",
      targetId: report._id.toString(),
      description: "Report generated",
      createdAt: new Date(),
    });

    const doc = new PDFDocument();

    // Response headers for PDF download

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=report.pdf");
    //  connect the pdf directly to the response

    doc.pipe(res);

    //  Add your content
    doc.fontSize(20).text("SyntraAid Report", {align: "center"});
    doc.moveDown();
    doc.fontSize(12).text(`Report Type: ${reportType}`);
    doc.end();
  } catch (error) {
    res.status(500).json({
      message: "Failed to generate report",
    });
  }
};

/*
GET /api/reports/kpis
KPI aggregation data
Access: admin
*/
const getKpis = async (req, res) => {
  try {
    // aggregation placeholder
    // playbook only says:
    // "GET /reports/kpis (aggregation queries)"

    res.status(200).json({
      message: "KPI aggregation data",
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch KPI data",
    });
  }
};

/*
GET /api/reports/contributions
Contribution tracker data
Access: admin, coordinator
*/
const getContributions = async (req, res) => {
  try {
    res.status(200).json({
      message: "Contribution tracker data",
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch contribution data",
    });
  }
};

export {getReports, generateReport, getKpis, getContributions};
