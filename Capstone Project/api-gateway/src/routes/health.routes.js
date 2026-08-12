const express = require('express');
const axios = require('axios');
const logger = require('../config/logger');

const router = express.Router();

const services = {
  catalog: process.env.CATALOG_SERVICE_URL || 'http://localhost:3001',
  order: process.env.ORDER_SERVICE_URL || 'http://localhost:3002',
  rating: process.env.RATING_SERVICE_URL || 'http://localhost:3003',
  notification: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3004',
};

// @desc    Combined health check querying all downstream microservices
// @route   GET /health
// @access  Public
router.get('/health', async (req, res) => {
  const startTime = Date.now();

  const healthPromises = Object.entries(services).map(async ([serviceName, baseUrl]) => {
    try {
      const response = await axios.get(`${baseUrl}/health`, { timeout: 2500 });
      return {
        service: serviceName,
        status: response.data.status || 'UP',
        details: response.data,
      };
    } catch (error) {
      return {
        service: serviceName,
        status: 'DOWN',
        error: error.message,
      };
    }
  });

  const results = await Promise.allSettled(healthPromises);

  const servicesStatus = {};
  let isAllHealthy = true;

  results.forEach((result) => {
    if (result.status === 'fulfilled') {
      const val = result.value;
      servicesStatus[val.service] = val;
      if (val.status !== 'UP') isAllHealthy = false;
    } else {
      isAllHealthy = false;
    }
  });

  const responsePayload = {
    service: 'api-gateway',
    status: isAllHealthy ? 'UP' : 'DEGRADED',
    timestamp: new Date().toISOString(),
    latencyMs: Date.now() - startTime,
    correlationId: req.correlationId,
    services: servicesStatus,
  };

  res.status(isAllHealthy ? 200 : 207).json(responsePayload);
});

module.exports = router;
