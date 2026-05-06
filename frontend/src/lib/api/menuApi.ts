import axiosInstance from './axios';

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
}

export interface Menu {
  id: number;
  title: string;
  url: string;
  icon: string;
  order: number;
  permissions: MenuPermission;
  items?: SubMenu[];
}

export const menuApi = {
  getMenusByRole: async (roleId: number): Promise<Menu[]> => {
    const response = await axiosInstance.get(`/menus/permissions/${roleId}`);
    return response.data.data;
  },
  
  getAllMenus: async (): Promise<Menu[]> => {
    const response = await axiosInstance.get('/menus');
    return response.data.data;
  },

  createMenu: async (data: Partial<Menu>) => {
    const response = await axiosInstance.post('/menus', data);
    return response.data;
  },

  updateMenu: async (id: number, data: Partial<Menu>) => {
    const response = await axiosInstance.put(`/menus/${id}`, data);
    return response.data;
  },

  deleteMenu: async (id: number) => {
    const response = await axiosInstance.delete(`/menus/${id}`);
    return response.data;
  },

  createSubMenu: async (data: { menuId: number; title: string; url: string; order?: number }) => {
    const response = await axiosInstance.post('/menus/submenu', data);
    return response.data;
  },

  updateSubMenu: async (id: number, data: { title?: string; url?: string; order?: number; isActive?: boolean }) => {
    const response = await axiosInstance.put(`/menus/submenu/${id}`, data);
    return response.data;
  },

  deleteSubMenu: async (id: number) => {
    const response = await axiosInstance.delete(`/menus/submenu/${id}`);
    return response.data;
  },
  
  seedMenus: async (): Promise<{success: boolean, message: string}> => {
    const response = await axiosInstance.post('/menus/seed');
    return response.data;
  },

  updatePermissions: async (roleId: number, permissions: any[]): Promise<{success: boolean, message: string}> => {
    const response = await axiosInstance.post(`/menus/permissions/${roleId}`, { permissions });
    return response.data;
  }
};
