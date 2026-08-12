const mongoose = require('mongoose');

const ratingSchema = new mongoose.Schema(
  {
    cakeId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, 'cakeId is required'],
      ref: 'Cake',
      index: true,
    },
    userId: {
      type: String,
      required: [true, 'userId is required'],
      trim: true,
      index: true,
    },
    stars: {
      type: Number,
      required: [true, 'stars rating is required'],
      min: [1, 'Rating must be at least 1 star'],
      max: [5, 'Rating cannot exceed 5 stars'],
    },
    comment: {
      type: String,
      trim: true,
      maxlength: [500, 'Comment cannot exceed 500 characters'],
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Compound Unique Index: Prevents the same userId from rating the same cakeId twice
ratingSchema.index({ cakeId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model('Rating', ratingSchema);
