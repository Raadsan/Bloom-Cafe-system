import api from './axios';

export interface MenuItem {
  id: number;
  name: string;
  description?: string;
  costPrice?: number;
  price: number;
  tax: number;
  imageUrl?: string;
  isAvailable: boolean;
  isRecommended: boolean;
  categoryId: number;
  category?: { id: number; name: string };
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateMenuItemPayload {
  name: string;
  description?: string;
  costPrice?: number;
  price: number;
  tax?: number;
  imageUrl?: string;
  isAvailable?: boolean;
  isRecommended?: boolean;
  categoryId: number;
}

export interface UpdateMenuItemPayload {
  name?: string;
  description?: string;
  costPrice?: number;
  price?: number;
  tax?: number;
  imageUrl?: string;
  isAvailable?: boolean;
  isRecommended?: boolean;
  categoryId?: number;
}

export const menuItemApi = {
  createMenuItem: async (payload: CreateMenuItemPayload): Promise<MenuItem> => {
    const res = await api.post('/menu-items', payload);
    return res.data.data;
  },

  getAllMenuItems: async (): Promise<MenuItem[]> => {
    const res = await api.get('/menu-items/all');
    return res.data.data || [];
  },

  getMenuItemsByCategory: async (categoryId: number): Promise<MenuItem[]> => {
    const res = await api.get(`/menu-items/category/${categoryId}`);
    return res.data.data || [];
  },

  updateMenuItem: async (id: number, payload: UpdateMenuItemPayload): Promise<MenuItem> => {
    const res = await api.patch(`/menu-items/${id}`, payload);
    return res.data.data;
  },

  deleteMenuItem: async (id: number): Promise<void> => {
    await api.delete(`/menu-items/${id}`);
  },

  /** PUBLIC – customer scans QR → gets full menu (no auth needed). */
  getPublicMenuByQrCode: async (qrCode: string): Promise<MenuItem[]> => {
    const res = await api.get(`/menu-items/menu/${qrCode}`);
    return res.data.data || [];
  },
};
