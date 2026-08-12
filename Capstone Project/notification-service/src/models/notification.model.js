const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    eventId: {
      type: String,
      required: [true, 'eventId is required'],
      unique: true, // Guarantees idempotency (prevents processing duplicate messages)
      index: true,
    },
    orderId: {
      type: String,
      required: [true, 'orderId is required'],
      index: true,
    },
    userId: {
      type: String,
      required: [true, 'userId is required'],
      index: true,
    },
    customerEmail: {
      type: String,
      required: [true, 'customerEmail is required'],
      lowercase: true,
      trim: true,
    },
    channel: {
      type: String,
      enum: ['EMAIL', 'CONSOLE_LOG'],
      default: 'EMAIL',
    },
    status: {
      type: String,
      enum: ['DELIVERED', 'FAILED'],
      default: 'DELIVERED',
    },
    payload: {
      type: Object,
      required: true,
    },
    deliveredAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Notification', notificationSchema);
