import express from 'express'
import {
  createPayment,
  createPublicPayment,
  confirmPublicPayment,
  getAllPayments,
  getPaymentById,
  getPaymentByOrderId,
  updatePaymentStatus,
  deletePayment
} from '../controllers/paymentController.js'
import { protect, authorize } from '../middlewares/authMiddleware.js'

const router = express.Router()

// PUBLIC ROUTES
router.post('/pay', createPublicPayment)
router.patch('/pay/:id/confirm', confirmPublicPayment)

// PROTECTED ROUTES
router.post(
  '/',
  protect,
  authorize('admin', 'manager', 'cashier'),
  createPayment
)

router.get(
  '/',
  protect,
  authorize('admin', 'manager', 'cashier'),
  getAllPayments
)

router.get(
  '/order/:orderId',
  protect,
  authorize('admin', 'manager', 'cashier'),
  getPaymentByOrderId
)

router.get(
  '/:id',
  protect,
  authorize('admin', 'manager', 'cashier'),
  getPaymentById
)

router.patch(
  '/:id/status',
  protect,
  authorize('admin', 'manager'),
  updatePaymentStatus
)

router.delete(
  '/:id',
  protect,
  authorize('admin'),
  deletePayment
)

export default router