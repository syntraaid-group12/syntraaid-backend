// Usage: roleGuard(['admin', 'coordinator'])
// Must be placed AFTER protect middleware (req.user must exist)
module.exports = (allowedRoles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authenticated.' })
  }
  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({
      message: `Access denied. Required role(s): ${allowedRoles.join(', ')}`,
    })
  }
  next()
}
