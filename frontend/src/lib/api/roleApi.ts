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
    const res = await api.post('/roles', payload);
    return res.data.data;
  },

  getAllRoles: async (): Promise<Role[]> => {
    const res = await api.get('/roles');
    return res.data.data;
  },

  updateRole: async (id: number, payload: UpdateRolePayload): Promise<Role> => {
    const res = await api.patch(`/roles/${id}`, payload);
    return res.data.data;
  },

  deleteRole: async (id: number): Promise<void> => {
    await api.delete(`/roles/${id}`);
  },
};
