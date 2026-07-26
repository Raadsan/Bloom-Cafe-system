"use client";

import {
  LayoutDashboard,
  ListOrdered,
  Users,
  Settings,
  Store,
  PackageOpen,
  LogOut,
  ChevronRight,
  ChevronDown,
  Settings2,
  Shield,
  Key,
  Activity,
  MoreVertical,
  User as UserIcon,
  ShieldCheck,
  Bell,
  Sun,
  FileText,
  LayoutGrid,
  History,
  ClipboardList,
  Tag,
  BarChart3,
  CreditCard,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarSeparator,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { authApi, AuthUser } from "@/lib/api/auth/authApi";
import { menuApi, Menu } from "@/lib/api/restaurant/menuApi";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useEffect, useState, useMemo, useRef } from "react";
import { cn } from "@/lib/utils";
import { getLucideIcon, searchLucideIconNames, LUCIDE_ICON_NAMES } from "@/lib/lucide-icons";
import { STATIC_APP_LOGO } from "@/lib/branding";
import { isModuleAdmin, workspaceFromPath, workspaceHref, type WorkspaceKey } from "@/lib/workspaces";

// Helper to normalize URLs from database
const normalizeUrl = (url: string) => {
  if (!url) return "/dashboard";
  return url;
};

/** Active route match — /orders must not highlight sibling order routes */
const ORDER_SIBLING_PREFIXES = [
  "/orders/create",
  "/orders/pickup",
  "/orders/kitchen",
];

const isNavRouteActive = (pathname: string, itemUrl: string) => {
  if (pathname === itemUrl) return true;
  if (itemUrl === "/dashboard") return false;
  if (itemUrl === "/orders/pickup" && pathname.startsWith("/orders/pickup/")) {
    return false;
  }
  if (itemUrl === "/orders" && ORDER_SIBLING_PREFIXES.some(p => pathname.startsWith(p))) {
    return false;
  }
  return pathname.startsWith(`${itemUrl}/`);
};

// ─── In-memory sidebar cache (module-level = survives re-renders, clears on reload) ───
// This makes sidebar render instantly on navigation — no extra API calls.
interface SidebarCache {
  menus: Menu[];
  roleId: number;
  workspace: WorkspaceKey;
}
let _sidebarCache: SidebarCache | null = null;

function clearSidebarCache() {
  _sidebarCache = null;
}

