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

const router = express.Router();

router.get('/permissions/:roleId', getMenusByRole);
router.post('/permissions/:roleId', updatePermissions);
router.get('/', getAllMenus);
router.post('/', createMenu);
router.put('/:id', updateMenu);
router.delete('/:id', deleteMenu);
router.post('/seed', seedDefaultMenus);

// Submenu routes
router.post('/submenu', createSubMenu);
router.put('/submenu/:id', updateSubMenu);
router.delete('/submenu/:id', deleteSubMenu);

export default router;
