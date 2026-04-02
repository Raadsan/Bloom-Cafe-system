import express from 'express'
import {
  createStockMovement,
  getAllStockMovements,
  getStockMovementById,
  getStockMovementsByIngredient,
  deleteStockMovement
} from '../controllers/stockMovementController.js'
import { protect, authorize } from '../middlewares/authMiddleware.js'

const router = express.Router()

router.post(
  '/',
  protect,
  authorize('admin', 'manager'),
  createStockMovement
)

router.get(
  '/all',
  protect,
  authorize('admin', 'manager', 'kitchen'),
  getAllStockMovements
)

router.get(
  '/ingredient/:ingredientId',
  protect,
  authorize('admin', 'manager', 'kitchen'),
  getStockMovementsByIngredient
)

router.get(
  '/:id',
  protect,
  authorize('admin', 'manager', 'kitchen'),
  getStockMovementById
)

router.delete(
  '/:id',
  protect,
  authorize('admin'),
  deleteStockMovement
)

export default router