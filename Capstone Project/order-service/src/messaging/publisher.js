const amqp = require('amqplib');
const { v4: uuidv4 } = require('uuid');
const logger = require('../config/logger');

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost:5672';
const EXCHANGE_NAME = 'cake-delight-events';
const ROUTING_KEY = 'order.completed';

let channel = null;
let connection = null;

/**
 * Initialize RabbitMQ Connection & Channel
 */
const initPublisher = async () => {
  try {
    logger.info(`[RabbitMQ Publisher] Connecting to RabbitMQ at ${RABBITMQ_URL}...`);
    connection = await amqp.connect(RABBITMQ_URL);
    channel = await connection.createChannel();

    // Assert durable topic exchange
    await channel.assertExchange(EXCHANGE_NAME, 'topic', { durable: true });
    logger.info(`[RabbitMQ Publisher] Topic exchange '${EXCHANGE_NAME}' asserted successfully.`);
  } catch (error) {
    logger.warn(`[RabbitMQ Publisher] Connection failed: ${error.message}. Events will not be published until RabbitMQ is available.`);
  }
};

/**
 * Publish 'order.completed' event payload to RabbitMQ
 * @param {Object} order Persisted order document from Mongoose
 */
const publishOrderCompleted = async (order) => {
  try {
    if (!channel) {
      logger.warn('[RabbitMQ Publisher] Channel not initialized. Attempting re-connection...');
      await initPublisher();
    }

    if (!channel) {
      logger.error('[RabbitMQ Publisher] Cannot publish event: RabbitMQ unavailable.');
      return false;
    }

    // Build event payload according to required Event Contract
    const eventPayload = {
      eventId: uuidv4(),
      eventType: 'order.completed',
      timestamp: new Date().toISOString(),
      version: '1.0',
      data: {
        orderId: order._id.toString(),
        userId: order.userId,
        customerEmail: order.customerEmail,
        items: order.items.map((item) => ({
          cakeId: item.cakeId,
          cakeName: item.cakeName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          lineTotal: item.lineTotal,
        })),
        totalAmount: order.totalAmount,
        orderStatus: order.orderStatus,
        placedAt: order.placedAt ? order.placedAt.toISOString() : new Date().toISOString(),
      },
    };

    const buffer = Buffer.from(JSON.stringify(eventPayload));

    const published = channel.publish(EXCHANGE_NAME, ROUTING_KEY, buffer, {
      persistent: true, // Persist message to disk
      contentType: 'application/json',
    });

    if (published) {
      logger.info(`[RabbitMQ Publisher] Successfully published 'order.completed' for orderId: ${order._id}`);
    } else {
      logger.warn(`[RabbitMQ Publisher] Buffer full, message queueing for orderId: ${order._id}`);
    }

    return published;
  } catch (error) {
    logger.error(`[RabbitMQ Publisher] Error publishing event: ${error.message}`);
    return false;
  }
};

module.exports = {
  initPublisher,
  publishOrderCompleted,
};