// Replicated NavUser component from Notary
function NavUser({ user }: { user: AuthUser | null }) {
  const { isMobile } = useSidebar();

  if (!user) return null;

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground border border-border/40 group-data-[collapsible=icon]:!p-0 group-data-[collapsible=icon]:justify-center"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded bg-primary text-white font-medium text-[15px] shadow-sm shadow-primary/20">
                {user.fullName?.charAt(0) || "U"}
              </div>
              <div className="grid flex-1 text-left text-[11px] leading-tight group-data-[collapsible=icon]:hidden">
                <span className="truncate font-bold text-foreground uppercase tracking-tight">
                  {user.fullName}
                </span>
                <span className="truncate text-[10px] font-medium uppercase tracking-widest text-muted-foreground/70">
                  {user.role}
                </span>
              </div>
              <MoreVertical className="ml-auto size-4 text-muted-foreground group-data-[collapsible=icon]:hidden" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-72 rounded-xl shadow-2xl border-border/50"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-2 py-2 text-left text-sm">
                <div className="flex h-9 w-9 items-center justify-center rounded bg-primary text-white font-medium text-[15px] shadow-sm shadow-primary/20">
                  {user.fullName?.charAt(0) || "U"}
                </div>
                <div className="grid flex-1 text-left text-xs leading-tight">
                  <span className="truncate font-medium uppercase tracking-tight">{user.fullName}</span>
                  <span className="truncate text-[11.5px] font-normal uppercase tracking-widest text-muted-foreground">{user.role}</span>
                  <span className="truncate text-[10.5px] font-normal text-muted-foreground/80">{user.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem className="text-xs font-bold uppercase tracking-widest cursor-pointer hover:bg-muted/50">
                <UserIcon className="mr-2 size-4" />
                Profile
              </DropdownMenuItem>
              {user.role?.toLowerCase() === "admin" && (
                <DropdownMenuItem asChild>
                  <Link href="/receipt-settings" className="flex w-full items-center text-xs font-semibold uppercase tracking-widest cursor-pointer hover:bg-muted/50">
                    <Settings2 className="mr-2 size-4" />
                    Receipt Settings
                  </Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem className="text-xs font-semibold uppercase tracking-widest cursor-pointer hover:bg-muted/50">
                <FileText className="mr-2 size-4" />
                Policy
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="text-xs font-semibold uppercase tracking-widest text-destructive dark:text-white cursor-pointer hover:bg-destructive/5"
              onClick={async () => {
                authApi.logout();
              }}
            >
              <LogOut className="mr-2 size-4 dark:text-white" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const workspace = workspaceFromPath(pathname);
  const [user, setUser] = useState<AuthUser | null>(null);
  // Pre-populate from module cache for instant render — no loading flash on navigation
  const [menus, setMenus] = useState<Menu[]>(_sidebarCache?.menus ?? []);
  const [loading, setLoading] = useState(_sidebarCache === null); // only show skeleton on first load
  const [openMenus, setOpenMenus] = useState<Record<number, boolean>>({});
  const userRoleIdRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    userRoleIdRef.current = user?.roleId;
  }, [user?.roleId]);

  // Fetch user + menus on mount. Subsequent renders served from in-memory cache (instant).
  useEffect(() => {
    const initSidebar = async (forceRefresh = false) => {
      try {
        const cachedUser = authApi.getCachedUser();
        if (cachedUser) setUser(cachedUser);

        const currentUser = cachedUser ?? (await authApi.getMe());
        setUser(currentUser);

        if (currentUser && currentUser.roleId) {
          if (!forceRefresh && _sidebarCache && _sidebarCache.roleId === currentUser.roleId && _sidebarCache.workspace === workspace) {
            setMenus(_sidebarCache.menus);
            setLoading(false);
            return;
          }
          const fetchedMenus = await menuApi.getMenusByRole(currentUser.roleId, forceRefresh, workspace);
          _sidebarCache = { menus: fetchedMenus, roleId: currentUser.roleId, workspace };
          setMenus(fetchedMenus);
        }
      } catch (error) {
        console.error("Failed to initialize sidebar:", error);
      } finally {
        setLoading(false);
      }
    };

    initSidebar();
  }, [workspace]);

  useEffect(() => {
    const handleMenuUpdate = (e: Event) => {
      const detail = (e as CustomEvent<{ roleId?: number; allMenus?: Menu[] }>).detail;
      const roleId = userRoleIdRef.current;
      if (!roleId) return;
      if (detail?.roleId && detail.roleId !== roleId) return;

      if (detail?.allMenus?.length && _sidebarCache?.roleId === roleId) {
        const byId = new Map(detail.allMenus.map((m) => [m.id, m]));
        const patched = _sidebarCache.menus
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
              items: (rm.items || [])
                .map((sub) => {
                  const srcSub = srcSubs.get(sub.id);
                  if (!srcSub) return sub;
                  return {
                    ...sub,
                    title: srcSub.title,
                    url: srcSub.url,
                    order: srcSub.order,
                  };
                })
                .sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
            };
          })
          .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        _sidebarCache = { menus: patched, roleId, workspace };
        setMenus(patched);
        return;
      }

      menuApi.getMenusByRole(roleId, false, workspace).then((fetchedMenus) => {
        _sidebarCache = { menus: fetchedMenus, roleId, workspace };
        setMenus(fetchedMenus);
      }).catch(() => {});
    };

    window.addEventListener("sidebar-menu-updated", handleMenuUpdate);
    return () => window.removeEventListener("sidebar-menu-updated", handleMenuUpdate);
  }, [workspace]);

  // Update which menu section is open when the path changes (no API calls)
  useEffect(() => {
    if (menus.length === 0) return;
    const initialOpen: Record<number, boolean> = {};
    menus.forEach(menu => {
      if (menu.items?.some(sub => pathname === sub.url || pathname.startsWith(`${sub.url}/`))) {
        initialOpen[menu.id] = true;
      }
    });
    setOpenMenus(initialOpen);
  }, [pathname, menus]);

  const toggleMenu = (menuId: number) => {
    setOpenMenus(prev => ({
      ...prev,
      [menuId]: !prev[menuId]
    }));
  };

  const navItems = useMemo(() => {
    const seen = new Set<string>();
    return menus
      .filter((item) => item.isActive !== false)
      .filter(item => {
        const title = item.title.trim();
        if (seen.has(title)) return false;
        seen.add(title);
        return true;
      });
  }, [menus]);

  return (
    <Sidebar collapsible="icon" {...props} className="border-r border-sidebar-border shadow-none bg-sidebar">
      <SidebarHeader className="!p-0 h-[88px] flex items-stretch justify-center overflow-hidden bg-sidebar border-b border-sidebar-border group-data-[collapsible=icon]:h-[72px]">
        <Link
          href="/dashboard"
          className="flex flex-1 w-full items-center justify-center px-3 py-2 min-h-0 hover:opacity-90 transition-opacity group-data-[collapsible=icon]:px-2"
        >
          <img
            src={STATIC_APP_LOGO}
            alt="Restaurant"
            className="h-12 w-auto max-w-[160px] object-contain group-data-[collapsible=icon]:h-9 group-data-[collapsible=icon]:max-w-[40px]"
          />
        </Link>
      </SidebarHeader>
      
      <SidebarContent className="bg-sidebar px-4 pt-8 pb-4 gap-0">
        <SidebarGroup className="p-0">
          <SidebarMenu className="gap-1.5 group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:gap-4 group-data-[collapsible=icon]:px-0">
            {workspace !== 'CORE' && isModuleAdmin(user?.role) && (
              <SidebarMenuItem className="w-full">
                <SidebarMenuButton render={<Link href="/dashboard" />} className="font-semibold h-11 rounded-lg">
                  <ChevronRight className="size-4 rotate-180" />
                  <span className="group-data-[collapsible=icon]:hidden">Back to Modules</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )}
            {loading ? (
              [1, 2, 3, 4, 5, 6].map((i) => (
                <SidebarMenuItem key={i} className="w-full px-2">
                  <div className="h-11 w-full rounded-lg bg-sidebar-accent animate-pulse" />
                </SidebarMenuItem>
              ))
            ) : (
              navItems.map((item) => {
                const Icon = getLucideIcon(item.icon);
                const activeSubs = (item.items || []).filter((sub) => sub.isActive !== false);
                const hasSubmenu = activeSubs.length > 0;
                const isOpen = openMenus[item.id];
                const itemUrl = workspaceHref(normalizeUrl(item.url), workspace);
                const isChildActive = activeSubs.some(sub => {
                  const subUrl = workspaceHref(normalizeUrl(sub.url), workspace);
                  return isNavRouteActive(pathname, subUrl);
                });
                const isActive = isNavRouteActive(pathname, itemUrl) || isChildActive;
                const displayTitle = item.title;

                return (
                  <SidebarMenuItem key={item.id} className="w-full">
                    {hasSubmenu ? (
                      <div className="w-full flex flex-col">
                        <SidebarMenuButton 
                          onClick={() => toggleMenu(item.id)}
                          tooltip={displayTitle}
                          className={cn(
                            "font-semibold text-[15.5px] h-12 transition-all pl-6 pr-2 rounded-lg w-full",
                            isActive 
                              ? "bg-sidebar-accent text-sidebar-accent-foreground" 
                              : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
                            "group-data-[collapsible=icon]:!p-0 group-data-[collapsible=icon]:h-10 group-data-[collapsible=icon]:w-10 group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:justify-center"
                          )}
                        >
                          <Icon className={cn("size-5 shrink-0 group-data-[collapsible=icon]:size-4", (isActive || isOpen) ? "text-sidebar-accent-foreground" : "text-muted-foreground")} strokeWidth={2} />
                          <span className="ml-3 flex-1 group-data-[collapsible=icon]:hidden whitespace-nowrap overflow-hidden text-ellipsis">{displayTitle}</span>
                          <ChevronRight className={cn("ml-auto size-3.5 shrink-0 transition-transform duration-300 opacity-40 group-data-[collapsible=icon]:hidden", isOpen && "rotate-90")} />
                        </SidebarMenuButton>
                        {isOpen && (
                          <SidebarMenuSub className="ml-8 border-none pl-0 mt-1 py-1 gap-1 group-data-[collapsible=icon]:hidden">
                            {activeSubs.map((sub) => {
                              const subUrl = workspaceHref(normalizeUrl(sub.url), workspace);
                              const isSubActive = isNavRouteActive(pathname, subUrl);
                              return (
                                <SidebarMenuSubItem key={sub.id}>
                                  <SidebarMenuSubButton 
                                    render={<Link href={subUrl} />}
                                    isActive={isSubActive}
                                    className={cn(
                                      "font-medium text-[14.5px] h-10 transition-all rounded-md pl-4 pr-3 w-full", 
                                      isSubActive 
                                        ? "text-sidebar-accent-foreground bg-sidebar-accent/70" 
                                        : "text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
                                    )}
                                  >
                                    <div className="flex items-center w-full">
                                      <span className="whitespace-nowrap">{sub.title}</span>
                                    </div>
                                  </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                              );
                            })}
                          </SidebarMenuSub>
                        )}
                      </div>
                    ) : (
                      <SidebarMenuButton 
                        render={<Link href={itemUrl} />}
                        isActive={isActive} 
                        tooltip={displayTitle}
                        className={cn(
                          "font-semibold text-[15.5px] h-12 transition-all pl-5 pr-1 rounded-lg w-full",
                          isActive 
                            ? "bg-sidebar-accent text-sidebar-accent-foreground" 
                            : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
                          "group-data-[collapsible=icon]:!p-0 group-data-[collapsible=icon]:h-10 group-data-[collapsible=icon]:w-10 group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:justify-center"
                        )}
                      >
                        <div className="flex items-center w-full justify-start group-data-[collapsible=icon]:justify-center">
                          <Icon className={cn("size-5 shrink-0 group-data-[collapsible=icon]:size-4", isActive ? "text-sidebar-accent-foreground" : "text-muted-foreground")} strokeWidth={2} />
                          <span className="ml-3 flex-1 group-data-[collapsible=icon]:hidden whitespace-nowrap overflow-hidden text-ellipsis">{displayTitle}</span>
                        </div>
                      </SidebarMenuButton>
                    )}
                  </SidebarMenuItem>
                );
              })
            )}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter className="p-3 bg-sidebar border-t border-sidebar-border">
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
