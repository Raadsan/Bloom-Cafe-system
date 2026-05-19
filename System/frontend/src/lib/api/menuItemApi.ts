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
  categoryId?: number;
}

export const menuItemApi = {
  createMenuItem: async (payload: CreateMenuItemPayload): Promise<MenuItem> => {
    const { data } = await api.post<{ success: boolean; data: MenuItem }>('/menu-items', payload);
    return data.data;
  },

  getAllMenuItems: async (): Promise<MenuItem[]> => {
    const { data } = await api.get<{ success: boolean; data: MenuItem[] }>('/menu-items/all');
    return data.data;
  },

  getMenuItemsByCategory: async (categoryId: number): Promise<MenuItem[]> => {
    const { data } = await api.get<{ success: boolean; data: MenuItem[] }>(`/menu-items/category/${categoryId}`);
    return data.data;
  },

  updateMenuItem: async (id: number, payload: UpdateMenuItemPayload): Promise<MenuItem> => {
    const { data } = await api.patch<{ success: boolean; data: MenuItem }>(`/menu-items/${id}`, payload);
    return data.data;
  },

  deleteMenuItem: async (id: number): Promise<void> => {
    await api.delete(`/menu-items/${id}`);
  },

  /** PUBLIC – customer scans QR → gets full menu (no auth needed). */
  getPublicMenuByQrCode: async (qrCode: string): Promise<MenuItem[]> => {
    const { data } = await api.get<{ success: boolean; data: MenuItem[] }>(`/menu-items/menu/${qrCode}`);
    return data.data;
  },
};
