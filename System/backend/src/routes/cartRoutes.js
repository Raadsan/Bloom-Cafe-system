import express from 'express'
import {
  getOrCreateCart,
  addToCart,
  getCart,
  removeCartItem,
  clearCart,
  checkoutCart
} from '../controllers/cartController.js'

const router = express.Router()

/**
 * PUBLIC CART ROUTES (QR CUSTOMER FLOW)
 * No authentication required
 */

// 1. Create or get active cart (by tableId)
router.post('/create', getOrCreateCart)

// 2. Add item to cart
router.post('/add', addToCart)

// 3. Get cart by ID
router.get('/:id', getCart)

// 4. Remove single item from cart
router.delete('/item/:id', removeCartItem)

// 5. Clear entire cart
router.delete('/clear/:cartId', clearCart)

// 6. Checkout cart → create order
router.post('/checkout', checkoutCart)

export default router