const express = require('express');
const { param } = require('express-validator');
const notificationController = require('../controllers/notification.controller');

const router = express.Router();

// Health route
router.get('/health', notificationController.healthCheck);

// Notification delivery history route
router.get(
  '/api/notifications/user/:userId',
  [param('userId').trim().notEmpty().withMessage('userId parameter is required')],
  notificationController.getNotificationsByUser
);

module.exports = router;
