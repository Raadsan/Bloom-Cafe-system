import express from 'express'
import { login, getMe, register, updateProfile, forgotPassword, resetPassword, logout } from '../controllers/authController.js'
import { protect } from '../middlewares/authMiddleware.js'

const router = express.Router()

router.post('/login', login)
router.post('/register', register)
router.post('/forgot-password', forgotPassword)
router.post('/reset-password', resetPassword)
router.post('/logout', protect, logout)
router.get('/me', protect, getMe)
router.patch('/update-profile', protect, updateProfile)

export default router