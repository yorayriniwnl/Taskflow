const logger = require('../config/logger');
const AppError = require('../utils/AppError');

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;
  error.statusCode = err.statusCode || 500;

  // Log error
  if (error.statusCode >= 500) {
    logger.error(`[${req.method}] ${req.path} >> ${err.stack}`);
  } else {
    logger.warn(`[${req.method}] ${req.path} >> ${err.message}`);
  }

  // PostgreSQL unique constraint violation
  if (err.code === '23505') {
    const field = err.detail?.match(/\((.+)\)/)?.[1] || 'field';
    error = new AppError(`${field} already exists.`, 409);
  }

  // PostgreSQL foreign key violation
  if (err.code === '23503') {
    error = new AppError('Referenced resource not found.', 404);
  }

  // PostgreSQL invalid UUID
  if (err.code === '22P02') {
    error = new AppError('Invalid ID format.', 400);
  }

  // JWT errors (fallback – should be caught in middleware)
  if (err.name === 'JsonWebTokenError') {
    error = new AppError('Invalid token.', 401);
  }
  if (err.name === 'TokenExpiredError') {
    error = new AppError('Token expired.', 401);
  }

  // Express body parser size limit
  if (err.type === 'entity.too.large') {
    error = new AppError('Request body too large. Maximum size is 10kb.', 413);
  }

  res.status(error.statusCode).json({
    success: false,
    requestId: req.id,
    message: error.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    ...(error.errors && { errors: error.errors }),
  });
};

module.exports = errorHandler;
