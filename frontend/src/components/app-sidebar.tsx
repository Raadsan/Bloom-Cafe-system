"use client";

import {
  LayoutDashboard,
  UtensilsCrossed,
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
import { authApi, AuthUser } from "@/lib/api/authApi";
import { menuApi, Menu } from "@/lib/api/menuApi";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useEffect, useState, useMemo } from "react";
import { cn } from "@/lib/utils";

// Icon mapping helper
const getIcon = (iconName: string) => {
  const icons: Record<string, any> = {
    LayoutDashboard,
    UtensilsCrossed,
    ListOrdered,
    Users,
    Settings,
    Store,
    PackageOpen,
    Settings2,
    Shield,
    Key,
    Activity,
    User: UserIcon,
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
    report: BarChart3,
  };
  return icons[iconName] || LayoutDashboard;
};

// Helper to normalize URLs from database
const normalizeUrl = (url: string) => {
  if (!url) return "/dashboard";
  return url;
};

// ─── In-memory sidebar cache (module-level = survives re-renders, clears on reload) ───
// This makes sidebar render instantly on navigation — no extra API calls.
interface SidebarCache {
  menus: Menu[];
  roleId: number;
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
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded bg-primary text-primary-foreground font-medium text-[15px] shadow-sm shadow-primary/20">
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
                <div className="flex h-9 w-9 items-center justify-center rounded bg-primary text-primary-foreground font-medium text-[15px] shadow-sm shadow-primary/20">
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
              <DropdownMenuItem asChild>
                <Link href="/settings" className="flex w-full items-center text-xs font-semibold uppercase tracking-widest cursor-pointer hover:bg-muted/50">
                  <Settings2 className="mr-2 size-4" />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem className="text-xs font-semibold uppercase tracking-widest cursor-pointer hover:bg-muted/50">
                <FileText className="mr-2 size-4" />
                Policy
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="text-xs font-semibold uppercase tracking-widest text-destructive cursor-pointer hover:bg-destructive/5"
              onClick={async () => {
                await authApi.logout();
              }}
            >
              <LogOut className="mr-2 size-4" />
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
  const { state, isMobile } = useSidebar();
  
  const [user, setUser] = useState<AuthUser | null>(null);
  // Pre-populate from module cache for instant render — no loading flash on navigation
  const [menus, setMenus] = useState<Menu[]>(_sidebarCache?.menus ?? []);
  const [loading, setLoading] = useState(_sidebarCache === null); // only show skeleton on first load
  const [openMenus, setOpenMenus] = useState<Record<number, boolean>>({});

