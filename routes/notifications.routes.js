// routes/notifications.routes.js
const express = require('express');
const router  = express.Router();
const protect = require('../middleware/auth');
const ctrl    = require('../controllers/notifications.controller');

// All notifications routes require authentication (self only, enforced in controller)
router.get('/',                protect, ctrl.getNotifications);
router.patch('/read-all',      protect, ctrl.markAllRead);      // must come BEFORE /:id/read
router.patch('/:id/read',      protect, ctrl.markOneRead);

module.exports = router;
