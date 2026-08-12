const Cake = require('../models/cake.model');
const mongoose = require('mongoose');

// @desc    Get all cakes with optional filtering
// @route   GET /api/cakes
// @access  Public
exports.getCakes = async (req, res, next) => {
  try {
    const { name, category, minPrice, maxPrice } = req.query;
    const filter = {};

    // Filter by name (case-insensitive substring search)
    if (name) {
      filter.name = { $regex: name, $options: 'i' };
    }

    // Filter by category
    if (category) {
      filter.category = category;
    }

    // Filter by price range
    if (minPrice !== undefined || maxPrice !== undefined) {
      filter.price = {};
      if (minPrice !== undefined && minPrice !== '') {
        filter.price.$gte = Number(minPrice);
      }
      if (maxPrice !== undefined && maxPrice !== '') {
        filter.price.$lte = Number(maxPrice);
      }
    }

    const cakes = await Cake.find(filter).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: cakes.length,
      data: cakes,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single cake by ID
// @route   GET /api/cakes/:id
// @access  Public
exports.getCakeById = async (req, res, next) => {
  try {
    const cake = await Cake.findById(req.params.id);

    if (!cake) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: `Cake with ID '${req.params.id}' not found`,
      });
    }

    res.status(200).json({
      success: true,
      data: cake,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new cake
// @route   POST /api/cakes
// @access  Admin/Internal
exports.createCake = async (req, res, next) => {
  try {
    const cake = await Cake.create(req.body);

    res.status(201).json({
      success: true,
      message: 'Cake created successfully',
      data: cake,
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
    service: 'catalog-service',
    status: isHealthy ? 'UP' : 'DOWN',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    database: {
      status: dbStates[dbState] || 'Unknown',
      connected: isHealthy,
    },
  });
};
