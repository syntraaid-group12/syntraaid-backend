// routes/reports.routes.js
const express   = require('express');
const router    = express.Router();
const protect   = require('../middleware/auth');
const roleGuard = require('../middleware/roleGuard');
const validate  = require('../middleware/validate');
const ctrl      = require('../controllers/reports.controller');

router.get('/',              protect, roleGuard(['admin']),                     ctrl.listReports);
router.post('/generate',     protect, roleGuard(['admin']),                     validate.generateReportRules, ctrl.generateReport);
router.get('/kpis',          protect, roleGuard(['admin']),                     ctrl.getKPIs);
router.get('/contributions', protect, roleGuard(['admin','coordinator']),        ctrl.getContributions);

module.exports = router;
