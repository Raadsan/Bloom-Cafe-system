import express from 'express'
import {
  createRoom,
  getAllRooms,
  getRoomById,
  updateRoom,
  deleteRoom
} from '../controllers/roomController.js'
import { protect, checkPermission } from '../middlewares/authMiddleware.js'

const router = express.Router()

router.get('/all', protect, getAllRooms)
router.get('/:id', protect, checkPermission('/rooms', 'canView'), getRoomById)
router.post('/', protect, checkPermission('/rooms', 'canAdd'), createRoom)
router.patch('/:id', protect, checkPermission('/rooms', 'canEdit'), updateRoom)
router.delete('/:id', protect, checkPermission('/rooms', 'canDelete'), deleteRoom)

export default router
