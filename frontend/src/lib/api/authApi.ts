import api from './axios';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface PosLoginCredentials {
  username: string;
  pin: string;
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

const USER_STORAGE_KEY = 'auth_user';

/** Save user to localStorage */
function saveUserToStorage(user: AuthUser): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  }
}

/** Read user from localStorage — returns null if not found */
function getUserFromStorage(): AuthUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

/** Clear user from localStorage */
function clearUserFromStorage(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(USER_STORAGE_KEY);
    localStorage.removeItem('token');
  }
}

function mapAuthUser(user: Record<string, unknown>): AuthUser {
  const dob = user.dateOfBirth;
  let dateOfBirth: string | undefined;
  if (dob) {
    const d = new Date(dob as string);
    if (!isNaN(d.getTime())) dateOfBirth = d.toISOString();
  }

  return {
    id: user.id as number,
    fullName: (user.fullName as string) || '',
    email: (user.email as string) || '',
    phone: (user.phone as string) || undefined,
    address: (user.address as string) || undefined,
    gender: (user.gender as string) || undefined,
    dateOfBirth,
    avatarUrl: (user.avatarUrl as string) || undefined,
    role: (user.role as string) || 'staff',
    roleId: user.roleId as number | undefined,
    createdAt: user.createdAt
      ? new Date(user.createdAt as string).toISOString()
      : undefined,
  };
}

export const authApi = {
  /** Login – saves token AND user to localStorage */
  login: async (credentials: LoginCredentials): Promise<LoginResponse> => {
    const res = await api.post('/auth/login', credentials);
    const { token, user } = res.data;

    const authUser: AuthUser = {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone || undefined,
      address: user.address || undefined,
      gender: user.gender || undefined,
      dateOfBirth: user.dateOfBirth || undefined,
      avatarUrl: user.avatarUrl || undefined,
      role: user.role,
      roleId: user.roleId,
      createdAt: user.createdAt
    };

    if (typeof window !== 'undefined') {
      localStorage.setItem('token', token);
      saveUserToStorage(authUser);
    }

    return { token, user: authUser };
  },

  loginWithGoogle: async (payload: {
    idToken: string;
    audience?: "client" | "staff";
  }): Promise<LoginResponse> => {
    const res = await api.post("/auth/google", payload);
    const { token, user } = res.data;
    const authUser = mapAuthUser(user);

    if (typeof window !== "undefined") {
      localStorage.setItem("token", token);
      saveUserToStorage(authUser);
    }

    return { token, user: authUser };
  },

  loginWithFacebook: async (payload: {
    accessToken: string;
    audience?: "client" | "staff";
  }): Promise<LoginResponse> => {
    const res = await api.post("/auth/facebook", payload);
    const { token, user } = res.data;
    const authUser = mapAuthUser(user);

    if (typeof window !== "undefined") {
      localStorage.setItem("token", token);
      saveUserToStorage(authUser);
    }

    return { token, user: authUser };
  },

  /** POS login — username + 4-digit PIN */
  posLogin: async (credentials: PosLoginCredentials): Promise<LoginResponse> => {
    const res = await api.post('/auth/pos-login', credentials);
    const { token, user } = res.data;

    const authUser: AuthUser = {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone || undefined,
      role: user.role,
      roleId: user.roleId,
      createdAt: user.createdAt,
    };

    if (typeof window !== 'undefined') {
      localStorage.setItem('token', token);
      saveUserToStorage(authUser);
    }

    return { token, user: authUser };
  },

  /**
   * Get the currently logged-in user.
   */
  getMe: async (forceRefresh = false): Promise<AuthUser> => {
    if (!forceRefresh) {
      const cached = getUserFromStorage();
      if (cached) return cached;
    }

    const res = await api.get('/auth/me');
    const authUser = mapAuthUser(res.data.data);

    saveUserToStorage(authUser);
    return authUser;
  },

  /** Update profile – updates the db then refreshes localStorage. */
  updateProfile: async (payload: UpdateProfileData): Promise<AuthUser> => {
    const res = await api.patch('/auth/update-profile', payload);
    const authUser = mapAuthUser(res.data.user);

    saveUserToStorage(authUser);
    return authUser;
  },

  /** Clear token + user cache and redirect to login. */
  logout: async (redirectTo = '/login') => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error("Logout request error:", error);
    }
    clearUserFromStorage();
    if (typeof window !== 'undefined') {
      window.location.href = redirectTo;
    }
  },
};
