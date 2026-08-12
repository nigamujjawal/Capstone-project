const Rating = require('../models/rating.model');
const mongoose = require('mongoose');

// @desc    Submit a new rating for a cake
// @route   POST /api/ratings
// @access  Public
exports.createRating = async (req, res, next) => {
  try {
    const { cakeId, userId, stars, comment } = req.body;

    const rating = await Rating.create({
      cakeId,
      userId,
      stars,
      comment,
    });

    res.status(201).json({
      success: true,
      message: 'Rating submitted successfully',
      data: rating,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all ratings submitted for a specific cake
// @route   GET /api/ratings/cake/:cakeId
// @access  Public
exports.getRatingsByCake = async (req, res, next) => {
  try {
    const { cakeId } = req.params;

    const ratings = await Rating.find({ cakeId }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: ratings.length,
      data: ratings,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Calculate average rating & count for a cake using MongoDB Aggregation Pipeline
// @route   GET /api/ratings/cake/:cakeId/average
// @access  Public
exports.getAverageRatingByCake = async (req, res, next) => {
  try {
    const { cakeId } = req.params;

    const stats = await Rating.aggregate([
      // Stage 1: Match all rating documents for the specified cakeId
      {
        $match: {
          cakeId: new mongoose.Types.ObjectId(cakeId),
        },
      },
      // Stage 2: Group matched ratings by cakeId and compute average & total count
      {
        $group: {
          _id: '$cakeId',
          averageRating: { $avg: '$stars' },
          totalRatings: { $sum: 1 },
        },
      },
      // Stage 3: Reshape output and round average to 1 decimal place
      {
        $project: {
          _id: 0,
          cakeId: '$_id',
          averageRating: { $round: ['$averageRating', 1] },
          totalRatings: 1,
        },
      },
    ]);

    // If no ratings exist for this cake yet, return default zero state
    if (stats.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          cakeId,
          averageRating: 0,
          totalRatings: 0,
        },
      });
    }

    res.status(200).json({
      success: true,
      data: stats[0],
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
    service: 'rating-service',
    status: isHealthy ? 'UP' : 'DOWN',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    database: {
      status: dbStates[dbState] || 'Unknown',
      connected: isHealthy,
    },
  });
};
