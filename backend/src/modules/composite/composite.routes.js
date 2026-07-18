import express from 'express'
import {
  getAllComposites,
  getComboFormData,
  getCompositeById,
  createComposite,
  updateComposite,
  deleteComposite,
} from './composite.controller.js'
import { protect, checkPermission } from '../../middlewares/authMiddleware.js'

const router = express.Router()

router.get('/', protect, getAllComposites)
router.get('/form-data', protect, getComboFormData)
router.get('/:id', protect, getCompositeById)
router.post('/', protect, checkPermission('/menus', 'canAdd'), createComposite)
router.put('/:id', protect, checkPermission('/menus', 'canEdit'), updateComposite)
router.delete('/:id', protect, checkPermission('/menus', 'canDelete'), deleteComposite)

export default router
