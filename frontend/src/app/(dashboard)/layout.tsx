"use client";

import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Bell, Search, Sun, ChevronDown, LogOut, User as UserIcon, FileText, Settings2 } from "lucide-react";
import { authApi, AuthUser } from "@/lib/api/authApi";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { PermissionProvider } from "@/context/PermissionContext";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await authApi.getMe();
        setUser(currentUser);
      } catch (error) {
        console.error("Failed to load user session", error);
      }
    };
    
    fetchUser();

    // Listen for profile updates
    const handleProfileUpdate = () => {
      fetchUser();
    };

    window.addEventListener('profile_updated', handleProfileUpdate);
    return () => {
      window.removeEventListener('profile_updated', handleProfileUpdate);
    };
  }, []);

  return (
    <SidebarProvider defaultOpen={true} style={{ "--sidebar-width": "16rem", "--sidebar-width-icon": "5.5rem" } as React.CSSProperties}>
      <PermissionProvider>
        <AppSidebar />

        <SidebarInset className="bg-[#F8F9FA] dark:bg-zinc-950/50">
          {/* Top Header - Trezo Style */}
          <header className="flex h-[80px] shrink-0 items-center gap-4 border-b bg-white/80 backdrop-blur-md px-6 sticky top-0 z-30 transition-all duration-300">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="-ml-1 text-muted-foreground hover:text-primary transition-colors" />
              <div className="hidden md:flex items-center gap-2 ml-4">
                <h1 className="text-[14px] font-semibold text-[#1E293B]">Dashboard</h1>
                <span className="text-muted-foreground/30 text-xs">/</span>
                <span className="text-[13px] font-medium text-muted-foreground">Main</span>
              </div>
            </div>

            <div className="flex-1 flex justify-center max-w-2xl mx-auto">
              <div className="relative w-full group">
                <Search className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <input
                  type="text"
                  placeholder="Search anything... (Cmd + K)"
                  className="w-full h-9 pl-9 pr-4 text-xs bg-muted/40 border border-transparent focus:border-primary/20 focus:bg-background rounded-full focus:outline-none transition-all shadow-none focus:shadow-sm"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-full group">
                      <Bell className="w-4.5 h-4.5 text-muted-foreground group-hover:text-foreground group-hover:scale-110 transition-all" />
                      <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-primary rounded-full ring-2 ring-background"></span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-80 mt-2 rounded-xl shadow-2xl border-border/50 p-0 overflow-hidden" align="end">
                    <div className="bg-muted/50 p-4 border-b border-border flex items-center justify-between">
                      <h3 className="text-xs font-black uppercase tracking-widest text-foreground">Notifications</h3>
                      <span className="text-[9px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full uppercase">3 New</span>
                    </div>
                    <div className="max-h-[300px] overflow-auto">
                      <div className="p-8 text-center">
                        <Bell className="size-8 text-muted-foreground/10 mx-auto mb-2" />
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">No new notifications</p>
                      </div>
                    </div>
                    <DropdownMenuSeparator className="m-0" />
                    <Link href="/config/notifications" className="block p-3 text-center text-[10px] font-black uppercase tracking-[0.2em] text-primary hover:bg-muted transition-colors">
                      View All Notifications
                    </Link>
                  </DropdownMenuContent>
                </DropdownMenu>

                <ThemeToggle />
              </div>

              <div className="h-4 w-px bg-border/60 mx-1"></div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-3 pl-1 cursor-pointer group outline-none">
                    <div className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[15px] font-medium shadow-sm shadow-primary/20 transition-all group-hover:ring-2 group-hover:ring-primary/20 group-hover:scale-105 overflow-hidden">
                      {user?.avatarUrl ? (
                        <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        user?.fullName?.charAt(0) || "U"
                      )}
                    </div>
                    <div className="hidden lg:flex flex-col items-start gap-0.5 text-left">
                      <span className="text-[12px] font-bold uppercase tracking-tight text-foreground leading-tight">{user?.fullName}</span>
                      <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground leading-tight">{user?.role}</span>
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 ml-1 text-muted-foreground group-hover:text-foreground transition-colors" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-72 mt-2 rounded-xl shadow-2xl border-border/50" align="end">
                  <DropdownMenuLabel className="p-0 font-normal">
                    <div className="flex items-center gap-2 px-2 py-2.5 text-left text-sm">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground font-medium text-[15px] overflow-hidden">
                        {user?.avatarUrl ? (
                          <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          user?.fullName?.charAt(0) || "U"
                        )}
                      </div>
                      <div className="grid flex-1 text-left text-xs leading-tight">
                        <span className="truncate font-medium uppercase tracking-tight">{user?.fullName}</span>
                        <span className="truncate text-[11.5px] font-normal uppercase tracking-widest text-muted-foreground">{user?.role}</span>
                        <span className="truncate text-[10.5px] font-normal text-muted-foreground/80">{user?.email}</span>
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuItem asChild>
                      <Link href="/profile" className="flex w-full items-center text-xs font-bold uppercase tracking-widest py-2.5 cursor-pointer">
                        <UserIcon className="mr-2 size-4" />
                        Profile
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/settings" className="flex w-full items-center text-xs font-bold uppercase tracking-widest py-2.5 cursor-pointer">
                        <Settings2 className="mr-2 size-4" />
                        Settings
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-xs font-bold uppercase tracking-widest py-2.5 cursor-pointer">
                      <FileText className="mr-2 size-4" />
                      Policy
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-xs font-bold uppercase tracking-widest text-destructive py-2.5 cursor-pointer"
                    onClick={async () => {
                      await authApi.logout();
                    }}
                  >
                    <LogOut className="mr-2 size-4" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          {/* Page Content */}
          <main className="flex-1 overflow-auto">
            <div className="py-4 px-4 md:px-6 lg:px-8">
              <div className="w-full mx-auto">
                {children}
              </div>
            </div>
          </main>
        </SidebarInset>
      </PermissionProvider>
    </SidebarProvider>
  );
}
