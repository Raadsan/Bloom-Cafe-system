import api from './axios';

export type TableStatus = 'active' | 'inactive';

export interface Table {
  id: number;
  number: number;
  name?: string;
  description?: string | null;
  capacity?: number;
  status: TableStatus;
  qrCode?: string;
  createdAt?: string;
}

export interface CreateTablePayload {
  number: number;
  name?: string;
  description?: string | null;
  capacity?: number;
  status?: TableStatus;
}

export interface UpdateTablePayload {
  number?: number;
  name?: string;
  description?: string | null;
  capacity?: number;
  status?: TableStatus;
}

export const tableApi = {
  createTable: async (payload: CreateTablePayload): Promise<Table> => {
    const res = await api.post('/tables', payload);
    return res.data.data;
  },

  getAllTables: async (): Promise<Table[]> => {
    const res = await api.get('/tables/all');
    return res.data.data || [];
  },

  updateTable: async (id: string | number, payload: UpdateTablePayload): Promise<Table> => {
    const res = await api.patch(`/tables/${id}`, payload);
    return res.data.data;
  },

  deleteTable: async (id: string | number): Promise<void> => {
    await api.delete(`/tables/${id}`);
  },
};
