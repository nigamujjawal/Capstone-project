const express = require('express');
const { body, param, query } = require('express-validator');
const cakeController = require('../controllers/cake.controller');
const validate = require('../middleware/validate');

const router = express.Router();

// Validation chains for POST /api/cakes
const createCakeValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Cake name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('description')
    .trim()
    .notEmpty()
    .withMessage('Description is required'),
  body('category')
    .isIn(['Chocolate', 'Fruity', 'Cheesecake', 'Custom', 'Vegan', 'Vanilla'])
    .withMessage('Invalid category specified'),
  body('price')
    .isFloat({ min: 0 })
    .withMessage('Price must be a non-negative number'),
  body('imageUrl')
    .optional()
    .isURL()
    .withMessage('Image URL must be a valid URL'),
  validate,
];

// Validation chain for GET /api/cakes/:id
const getCakeByIdValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid Cake ID format'),
  validate,
];

// Health route
router.get('/health', cakeController.healthCheck);

// Cake resource routes
router.get('/api/cakes', cakeController.getCakes);
router.get('/api/cakes/:id', getCakeByIdValidation, cakeController.getCakeById);
router.post('/api/cakes', createCakeValidation, cakeController.createCake);

module.exports = router;
