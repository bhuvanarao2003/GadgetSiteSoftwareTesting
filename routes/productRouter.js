const express = require('express');
const router = express.Router();
const CartItem = require('../models/Products'); // Import your CartItem model

// POST route to add a product to cart
router.post('/add/:productId', async (req, res) => {
  const { productId } = req.params;

  try {
    // Example: Create a new cart item and save it to the database
    const cartItem = new CartItem({ productId });
    await cartItem.save();

    res.status(201).json({ message: 'Product added to cart successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to add product to cart' });
  }
});

module.exports = router;
