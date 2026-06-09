// routes/coordinator.routes.js
const express   = require('express');
const router    = express.Router();
const protect   = require('../middleware/auth');
const roleGuard = require('../middleware/roleGuard');
const ctrl      = require('../controllers/coordinator.controller');

router.get('/dashboard', protect, roleGuard(['coordinator']), ctrl.getDashboard);
router.get('/projects',  protect, roleGuard(['coordinator']), ctrl.getProjects);

module.exports = router;
