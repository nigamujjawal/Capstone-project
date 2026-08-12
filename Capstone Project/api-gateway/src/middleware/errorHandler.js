const logger = require('../config/logger');

const errorHandler = (err, req, res, next) => {
  logger.error(`[Gateway Error] ${err.name}: ${err.message}`, {
    correlationId: req.correlationId,
    stack: err.stack,
  });

  const statusCode = res.statusCode !== 200 ? res.statusCode : 500;
  res.status(statusCode).json({
    success: false,
    error: err.message || 'API Gateway Internal Error',
    correlationId: req.correlationId,
  });
};

module.exports = errorHandler;
