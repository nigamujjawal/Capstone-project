require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');
const swaggerJsDoc = require('swagger-jsdoc');

const connectDB = require('./config/db');
const logger = require('./config/logger');
const basketRoutes = require('./routes/basket.routes');
const orderRoutes = require('./routes/order.routes');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3002;

// Connect to MongoDB Database
connectDB();

// Initialize RabbitMQ Publisher
const { initPublisher } = require('./messaging/publisher');
initPublisher();

// Global Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// HTTP Request Logger using Morgan integrated with Winston
const stream = {
  write: (message) => logger.info(message.trim()),
};
app.use(morgan(':method :url :status :res[content-length] - :response-time ms', { stream }));

// Swagger UI Configuration
const swaggerOptions = {
  swaggerDefinition: {
    openapi: '3.0.0',
    info: {
      title: 'Order & Basket Microservice API',
      version: '1.0.0',
      description: 'API documentation for Cake Delight Order Service - Shopping cart, item totals calculation, and checkout.',
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
        description: 'Local Development Server',
      },
    ],
  },
  apis: ['./src/routes/*.js'],
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Mount Routes
app.use('/', basketRoutes);
app.use('/', orderRoutes);

// Centralized Error Handling Middleware
app.use(errorHandler);

// Start Server
const server = app.listen(PORT, () => {
  logger.info(`Order Service running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
  logger.info(`Swagger documentation available at http://localhost:${PORT}/api-docs`);
});

// Handle Unhandled Promise Rejections
process.on('unhandledRejection', (err) => {
  logger.error(`Unhandled Rejection: ${err.message}`);
  server.close(() => process.exit(1));
});

module.exports = app;
