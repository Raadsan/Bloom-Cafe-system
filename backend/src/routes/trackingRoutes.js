import express from 'express';
import { trackingController } from '../controllers/trackingController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/all', protect, trackingController.getAllLogs);

export default router;
