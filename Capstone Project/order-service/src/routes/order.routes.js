const express = require('express');
const { body, param } = require('express-validator');
const orderController = require('../controllers/order.controller');
const validate = require('../middleware/validate');

const router = express.Router();

// Validation chains
const checkoutValidation = [
  body('userId').trim().notEmpty().withMessage('userId is required'),
  body('customerEmail').isEmail().withMessage('Valid customerEmail is required'),
  validate,
];

const orderIdValidation = [
  param('orderId').isMongoId().withMessage('Valid Mongo orderId parameter is required'),
  validate,
];

const userIdValidation = [
  param('userId').trim().notEmpty().withMessage('userId parameter is required'),
  validate,
];

// Health check route
router.get('/health', orderController.healthCheck);

// Order Routes
router.post('/api/orders/checkout', checkoutValidation, orderController.checkoutOrder);
router.get('/api/orders/:orderId', orderIdValidation, orderController.getOrderById);
router.get('/api/orders/user/:userId', userIdValidation, orderController.getOrdersByUser);

module.exports = router;
