import api from './axios';

export interface Role {
  id: number;
  name: string;
  description?: string;
  createdAt?: string;
}

export interface CreateRolePayload {
  name: string;
  description?: string;
}

export interface UpdateRolePayload {
  name?: string;
  description?: string;
}

export const roleApi = {
  createRole: async (payload: CreateRolePayload): Promise<Role> => {
    const { data } = await api.post<{ success: boolean; data: Role }>('/roles', payload);
    return data.data;
  },

  getAllRoles: async (): Promise<Role[]> => {
    const { data } = await api.get<{ success: boolean; data: Role[] }>('/roles');
    return data.data;
  },

  updateRole: async (id: number, payload: UpdateRolePayload): Promise<Role> => {
    const { data } = await api.patch<{ success: boolean; data: Role }>(`/roles/${id}`, payload);
    return data.data;
  },

  deleteRole: async (id: number): Promise<void> => {
    await api.delete(`/roles/${id}`);
  },
};
