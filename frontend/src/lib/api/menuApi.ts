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

export interface MenuBundlePayload {
  title: string;
  url: string;
  icon?: string;
  order?: number;
  isActive?: boolean;
  hasSubmenus?: boolean;
  submenus?: Array<{
    id?: number;
    title: string;
    url: string;
    order?: number;
    isActive?: boolean;
  }>;
}

const MENU_CACHE_KEY = (roleId: number) => `sidebar_menus_${roleId}`;
const ALL_MENUS_CACHE_KEY = 'all_menus_admin';
const MEM_TTL_MS = 5 * 60 * 1000;

const memoryCache = new Map<number, { data: Menu[]; at: number }>();
const inflight = new Map<number, Promise<Menu[]>>();

let allMenusMem: { data: Menu[]; at: number } | null = null;
let allMenusInflight: Promise<Menu[]> | null = null;

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

function readAllMenusLocal(): Menu[] | null {
  if (typeof window === 'undefined') return null;
  try {
    const cached = localStorage.getItem(ALL_MENUS_CACHE_KEY);
    if (cached) return JSON.parse(cached) as Menu[];
  } catch { /* ignore */ }
  return null;
}

function writeAllMenusLocal(data: Menu[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(ALL_MENUS_CACHE_KEY, JSON.stringify(data));
  } catch { /* ignore */ }
}

function setAllMenusMem(data: Menu[]) {
  allMenusMem = { data, at: Date.now() };
  writeAllMenusLocal(data);
}

async function fetchAllMenusFromNetwork(): Promise<Menu[]> {
  const res = await api.get('/menus');
  const data: Menu[] = res.data.data || [];
  setAllMenusMem(data);
  return data;
}

async function fetchRoleMenusFromNetwork(roleId: number): Promise<Menu[]> {
  const res = await api.get(`/menus/permissions/${roleId}`);
  const data: Menu[] = res.data.data || [];
  memoryCache.set(roleId, { data, at: Date.now() });
  writeLocalCache(roleId, data);
  return data;
}

/** Sync sidebar role caches when admin changes menu structure (order/titles) — keeps permissions. */
export function syncRoleCachesFromAllMenus(allMenus: Menu[]) {
  const byId = new Map(allMenus.map((m) => [m.id, m]));
  const patchRoleList = (roleMenus: Menu[]): Menu[] =>
    roleMenus
      .map((rm) => {
        const src = byId.get(rm.id);
        if (!src) return rm;
        const srcSubs = new Map((src.items || []).map((s) => [s.id, s]));
        return {
          ...rm,
          title: src.title,
          url: src.url,
          icon: src.icon,
          order: src.order,
          isActive: src.isActive,
          items: (rm.items || [])
            .map((sub) => {
              const srcSub = srcSubs.get(sub.id);
              if (!srcSub) return sub;
              return {
                ...sub,
                title: srcSub.title,
                url: srcSub.url,
                order: srcSub.order,
                isActive: srcSub.isActive,
              };
            })
            .sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
        };
      })
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  memoryCache.forEach((entry, roleId) => {
    const patched = patchRoleList(entry.data);
    memoryCache.set(roleId, { data: patched, at: Date.now() });
    writeLocalCache(roleId, patched);
  });

  if (typeof window !== 'undefined') {
    Object.keys(localStorage)
      .filter((k) => k.startsWith('sidebar_menus_'))
      .forEach((key) => {
        try {
          const roleId = Number(key.replace('sidebar_menus_', ''));
          if (!Number.isFinite(roleId)) return;
          const raw = localStorage.getItem(key);
          if (!raw) return;
          const parsed = JSON.parse(raw) as Menu[];
          writeLocalCache(roleId, patchRoleList(parsed));
        } catch { /* ignore */ }
      });
  }
}

