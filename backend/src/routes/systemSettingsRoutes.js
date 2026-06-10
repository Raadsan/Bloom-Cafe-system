import express from 'express'
import { getSystemSettings, updateSystemSettings } from '../controllers/systemSettingsController.js'
import { protect, authorize } from '../middlewares/authMiddleware.js'

const router = express.Router()

router.get('/', getSystemSettings)
router.patch('/', protect, authorize('admin', 'Admin'), updateSystemSettings)

export default router
