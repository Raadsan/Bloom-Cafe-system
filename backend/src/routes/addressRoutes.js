import express from 'express'
import {
  getCustomerAddresses,
  createAddress,
  setDefaultAddress,
  deleteAddress
} from '../controllers/addressController.js'

const router = express.Router()

router.get('/customer/:customerId', getCustomerAddresses)
router.post('/', createAddress)
router.patch('/:id/default', setDefaultAddress)
router.delete('/:id', deleteAddress)

export default router
