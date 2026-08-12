const Basket = require('../models/basket.model');
const { getCakeDetails } = require('../services/catalogClient');

// @desc    Add item to basket (fetches price & name from Catalog service over HTTP)
// @route   POST /api/basket/:userId/items
// @access  Public
exports.addItemToBasket = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { cakeId, quantity } = req.body;
    const qty = Number(quantity) || 1;

    // Fetch real cake details from Catalog service over HTTP (NEVER trust client prices!)
    const cake = await getCakeDetails(cakeId);

    if (!cake.isAvailable) {
      return res.status(400).json({
        success: false,
        error: 'Cake Out of Stock',
        message: `'${cake.name}' is currently unavailable for purchase.`,
      });
    }

    let basket = await Basket.findOne({ userId });

    if (!basket) {
      basket = new Basket({ userId, items: [] });
    }

    // Check if cake already exists in user basket
    const existingIndex = basket.items.findIndex((item) => item.cakeId === cakeId);

    if (existingIndex > -1) {
      // Update quantity and unit price (to reflect latest price)
      basket.items[existingIndex].quantity += qty;
      basket.items[existingIndex].unitPrice = cake.price;
      basket.items[existingIndex].cakeName = cake.name;
    } else {
      // Add new item
      basket.items.push({
        cakeId: cake._id.toString(),
        cakeName: cake.name,
        unitPrice: cake.price,
        quantity: qty,
      });
    }

    await basket.save();

    res.status(200).json({
      success: true,
      message: 'Item added to basket',
      data: basket,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    View user basket with item line totals & grand total
// @route   GET /api/basket/:userId
// @access  Public
exports.getBasket = async (req, res, next) => {
  try {
    const { userId } = req.params;

    let basket = await Basket.findOne({ userId });

    if (!basket) {
      basket = {
        userId,
        items: [],
        grandTotal: 0,
      };
    }

    res.status(200).json({
      success: true,
      data: basket,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update item quantity in basket
// @route   PUT /api/basket/:userId/items/:cakeId
// @access  Public
exports.updateItemQuantity = async (req, res, next) => {
  try {
    const { userId, cakeId } = req.params;
    const { quantity } = req.body;
    const qty = Number(quantity);

    const basket = await Basket.findOne({ userId });

    if (!basket) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: `Basket not found for user '${userId}'`,
      });
    }

    const itemIndex = basket.items.findIndex((item) => item.cakeId === cakeId);

    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: `Item with cakeId '${cakeId}' not found in basket`,
      });
    }

    if (qty <= 0) {
      // Remove item if quantity updated to 0 or less
      basket.items.splice(itemIndex, 1);
    } else {
      basket.items[itemIndex].quantity = qty;
    }

    await basket.save();

    res.status(200).json({
      success: true,
      message: 'Basket item quantity updated',
      data: basket,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Remove item from basket
// @route   DELETE /api/basket/:userId/items/:cakeId
// @access  Public
exports.removeItemFromBasket = async (req, res, next) => {
  try {
    const { userId, cakeId } = req.params;

    const basket = await Basket.findOne({ userId });

    if (!basket) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: `Basket not found for user '${userId}'`,
      });
    }

    basket.items = basket.items.filter((item) => item.cakeId !== cakeId);

    await basket.save();

    res.status(200).json({
      success: true,
      message: 'Item removed from basket',
      data: basket,
    });
  } catch (error) {
    next(error);
  }
};
