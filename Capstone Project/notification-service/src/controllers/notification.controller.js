const Notification = require('../models/notification.model');
const mongoose = require('mongoose');

// @desc    Get notification delivery history for a user
// @route   GET /api/notifications/user/:userId
// @access  Public
exports.getNotificationsByUser = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const notifications = await Notification.find({ userId }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: notifications.length,
      data: notifications,
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
    service: 'notification-service',
    status: isHealthy ? 'UP' : 'DOWN',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    database: {
      status: dbStates[dbState] || 'Unknown',
      connected: isHealthy,
    },
  });
};
