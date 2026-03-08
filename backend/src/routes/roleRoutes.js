// import express from 'express'
// import {
//   createRole,
//   getAllRoles,
//   updateRole,
//   deleteRole
// } from '../controllers/roleController.js'

// const router = express.Router()
// // create role
// router.post('/', createRole)
// // get all roles
// router.get('/', getAllRoles)
// // update role
// router.patch('/:id', updateRole)
// // delete role
// router.delete('/:id', deleteRole)

// export default router


import express from 'express'
import {
  createRole,
  getAllRoles,
  updateRole,
  deleteRole
} from '../controllers/roleController.js'
import { protect, authorize } from '../middlewares/authMiddleware.js'

const router = express.Router()

// Create role
router.post('/', protect, authorize('admin'), createRole)

// Get all roles
router.get('/', protect, authorize('admin'), getAllRoles)

// Update role
router.patch('/:id', protect, authorize('admin'), updateRole)

// Delete role
router.delete('/:id', protect, authorize('admin'), deleteRole)

export default router