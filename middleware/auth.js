const jwt  = require('jsonwebtoken')
const User = require('../models/User')

// Verifies JWT on every protected route.
// Attaches the live user document to req.user.
exports.protect = async (req, res, next) => {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided. Access denied.' })
  }

  const token = authHeader.split(' ')[1]

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    // Fetch live user — confirms account is still active and not deleted
    const user = await User.findById(decoded._id).select('-passwordHash')

    if (!user) {
      return res.status(401).json({ message: 'User no longer exists.' })
    }
    if (!user.isActive) {
      return res.status(401).json({ message: 'Account is not yet activated. Contact your admin.' })
    }
    if (user.deletedAt) {
      return res.status(401).json({ message: 'Account has been deactivated.' })
    }

    req.user = user
    next()
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token.' })
  }
}
