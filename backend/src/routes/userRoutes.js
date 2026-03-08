// import express from 'express';
// const router = express.Router();
// import { createUser, updateUser, getAllUsers, deleteUser, getUsersByRole } from '../controllers/userController.js';

// // Create user
// router.post('/', createUser);
// // Update user
// router.patch('/:id', updateUser);
// // GET ALL USERS
// router.get('/', getAllUsers);
// // DELETE USER
// router.delete('/:id', deleteUser);
// // GET USERS BY ROLE
// router.get('/role/:role', getUsersByRole);

// export default router;

import express from 'express'
import {
  createUser,
  updateUser,
  getAllUsers,
  deleteUser,
  getUsersByRole
} from '../controllers/userController.js'
import { protect, authorize } from '../middlewares/authMiddleware.js'

const router = express.Router()

// Create user
router.post('/', protect, authorize('admin'), createUser)

// Get all users
router.get('/', protect, authorize('admin', 'manager'), getAllUsers)

// Get users by role
router.get('/role/:roleId', protect, authorize('admin', 'manager'), getUsersByRole)

// Update user
router.patch('/:id', protect, authorize('admin', 'manager'), updateUser)

// Delete user
router.delete('/:id', protect, authorize('admin'), deleteUser)

export default router