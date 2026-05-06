// import express from 'express'
// import {
//   createOrder,
//   getAllOrders,
//   getOrderById,
//   updateOrderStatus,
//   deleteOrder,
//   getOrdersByTable
// } from '../controllers/orderController.js'

// const router = express.Router()
// // Create Order
// router.post('/', createOrder)
// // Get All Orders
// router.get('/all', getAllOrders)
// // Get Order By Id
// router.get('/:id', getOrderById)
// // Update Order Status
// router.patch('/:id/status', updateOrderStatus)
// // Delete Order
// router.delete('/:id', deleteOrder)
// // Get Orders By Table
// router.get('/table/:tableId', getOrdersByTable)
// export default router

import express from 'express'
import {
  createOrder,
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  updateOrder,
  deleteOrder,
  getOrdersByTable,
} from '../controllers/orderController.js'
import { protect, checkPermission } from '../middlewares/authMiddleware.js'

const router = express.Router()

// Create order
router.post('/', protect, checkPermission('/orders', 'canAdd'), createOrder)

// Get all orders
router.get('/all', protect, checkPermission('/orders', 'canView'), getAllOrders)

// Get orders by table
router.get('/table/:tableId', protect, checkPermission('/orders', 'canView'), getOrdersByTable)

// Get order by id
router.get('/:id', protect, checkPermission('/orders', 'canView'), getOrderById)

// Update order status
router.patch('/:id/status', protect, checkPermission('/orders', 'canEdit'), updateOrderStatus)

// Update full order
router.put('/:id', protect, checkPermission('/orders', 'canEdit'), updateOrder)

// Delete order
router.delete('/:id', protect, checkPermission('/orders', 'canDelete'), deleteOrder)

export default router