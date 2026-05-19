import express from 'express';
import { 
  getMenusByRole, 
  seedDefaultMenus, 
  getAllMenus, 
  createMenu, 
  updateMenu, 
  deleteMenu, 
  createSubMenu, 
  updateSubMenu, 
  deleteSubMenu,
  updatePermissions
} from '../controllers/menuController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/permissions/:roleId', protect, getMenusByRole);
router.post('/permissions/:roleId', protect, updatePermissions);
router.get('/', protect, getAllMenus);
router.post('/', protect, createMenu);
router.put('/:id', protect, updateMenu);
router.delete('/:id', protect, deleteMenu);
router.post('/seed', protect, seedDefaultMenus);

// Submenu routes
router.post('/submenu', protect, createSubMenu);
router.put('/submenu/:id', protect, updateSubMenu);
router.delete('/submenu/:id', protect, deleteSubMenu);

export default router;
