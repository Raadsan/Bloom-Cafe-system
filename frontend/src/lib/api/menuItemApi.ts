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
  /** POS variants e.g. ["Small", "Medium", "Large"] */
  options?: string[] | null;
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
  options?: string[] | string | null;
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
  options?: string[] | string | null;
}

export function parseMenuItemOptions(product: MenuItem): string[] {
  const raw = product.options;
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.map(String).filter(Boolean);
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.map(String).filter(Boolean) : [];
    } catch {
      return raw.split(',').map(s => s.trim()).filter(Boolean);
    }
  }
  return [];
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
