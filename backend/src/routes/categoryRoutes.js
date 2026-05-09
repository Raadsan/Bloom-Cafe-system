// import express from 'express'
// import {
//   createCategory,
//   getAllCategories,
//   updateCategory,
//   deleteCategory,
//   getCategoriesWithItems,
//   getCategoryByIdWithItems
// } from '../controllers/categoryController.js'

// const router = express.Router()
// // Create Category
// router.post('/', createCategory)
// // Get All Categories
// router.get('/all', getAllCategories)
// // Update Category
// router.patch('/:id', updateCategory)
// // Delete Category
// router.delete('/:id', deleteCategory)
// // Get Categories With Items
// router.get('/with-items', getCategoriesWithItems)
// // Get Category By Id With Items
// router.get('/:id/with-items', getCategoryByIdWithItems)

// export default router

import express from 'express'
import {
  createCategory,
  getAllCategories,
  updateCategory,
  deleteCategory,
  getCategoriesWithItems,
  getCategoryByIdWithItems
} from '../controllers/categoryController.js'
import { protect, checkPermission } from '../middlewares/authMiddleware.js'

const router = express.Router()

// Create category
router.post('/', protect, checkPermission('/menu/categories', 'canAdd'), createCategory)

// Get all categories
// router.get('/all', protect, checkPermission('/menu/categories', 'canView'), getAllCategories)
router.get('/all',getAllCategories)

// Get categories with items
router.get('/with-items', protect, checkPermission('/menu/categories', 'canView'), getCategoriesWithItems)

// Get category by id with items
router.get('/:id/with-items', protect, checkPermission('/menu/categories', 'canView'), getCategoryByIdWithItems)

// Update category
router.patch('/:id', protect, checkPermission('/menu/categories', 'canEdit'), updateCategory)

// Delete category
router.delete('/:id', protect, checkPermission('/menu/categories', 'canDelete'), deleteCategory)

export default router