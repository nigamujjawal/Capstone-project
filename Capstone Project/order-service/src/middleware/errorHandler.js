const logger = require('../config/logger');

const errorHandler = (err, req, res, next) => {
  logger.error(`[Error Handler] ${err.name}: ${err.message}`, { stack: err.stack });

  // Handle custom status codes (e.g., 503 from Catalog service downstream error)
  const statusCode = err.statusCode || (res.statusCode !== 200 ? res.statusCode : 500);

  // Handle Mongoose CastError
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      error: 'Resource Not Found',
      message: `Invalid format for field '${err.path}'`,
    });
  }

  // Handle Mongoose ValidationError
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      details: messages,
    });
  }

  res.status(statusCode).json({
    success: false,
    error: err.message || 'Internal Server Error',
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
};

module.exports = errorHandler;
