const mongoose = require('mongoose');

const basketItemSchema = new mongoose.Schema({
  cakeId: {
    type: String,
    required: [true, 'cakeId is required'],
  },
  cakeName: {
    type: String,
    required: [true, 'cakeName is required'],
  },
  unitPrice: {
    type: Number,
    required: [true, 'unitPrice is required'],
    min: [0, 'unitPrice cannot be negative'],
  },
  quantity: {
    type: Number,
    required: [true, 'quantity is required'],
    min: [1, 'quantity must be at least 1'],
    default: 1,
  },
  lineTotal: {
    type: Number,
    required: true,
    default: 0,
  },
});

const basketSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: [true, 'userId is required'],
      unique: true,
      index: true,
    },
    items: [basketItemSchema],
    grandTotal: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save hook to recalculate item line totals and basket grand total accurately
basketSchema.pre('save', function (next) {
  let total = 0;
  this.items.forEach((item) => {
    item.lineTotal = Number((item.unitPrice * item.quantity).toFixed(2));
    total += item.lineTotal;
  });
  this.grandTotal = Number(total.toFixed(2));
  next();
});

module.exports = mongoose.model('Basket', basketSchema);
