const AppError = require('../utils/AppError');

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

module.exports = { authorize };
