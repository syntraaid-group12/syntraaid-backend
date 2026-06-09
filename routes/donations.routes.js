// routes/donations.routes.js
const express   = require('express');
const router    = express.Router();
const protect   = require('../middleware/auth');
const roleGuard = require('../middleware/roleGuard');
const ctrl      = require('../controllers/donations.controller');

// Donor (self) routes
router.get('/reference', protect, roleGuard(['donor']),            ctrl.getMyReference);
router.get('/mine',      protect, roleGuard(['donor']),            ctrl.getMyDonations);
router.post('/',         protect, roleGuard(['donor']),            ctrl.submitDonation);

// Admin routes
router.get('/',                   protect, roleGuard(['admin']),   ctrl.listDonations);
router.patch('/:id/acknowledge',  protect, roleGuard(['admin']),   ctrl.acknowledgeDonation);

module.exports = router;
