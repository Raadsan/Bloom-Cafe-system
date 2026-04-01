import express from 'express'
import {
  getDashboardSummary,
  getRevenueReport,
  getTopSellingItems,
  getTablePerformanceReport,
  getDailyReport,
  getMonthlyReport,
  getStaffPerformanceReport
} from '../controllers/reportController.js'
import { protect, authorize } from '../middlewares/authMiddleware.js'

const router = express.Router()

router.get(
  '/summary',
  protect,
  authorize('admin', 'manager'),
  getDashboardSummary
)

router.get(
  '/revenue',
  protect,
  authorize('admin', 'manager'),
  getRevenueReport
)

router.get(
  '/top-items',
  protect,
  authorize('admin', 'manager'),
  getTopSellingItems
)

router.get(
  '/table-performance',
  protect,
  authorize('admin', 'manager'),
  getTablePerformanceReport
)
router.get(
  '/daily',
  protect,
  authorize('admin', 'manager'),
  getDailyReport
)

router.get(
  '/monthly',
  protect,
  authorize('admin', 'manager'),
  getMonthlyReport
)

router.get(
  '/staff-performance',
  protect,
  authorize('admin', 'manager'),
  getStaffPerformanceReport
)

export default router