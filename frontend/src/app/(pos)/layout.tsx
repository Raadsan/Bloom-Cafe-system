"use client";

import React, { useCallback, useEffect, useState } from "react";
import { authApi, AuthUser } from "@/lib/api/authApi";
import {
  LogOut,
  User as UserIcon,
  ChevronDown,
  FileText,
  Settings2,
  Maximize,
  Printer,
  RotateCw,
} from "lucide-react";
import { dispatchPosSoftRefresh, onDebouncedEvent, ORDERS_CHANGED, POS_SOFT_REFRESH } from "@/lib/live-updates";
import { orderApi } from "@/lib/api/orderApi";
import { PermissionProvider } from "@/context/PermissionContext";
import PosSidebarNav from "@/components/pos/PosSidebarNav";
import PosHeaderNotifications from "@/components/pos/PosHeaderNotifications";
import { PosSearchProvider } from "@/context/PosSearchContext";
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

function PosLayoutInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [cartCount, setCartCount] = useState(0);
  const [kitchenCount, setKitchenCount] = useState(0);
  const [clock, setClock] = useState("");

  const syncCounts = useCallback(async () => {
    try {
      const counts = await orderApi.getQueueCounts();
      setKitchenCount(counts.kitchenCount);
    } catch {
      setKitchenCount(0);
    }
  }, []);

  useEffect(() => {
    const tick = () => {
      setClock(
        new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      );
    };
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const cached = authApi.getCachedUser();
    if (cached) setUser(cached);

    authApi.getMe().then(setUser).catch(() => {
      window.location.href = "/pos/login";
    });

    const handleProfileUpdate = () => {
      authApi.getMe(true).then(setUser).catch(() => {});
    };
    window.addEventListener("profile_updated", handleProfileUpdate);

    const updateCountFromStorage = () => {
      const saved = localStorage.getItem("pos-cart");
      if (saved) {
        try {
          const cart = JSON.parse(saved);
          setCartCount(cart.reduce((sum: number, i: { quantity?: number }) => sum + (i.quantity || 0), 0));
        } catch {
          setCartCount(0);
        }
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

    syncCounts();
    const removeOrdersListener = onDebouncedEvent(ORDERS_CHANGED, syncCounts, 700);
    const removePosRefresh = onDebouncedEvent(POS_SOFT_REFRESH, syncCounts, 400);

    return () => {
      window.removeEventListener("cart-updated", handleCartEvent);
      window.removeEventListener("storage", updateCountFromStorage);
      window.removeEventListener("profile_updated", handleProfileUpdate);
      removeOrdersListener();
      removePosRefresh();
    };
  }, [syncCounts]);

  return (
    <PermissionProvider>
      <div className="flex h-screen bg-[#eef1f7] dark:bg-[#121212] font-sans overflow-hidden">
        <PosSidebarNav
          pathname={pathname}
          cartCount={cartCount}
          kitchenCount={kitchenCount}
          onLogout={() => authApi.logout("/pos/login")}
        />

        <div className="flex flex-col flex-1 min-w-0 min-h-0">
          <header className="h-14 shrink-0 bg-white dark:bg-[#1a1a1a] border-b border-zinc-200/80 dark:border-zinc-800 flex items-center px-5 gap-4 shadow-sm z-40">
            <div className="flex items-center gap-3 text-sm">
              <span className="font-semibold text-zinc-700 dark:text-zinc-200">Bloom POS</span>
              <span className="text-zinc-300">|</span>
              <span className="text-zinc-500 tabular-nums">{clock}</span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-semibold border border-emerald-200">
                <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Online
              </span>
            </div>

            <div className="flex-1 min-w-0" />

            <PosHeaderNotifications />

            <button
              type="button"
              onClick={() => {
                dispatchPosSoftRefresh();
                syncCounts();
              }}
              className="size-9 rounded-lg text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center justify-center transition-colors"
              title="Refresh"
              aria-label="Refresh"
            >
              <RotateCw className="size-4" />
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              className="size-9 rounded-lg text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center justify-center transition-colors"
              title="Print"
              aria-label="Print"
            >
              <Printer className="size-4" />
            </button>

            <button
              type="button"
              onClick={() => {
                if (!document.fullscreenElement) document.documentElement.requestFullscreen();
                else document.exitFullscreen();
              }}
              className="size-9 rounded-lg text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center justify-center transition-colors"
              title="Fullscreen"
              aria-label="Fullscreen"
            >
              <Maximize className="size-4" />
            </button>

            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 pl-1 cursor-pointer outline-none bg-zinc-50 border border-zinc-200 hover:border-primary/30 pr-3 py-1.5 rounded-xl transition-all">
                    <div className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center text-[13px] font-bold overflow-hidden">
                      {user.avatarUrl ? (
                        <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        user.fullName?.charAt(0) || "U"
                      )}
                    </div>
                    <div className="hidden md:flex flex-col items-start text-left">
                      <span className="text-[11px] font-bold text-zinc-800 leading-tight">{user.fullName}</span>
                      <span className="text-[10px] text-zinc-400 uppercase">{user.role}</span>
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 rounded-xl" align="end">
                  <DropdownMenuLabel className="font-normal text-xs">{user.fullName}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuItem asChild>
                      <Link href="/my-profile" className="cursor-pointer">
                        <UserIcon className="mr-2 size-4" />
                        My Profile
                      </Link>
                    </DropdownMenuItem>
                    {user.role?.toLowerCase() === "admin" && (
                      <DropdownMenuItem asChild>
                        <Link href="/receipt-settings" className="cursor-pointer">
                          <Settings2 className="mr-2 size-4" />
                          Receipt Settings
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem>
                      <FileText className="mr-2 size-4" />
                      Policy
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-red-600 cursor-pointer"
                    onClick={() => authApi.logout("/pos/login")}
                  >
                    <LogOut className="mr-2 size-4" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </header>

          <main className="pos-scope flex-1 min-h-0 overflow-hidden">{children}</main>
        </div>
      </div>
    </PermissionProvider>
  );
}

export default function PosLayout({ children }: { children: React.ReactNode }) {
  return (
    <PosSearchProvider>
      <PosLayoutInner>{children}</PosLayoutInner>
    </PosSearchProvider>
  );
}
