const logger = require('../config/logger');

const errorHandler = (err, req, res, next) => {
  logger.error(`[Error Handler] ${err.name}: ${err.message}`, { stack: err.stack });

  const statusCode = res.statusCode !== 200 ? res.statusCode : 500;
  res.status(statusCode).json({
    success: false,
    error: err.message || 'Internal Server Error',
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
};

module.exports = errorHandler;
