const Order = require('../models/order.model');
const Basket = require('../models/basket.model');
const mongoose = require('mongoose');

// @desc    Checkout active basket, create order, and clear basket
// @route   POST /api/orders/checkout
// @access  Public
exports.checkoutOrder = async (req, res, next) => {
  try {
    const { userId, customerEmail } = req.body;

    const basket = await Basket.findOne({ userId });

    if (!basket || basket.items.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Empty Basket',
        message: 'Cannot place an order with an empty basket.',
      });
    }

    // Prepare Order items from current basket
    const orderItems = basket.items.map((item) => ({
      cakeId: item.cakeId,
      cakeName: item.cakeName,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      lineTotal: item.lineTotal,
    }));

    // Create persistent Order record
    const order = await Order.create({
      userId,
      customerEmail,
      items: orderItems,
      totalAmount: basket.grandTotal,
      orderStatus: 'CONFIRMED',
      placedAt: new Date(),
    });

    // Clear active basket after successful order creation
    basket.items = [];
    basket.grandTotal = 0;
    await basket.save();

    // Publish 'order.completed' event to RabbitMQ
    const { publishOrderCompleted } = require('../messaging/publisher');
    publishOrderCompleted(order).catch((err) => {
      logger.error(`Failed to publish order event: ${err.message}`);
    });

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get order details by order ID
// @route   GET /api/orders/:orderId
// @access  Public
exports.getOrderById = async (req, res, next) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: `Order with ID '${orderId}' not found`,
      });
    }

    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all orders placed by a specific user
// @route   GET /api/orders/user/:userId
// @access  Public
exports.getOrdersByUser = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const orders = await Order.find({ userId }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Health check endpoint
// @route   GET /health
// @access  Public
exports.healthCheck = async (req, res) => {
  const dbState = mongoose.connection.readyState;
  const dbStates = {
    0: 'Disconnected',
    1: 'Connected',
    2: 'Connecting',
    3: 'Disconnecting',
  };

  const isHealthy = dbState === 1;

  res.status(isHealthy ? 200 : 503).json({
    service: 'order-service',
    status: isHealthy ? 'UP' : 'DOWN',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    database: {
      status: dbStates[dbState] || 'Unknown',
      connected: isHealthy,
    },
  });
};
