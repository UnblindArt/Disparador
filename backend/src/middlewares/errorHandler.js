import logger from '../config/logger.js';
import { ValidationError } from '../utils/validators.js';

export function errorHandler(err, req, res, next) {
  // Log error
  logger.logError(err, req);

  // Validation errors
  if (err instanceof ValidationError) {
    return res.status(err.statusCode).json({
      success: false,
      error: err.message,
      details: err.errors,
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      error: 'Invalid or expired token',
    });
  }

  // Multer errors (file upload)
  if (err.name === 'MulterError') {
    return res.status(400).json({
      success: false,
      error: err.message,
    });
  }

  // Default error
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}

export function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    path: req.originalUrl,
  });
}

export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

export default { errorHandler, notFoundHandler, asyncHandler };
