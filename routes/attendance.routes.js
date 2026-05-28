// routes/attendance.routes.js  ⚠️  NO PUT/PATCH/DELETE – EVER.
const express   = require('express');
const router    = express.Router();
const protect   = require('../middleware/auth');
const roleGuard = require('../middleware/roleGuard');
const validate  = require('../middleware/validate');
const ctrl      = require('../controllers/attendance.controller');

router.get('/',        protect, roleGuard(['admin','coordinator']),          ctrl.listAttendance);
router.post('/',       protect, roleGuard(['volunteer','coordinator']),       validate.logAttendanceRules, ctrl.logAttendance);
router.get('/export',  protect, roleGuard(['admin']),                         ctrl.exportAttendance);

module.exports = router;
