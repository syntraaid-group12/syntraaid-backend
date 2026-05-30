// routes/projects.routes.js
const express   = require('express');
const router    = express.Router();
const protect   = require('../middleware/auth');
const roleGuard = require('../middleware/roleGuard');
const validate  = require('../middleware/validate');
const ctrl      = require('../controllers/projects.controller');

router.get('/',                                       protect, roleGuard(['admin','coordinator']), ctrl.listProjects);
router.post('/',                                      protect, roleGuard(['admin','coordinator']), validate.createProjectRules,       ctrl.createProject);
router.get('/:id',                                    protect, roleGuard(['admin','coordinator']), ctrl.getProject);
router.put('/:id',                                    protect, roleGuard(['admin','coordinator']), ctrl.updateProject);
router.patch('/:id/status',                           protect, roleGuard(['admin','coordinator']), validate.changeProjectStatusRules,  ctrl.changeStatus);
router.delete('/:id',                                 protect, roleGuard(['admin']),                ctrl.deleteProject);
router.get('/:id/volunteer-view',                     protect, roleGuard(['volunteer']),            ctrl.getVolunteerView);
router.post('/:id/volunteers',                        protect, roleGuard(['admin','coordinator']), ctrl.assignVolunteer);
router.delete('/:id/volunteers/:volunteerId',         protect, roleGuard(['admin','coordinator']), ctrl.removeVolunteer);
router.post('/:id/milestones',                        protect, roleGuard(['admin','coordinator']), ctrl.addMilestone);
router.put('/:id/milestones/:milestoneId',            protect, roleGuard(['admin','coordinator']), ctrl.updateMilestone);
router.patch('/:id/milestones/:milestoneId/complete', protect, roleGuard(['admin','coordinator']), ctrl.completeMilestone);
router.get('/:id/dashboard',                          protect, roleGuard(['admin']),                ctrl.getAdminDashboard);

module.exports = router;
