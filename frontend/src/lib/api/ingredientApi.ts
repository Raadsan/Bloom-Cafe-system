// ─────────────────────────────────────────────────────────────────
//  ingredientApi.ts
//  POST   /api/ingredients      (admin, manager)
//  GET    /api/ingredients       (admin, manager, kitchen)
//  GET    /api/ingredients/:id   (admin, manager, kitchen)
//  PUT    /api/ingredients/:id   (admin, manager)
//  DELETE /api/ingredients/:id   (admin)
// ─────────────────────────────────────────────────────────────────

import api from './axios';

export interface Ingredient {
  id: number;
  name: string;
  unit: string;
  stockQuantity: number;
  minStockLevel: number;
  costPerUnit: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateIngredientPayload {
  name: string;
  unit: string;
  stockQuantity: number;
  minStockLevel: number;
  costPerUnit?: number;
}

export interface UpdateIngredientPayload {
  name?: string;
  unit?: string;
  stockQuantity?: number;
  minStockLevel?: number;
  costPerUnit?: number;
  isActive?: boolean;
}

export const ingredientApi = {
  createIngredient: async (payload: CreateIngredientPayload): Promise<Ingredient> => {
    const { data } = await api.post<{ success: boolean; data: Ingredient }>('/ingredients', payload);
    return data.data;
  },

  getAllIngredients: async (): Promise<Ingredient[]> => {
    const { data } = await api.get<{ success: boolean; data: Ingredient[] }>('/ingredients');
    return data.data;
  },

  getIngredientById: async (id: number): Promise<Ingredient> => {
    const { data } = await api.get<{ success: boolean; data: Ingredient }>(`/ingredients/${id}`);
    return data.data;
  },

  updateIngredient: async (id: number, payload: UpdateIngredientPayload): Promise<Ingredient> => {
    const { data } = await api.patch<{ success: boolean; data: Ingredient }>(`/ingredients/${id}`, payload);
    return data.data;
  },

  deleteIngredient: async (id: number): Promise<void> => {
    await api.delete(`/ingredients/${id}`);
  },
};
