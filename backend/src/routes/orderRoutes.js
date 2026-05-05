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
  // createPublicOrder
} from '../controllers/orderController.js'
import { protect, authorize } from '../middlewares/authMiddleware.js'

const router = express.Router()

// Create order
router.post('/', protect, authorize('admin', 'manager', 'waiter'), createOrder)

// Get all orders
router.get('/all', protect, authorize('admin', 'manager', 'kitchen', 'waiter'), getAllOrders)

// Get orders by table
router.get('/table/:tableId', protect, authorize('admin', 'manager', 'kitchen', 'waiter'), getOrdersByTable)

// Get order by id
router.get('/:id', protect, authorize('admin', 'manager', 'kitchen', 'waiter'), getOrderById)

// Update order status
router.patch('/:id/status', protect, authorize('admin', 'manager', 'kitchen', 'waiter'), updateOrderStatus)

// Update full order
router.put('/:id', protect, authorize('admin', 'manager'), updateOrder)

// Delete order
router.delete('/:id', protect, authorize('admin', 'manager'), deleteOrder)

// Customer creates order
// router.post('/customer_orders', createPublicOrder)

export default router