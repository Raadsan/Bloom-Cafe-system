"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { menuApi, Menu, SubMenu } from "@/lib/api/restaurant/menuApi";
import { authApi } from "@/lib/api/auth/authApi";

interface PermissionContextType {
  permissions: Menu[];
  loading: boolean;
  isAdmin: boolean;
  canView: (url: string) => boolean;
  canAdd: (url: string) => boolean;
  canEdit: (url: string) => boolean;
  canDelete: (url: string) => boolean;
  refreshPermissions: () => Promise<void>;
}

const PermissionContext = createContext<PermissionContextType | undefined>(undefined);

export function PermissionProvider({ children }: { children: React.ReactNode }) {
  const [permissions, setPermissions] = useState<Menu[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const fetchPermissions = async () => {
    try {
      const cached = authApi.getCachedUser();
      if (cached) {
        const adminRole = ['admin', 'super_admin', 'super admin'].includes(cached.role?.toLowerCase?.());
        setIsAdmin(adminRole);
        if (adminRole) return;
        if (cached.roleId) {
          const menus = await menuApi.getMenusByRole(cached.roleId);
          setPermissions(menus || []);
          return;
        }
      }

      const user = await authApi.getMe();
      if (user) {
        // Admin bypass — full access
        const adminRole = ['admin', 'super_admin', 'super admin'].includes(user.role?.toLowerCase?.());
        setIsAdmin(adminRole);

        if (!adminRole && user.roleId) {
          const menus = await menuApi.getMenusByRole(user.roleId);
          setPermissions(menus || []);
        }
      }
    } catch (error) {
      console.error("Failed to fetch permissions:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPermissions();
  }, []);

  /**
   * Find permission config for a URL.
   * Tries exact match first, then prefix match for nested routes.
   */
  const findConfig = (url: string) => {
    let bestMatch: any = null;
    let bestMatchLength = 0;

    for (const menu of permissions) {
      // Exact menu match
      if (menu.url === url && menu.permissions) {
        return menu.permissions;
      }
      // Prefix match (e.g. /inventory matches /inventory/movements)
      if (menu.url && url.startsWith(menu.url) && menu.url.length > bestMatchLength && menu.permissions) {
        bestMatch = menu.permissions;
        bestMatchLength = menu.url.length;
      }
      // Check submenus
      if (menu.items) {
        for (const sub of menu.items) {
          if (sub.url === url && sub.permissions) {
            return sub.permissions;
          }
          if (sub.url && url.startsWith(sub.url) && sub.url.length > bestMatchLength && sub.permissions) {
            bestMatch = sub.permissions;
            bestMatchLength = sub.url.length;
          }
        }
      }
    }
    return bestMatch;
  };

  const check = (url: string, type: 'canView' | 'canAdd' | 'canEdit' | 'canDelete'): boolean => {
    // Admin always has access
    if (isAdmin) return true;
    const config = findConfig(url);
    if (!config) return false;
    return !!config[type];
  };

  const value = {
    permissions,
    loading,
    isAdmin,
    canView: (url: string) => check(url, 'canView'),
    canAdd: (url: string) => check(url, 'canAdd'),
    canEdit: (url: string) => check(url, 'canEdit'),
    canDelete: (url: string) => check(url, 'canDelete'),
    refreshPermissions: fetchPermissions,
  };

  return (
    <PermissionContext.Provider value={value}>
      {children}
    </PermissionContext.Provider>
  );
}

export function usePermissions() {
  const context = useContext(PermissionContext);
  if (context === undefined) {
    throw new Error("usePermissions must be used within a PermissionProvider");
  }
  return context;
}
