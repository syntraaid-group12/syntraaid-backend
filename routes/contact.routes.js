// routes/contact.routes.js
const express   = require('express');
const router    = express.Router();
const protect   = require('../middleware/auth');
const roleGuard = require('../middleware/roleGuard');
const validate  = require('../middleware/validate');
const ctrl      = require('../controllers/contact.controller');

router.post('/',              validate.contactRules,                           ctrl.submitContact);
router.get('/',  protect, roleGuard(['admin']),                                ctrl.listContactRequests);
router.patch('/:id/status', protect, roleGuard(['admin']),                     ctrl.updateStatus);

module.exports = router;
