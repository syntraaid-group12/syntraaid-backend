// routes/auth.routes.js
const express  = require('express');
const router   = express.Router();
const ctrl     = require('../controllers/auth.controller');
const validate = require('../middleware/validate');

router.post('/register',        validate.registerRules,       ctrl.register);
router.post('/login',           validate.loginRules,          ctrl.login);
router.post('/forgot-password', validate.forgotPasswordRules, ctrl.forgotPassword);
router.post('/reset-password',  validate.resetPasswordRules,  ctrl.resetPassword);
router.get('/invite/:token',                                   ctrl.validateInvite);

module.exports = router;
