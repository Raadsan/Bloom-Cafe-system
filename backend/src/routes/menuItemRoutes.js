// import express from 'express'
// import {
//   createMenuItem,
//   getAllMenuItems,
//   getMenuItemsByCategory,
//   updateMenuItem,
//   deleteMenuItem
// } from '../controllers/menuItemController.js'

// const router = express.Router()
// // Create Menu Item
// router.post('/', createMenuItem)
// // Get All Menu Items
// router.get('/all', getAllMenuItems)
// // Get Menu Items By Category
// router.get('/category/:categoryId', getMenuItemsByCategory)
// // Update Menu Item
// router.patch('/:id', updateMenuItem)
// // Delete Menu Item
// router.delete('/:id', deleteMenuItem)

// export default router

import express from 'express'
import {
  createMenuItem,
  getAllMenuItems,
  getMenuItemsByCategory,
  updateMenuItem,
  deleteMenuItem
} from '../controllers/menuItemController.js'
import { protect, authorize } from '../middlewares/authMiddleware.js'

const router = express.Router()

// Create menu item
router.post('/', protect, authorize('admin', 'manager'), createMenuItem)

// Get all menu items
router.get('/all', protect, authorize('admin', 'manager', 'kitchen', 'waiter'), getAllMenuItems)

// Get menu items by category
router.get('/category/:categoryId', protect, authorize('admin', 'manager', 'kitchen', 'waiter'), getMenuItemsByCategory)

// Update menu item
router.patch('/:id', protect, authorize('admin', 'manager'), updateMenuItem)

// Delete menu item
router.delete('/:id', protect, authorize('admin'), deleteMenuItem)

export default router