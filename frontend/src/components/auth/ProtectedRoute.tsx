"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { authApi } from "@/lib/api/auth/authApi";
import { menuApi, Menu } from "@/lib/api/restaurant/menuApi";
import { isModuleAdmin, workspaceFromPath, workspaceHref, type WorkspaceKey } from "@/lib/workspaces";

const ACCOUNT_ROUTES = new Set(["/profile", "/my-profile"]);
const POS_ROUTES = new Set(["/pos-terminal", "/kitchen", "/ready-orders", "/my-sales", "/my-profile"]);

function hasRouteAccess(menus: Menu[], pathname: string, workspace: WorkspaceKey) {
  let best: { length: number; canView: boolean } | null = null;
  for (const menu of menus) {
    const entries = [menu, ...(menu.items || [])];
    for (const entry of entries) {
      const url = workspaceHref(entry.url, workspace);
      if (!url || (pathname !== url && !pathname.startsWith(`${url}/`))) continue;
      if (!best || url.length > best.length) {
        best = { length: url.length, canView: entry.isActive !== false && !!entry.permissions?.canView };
      }
    }
  }
  return best?.canView === true;
}

export function ProtectedRoute({
  children,
  loginPath = "/login",
}: {
  children: React.ReactNode;
  loginPath?: string;
}) {
  const pathname = usePathname();
  const [allowedPath, setAllowedPath] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    const isLogoutLocked = () => document.cookie.split(";").some(
      (part) => part.trim() === "restaurant_logout=1"
    );
    const hideProtectedPage = () => {
      document.documentElement.style.visibility = "hidden";
    };
    const handlePageShow = () => {
      if (isLogoutLocked()) {
        hideProtectedPage();
        window.location.replace(loginPath);
      } else {
        document.documentElement.style.visibility = "";
      }
    };

    if (isLogoutLocked()) {
      hideProtectedPage();
      window.location.replace(loginPath);
      return;
    }

    window.addEventListener("pagehide", hideProtectedPage);
    window.addEventListener("pageshow", handlePageShow);
    return () => {
      window.removeEventListener("pagehide", hideProtectedPage);
      window.removeEventListener("pageshow", handlePageShow);
      document.documentElement.style.visibility = "";
    };
  }, [loginPath]);

  useEffect(() => {
    let active = true;

    async function validate() {
      try {
        setValidationError(null);
        // Login already stores the authenticated user. Reuse it here so every
        // protected navigation does not block the whole application on /auth/me.
        // API requests still enforce the server-side session and return 401 when
        // it is no longer valid.
        const user = await authApi.getMe();
        const workspace = workspaceFromPath(pathname);
        const role = user.role?.trim().toLowerCase().replace(/[\s-]+/g, '_');
        const isPosSessionRoute = user.authContext === 'pos' && POS_ROUTES.has(pathname);
        const assignedMenus = user.roleId && !isPosSessionRoute && !ACCOUNT_ROUTES.has(pathname)
          ? await menuApi.getMenusByRole(user.roleId, false, workspace)
          : [];
        const workspaceAllowed = isModuleAdmin(user.role) || assignedMenus.length > 0 ||
          (isPosSessionRoute && ['pos', 'cashier', 'waiter', 'manager'].includes(role)) ||
          (workspace === 'RESTAURANT' && ['restaurant', 'manager', 'pos', 'cashier', 'waiter'].includes(role)) ||
          (workspace === 'ACCOUNTING' && ['accounting', 'accountant'].includes(role));
        if (!workspaceAllowed) {
          authApi.logout(loginPath);
          return;
        }
        // Page access always comes from this role's database menu permissions.
        // Admin is not an automatic bypass: it must also have canView assigned.
        const canEnter = (user.authContext === "pos" && POS_ROUTES.has(pathname)) ||
          ACCOUNT_ROUTES.has(pathname) || pathname === '/accounting/dashboard' || (
          // Menu permissions have a short-lived cache and are also enforced by
          // the backend. Avoid forcing the same remote query on every route.
          !!user.roleId && hasRouteAccess(assignedMenus, pathname, workspace)
        );
        if (!canEnter) {
          authApi.logout(loginPath);
          return;
        }
        if (active) setAllowedPath(pathname);
      } catch (error: unknown) {
        const status = (error as { response?: { status?: number } })?.response?.status;
        if (status === 401) {
          authApi.logout(loginPath);
          return;
        }
        if (active) setValidationError(
          status === 403 ? "You do not have access to this workspace." : "Unable to validate workspace access. Please retry."
        );
      }
    }

    void validate();
    return () => { active = false; };
  }, [pathname, loginPath]);

  if (validationError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white p-6 dark:bg-zinc-950">
        <div className="max-w-md text-center">
          <p className="text-sm font-medium text-zinc-700 dark:text-zinc-200">{validationError}</p>
          <button type="button" onClick={() => window.location.reload()} className="mt-4 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white">
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (allowedPath !== pathname) {
    return (
      <div
        className="flex min-h-screen items-center justify-center bg-white dark:bg-zinc-950"
        aria-label="Validating session"
        aria-live="polite"
      >
        <div className="flex flex-col items-center gap-3 text-center">
          <span className="h-9 w-9 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
          <p className="text-sm font-medium text-zinc-600 dark:text-zinc-300">
            Loading your workspace...
          </p>
        </div>
      </div>
    );
  }

  return children;
}
