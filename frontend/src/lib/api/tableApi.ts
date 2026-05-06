// ─────────────────────────────────────────────────────────────────
//  tableApi.ts
//  POST   /api/tables       (admin, manager)
//  GET    /api/tables/all   (admin, manager, waiter)
//  PATCH  /api/tables/:id   (admin, manager)
//  DELETE /api/tables/:id   (admin)
// ─────────────────────────────────────────────────────────────────

import api from './axios';

export type TableStatus = 'available' | 'occupied' | 'reserved';

export interface Table {
  id: number;
  number: number;
  name?: string;
  capacity?: number;
  status: TableStatus;
  qrCode?: string;
  createdAt?: string;
}

export interface CreateTablePayload {
  number: number;
  name?: string;
  capacity?: number;
  status?: TableStatus;
}

export interface UpdateTablePayload {
  number?: number;
  name?: string;
  capacity?: number;
  status?: TableStatus;
}

export const tableApi = {
  createTable: async (payload: CreateTablePayload): Promise<Table> => {
    const { data } = await api.post<{ success: boolean; data: Table }>('/tables', payload);
    return data.data;
  },

  getAllTables: async (): Promise<Table[]> => {
    const { data } = await api.get<{ success: boolean; data: Table[] }>('/tables/all');
    return data.data;
  },

  updateTable: async (id: string, payload: UpdateTablePayload): Promise<Table> => {
    const { data } = await api.patch<{ success: boolean; data: Table }>(`/tables/${id}`, payload);
    return data.data;
  },

  deleteTable: async (id: string): Promise<void> => {
    await api.delete(`/tables/${id}`);
  },
};
