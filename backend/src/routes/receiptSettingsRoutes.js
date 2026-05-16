import express from 'express'
import { getReceiptSettings, updateReceiptSettings } from '../controllers/receiptSettingsController.js'
import { protect, authorize } from '../middlewares/authMiddleware.js'

const router = express.Router()

router.get('/', getReceiptSettings)
router.patch('/', protect, authorize('admin', 'Admin'), updateReceiptSettings)

export default router
