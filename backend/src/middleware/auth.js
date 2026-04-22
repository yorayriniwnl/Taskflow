const jwt = require('jsonwebtoken');
const { query } = require('../config/database');
const AppError = require('../utils/AppError');

/**
 * Verify JWT and attach user to request
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Access denied. No token provided.', 401);
    }

    const token = authHeader.split(' ')[1];

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        throw new AppError('Token expired. Please refresh your token.', 401);
      }
      throw new AppError('Invalid token. Authentication failed.', 401);
    }

    // Check user still exists and is active
    const result = await query(
      'SELECT id, email, name, role, is_active FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (result.rows.length === 0 || !result.rows[0].is_active) {
      throw new AppError('User not found or account deactivated.', 401);
    }

    req.user = result.rows[0];
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Optional auth – attaches user if token present, but doesn't fail without one
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const result = await query(
        'SELECT id, email, name, role, is_active FROM users WHERE id = $1',
        [decoded.userId]
      );
      if (result.rows.length > 0 && result.rows[0].is_active) {
        req.user = result.rows[0];
      }
    }
  } catch {
    // Silently ignore – optional auth
  }
  next();
};

module.exports = { authenticate, optionalAuth };
