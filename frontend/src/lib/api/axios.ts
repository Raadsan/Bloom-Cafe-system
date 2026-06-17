import axios from 'axios';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:5000/api';

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// ── Attach JWT token on every request ────────────────────────────
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Auto-logout on 401 Unauthorized ──────────────────────────────
// Skip redirect if already on the login page (so login errors show properly)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      const path = window.location.pathname;
      const isLoginPage =
        path === '/login' ||
        path === '/login/pos' ||
        path === '/pos' ||
        path === '/pos/login';
      const isPosRoute =
        path.startsWith('/pos-') ||
        path === '/pos-terminal' ||
        path === '/ready-orders' ||
        path === '/my-sales' ||
        path === '/my-profile';
      if (!isLoginPage) {
        localStorage.removeItem('token');
        localStorage.removeItem('auth_user');
        window.location.href = isPosRoute ? '/pos/login' : '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
