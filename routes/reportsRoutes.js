import express from "express";

import {
  getReports,
  generateReport,
  getKpis,
  getContributions,
} from "../controllers/reportsController.js";

import auth from "../middleware/auth.js";

import roleGuard from "../middleware/roleGuard.js";

const router = express.Router();

/*
GET /api/reports
List all generated reports
Access: admin
*/
router.get("/", auth, roleGuard(["admin"]), getReports);

/*
POST /api/reports/generate
Generate new report (PDF/CSV)
Access: admin
*/
router.post("/generate", auth, roleGuard(["admin"]), generateReport);

/*
GET /api/reports/kpis
KPI aggregation data
Access: admin
*/
router.get("/kpis", auth, roleGuard(["admin"]), getKpis);

/*
GET /api/reports/contributions
Contribution tracker data
Access: admin, coordinator
*/
router.get(
  "/contributions",
  auth,
  roleGuard(["admin", "coordinator"]),
  getContributions,
);

export default router;
