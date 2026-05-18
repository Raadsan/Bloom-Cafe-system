import express from 'express'
import {
  createCustomer,
  getAllCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer
} from '../controllers/customerController.js'
import { protect, checkPermission } from '../middlewares/authMiddleware.js'

const router = express.Router()

router.post('/', protect, checkPermission('/clients', 'canAdd'), createCustomer)
router.get('/all', protect, getAllCustomers)
router.get('/:id', protect, checkPermission('/clients', 'canView'), getCustomerById)
router.put('/:id', protect, checkPermission('/clients', 'canEdit'), updateCustomer)
router.delete('/:id', protect, checkPermission('/clients', 'canDelete'), deleteCustomer)

export default router
