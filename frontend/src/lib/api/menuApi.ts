import api from './axios';

export interface MenuPermission {
  canView: boolean;
  canAdd: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

export interface SubMenu {
  id: number;
  title: string;
  url: string;
  order: number;
  permissions: MenuPermission;
  isActive?: boolean;
}

export interface Menu {
  id: number;
  title: string;
  url: string;
  icon: string;
  order: number;
  permissions: MenuPermission;
  items?: SubMenu[];
  isActive?: boolean;
}

export const menuApi = {
  getMenusByRole: async (roleId: number): Promise<Menu[]> => {
    const res = await api.get(`/menus/permissions/${roleId}`);
    return res.data.data || [];
  },

  clearMenuCache: (_roleId?: number) => {
    // No-op — backend is source of truth
  },

  getAllMenus: async (): Promise<Menu[]> => {
    const res = await api.get('/menus');
    return res.data.data || [];
  },

  createMenu: async (data: Partial<Menu>) => {
    const res = await api.post('/menus', data);
    return { success: true, data: res.data.data };
  },

  updateMenu: async (id: number, data: Partial<Menu>) => {
    const res = await api.put(`/menus/${id}`, data);
    return { success: true, data: res.data.data };
  },

  deleteMenu: async (id: number) => {
    await api.delete(`/menus/${id}`);
    return { success: true, message: 'Menu deleted' };
  },

  createSubMenu: async (data: { menuId: number; title: string; url: string; order?: number }) => {
    const res = await api.post('/menus/submenu', data);
    return { success: true, data: res.data.data };
  },

  updateSubMenu: async (id: number, data: { title?: string; url?: string; order?: number; isActive?: boolean }) => {
    const res = await api.put(`/menus/submenu/${id}`, data);
    return { success: true, data: res.data.data };
  },

  deleteSubMenu: async (id: number) => {
    await api.delete(`/menus/submenu/${id}`);
    return { success: true, message: 'Submenu deleted' };
  },

  seedMenus: async (): Promise<{ success: boolean; message: string }> => {
    const res = await api.post('/menus/seed');
    return res.data;
  },

  updatePermissions: async (roleId: number, permissions: any[]): Promise<{ success: boolean; message: string }> => {
    const res = await api.post(`/menus/permissions/${roleId}`, { permissions });
    return res.data;
  }
};
