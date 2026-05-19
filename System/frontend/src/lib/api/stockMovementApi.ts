import api from './axios';

export type MovementType = 'in' | 'out' | 'adjustment';

export interface StockMovement {
  id: string;
  ingredientId: string;
  type: MovementType;
  quantity: number;
  notes?: string;
  ingredient?: { id: string; name: string; unit: string };
  createdAt?: string;
}

export interface CreateStockMovementPayload {
  ingredientId: string;
  type: MovementType;
  quantity: number;
  notes?: string;
}

export const stockMovementApi = {
  createStockMovement: async (payload: CreateStockMovementPayload): Promise<StockMovement> => {
    const { data } = await api.post<{ success: boolean; data: StockMovement }>('/stock-movements', payload);
    return data.data;
  },

  getAllStockMovements: async (): Promise<StockMovement[]> => {
    const { data } = await api.get<{ success: boolean; data: StockMovement[] }>('/stock-movements/all');
    return data.data;
  },

  getStockMovementsByIngredient: async (ingredientId: string): Promise<StockMovement[]> => {
    const { data } = await api.get<{ success: boolean; data: StockMovement[] }>(`/stock-movements/ingredient/${ingredientId}`);
    return data.data;
  },

  getStockMovementById: async (id: string): Promise<StockMovement> => {
    const { data } = await api.get<{ success: boolean; data: StockMovement }>(`/stock-movements/${id}`);
    return data.data;
  },

  deleteStockMovement: async (id: string): Promise<void> => {
    await api.delete(`/stock-movements/${id}`);
  },
};
