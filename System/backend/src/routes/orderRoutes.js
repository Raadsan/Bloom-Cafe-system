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

// Create order — accessible to any logged-in user (needed by POS)
router.post('/', protect, createOrder)

// Get all orders (Accessible to any logged-in user for POS retrieval)
router.get('/all', protect, getAllOrders)

// Get orders by table
router.get('/table/:tableId', protect, checkPermission('/orders', 'canView'), getOrdersByTable)

// Get order by id
router.get('/:id', protect, checkPermission('/orders', 'canView'), getOrderById)

// Update order status
router.patch('/:id/status', protect, checkPermission('/orders', 'canEdit'), updateOrderStatus)

// Update full order
router.put('/:id', protect, checkPermission('/orders', 'canEdit'), updateOrder)

// Delete order (Accessible to any logged-in user to allow resuming held orders)
router.delete('/:id', protect, deleteOrder)

export default router