const amqp = require('amqplib');
const logger = require('../config/logger');
const Notification = require('../models/notification.model');
const { sendOrderConfirmationEmail } = require('../services/emailService');

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost:5672';
const EXCHANGE_NAME = 'cake-delight-events';
const QUEUE_NAME = 'order.completed.queue';
const ROUTING_KEY = 'order.completed';

const startConsumer = async () => {
  const maxRetries = 5;
  let attempt = 0;

  while (attempt < maxRetries) {
    try {
      attempt++;
      logger.info(`[RabbitMQ Consumer] Connecting to RabbitMQ at ${RABBITMQ_URL} (Attempt ${attempt}/${maxRetries})...`);
      
      const connection = await amqp.connect(RABBITMQ_URL);
      const channel = await connection.createChannel();

      // Handle connection close / error
      connection.on('error', (err) => {
        logger.error(`[RabbitMQ Consumer] Connection error: ${err.message}`);
      });

      connection.on('close', () => {
        logger.warn('[RabbitMQ Consumer] Connection closed. Attempting reconnect in 5s...');
        setTimeout(startConsumer, 5000);
      });

      // Assert durable topic exchange
      await channel.assertExchange(EXCHANGE_NAME, 'topic', { durable: true });

      // Assert durable queue
      await channel.assertQueue(QUEUE_NAME, { durable: true });

      // Bind queue to exchange with routing key
      await channel.bindQueue(QUEUE_NAME, EXCHANGE_NAME, ROUTING_KEY);

      // Fair dispatch: process 1 message at a time per consumer worker
      await channel.prefetch(1);

      logger.info(`[RabbitMQ Consumer] Listening for '${ROUTING_KEY}' events on queue '${QUEUE_NAME}'...`);

      // Consume messages with Manual Message Acknowledgement (noAck: false)
      channel.consume(
        QUEUE_NAME,
        async (msg) => {
          if (!msg) return;

          try {
            const contentString = msg.content.toString();
            const event = JSON.parse(contentString);

            logger.info(`[RabbitMQ Consumer] Received event ${event.eventType} (ID: ${event.eventId})`);

            const { eventId, data } = event;

            // Idempotency Check: Verify if event has already been processed and persisted
            const existingNotification = await Notification.findOne({ eventId });
            if (existingNotification) {
              logger.warn(`[RabbitMQ Consumer] Duplicate event detected (eventId: ${eventId}). Acknowledging without duplicate delivery.`);
              // Acknowledge duplicate message to clear it from RabbitMQ queue
              channel.ack(msg);
              return;
            }

            // 1. Simulate/send email notification
            await sendOrderConfirmationEmail(data);

            // 2. Persist delivery record in notification_db
            await Notification.create({
              eventId,
              orderId: data.orderId,
              userId: data.userId,
              customerEmail: data.customerEmail,
              channel: 'EMAIL',
              status: 'DELIVERED',
              payload: event,
              deliveredAt: new Date(),
            });

            logger.info(`[RabbitMQ Consumer] Notification record persisted for orderId: ${data.orderId}`);

            // 3. Manual Message Acknowledgement (Ack message ONLY AFTER successful DB persistence)
            channel.ack(msg);
            logger.info(`[RabbitMQ Consumer] Message ACK sent to RabbitMQ for eventId: ${eventId}`);
          } catch (processingError) {
            logger.error(`[RabbitMQ Consumer] Failed to process message: ${processingError.message}`);

            // If processing fails, reject and requeue message (nack with requeue=true)
            // If message was already redelivered, drop/log to prevent infinite poison pill loop
            if (msg.fields.redelivered) {
              logger.error(`[RabbitMQ Consumer] Message failed second attempt. Dropping to prevent infinite loop.`);
              channel.nack(msg, false, false); // no requeue
            } else {
              logger.warn(`[RabbitMQ Consumer] Requeueing message for retry...`);
              channel.nack(msg, false, true); // requeue
            }
          }
        },
        { noAck: false } // Enforce manual acknowledgement mode
      );

      return; // Connection successful
    } catch (error) {
      logger.warn(`[RabbitMQ Consumer] Connection attempt ${attempt} failed: ${error.message}`);
      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000;
        logger.info(`[RabbitMQ Consumer] Waiting ${delay / 1000}s before retrying...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      } else {
        logger.error(`[RabbitMQ Consumer] Failed to connect to RabbitMQ after ${maxRetries} attempts.`);
      }
    }
  }
};

module.exports = {
  startConsumer,
};
