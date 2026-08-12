const { v4: uuidv4 } = require('uuid');

const correlationIdMiddleware = (req, res, next) => {
  // Use client-provided X-Correlation-ID if present, or generate a fresh UUID v4
  const correlationId = req.headers['x-correlation-id'] || uuidv4();

  // Attach to request object and response headers
  req.correlationId = correlationId;
  res.setHeader('X-Correlation-ID', correlationId);

  next();
};

module.exports = correlationIdMiddleware;
