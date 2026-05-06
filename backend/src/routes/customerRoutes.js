import express from 'express'
import {
  createCustomer,
  getAllCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer
} from '../controllers/customerController.js'
import { protect, authorize } from '../middlewares/authMiddleware.js'

const router = express.Router()

router.post(
  '/',
  protect,
  authorize('admin', 'manager'),
  createCustomer
)

router.get(
  '/all',
  protect,
  authorize('admin', 'manager', 'kitchen'),
  getAllCustomers
)

router.get(
  '/:id',
  protect,
  authorize('admin', 'manager', 'kitchen'),
  getCustomerById
)

router.put(
  '/:id',
  protect,
  authorize('admin', 'manager'),
  updateCustomer
)

router.delete(
  '/:id',
  protect,
  authorize('admin'),
  deleteCustomer
)

export default router
