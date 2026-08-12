require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const rateLimit = require('express-rate-limit');
const { createProxyMiddleware } = require('http-proxy-middleware');

const logger = require('./config/logger');
const correlationIdMiddleware = require('./middleware/correlationId');
const healthRoutes = require('./routes/health.routes');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3000;

// Targets for downstream microservices
const SERVICES = {
  CATALOG: process.env.CATALOG_SERVICE_URL || 'http://localhost:3001',
  ORDER: process.env.ORDER_SERVICE_URL || 'http://localhost:3002',
  RATING: process.env.RATING_SERVICE_URL || 'http://localhost:3003',
  NOTIFICATION: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3004',
};

// Global Middleware
app.use(cors());

// Express Rate Limiter: Max 100 requests per 15 minutes per IP
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    success: false,
    error: 'Too Many Requests',
    message: 'Rate limit exceeded. Please try again after 15 minutes.',
  },
});
app.use(limiter);

// Correlation ID Middleware
app.use(correlationIdMiddleware);

// HTTP Logging with Winston & Correlation ID
morgan.token('correlation-id', (req) => req.correlationId);
const stream = {
  write: (message) => logger.info(message.trim()),
};
app.use(morgan(':method :url :status :res[content-length] - :response-time ms [CID: :correlation-id]', { stream }));

// Serve static frontend files from 'public' directory
app.use(express.static(path.join(__dirname, '../public')));

// Combined Health Check Endpoint
app.use('/', healthRoutes);

/**
 * Proxy Options Helper: Attaches X-Correlation-ID header to all proxied downstream requests
 */
const getProxyOptions = (target, serviceName) => ({
  target,
  changeOrigin: true,
  onProxyReq: (proxyReq, req, res) => {
    // Inject Correlation ID into downstream request headers
    if (req.correlationId) {
      proxyReq.setHeader('X-Correlation-ID', req.correlationId);
    }
    logger.info(`[Gateway Proxy] Forwarding ${req.method} ${req.originalUrl} -> ${serviceName} (${target})`);
  },
  onError: (err, req, res) => {
    logger.error(`[Gateway Proxy Error] ${serviceName} unreachable: ${err.message}`);
    if (!res.headersSent) {
      res.status(503).json({
        success: false,
        error: 'Service Unavailable',
        message: `The '${serviceName}' is currently unreachable.`,
        correlationId: req.correlationId,
      });
    }
  },
});

// Proxy Route Definitions
app.use('/api/cakes', createProxyMiddleware(getProxyOptions(SERVICES.CATALOG, 'Catalog Service')));
app.use('/api/basket', createProxyMiddleware(getProxyOptions(SERVICES.ORDER, 'Order Service (Basket)')));
app.use('/api/orders', createProxyMiddleware(getProxyOptions(SERVICES.ORDER, 'Order Service (Checkout)')));
app.use('/api/ratings', createProxyMiddleware(getProxyOptions(SERVICES.RATING, 'Rating Service')));
app.use('/api/notifications', createProxyMiddleware(getProxyOptions(SERVICES.NOTIFICATION, 'Notification Service')));

// Central Error Handler
app.use(errorHandler);

// Start Gateway Server
const server = app.listen(PORT, () => {
  logger.info(`=======================================================`);
  logger.info(`Cake Delight API Gateway running on port ${PORT}`);
  logger.info(`Serving static frontend at http://localhost:${PORT}/`);
  logger.info(`Proxied Routes:`);
  logger.info(` - /api/cakes          -> ${SERVICES.CATALOG}`);
  logger.info(` - /api/basket         -> ${SERVICES.ORDER}`);
  logger.info(` - /api/orders         -> ${SERVICES.ORDER}`);
  logger.info(` - /api/ratings        -> ${SERVICES.RATING}`);
  logger.info(` - /api/notifications  -> ${SERVICES.NOTIFICATION}`);
  logger.info(`=======================================================`);
});

process.on('unhandledRejection', (err) => {
  logger.error(`Unhandled Rejection: ${err.message}`);
  server.close(() => process.exit(1));
});

module.exports = app;
