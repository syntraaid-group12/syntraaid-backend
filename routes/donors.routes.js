// routes/donors.routes.js
// ⚠️  Donors have read-only access to their own data.
// ⚠️  Donors cannot POST, PUT, PATCH, or DELETE anything.
const express   = require('express');
const router    = express.Router();
const protect   = require('../middleware/auth');
const roleGuard = require('../middleware/roleGuard');
const ctrl      = require('../controllers/donors.controller');

router.get('/',                                          protect, roleGuard(['admin']),                 ctrl.listDonors);
router.get('/:id/dashboard',                             protect, roleGuard(['donor']),                 ctrl.getDonorDashboard);
router.get('/:id/projects',                              protect, ctrl.getDonorProjects);               // access checked in controller
router.get('/:id/projects/:projectId',                   protect, roleGuard(['donor']),                 ctrl.getDonorProjectDetail);
router.get('/:id/projects/:projectId/history',           protect, roleGuard(['donor']),                 ctrl.getDonorProjectHistory);
router.get('/:id/summary',                               protect, roleGuard(['donor']),                 ctrl.getDonorSummary);
router.post('/:id/projects',                             protect, roleGuard(['admin']),                 ctrl.linkDonorToProject);
router.put('/:id/projects/:projectId',                   protect, roleGuard(['admin']),                 ctrl.updateVisibilitySettings);
router.patch('/:id/projects/:projectId/unlink',          protect, roleGuard(['admin']),                 ctrl.unlinkDonor);

module.exports = router;
