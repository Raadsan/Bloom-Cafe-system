import express from 'express'
import {
  createIngredient,
  getAllIngredients,
  getIngredientById,
  updateIngredient,
  deleteIngredient
} from '../controllers/ingredientController.js'
import { protect, authorize } from '../middlewares/authMiddleware.js'

const router = express.Router()

router.post(
  '/',
  protect,
  authorize('admin', 'manager'),
  createIngredient
)

router.get(
  '/',
  protect,
  authorize('admin', 'manager', 'kitchen'),
  getAllIngredients
)

router.get(
  '/:id',
  protect,
  authorize('admin', 'manager', 'kitchen'),
  getIngredientById
)

router.put(
  '/:id',
  protect,
  authorize('admin', 'manager'),
  updateIngredient
)

router.delete(
  '/:id',
  protect,
  authorize('admin'),
  deleteIngredient
)

export default router