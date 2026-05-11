import api from './axios';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthUser {
  id: number;
  fullName: string;
  email: string;
  role: string;
  roleId?: number;
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

  /** Clear token and redirect to login. */
  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
  },
};
