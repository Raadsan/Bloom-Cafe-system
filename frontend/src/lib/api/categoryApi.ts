import api from './axios';
import { MenuItem } from './menuItemApi';

export interface Category {
  id: number;
  name: string;
  description?: string;
  imageUrl?: string;
  createdAt?: string;
  updatedAt?: string;
  isActive?: boolean;
}

export interface CategoryWithItems extends Category {
  menuitem: MenuItem[];
}

export interface CreateCategoryPayload {
  name: string;
  description?: string;
  imageUrl?: string;
  isActive?: boolean;
}

export interface UpdateCategoryPayload {
  name?: string;
  description?: string;
  imageUrl?: string;
  isActive?: boolean;
}

export const categoryApi = {
  createCategory: async (payload: CreateCategoryPayload): Promise<Category> => {
    const res = await api.post('/categories', payload);
    return res.data.data;
  },

  getAllCategories: async (): Promise<Category[]> => {
    const res = await api.get('/categories');
    return res.data.data || [];
  },

  getCategoriesWithItems: async (): Promise<CategoryWithItems[]> => {
    const res = await api.get('/categories/with-items');
    return res.data.data || [];
  },

  getCategoryWithItemsById: async (id: number): Promise<CategoryWithItems> => {
    const res = await api.get(`/categories/${id}/with-items`);
    return res.data.data;
  },

  updateCategory: async (id: number, payload: UpdateCategoryPayload): Promise<Category> => {
    const res = await api.patch(`/categories/${id}`, payload);
    return res.data.data;
  },

  deleteCategory: async (id: number): Promise<void> => {
    await api.delete(`/categories/${id}`);
  }
};
