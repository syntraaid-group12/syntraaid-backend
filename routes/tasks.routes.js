// routes/tasks.routes.js
const express   = require('express');
const router    = express.Router();
const protect   = require('../middleware/auth');
const roleGuard = require('../middleware/roleGuard');
const validate  = require('../middleware/validate');
const ctrl      = require('../controllers/tasks.controller');

router.get('/',                        protect, roleGuard(['admin','coordinator']),  ctrl.listTasks);
router.post('/',                       protect, roleGuard(['admin','coordinator']),  validate.createTaskRules,      ctrl.createTask);
router.get('/:id',                     protect,                                      ctrl.getTask);
router.put('/:id',                     protect, roleGuard(['admin','coordinator']),  ctrl.updateTask);
router.patch('/:id/status',            protect,                                      validate.changeTaskStatusRules, ctrl.updateStatus);
router.post('/:id/assign',             protect, roleGuard(['admin','coordinator']),  ctrl.assignVolunteers);
router.delete('/:id/assign/:volunteerId', protect, roleGuard(['admin','coordinator']), ctrl.removeVolunteer);

module.exports = router;