  // Fetch user + menus on mount. Subsequent renders served from in-memory cache (instant).
  useEffect(() => {
    const initSidebar = async (forceRefresh = false) => {
      try {
        // authApi.getMe already uses localStorage cache — instant when not forced
        const currentUser = await authApi.getMe();
        setUser(currentUser);

        if (currentUser && currentUser.roleId) {
          // Check in-memory module cache first (survives navigation, cleared on config change)
          if (!forceRefresh && _sidebarCache && _sidebarCache.roleId === currentUser.roleId) {
            setMenus(_sidebarCache.menus);
            setLoading(false);
            return;
          }
          // Cache miss — fetch from backend
          const fetchedMenus = await menuApi.getMenusByRole(currentUser.roleId);
          _sidebarCache = { menus: fetchedMenus, roleId: currentUser.roleId };
          setMenus(fetchedMenus);
        }
      } catch (error) {
        console.error("Failed to initialize sidebar:", error);
      } finally {
        setLoading(false);
      }
    };

    initSidebar();

    const handleMenuUpdate = () => {
      clearSidebarCache();
      initSidebar(true); // force re-fetch from backend
    };

    window.addEventListener("sidebar-menu-updated", handleMenuUpdate);
    return () => {
      window.removeEventListener("sidebar-menu-updated", handleMenuUpdate);
    };
  }, []); // ← empty deps: runs once on mount only

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
    return menus.filter(item => {
      const title = item.title.trim();
      if (seen.has(title)) return false;
      seen.add(title);
      return true;
    });
  }, [menus]);

  return (
    <Sidebar collapsible="icon" {...props} className="border-r border-zinc-100 shadow-none bg-white">
      <SidebarHeader className="h-[76px] flex items-center justify-start px-4 bg-white border-b border-zinc-50 group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:justify-center">
        <Link href="/dashboard" className="flex items-center gap-3 w-full group-data-[collapsible=icon]:justify-center mt-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#605DFF] text-white shadow-lg shadow-[#605DFF]/20 ml-1 group-data-[collapsible=icon]:ml-0 font-bold text-lg">
            <UtensilsCrossed/>
          </div>
          <div className="flex flex-col gap-0.5 group-data-[collapsible=icon]:hidden">
            <span className="font-bold text-lg tracking-tighter text-[#1E293B] uppercase leading-none">Restaurant</span>
            <span className="text-[9px] font-bold text-muted-foreground/50 tracking-widest uppercase leading-none">Management System</span>
          </div>
        </Link>
      </SidebarHeader>
      
      <SidebarContent className="bg-white px-4 pt-8 pb-4 gap-0">
        <SidebarGroup className="p-0">
          <SidebarMenu className="gap-1.5 group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:gap-4 group-data-[collapsible=icon]:px-0">
            {loading ? (
              [1, 2, 3, 4, 5, 6].map((i) => (
                <SidebarMenuItem key={i} className="w-full px-2">
                  <div className="h-11 w-full rounded-lg bg-zinc-50 animate-pulse" />
                </SidebarMenuItem>
              ))
            ) : (
              navItems.map((item) => {
                const Icon = getIcon(item.icon);
                const hasSubmenu = item.items && item.items.length > 0;
                const isOpen = openMenus[item.id];
                const itemUrl = normalizeUrl(item.url);
                const isChildActive = item.items?.some(sub => {
                  const subUrl = normalizeUrl(sub.url);
                  return pathname === subUrl || (pathname.startsWith(subUrl + "/") && subUrl !== "/dashboard");
                });
                const isActive = pathname === itemUrl || (pathname.startsWith(`${itemUrl}/`) && itemUrl !== "/dashboard") || isChildActive;
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
                              ? "bg-[#F3F4FF] text-[#1E293B]" 
                              : "text-[#64748B] hover:bg-zinc-50 hover:text-[#1E293B]",
                            "group-data-[collapsible=icon]:!p-0 group-data-[collapsible=icon]:h-10 group-data-[collapsible=icon]:w-10 group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:justify-center"
                          )}
                        >
                          <Icon className={cn("size-5 shrink-0 group-data-[collapsible=icon]:size-4", (isActive || isOpen) ? "text-[#1E293B]" : "text-[#94A3B8]")} strokeWidth={2} />
                          <span className="ml-3 flex-1 group-data-[collapsible=icon]:hidden whitespace-nowrap overflow-hidden text-ellipsis">{displayTitle}</span>
                          <ChevronRight className={cn("ml-auto size-3.5 shrink-0 transition-transform duration-300 opacity-40 group-data-[collapsible=icon]:hidden", isOpen && "rotate-90")} />
                        </SidebarMenuButton>
                        {isOpen && (
                          <SidebarMenuSub className="ml-8 border-none pl-0 mt-1 py-1 gap-1 group-data-[collapsible=icon]:hidden">
                            {item.items?.map((sub) => {
                              const subUrl = normalizeUrl(sub.url);
                              const isSubActive = pathname === subUrl || (pathname.startsWith(subUrl + "/") && subUrl !== "/dashboard");
                              return (
                                <SidebarMenuSubItem key={sub.id}>
                                  <SidebarMenuSubButton 
                                    render={<Link href={subUrl} />}
                                    isActive={isSubActive}
                                    className={cn(
                                      "font-medium text-[14.5px] h-10 transition-all rounded-md pl-4 pr-3 w-full", 
                                      isSubActive 
                                        ? "text-[#1E293B] bg-[#F3F4FF]/50" 
                                        : "text-[#64748B] hover:text-[#1E293B] hover:bg-zinc-50/50"
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
                            ? "bg-[#F3F4FF] text-[#1E293B]" 
                            : "text-[#64748B] hover:bg-zinc-50 hover:text-[#1E293B]",
                          "group-data-[collapsible=icon]:!p-0 group-data-[collapsible=icon]:h-10 group-data-[collapsible=icon]:w-10 group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:justify-center"
                        )}
                      >
                        <div className="flex items-center w-full justify-start group-data-[collapsible=icon]:justify-center">
                          <Icon className={cn("size-5 shrink-0 group-data-[collapsible=icon]:size-4", isActive ? "text-[#1E293B]" : "text-[#94A3B8]")} strokeWidth={2} />
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
      
      <SidebarFooter className="p-3 bg-white border-t border-zinc-50">
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
