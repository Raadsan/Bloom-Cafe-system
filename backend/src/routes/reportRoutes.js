import express from 'express'
import {
  getDashboardSummary,
  getRevenueReport,
  getTopSellingItems,
  getTablePerformanceReport,
  getDailyReport,
  getMonthlyReport,
  getStaffPerformanceReport,
  getFinanceReport,
  getOrdersReport,
  getClientsReport
} from '../controllers/reportController.js'
import { protect, checkPermission } from '../middlewares/authMiddleware.js'

const router = express.Router()

router.get('/summary', protect, checkPermission('/reports', 'canView'), getDashboardSummary)
router.get('/revenue', protect, checkPermission('/reports', 'canView'), getRevenueReport)
router.get('/top-items', protect, checkPermission('/reports', 'canView'), getTopSellingItems)
router.get('/table-performance', protect, checkPermission('/reports', 'canView'), getTablePerformanceReport)
router.get('/daily', protect, checkPermission('/reports', 'canView'), getDailyReport)
router.get('/monthly', protect, checkPermission('/reports', 'canView'), getMonthlyReport)
router.get('/staff-performance', protect, checkPermission('/reports', 'canView'), getStaffPerformanceReport)
router.get('/finance', protect, checkPermission('/reports', 'canView'), getFinanceReport)
router.get('/orders', protect, checkPermission('/reports', 'canView'), getOrdersReport)
router.get('/clients', protect, checkPermission('/reports', 'canView'), getClientsReport)

export default router