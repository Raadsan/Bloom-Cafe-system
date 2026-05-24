import api from './axios';

export interface User {
  id: number;
  fullName: string;
  email: string;
  phone?: string;
  isActive: boolean;
  roleId: number;
  role?: { id: number; name: string };
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateUserPayload {
  fullName: string;
  email: string;
  password: string;
  roleId: number;
  phone?: string;
}

export interface UpdateUserPayload {
  fullName?: string;
  email?: string;
  password?: string;
  roleId?: number;
  phone?: string;
  isActive?: boolean;
}

export const userApi = {
  createUser: async (payload: CreateUserPayload): Promise<User> => {
    const res = await api.post('/users', payload);
    return res.data.data;
  },

  getAllUsers: async (): Promise<User[]> => {
    const res = await api.get('/users');
    return res.data.data;
  },

  getUsersByRole: async (roleId: number): Promise<User[]> => {
    const res = await api.get(`/users/role/${roleId}`);
    return res.data.data;
  },

  updateUser: async (id: number, payload: UpdateUserPayload): Promise<User> => {
    const res = await api.patch(`/users/${id}`, payload);
    return res.data.data;
  },

  deleteUser: async (id: number): Promise<void> => {
    await api.delete(`/users/${id}`);
  }
};
