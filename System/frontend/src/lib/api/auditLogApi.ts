import api from './axios';

export interface AuditLog {
  id: number;
  userId: number | null;
  action: string;
  entity: string;
  entityId: number | null;
  description: string | null;
  createdAt: string;
  user?: {
    id: number;
    fullName: string;
    email: string;
    role?: {
      id: number;
      name: string;
    };
  } | null;
}

export const auditLogApi = {
  getAllLogs: async (): Promise<AuditLog[]> => {
    const { data } = await api.get<{ success: boolean; count: number; data: AuditLog[] }>('/audit-logs/all');
    return data.data;
  },

  getLogById: async (id: number): Promise<AuditLog> => {
    const { data } = await api.get<{ success: boolean; data: AuditLog }>(`/audit-logs/${id}`);
    return data.data;
  },

  getLogsByUser: async (userId: number): Promise<AuditLog[]> => {
    const { data } = await api.get<{ success: boolean; data: AuditLog[] }>(`/audit-logs/user/${userId}`);
    return data.data;
  },

  getLogsByEntity: async (entity: string): Promise<AuditLog[]> => {
    const { data } = await api.get<{ success: boolean; data: AuditLog[] }>(`/audit-logs/entity/${entity}`);
    return data.data;
  },

  deleteLog: async (id: number): Promise<void> => {
    await api.delete(`/audit-logs/${id}`);
  },
};
