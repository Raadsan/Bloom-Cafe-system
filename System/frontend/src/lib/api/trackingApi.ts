import api from './axios';

export interface AuditLog {
  id: number;
  userId: number;
  action: string;
  entity: string;
  entityId?: number;
  description: string;
  createdAt: string;
  user?: {
    fullName: string;
    email: string;
  };
}

export const trackingApi = {
  getAllLogs: async (): Promise<AuditLog[]> => {
    const { data } = await api.get<{ success: boolean; data: AuditLog[] }>('/tracking/all');
    return data.data;
  }
};
