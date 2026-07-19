"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { authApi } from "@/lib/api/authApi";
import { menuApi, Menu } from "@/lib/api/menuApi";

const ACCOUNT_ROUTES = new Set(["/profile", "/my-profile"]);
const POS_ROUTES = new Set(["/pos-terminal", "/kitchen", "/ready-orders", "/my-sales", "/my-profile"]);

function hasRouteAccess(menus: Menu[], pathname: string) {
  let best: { length: number; canView: boolean } | null = null;
  for (const menu of menus) {
    const entries = [menu, ...(menu.items || [])];
    for (const entry of entries) {
      const url = entry.url;
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
        const user = await authApi.getMe(true);
        // Page access always comes from this role's database menu permissions.
        // Admin is not an automatic bypass: it must also have canView assigned.
        const canEnter = (user.authContext === "pos" && POS_ROUTES.has(pathname)) ||
          ACCOUNT_ROUTES.has(pathname) || (
          !!user.roleId && hasRouteAccess(await menuApi.getMenusByRole(user.roleId, true), pathname)
        );
        if (!canEnter) {
          authApi.logout(loginPath);
          return;
        }
        if (active) setAllowedPath(pathname);
      } catch {
        if (active) authApi.logout(loginPath);
      }
    }

    void validate();
    return () => { active = false; };
  }, [pathname, loginPath]);

  if (allowedPath !== pathname) {
    return <div className="min-h-screen bg-white dark:bg-zinc-950" aria-label="Validating session" />;
  }

  return children;
}
