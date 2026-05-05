// ─────────────────────────────────────────────────────────────────
//  categoryApi.ts
//  POST   /api/categories                 (admin, manager)
//  GET    /api/categories/all             (admin, manager, kitchen, waiter)
//  GET    /api/categories/with-items      (admin, manager, kitchen, waiter)
//  GET    /api/categories/:id/with-items  (admin, manager, kitchen, waiter)
//  PATCH  /api/categories/:id             (admin, manager)
//  DELETE /api/categories/:id             (admin)
// ─────────────────────────────────────────────────────────────────

import api from './axios';

export interface Category {
  id: number;
  name: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CategoryWithItems extends Category {
  menuitem: {
    id: number;
    name: string;
    description?: string;
    price: number;
    imageUrl?: string;
    isAvailable: boolean;
    categoryId: number;
  }[];
}

export interface CreateCategoryPayload {
  name: string;
  description?: string;
}

export interface UpdateCategoryPayload {
  name?: string;
  description?: string;
}

export const categoryApi = {
  createCategory: async (payload: CreateCategoryPayload): Promise<Category> => {
    const { data } = await api.post<{ success: boolean; data: Category }>('/categories', payload);
    return data.data;
  },

  getAllCategories: async (): Promise<Category[]> => {
    const { data } = await api.get<{ success: boolean; data: Category[] }>('/categories/all');
    return data.data;
  },

  getCategoriesWithItems: async (): Promise<CategoryWithItems[]> => {
    const { data } = await api.get<{ success: boolean; data: CategoryWithItems[] }>('/categories/with-items');
    return data.data;
  },

  getCategoryWithItemsById: async (id: number): Promise<CategoryWithItems> => {
    const { data } = await api.get<{ success: boolean; data: CategoryWithItems }>(`/categories/${id}/with-items`);
    return data.data;
  },

  updateCategory: async (id: number, payload: UpdateCategoryPayload): Promise<Category> => {
    const { data } = await api.patch<{ success: boolean; data: Category }>(`/categories/${id}`, payload);
    return data.data;
  },

  deleteCategory: async (id: number): Promise<void> => {
    await api.delete(`/categories/${id}`);
  }
};
