// middleware/auth.js
// SOURCE: SyntraAid Master Technical Playbook v2.0 - Part 3 middleware/auth.js + roleGuard.js

const jwt = require('jsonwebtoken')

// ─────────────────────────────────────────────
// protect — verifies the JWT token on every protected route
// Attaches req.user = { id, role } for controllers to use
// ─────────────────────────────────────────────
const protect = (req, res, next) => {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided. Access denied.' })
  }

  const token = authHeader.split(' ')[1]

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = {
      id: decoded.id || decoded._id,
      role: (decoded.role || '').toLowerCase(),
    }
    next()
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token.' })
  }
}

// ─────────────────────────────────────────────
// roleGuard — restricts route to specific roles
// Pass an array of allowed roles from the playbook userRole enum:
// ['admin', 'coordinator', 'volunteer', 'donor']
//
// Usage in route:
//   router.get('/', protect, roleGuard(['admin', 'coordinator']), controller)
// ─────────────────────────────────────────────
const roleGuard = (allowedRoles) => {
  return (req, res, next) => {
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Access denied. This route requires one of: ${allowedRoles.join(', ')}. Your role: ${req.user.role}`,
      })
    }
    next()
  }
}

module.exports = { protect, roleGuard }