const express = require('express');
const { body, param } = require('express-validator');
const basketController = require('../controllers/basket.controller');
const validate = require('../middleware/validate');

const router = express.Router();

// Validation chains
const addItemValidation = [
  param('userId').trim().notEmpty().withMessage('userId is required'),
  body('cakeId').trim().notEmpty().withMessage('cakeId is required'),
  body('quantity').optional().isInt({ min: 1 }).withMessage('quantity must be at least 1'),
  validate,
];

const updateQuantityValidation = [
  param('userId').trim().notEmpty().withMessage('userId is required'),
  param('cakeId').trim().notEmpty().withMessage('cakeId is required'),
  body('quantity').isInt({ min: 0 }).withMessage('quantity must be a non-negative integer'),
  validate,
];

const userIdParamValidation = [
  param('userId').trim().notEmpty().withMessage('userId is required'),
  validate,
];

// Basket Routes
router.post('/api/basket/:userId/items', addItemValidation, basketController.addItemToBasket);
router.get('/api/basket/:userId', userIdParamValidation, basketController.getBasket);
router.put('/api/basket/:userId/items/:cakeId', updateQuantityValidation, basketController.updateItemQuantity);
router.delete('/api/basket/:userId/items/:cakeId', basketController.removeItemFromBasket);

module.exports = router;
