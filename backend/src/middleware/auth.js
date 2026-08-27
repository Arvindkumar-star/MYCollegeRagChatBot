const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Verifies the Bearer JWT and attaches req.user.
 * Returns 401 if missing/invalid, 401 if user not found.
 */
const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.id).select('-passwordHash');
    if (!user) return res.status(401).json({ error: 'User not found' });
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

/**
 * Must be used AFTER authenticate.
 * Returns 403 if the authenticated user is not an admin.
 */
const requireAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

/**
 * Requires admin or faculty role.
 */
const requireFacultyOrAdmin = (req, res, next) => {
  if (!['admin', 'faculty'].includes(req.user?.role)) {
    return res.status(403).json({ error: 'Faculty or admin access required' });
  }
  next();
};

module.exports = { authenticate, requireAdmin, requireFacultyOrAdmin };
