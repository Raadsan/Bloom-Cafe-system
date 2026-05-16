import api from './axios';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthUser {
  id: number;
  fullName: string;
  email: string;
  phone?: string;
  address?: string;
  gender?: string;
  dateOfBirth?: string;
  avatarUrl?: string;
  role: string;
  roleId?: number;
  createdAt?: string;
}

export interface UpdateProfileData {
  fullName?: string;
  email?: string;
  phone?: string;
  address?: string;
  gender?: string;
  dateOfBirth?: string;
  currentPassword?: string;
  newPassword?: string;
  avatarUrl?: string;
}

export interface LoginResponse {
  token: string;
  user: AuthUser;
}

export const authApi = {
  /** Login – saves token to localStorage automatically. */
  login: async (credentials: LoginCredentials): Promise<LoginResponse> => {
    const { data } = await api.post<LoginResponse>('/auth/login', credentials);
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', data.token);
    }
    return data;
  },

  /** Get the currently logged-in user. */
  getMe: async (): Promise<AuthUser> => {
    const { data } = await api.get<any>('/auth/me');
    const userData = data.data || data.user || data;
    return {
      ...userData,
      fullName: userData.fullName || userData.name || 'User'
    };
  },

  /** Update profile. */
  updateProfile: async (payload: UpdateProfileData): Promise<AuthUser> => {
    const { data } = await api.patch<any>('/auth/update-profile', payload);
    return data.user || data.data || data;
  },

  /** Clear token and redirect to login. */
  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.error('Failed to log out from server', err);
    } finally {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    }
  },
};
