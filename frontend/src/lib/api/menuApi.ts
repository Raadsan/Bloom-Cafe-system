import api from './axios';

export interface MenuPermission {
  canView: boolean;
  canAdd: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

export interface SubMenu {
  id: number;
  title: string;
  url: string;
  order: number;
  permissions: MenuPermission;
  isActive?: boolean;
}

export interface Menu {
  id: number;
  title: string;
  url: string;
  icon: string;
  order: number;
  permissions: MenuPermission;
  items?: SubMenu[];
  isActive?: boolean;
}

const MENU_CACHE_KEY = (roleId: number) => `sidebar_menus_${roleId}`;
const MEM_TTL_MS = 5 * 60 * 1000;

const memoryCache = new Map<number, { data: Menu[]; at: number }>();
const inflight = new Map<number, Promise<Menu[]>>();

function readLocalCache(roleId: number): Menu[] | null {
  if (typeof window === 'undefined') return null;
  try {
    const cached = localStorage.getItem(MENU_CACHE_KEY(roleId));
    if (cached) return JSON.parse(cached) as Menu[];
  } catch { /* ignore */ }
  return null;
}

function writeLocalCache(roleId: number, data: Menu[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(MENU_CACHE_KEY(roleId), JSON.stringify(data));
  } catch { /* ignore */ }
}

export const menuApi = {
  getMenusByRole: async (roleId: number, forceRefresh = false): Promise<Menu[]> => {
    const now = Date.now();
    const mem = memoryCache.get(roleId);
    if (!forceRefresh && mem && now - mem.at < MEM_TTL_MS) {
      return mem.data;
    }

    if (!forceRefresh) {
      const local = readLocalCache(roleId);
      if (local) {
        memoryCache.set(roleId, { data: local, at: now });
        return local;
      }
    }

    const pending = inflight.get(roleId);
    if (pending && !forceRefresh) return pending;

    const request = api
      .get(`/menus/permissions/${roleId}`)
      .then((res) => {
        const data: Menu[] = res.data.data || [];
        memoryCache.set(roleId, { data, at: Date.now() });
        writeLocalCache(roleId, data);
        inflight.delete(roleId);
        return data;
      })
      .catch((err) => {
        inflight.delete(roleId);
        throw err;
      });

    inflight.set(roleId, request);
    return request;
  },

  clearMenuCache: (roleId?: number) => {
    if (roleId !== undefined) {
      memoryCache.delete(roleId);
      inflight.delete(roleId);
      if (typeof window !== 'undefined') {
        localStorage.removeItem(MENU_CACHE_KEY(roleId));
      }
    } else {
      memoryCache.clear();
      inflight.clear();
      if (typeof window !== 'undefined') {
        Object.keys(localStorage)
          .filter((k) => k.startsWith('sidebar_menus_'))
          .forEach((k) => localStorage.removeItem(k));
      }
    }
  },

  getAllMenus: async (): Promise<Menu[]> => {
    const res = await api.get('/menus');
    return res.data.data || [];
  },

  createMenu: async (data: Partial<Menu>) => {
    const res = await api.post('/menus', data);
    menuApi.clearMenuCache();
    return { success: true, data: res.data.data };
  },

  updateMenu: async (id: number, data: Partial<Menu>) => {
    const res = await api.put(`/menus/${id}`, data);
    menuApi.clearMenuCache();
    return { success: true, data: res.data.data };
  },

  deleteMenu: async (id: number) => {
    await api.delete(`/menus/${id}`);
    menuApi.clearMenuCache();
    return { success: true, message: 'Menu deleted' };
  },

  createSubMenu: async (data: { menuId: number; title: string; url: string; order?: number }) => {
    const res = await api.post('/menus/submenu', data);
    menuApi.clearMenuCache();
    return { success: true, data: res.data.data };
  },

  updateSubMenu: async (id: number, data: { title?: string; url?: string; order?: number; isActive?: boolean }) => {
    const res = await api.put(`/menus/submenu/${id}`, data);
    menuApi.clearMenuCache();
    return { success: true, data: res.data.data };
  },

  deleteSubMenu: async (id: number) => {
    await api.delete(`/menus/submenu/${id}`);
    menuApi.clearMenuCache();
    return { success: true, message: 'Submenu deleted' };
  },

  seedMenus: async (): Promise<{ success: boolean; message: string }> => {
    const res = await api.post('/menus/seed');
    menuApi.clearMenuCache();
    return res.data;
  },

  updatePermissions: async (roleId: number, permissions: any[]): Promise<{ success: boolean; message: string }> => {
    const res = await api.post(`/menus/permissions/${roleId}`, { permissions });
    menuApi.clearMenuCache(roleId);
    return res.data;
  },
};
