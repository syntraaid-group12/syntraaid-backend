// routes/activityLogs.routes.js
// ⚠️  GET ONLY. No POST, PUT, or DELETE routes. Ever.
const express   = require('express');
const router    = express.Router();
const protect   = require('../middleware/auth');
const roleGuard = require('../middleware/roleGuard');
const ctrl      = require('../controllers/activityLogs.controller');

router.get('/', protect, roleGuard(['admin', 'coordinator']), ctrl.listActivityLogs);

// Deliberately no POST / PUT / DELETE routes defined here.

module.exports = router;
