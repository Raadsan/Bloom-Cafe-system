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
    const { data } = await api.post<{ success: boolean; data: User }>('/users', payload);
    return data.data;
  },

  getAllUsers: async (): Promise<User[]> => {
    const { data } = await api.get<{ success: boolean; data: User[] }>('/users');
    return data.data;
  },

  getUsersByRole: async (roleId: number): Promise<User[]> => {
    const { data } = await api.get<{ success: boolean; data: User[] }>(`/users/role/${roleId}`);
    return data.data;
  },

  updateUser: async (id: number, payload: UpdateUserPayload): Promise<User> => {
    const { data } = await api.patch<{ success: boolean; data: User }>(`/users/${id}`, payload);
    return data.data;
  },

  deleteUser: async (id: number): Promise<void> => {
    await api.delete(`/users/${id}`);
  }
};
