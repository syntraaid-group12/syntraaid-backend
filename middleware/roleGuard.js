// middleware/roleGuard.js
// Usage: router.get('/admin-only', protect, roleGuard(['admin']), controller)
// Pass an array of allowed roles. Always use AFTER the protect middleware.

const roleGuard = (allowedRoles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role(s): ${allowedRoles.join(', ')}. Your role: ${req.user.role}`,
      });
    }

    next();
  };
};

module.exports = roleGuard;
