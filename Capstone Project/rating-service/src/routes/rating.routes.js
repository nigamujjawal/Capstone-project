const express = require('express');
const { body, param } = require('express-validator');
const ratingController = require('../controllers/rating.controller');
const validate = require('../middleware/validate');

const router = express.Router();

// Validation chain for POST /api/ratings
const createRatingValidation = [
  body('cakeId')
    .isMongoId()
    .withMessage('Valid Mongo cakeId is required'),
  body('userId')
    .trim()
    .notEmpty()
    .withMessage('userId is required'),
  body('stars')
    .isInt({ min: 1, max: 5 })
    .withMessage('stars must be an integer between 1 and 5'),
  body('comment')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Comment must not exceed 500 characters'),
  validate,
];

// Validation chain for cakeId route parameters
const cakeIdValidation = [
  param('cakeId')
    .isMongoId()
    .withMessage('Valid Mongo cakeId parameter is required'),
  validate,
];

// Health route
router.get('/health', ratingController.healthCheck);

// Rating resource routes
router.post('/api/ratings', createRatingValidation, ratingController.createRating);
router.get('/api/ratings/cake/:cakeId', cakeIdValidation, ratingController.getRatingsByCake);
router.get('/api/ratings/cake/:cakeId/average', cakeIdValidation, ratingController.getAverageRatingByCake);

module.exports = router;
