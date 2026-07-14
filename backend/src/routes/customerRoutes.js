import express from 'express'
import {
  createCustomer,
  getAllCustomers,
  getPosCustomers,
  getCustomerByPhone,
  getCustomerById,
  updateCustomer,
  deleteCustomer
} from '../controllers/customerController.js'
import { protect, checkPermission } from '../middlewares/authMiddleware.js'

const router = express.Router()

const allowPosOrClientAdd = (req, res, next) => {
  if (req.user && req.user.role.toLowerCase() === 'pos') {
    return next();
  }
  return checkPermission('/clients', 'canAdd')(req, res, next);
};

router.post('/', protect, allowPosOrClientAdd, createCustomer)
router.get('/all', protect, getAllCustomers)
router.get('/pos-list', protect, getPosCustomers)
router.get('/by-phone/:phone', protect, getCustomerByPhone)
router.get('/:id', protect, checkPermission('/clients', 'canView'), getCustomerById)
router.put('/:id', protect, checkPermission('/clients', 'canEdit'), updateCustomer)
router.delete('/:id', protect, checkPermission('/clients', 'canDelete'), deleteCustomer)

export default router
