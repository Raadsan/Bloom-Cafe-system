import api from './axios';

export interface BOMItem {
  id: string;
  menuItemId: string;
  ingredientId: string;
  quantity: number;
  menuItem?: { id: string; name: string };
  ingredient?: { id: string; name: string; unit: string };
}

export interface CreateBOMItemPayload {
  menuItemId: string;
  ingredientId: string;
  quantity: number;
}

export interface UpdateBOMItemPayload {
  quantity?: number;
}

export const bomApi = {
  createBOMItem: async (payload: CreateBOMItemPayload): Promise<BOMItem> => {
    const { data } = await api.post<BOMItem>('/bom', payload);
    return data;
  },

  getAllBOMItems: async (): Promise<BOMItem[]> => {
    const { data } = await api.get<BOMItem[]>('/bom');
    return data;
  },

  getBOMByMenuItem: async (menuItemId: string): Promise<BOMItem[]> => {
    const { data } = await api.get<BOMItem[]>(`/bom/menu-item/${menuItemId}`);
    return data;
  },

  updateBOMItem: async (id: string, payload: UpdateBOMItemPayload): Promise<BOMItem> => {
    const { data } = await api.patch<BOMItem>(`/bom/${id}`, payload);
    return data;
  },

  deleteBOMItem: async (id: string): Promise<void> => {
    await api.delete(`/bom/${id}`);
  },
};
