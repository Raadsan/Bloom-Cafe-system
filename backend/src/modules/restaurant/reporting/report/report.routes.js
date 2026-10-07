import express from 'express'
import {
  getDashboardSummary,
  getDashboardInit,
  getRevenueReport,
  getTopSellingItems,
  getTablePerformanceReport,
  getDailyReport,
  getMonthlyReport,
  getStaffPerformanceReport,
  getFinanceReport,
  getWeeklyAnalytics,
  getOrdersReport,
  getClientsReport,
  clearReportCache
} from './report.controller.js'
import { runNightlyOrderClose } from '../../../../utils/nightlyOrderClose.js'
import { closeBusinessDay, getBusinessDayStatus } from '../../../../utils/businessDay.js'
import { protect, checkPermission } from '../../../../middlewares/authMiddleware.js'

const router = express.Router()

// Admin and Manager share the dashboard summary
router.get('/summary', protect, getDashboardSummary)
router.get('/dashboard-init', protect, getDashboardInit)
router.get('/revenue', protect, checkPermission('/report', 'canView'), getRevenueReport)
router.get('/top-items', protect, checkPermission('/report', 'canView'), getTopSellingItems)
router.get('/table-performance', protect, checkPermission('/report', 'canView'), getTablePerformanceReport)
router.get('/daily', protect, checkPermission('/report', 'canView'), getDailyReport)
router.get('/monthly', protect, checkPermission('/report', 'canView'), getMonthlyReport)
router.get('/staff-performance', protect, checkPermission('/report', 'canView'), getStaffPerformanceReport)
router.get('/finance', protect, checkPermission('/report', 'canView'), getFinanceReport)
router.get('/weekly', protect, checkPermission('/report', 'canView'), getWeeklyAnalytics)
router.get('/orders', protect, checkPermission('/report', 'canView'), getOrdersReport)
router.get('/clients', protect, checkPermission('/report', 'canView'), getClientsReport)

router.get('/business-day', protect, async (req, res) => {
  try {
    const data = await getBusinessDayStatus()
    return res.status(200).json({ success: true, data })
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message })
  }
})

router.post('/business-day/close', protect, async (req, res) => {
  try {
    const data = await closeBusinessDay(req.user?.id)
    clearReportCache()
    return res.status(200).json({ success: true, data })
  } catch (error) {
    return res.status(error.statusCode || 500).json({ success: false, message: error.message })
  }
})

// Manual trigger for nightly order close (admin only)
router.post('/nightly-close', protect, async (req, res) => {
  try {
    const role = req.user?.role?.toLowerCase()
    if (role !== 'admin' && role !== 'manager') {
      return res.status(403).json({ success: false, message: 'Access denied' })
    }
    const result = await runNightlyOrderClose()
    return res.status(200).json({ success: true, data: result })
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message })
  }
})

export default router