export const menuApi = {
  peekAllMenus: (): Menu[] | null => allMenusMem?.data ?? readAllMenusLocal(),

  setAllMenusCache: (data: Menu[]) => {
    setAllMenusMem(data);
    syncRoleCachesFromAllMenus(data);
  },

  patchAllMenusCache: (updater: (menus: Menu[]) => Menu[]) => {
    const current = allMenusMem?.data ?? readAllMenusLocal() ?? [];
    const next = updater([...current]);
    menuApi.setAllMenusCache(next);
    return next;
  },

  getMenusByRole: async (roleId: number, forceRefresh = false): Promise<Menu[]> => {
    const now = Date.now();
    const mem = memoryCache.get(roleId);
    if (!forceRefresh && mem && now - mem.at < MEM_TTL_MS) {
      return mem.data;
    }

    if (!forceRefresh) {
      const local = readLocalCache(roleId);
      if (local?.length) {
        memoryCache.set(roleId, { data: local, at: now });
        if (!inflight.has(roleId)) {
          inflight.set(
            roleId,
            fetchRoleMenusFromNetwork(roleId)
              .catch(() => local)
              .finally(() => inflight.delete(roleId))
          );
        }
        return local;
      }
    }

    const pending = inflight.get(roleId);
    if (pending && !forceRefresh) return pending;

    const request = fetchRoleMenusFromNetwork(roleId)
      .catch((err) => {
        inflight.delete(roleId);
        throw err;
      })
      .finally(() => inflight.delete(roleId));

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
    menuApi.clearAllMenusCache();
  },

  clearAllMenusCache: () => {
    allMenusMem = null;
    allMenusInflight = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem(ALL_MENUS_CACHE_KEY);
    }
  },

  reorderMenus: async (items: { id: number; order: number }[]): Promise<Menu[]> => {
    const res = await api.put('/menus/reorder', { items });
    const data: Menu[] = res.data.data || [];
    if (data.length) {
      menuApi.setAllMenusCache(data);
    } else {
      menuApi.patchAllMenusCache((menus) => {
        const orderById = new Map(items.map((i) => [i.id, i.order]));
        return menus
          .map((m) => (orderById.has(m.id) ? { ...m, order: orderById.get(m.id)! } : m))
          .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      });
    }
    return menuApi.peekAllMenus() || [];
  },

  reorderSubMenus: async (items: { id: number; order: number }[]): Promise<void> => {
    await api.put('/menus/submenu/reorder', { items });
    const orderById = new Map(items.map((i) => [i.id, i.order]));
    menuApi.patchAllMenusCache((menus) =>
      menus.map((m) => ({
        ...m,
        items: (m.items || [])
          .map((sm) =>
            orderById.has(sm.id) ? { ...sm, order: orderById.get(sm.id)! } : sm
          )
          .sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
      }))
    );
  },

  getAllMenus: async (forceRefresh = false): Promise<Menu[]> => {
    const now = Date.now();
    if (!forceRefresh && allMenusMem && now - allMenusMem.at < MEM_TTL_MS) {
      return allMenusMem.data;
    }

    if (!forceRefresh) {
      const local = readAllMenusLocal();
      if (local?.length) {
        allMenusMem = { data: local, at: now };
        if (!allMenusInflight) {
          allMenusInflight = fetchAllMenusFromNetwork()
            .catch(() => local)
            .finally(() => {
              allMenusInflight = null;
            });
        }
        return local;
      }
    }

    if (allMenusInflight && !forceRefresh) return allMenusInflight;

    allMenusInflight = fetchAllMenusFromNetwork()
      .catch((err) => {
        allMenusInflight = null;
        throw err;
      })
      .finally(() => {
        allMenusInflight = null;
      });

    return allMenusInflight;
  },

  saveMenuBundle: async (menuId: number | undefined, payload: MenuBundlePayload): Promise<Menu> => {
    const res = menuId
      ? await api.put(`/menus/${menuId}/bundle`, payload)
      : await api.post('/menus/bundle', payload);
    const saved: Menu = res.data.data;
    menuApi.patchAllMenusCache((menus) => {
      const idx = menus.findIndex((m) => m.id === saved.id);
      const entry = { ...saved, items: saved.items || [] };
      if (idx >= 0) {
        const next = [...menus];
        next[idx] = entry;
        return next.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      }
      return [...menus, entry].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    });
    return saved;
  },

  createMenu: async (data: Partial<Menu>) => {
    const res = await api.post('/menus', data);
    return { success: true, data: res.data.data };
  },

  updateMenu: async (id: number, data: Partial<Menu>) => {
    const res = await api.put(`/menus/${id}`, data);
    return { success: true, data: res.data.data };
  },

  deleteMenu: async (id: number) => {
    await api.delete(`/menus/${id}`);
    menuApi.patchAllMenusCache((menus) => menus.filter((m) => m.id !== id));
    memoryCache.forEach((entry, roleId) => {
      const next = entry.data.filter((m) => m.id !== id);
      memoryCache.set(roleId, { data: next, at: Date.now() });
      writeLocalCache(roleId, next);
    });
    return { success: true, message: 'Menu deleted' };
  },

  createSubMenu: async (data: { menuId: number; title: string; url: string; order?: number }) => {
    const res = await api.post('/menus/submenu', data);
    return { success: true, data: res.data.data };
  },

  updateSubMenu: async (id: number, data: { title?: string; url?: string; order?: number; isActive?: boolean }) => {
    const res = await api.put(`/menus/submenu/${id}`, data);
    return { success: true, data: res.data.data };
  },

  deleteSubMenu: async (id: number) => {
    await api.delete(`/menus/submenu/${id}`);
    menuApi.patchAllMenusCache((menus) =>
      menus.map((m) => ({
        ...m,
        items: (m.items || []).filter((sm) => sm.id !== id),
      }))
    );
    return { success: true, message: 'Submenu deleted' };
  },

  seedMenus: async (): Promise<{ success: boolean; message: string }> => {
    const res = await api.post('/menus/seed');
    menuApi.clearMenuCache();
    return res.data;
  },

  updatePermissions: async (roleId: number, permissions: any[]): Promise<{ success: boolean; message: string }> => {
    const res = await api.post(`/menus/permissions/${roleId}`, { permissions });
    memoryCache.delete(roleId);
    inflight.delete(roleId);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(MENU_CACHE_KEY(roleId));
    }
    void fetchRoleMenusFromNetwork(roleId).catch(() => {});
    return res.data;
  },
};
