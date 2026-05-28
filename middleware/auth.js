// middleware/auth.js – Verifies JWT on every protected route
const jwt  = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorised – no token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Attach full user document (minus password) to the request
    req.user = await User.findById(decoded.id).select('-passwordHash');

    if (!req.user) {
      return res.status(401).json({ success: false, message: 'User belonging to this token no longer exists' });
    }

    if (!req.user.isActive) {
      return res.status(403).json({ success: false, message: 'Account is not active. Contact an administrator.' });
    }

    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};

module.exports = protect;
