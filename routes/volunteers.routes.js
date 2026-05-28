// routes/volunteers.routes.js
const express   = require('express');
const router    = express.Router();
const protect   = require('../middleware/auth');
const roleGuard = require('../middleware/roleGuard');
const ctrl      = require('../controllers/volunteers.controller');

router.get('/',                    protect, roleGuard(['admin', 'coordinator']), ctrl.listVolunteers);
router.get('/:id',                 protect, ctrl.getVolunteer);
router.post('/:id/profile',        protect, roleGuard(['volunteer']),            ctrl.createProfile);
router.put('/:id/profile',         protect, ctrl.updateProfile);
router.get('/:id/dashboard',       protect, roleGuard(['volunteer']),            ctrl.getDashboard);
router.get('/:id/attendance',      protect, ctrl.getAttendance);
router.get('/:id/tasks',           protect, roleGuard(['volunteer']),            ctrl.getTasks);

module.exports = router;
