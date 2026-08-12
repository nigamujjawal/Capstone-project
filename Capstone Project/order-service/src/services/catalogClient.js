const axios = require('axios');
const logger = require('../config/logger');

const CATALOG_SERVICE_URL = process.env.CATALOG_SERVICE_URL || 'http://localhost:3001';

/**
 * Fetch real cake details from Catalog Service over HTTP with timeout & retries.
 * @param {string} cakeId 
 * @returns {Promise<Object>} Cake document { _id, name, price, category, imageUrl, isAvailable }
 */
const getCakeDetails = async (cakeId) => {
  const url = `${CATALOG_SERVICE_URL}/api/cakes/${cakeId}`;
  const maxRetries = 2;
  const timeoutMs = 3000;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      logger.info(`[CatalogClient] Fetching cake ${cakeId} from ${url} (Attempt ${attempt}/${maxRetries})`);
      const response = await axios.get(url, { timeout: timeoutMs });

      if (response.data && response.data.success && response.data.data) {
        return response.data.data;
      }

      throw new Error('Invalid response structure from Catalog Service');
    } catch (error) {
      const isLastAttempt = attempt === maxRetries;

      // Handle 404 Cake Not Found explicitly
      if (error.response && error.response.status === 404) {
        const err = new Error(`Cake with ID '${cakeId}' does not exist in catalog`);
        err.statusCode = 404;
        throw err;
      }

      logger.warn(`[CatalogClient] Attempt ${attempt} failed: ${error.message}`);

      if (isLastAttempt) {
        logger.error(`[CatalogClient] Catalog Service unavailable after ${maxRetries} attempts`);
        const err = new Error('Catalog Service is currently unavailable. Please try again later.');
        err.statusCode = 503;
        throw err;
      }

      // Small delay before retrying
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }
};

module.exports = {
  getCakeDetails,
};
