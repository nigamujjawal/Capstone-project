const mongoose = require('mongoose');

const cakeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Cake name is required'],
      trim: true,
      index: true,
    },
    description: {
      type: String,
      required: [true, 'Cake description is required'],
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: {
        values: ['Chocolate', 'Fruity', 'Cheesecake', 'Custom', 'Vegan', 'Vanilla'],
        message: '{VALUE} is not a valid cake category',
      },
      index: true,
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    imageUrl: {
      type: String,
      default: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=600&q=80',
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for price range queries and category filtering
cakeSchema.index({ category: 1, price: 1 });

module.exports = mongoose.model('Cake', cakeSchema);
