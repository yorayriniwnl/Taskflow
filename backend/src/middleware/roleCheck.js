const AppError = require('../utils/AppError');

/**
 * Restrict access to specific roles
 * @param  {...string} roles - Allowed roles (e.g. 'admin', 'user')
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Authentication required.', 401));
    }

    if (!roles.includes(req.user.role)) {
      return next(new AppError(
        `Access denied. Required role: [${roles.join(', ')}]. Your role: ${req.user.role}`,
        403
      ));
    }

    next();
  };
};

/**
 * Allow access only to resource owner OR admin
 * @param {Function} getOwnerId - Function to extract owner ID from request
 */
const ownerOrAdmin = (getOwnerId) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Authentication required.', 401));
    }

    const ownerId = getOwnerId(req);
    const isOwner = req.user.id === ownerId;
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return next(new AppError('Access denied. You can only access your own resources.', 403));
    }

    next();
  };
};

module.exports = { authorize, ownerOrAdmin };
