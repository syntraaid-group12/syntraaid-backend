// middleware/validate.js
// Express-validator rule sets for all incoming requests.
// Usage: router.post('/login', validate.login, ctrl.login)
// Requires: npm install express-validator

const { body, param, query, validationResult } = require('express-validator');
const ENUMS = require('../constants/enums');

// ── Run validations and return 400 on failure ─────────────────
const runValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors:  errors.array().map(e => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};

// ── Auth ──────────────────────────────────────────────────────
const loginRules = [
  body('email').isEmail().withMessage('A valid email is required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
  runValidation,
];

const registerRules = [
  body('token').notEmpty().withMessage('Invite token is required'),
  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
    .matches(/[0-9]/).withMessage('Password must contain at least one number'),
  runValidation,
];

const forgotPasswordRules = [
  body('email').isEmail().withMessage('A valid email is required').normalizeEmail(),
  runValidation,
];

const resetPasswordRules = [
  body('token').notEmpty().withMessage('Reset token is required'),
  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/).withMessage('Must contain at least one uppercase letter')
    .matches(/[0-9]/).withMessage('Must contain at least one number'),
  runValidation,
];

// ── Users ─────────────────────────────────────────────────────
const inviteUserRules = [
  body('email').isEmail().withMessage('A valid email is required').normalizeEmail(),
  body('role').isIn(ENUMS.userRole).withMessage(`role must be one of: ${ENUMS.userRole.join(', ')}`),
  runValidation,
];

// ── Projects ──────────────────────────────────────────────────
const createProjectRules = [
  body('title').trim().notEmpty().withMessage('Project title is required'),
  body('status')
    .optional()
    .isIn(ENUMS.projectStatus).withMessage(`status must be one of: ${ENUMS.projectStatus.join(', ')}`),
  runValidation,
];

const changeProjectStatusRules = [
  body('status').isIn(ENUMS.projectStatus).withMessage(`status must be one of: ${ENUMS.projectStatus.join(', ')}`),
  runValidation,
];

// ── Tasks ─────────────────────────────────────────────────────
const createTaskRules = [
  body('projectId').notEmpty().withMessage('projectId is required'),
  body('title').trim().notEmpty().withMessage('Task title is required'),
  body('status')
    .optional()
    .isIn(ENUMS.taskStatus).withMessage(`status must be one of: ${ENUMS.taskStatus.join(', ')}`),
  runValidation,
];

const changeTaskStatusRules = [
  body('status').isIn(ENUMS.taskStatus).withMessage(`status must be one of: ${ENUMS.taskStatus.join(', ')}`),
  runValidation,
];

// ── Attendance ────────────────────────────────────────────────
const logAttendanceRules = [
  body('volunteerId').notEmpty().withMessage('volunteerId is required'),
  body('projectId').notEmpty().withMessage('projectId is required'),
  body('sessionDate').isISO8601().withMessage('sessionDate must be a valid ISO date'),
  body('hoursLogged')
    .isFloat({ gt: 0 }).withMessage('hoursLogged must be a number greater than 0')
    .isFloat({ max: 24 }).withMessage('hoursLogged cannot exceed 24 hours per session'),
  runValidation,
];

// ── Volunteers ────────────────────────────────────────────────
const createProfileRules = [
  body('firstName').trim().notEmpty().withMessage('firstName is required'),
  body('lastName').trim().notEmpty().withMessage('lastName is required'),
  runValidation,
];

// ── Contact ───────────────────────────────────────────────────
const contactRules = [
  body('name').trim().notEmpty().withMessage('name is required'),
  body('email').isEmail().withMessage('A valid email is required').normalizeEmail(),
  body('organizationName').trim().notEmpty().withMessage('organizationName is required'),
  runValidation,
];

// ── Reports ───────────────────────────────────────────────────
const generateReportRules = [
  body('reportType').isIn(ENUMS.reportType).withMessage(`reportType must be one of: ${ENUMS.reportType.join(', ')}`),
  body('dateRangeStart').optional().isISO8601().withMessage('dateRangeStart must be a valid ISO date'),
  body('dateRangeEnd').optional().isISO8601().withMessage('dateRangeEnd must be a valid ISO date'),
  runValidation,
];

module.exports = {
  loginRules,
  registerRules,
  forgotPasswordRules,
  resetPasswordRules,
  inviteUserRules,
  createProjectRules,
  changeProjectStatusRules,
  createTaskRules,
  changeTaskStatusRules,
  logAttendanceRules,
  createProfileRules,
  contactRules,
  generateReportRules,
};
