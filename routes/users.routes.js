// routes/users.routes.js
const express   = require('express');
const router    = express.Router();
const protect   = require('../middleware/auth');
const roleGuard = require('../middleware/roleGuard');
const validate  = require('../middleware/validate');
const ctrl      = require('../controllers/users.controller');

router.get('/',               protect, roleGuard(['admin']),         ctrl.listUsers);
router.post('/invite',        protect, roleGuard(['admin']),         validate.inviteUserRules,    ctrl.inviteUser);
router.get('/:id',            protect,                               ctrl.getUser);
router.put('/:id',            protect,                               ctrl.updateUser);
router.patch('/:id/activate', protect, roleGuard(['admin']),         ctrl.activateUser);
router.get('/:id/notification-preferences',  protect, ctrl.getNotificationPrefs);
router.put('/:id/notification-preferences',  protect, ctrl.updateNotificationPrefs);

module.exports = router;
