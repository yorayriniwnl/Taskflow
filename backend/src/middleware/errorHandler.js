const logger = require('../config/logger');
const AppError = require('../utils/AppError');

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;
  error.statusCode = err.statusCode || 500;

  if (error.statusCode >= 500) {
    logger.error(`[${req.method}] ${req.originalUrl} >> ${err.stack || err.message}`);
  } else {
    logger.warn(`[${req.method}] ${req.originalUrl} >> ${err.message}`);
  }

  if (err.message === 'Not allowed by CORS') {
    error = new AppError('Origin not allowed by CORS.', 403);
  }

  if (err.code === '23505') {
    const field = err.detail?.match(/\((.+)\)/)?.[1] || 'field';
    error = new AppError(`${field} already exists.`, 409);
  }

  if (err.code === '23503') {
    error = new AppError('Referenced resource not found.', 404);
  }

  if (err.code === '22P02') {
    error = new AppError('Invalid ID format.', 400);
  }

  if (err.name === 'JsonWebTokenError') {
    error = new AppError('Invalid token.', 401);
  }

  if (err.name === 'TokenExpiredError') {
    error = new AppError('Token expired.', 401);
  }

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
