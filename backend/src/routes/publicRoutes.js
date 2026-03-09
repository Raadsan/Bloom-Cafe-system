import express from 'express'
import { getPublicMenuByQrCode, createPublicOrder } from '../controllers/publicController.js'

const router = express.Router()

// Customer scans QR and gets menu
router.get('/menu/:qrCode', getPublicMenuByQrCode)

// Customer creates order
router.post('/orders', createPublicOrder)

export default router