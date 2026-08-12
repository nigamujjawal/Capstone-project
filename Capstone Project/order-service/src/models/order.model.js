const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  cakeId: {
    type: String,
    required: true,
  },
  cakeName: {
    type: String,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
  },
  unitPrice: {
    type: Number,
    required: true,
  },
  lineTotal: {
    type: Number,
    required: true,
  },
});

const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: [true, 'userId is required'],
      index: true,
    },
    customerEmail: {
      type: String,
      required: [true, 'customerEmail is required'],
      trim: true,
      lowercase: true,
    },
    items: [orderItemSchema],
    totalAmount: {
      type: Number,
      required: true,
    },
    orderStatus: {
      type: String,
      enum: ['CONFIRMED', 'PENDING', 'CANCELLED'],
      default: 'CONFIRMED',
    },
    placedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Order', orderSchema);
