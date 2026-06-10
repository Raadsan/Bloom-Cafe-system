"use client";

import React, { useEffect, useState } from "react";
import { authApi, AuthUser } from "@/lib/api/authApi";
import { 
  LogOut, 
  User,
  User as UserIcon,
  ChevronDown,
  FileText,
  Settings2,
  Calculator,
  Maximize,
  CircleDollarSign,
  Wallet,
  ShoppingCart,
  Printer,
  RotateCw,
  Bell
} from "lucide-react";
import { onDebouncedEvent, ORDERS_CHANGED } from "@/lib/live-updates";
import { orderApi } from "@/lib/api/orderApi";
import { matchesReadyAudience } from "@/lib/order-type-utils";
import { ToastProvider } from "@/components/ui/toast";
import { ThemeToggle } from "@/components/theme-toggle";
import { useSystemBranding } from "@/hooks/use-system-branding";
import SystemBrandMark from "@/components/branding/SystemBrandMark";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function PosLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { branding } = useSystemBranding();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [cartCount, setCartCount] = useState(0);
  const [readyCount, setReadyCount] = useState(0);

  useEffect(() => {
    authApi.getMe().then(setUser).catch(() => {
      window.location.href = "/login";
    });

    const handleProfileUpdate = () => {
      authApi.getMe(true).then(setUser).catch(() => {});
    };
    window.addEventListener("profile_updated", handleProfileUpdate);

    const updateCountFromStorage = () => {
      const saved = localStorage.getItem('pos-cart');
      if (saved) {
        try {
          const cart = JSON.parse(saved);
          setCartCount(cart.reduce((sum: number, i: any) => sum + i.quantity, 0));
        } catch (e) { setCartCount(0); }
      } else {
        setCartCount(0);
      }
    };

    updateCountFromStorage();
    
    const handleCartEvent = (e: Event) => {
      const detail = (e as CustomEvent<number>).detail;
      if (typeof detail === "number") setCartCount(detail);
    };

    window.addEventListener("cart-updated", handleCartEvent);
    window.addEventListener("storage", updateCountFromStorage);

    const syncReadyCount = async () => {
      try {
        const data = await orderApi.getAllOrders({ posQueue: true }, true);
        setReadyCount(
          (data || []).filter(
            order => matchesReadyAudience(order, "pos") && order.status === "ready"
          ).length
        );
      } catch {
        setReadyCount(0);
      }
    };

    syncReadyCount();
    const removeOrdersListener = onDebouncedEvent(ORDERS_CHANGED, () => {
      syncReadyCount();
    }, 700);

    return () => {
      window.removeEventListener("cart-updated", handleCartEvent);
      window.removeEventListener("storage", updateCountFromStorage);
      window.removeEventListener("profile_updated", handleProfileUpdate);
      removeOrdersListener();
    };
  }, []);

  return (
    <ToastProvider>
      <div className="flex flex-col h-screen bg-zinc-50 dark:bg-[#161616] font-sans overflow-hidden">
        {/* POS Header */}
        <header className="h-[56px] shrink-0 bg-white dark:bg-[#161616] border-b border-gray-200 dark:border-[#2a2a2a] flex items-center px-6 gap-6 shadow-sm z-50">
          {/* Logo */}
          <Link href="/pos-terminal" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity min-w-0">
            <SystemBrandMark
              logoUrl={branding.systemLogoUrl}
              systemName={branding.systemName}
              size="sm"
            />
            <div className="min-w-0">
              <span className="text-[13px] font-black text-[#1E293B] dark:text-zinc-100 uppercase tracking-tight truncate block">
                {branding.systemName}
              </span>
              <span className="block text-[9px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-widest leading-none truncate">
                {branding.systemTagline || "POS Terminal"}
              </span>
            </div>
          </Link>

          <div className="flex-1" />
          
          {/* Utility Icons */}
          <div className="flex items-center gap-1.5 mr-4 border-r border-gray-100 pr-4 shrink-0">
            {/* Cart Button (Link to POS Terminal) */}

            <button 
              onClick={() => {
                if (!document.fullscreenElement) document.documentElement.requestFullscreen();
                else document.exitFullscreen();
              }}
              className="size-8 rounded-xl bg-gray-50 text-gray-500 flex items-center justify-center hover:bg-gray-100 transition-all border border-gray-100"
            >
              <Maximize className="size-4" />
            </button>
            <Link 
              href="/pos-terminal"
              className={cn(
                "size-8 rounded-xl flex items-center justify-center transition-all relative border",
                pathname === '/pos-terminal' ? "bg-primary text-white border-primary shadow-sm" : 
                cartCount > 0 ? "bg-primary/10 text-primary border-primary/20" : "bg-gray-50 text-gray-400 border-gray-100 hover:bg-gray-100"
              )}
            >
              <ShoppingCart className="size-4" />
              {cartCount > 0 && (
                <span className={cn("absolute -top-1.5 -right-1.5 text-[9px] font-black h-4 w-4 flex items-center justify-center rounded-full shadow-md border",
                  pathname === '/pos-terminal' ? "bg-white text-primary border-primary" : "bg-primary text-white border-white"
                )}>
                  {cartCount}
                </span>
              )}
            </Link>

            <Link 
              href="/my-sales" 
              className={cn(
                "size-8 rounded-xl flex items-center justify-center transition-all border group",
                pathname === '/my-sales' ? "bg-primary text-white border-primary shadow-sm" : "bg-gray-50 text-gray-400 border-gray-100 hover:bg-primary hover:text-white"
              )}
            >
              <CircleDollarSign className="size-4" />
            </Link>

            <Link
              href="/ready-orders"
              className={cn(
                "size-8 rounded-xl flex items-center justify-center transition-all relative border",
                pathname === "/ready-orders"
                  ? "bg-primary text-white border-primary shadow-sm"
                  : readyCount > 0
                    ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                    : "bg-gray-50 text-gray-400 border-gray-100 hover:bg-gray-100"
              )}
              title="Ready orders"
            >
              <Bell className="size-4" />
              <span
                className={cn(
                  "absolute -top-1.5 -right-1.5 min-w-4 h-4 px-0.5 rounded-full text-[9px] font-bold flex items-center justify-center",
                  readyCount > 0
                    ? "bg-emerald-600 text-white"
                    : "bg-muted text-muted-foreground border border-border"
                )}
              >
                {readyCount}
              </span>
            </Link>

            <button 
              onClick={() => window.print()}
              className="size-8 rounded-xl bg-gray-50 text-gray-400 flex items-center justify-center hover:bg-gray-100 transition-all border border-gray-100"
            >
              <Printer className="size-4" />
            </button>

            <button
              type="button"
              onClick={() => window.location.reload()}
              className="size-8 rounded-xl bg-gray-50 text-gray-400 flex items-center justify-center hover:bg-gray-100 transition-all border border-gray-100"
              title="Refresh"
            >
              <RotateCw className="size-4" />
            </button>
          </div>

          <ThemeToggle />

          {/* User Info */}
          {user && (
            <div className="flex items-center gap-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 pl-1 cursor-pointer group outline-none bg-gray-50 border border-gray-100 hover:border-primary/30 pr-3 py-1.5 rounded-xl transition-all">
                    <div className="w-8 h-8 rounded-xl bg-primary text-white flex items-center justify-center text-[13px] font-bold shadow-sm overflow-hidden">
                      {user?.avatarUrl ? (
                        <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        user?.fullName?.charAt(0) || "U"
                      )}
                    </div>
                    <div className="hidden lg:flex flex-col items-start gap-0.5 text-left ml-1">
                      <span className="text-[12px] font-bold uppercase tracking-tight text-[#1E293B] leading-tight">{user?.fullName}</span>
                      <span className="text-[10px] font-medium uppercase tracking-widest text-gray-500 leading-tight">{user?.role}</span>
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 ml-1 text-gray-400 group-hover:text-primary transition-colors" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-64 mt-2 rounded-xl shadow-2xl border-gray-100" align="end">
                  <DropdownMenuLabel className="p-0 font-normal">
                    <div className="flex items-center gap-3 px-2 py-3 text-left text-sm">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white font-bold text-[15px] overflow-hidden">
                        {user?.avatarUrl ? (
                          <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          user?.fullName?.charAt(0) || "U"
                        )}
                      </div>
                      <div className="grid flex-1 text-left text-xs leading-tight">
                        <span className="truncate font-bold uppercase tracking-tight text-[#1E293B]">{user?.fullName}</span>
                        <span className="truncate text-[10px] font-black uppercase tracking-widest text-gray-400 mt-0.5">{user?.role}</span>
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-gray-100" />
                  <DropdownMenuGroup>
                    <DropdownMenuItem asChild>
                      <Link href="/my-profile" className="flex w-full items-center text-[11px] font-bold uppercase tracking-widest py-3 cursor-pointer text-gray-600 hover:text-primary hover:bg-primary/5 focus:text-primary focus:bg-primary/5">
                        <UserIcon className="mr-2.5 size-4" />
                        My Profile
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard/settings" className="flex w-full items-center text-[11px] font-bold uppercase tracking-widest py-3 cursor-pointer text-gray-600 hover:text-primary hover:bg-primary/5 focus:text-primary focus:bg-primary/5">
                        <Settings2 className="mr-2.5 size-4" />
                        Settings
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-[11px] font-bold uppercase tracking-widest py-3 cursor-pointer text-gray-600 hover:text-primary hover:bg-primary/5 focus:text-primary focus:bg-primary/5">
                      <FileText className="mr-2.5 size-4" />
                      Privacy Policy
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator className="bg-gray-100" />
                  <DropdownMenuItem
                    className="text-[11px] font-bold uppercase tracking-widest text-red-500 dark:text-white py-3 cursor-pointer hover:bg-red-50 dark:hover:bg-white/10 hover:text-red-600 dark:hover:text-white focus:bg-red-50 dark:focus:bg-white/10 focus:text-red-600 dark:focus:text-white"
                    onClick={async () => {
                      await authApi.logout();
                    }}
                  >
                    <LogOut className="mr-2.5 size-4 dark:text-white" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </header>

        {/* POS Content — full height */}
        <main className="pos-scope flex-1 overflow-hidden">
          {children}
        </main>
      </div>
    </ToastProvider>
  );
}
