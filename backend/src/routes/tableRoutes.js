// import express from 'express';
// import { createTable, updateTable, deleteTable, getAllTables } from '../controllers/tableController.js';

// const router = express.Router();
// // Create Table
// router.post('/', createTable);
// // Update Table
// router.patch('/:id', updateTable);
// // Delete Table
// router.delete('/:id', deleteTable);
// // Get All Tables
// router.get('/all', getAllTables);

// export default router;

import express from 'express'
import {
  createTable,
  updateTable,
  deleteTable,
  getAllTables
} from '../controllers/tableController.js'
import { protect, authorize } from '../middlewares/authMiddleware.js'

const router = express.Router()

// Create table
router.post('/', protect, authorize('admin', 'manager'), createTable)

// Get all tables
router.get('/all', protect, authorize('admin', 'manager', 'waiter'), getAllTables)

// Update table
router.patch('/:id', protect, authorize('admin', 'manager'), updateTable)

// Delete table
router.delete('/:id', protect, authorize('admin'), deleteTable)

export default router