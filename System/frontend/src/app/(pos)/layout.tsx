"use client";

import React, { useEffect, useState } from "react";
import { authApi, AuthUser } from "@/lib/api/authApi";
import { 
  UtensilsCrossed, 
  LogOut, 
  User,
  User as UserIcon,
  ChevronDown,
  FileText,
  Settings2,
  Clock,
  Calculator,
  Maximize,
  RotateCw,
  CircleDollarSign,
  Wallet,
  ShoppingCart,
  Printer,
  History
} from "lucide-react";
import { ToastProvider } from "@/components/ui/toast";
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
  const [user, setUser] = useState<AuthUser | null>(null);
  const [time, setTime] = useState(new Date());
  const [cartCount, setCartCount] = useState(0);
  const [heldCount, setHeldCount] = useState(0);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    authApi.getMe().then(setUser).catch(() => {
      window.location.href = "/login";
    });

    const interval = setInterval(() => setTime(new Date()), 1000);

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
    
    const handleCartEvent = (e: any) => setCartCount(e.detail);
    const handleHeldEvent = (e: any) => setHeldCount(e.detail);
    
    window.addEventListener('cart-updated', handleCartEvent);
    window.addEventListener('held-updated', handleHeldEvent);
    window.addEventListener('storage', updateCountFromStorage);

    return () => {
      clearInterval(interval);
      window.removeEventListener('cart-updated', handleCartEvent);
      window.removeEventListener('held-updated', handleHeldEvent);
      window.removeEventListener('storage', updateCountFromStorage);
    };
  }, []);

  const formatTime = (date: Date) =>
    date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

  const formatDate = (date: Date) =>
    date.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "short", day: "numeric" });

  return (
    <ToastProvider>
      <div className="flex flex-col h-screen bg-[#f8f9fc] font-sans overflow-hidden">
        {/* POS Header */}
        <header className="h-[56px] shrink-0 bg-white border-b border-gray-200 flex items-center px-6 gap-6 shadow-sm z-50">
          {/* Logo */}
          <Link href="/pos-terminal" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 bg-[#605DFF] rounded-lg flex items-center justify-center shadow-sm">
              <UtensilsCrossed className="size-4 text-white" />
            </div>
            <div>
              <span className="text-[13px] font-black text-[#1E293B] uppercase tracking-tight">Restaurant</span>
              <span className="block text-[9px] font-bold text-gray-400 uppercase tracking-widest leading-none">POS Terminal</span>
            </div>
          </Link>

          <div className="w-px h-6 bg-gray-200" />

          {/* Clock */}
          <div className="flex items-center gap-2 text-gray-500">
            <Clock className="size-4 text-[#605DFF]" />
            <div>
              <span className="text-[13px] font-bold text-[#1E293B] tabular-nums">
                {isMounted ? formatTime(time) : "--:--:--"}
              </span>
              <span className="text-[10px] text-gray-400 ml-2">
                {isMounted ? formatDate(time) : "Loading..."}
              </span>
            </div>
          </div>

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
                pathname === '/pos-terminal' ? "bg-[#605DFF] text-white border-[#605DFF] shadow-sm" : 
                cartCount > 0 ? "bg-[#605DFF]/10 text-[#605DFF] border-[#605DFF]/20" : "bg-gray-50 text-gray-400 border-gray-100 hover:bg-gray-100"
              )}
            >
              <ShoppingCart className="size-4" />
              {cartCount > 0 && (
                <span className={cn("absolute -top-1.5 -right-1.5 text-[9px] font-black h-4 w-4 flex items-center justify-center rounded-full shadow-md border",
                  pathname === '/pos-terminal' ? "bg-white text-[#605DFF] border-[#605DFF]" : "bg-[#605DFF] text-white border-white"
                )}>
                  {cartCount}
                </span>
              )}
            </Link>

            <Link 
              href="/my-sales" 
              className={cn(
                "size-8 rounded-xl flex items-center justify-center transition-all border group",
                pathname === '/my-sales' ? "bg-[#605DFF] text-white border-[#605DFF] shadow-sm" : "bg-gray-50 text-gray-400 border-gray-100 hover:bg-[#605DFF] hover:text-white"
              )}
            >
              <CircleDollarSign className="size-4" />
            </Link>

            <button 
              onClick={() => window.print()}
              className="size-8 rounded-xl bg-gray-50 text-gray-400 flex items-center justify-center hover:bg-gray-100 transition-all border border-gray-100"
            >
              <Printer className="size-4" />
            </button>

            {/* Held Orders Button */}
            <button 
              onClick={() => window.dispatchEvent(new CustomEvent('open-held-orders'))}
              className={cn(
                "size-8 rounded-xl flex items-center justify-center transition-all relative border",
                heldCount > 0 ? "bg-[#605DFF] text-white border-[#605DFF] shadow-sm" : "bg-gray-50 text-gray-400 border-gray-100"
              )}
            >
              <History className="size-4" />
              {heldCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-white text-[#605DFF] text-[9px] font-black h-4 w-4 flex items-center justify-center rounded-full shadow-md border border-[#605DFF]">
                  {heldCount}
                </span>
              )}
            </button>
            <button onClick={() => window.location.reload()} className="size-8 rounded-xl bg-gray-50 text-gray-500 flex items-center justify-center hover:bg-gray-100 transition-all border border-gray-100">
              <RotateCw className="size-4" />
            </button>
          </div>

          {/* User Info */}
          {user && (
            <div className="flex items-center gap-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 pl-1 cursor-pointer group outline-none bg-gray-50 border border-gray-100 hover:border-[#605DFF]/30 pr-3 py-1.5 rounded-xl transition-all">
                    <div className="w-8 h-8 rounded-xl bg-[#605DFF] text-white flex items-center justify-center text-[13px] font-bold shadow-sm overflow-hidden">
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
                    <ChevronDown className="w-3.5 h-3.5 ml-1 text-gray-400 group-hover:text-[#605DFF] transition-colors" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-64 mt-2 rounded-xl shadow-2xl border-gray-100" align="end">
                  <DropdownMenuLabel className="p-0 font-normal">
                    <div className="flex items-center gap-3 px-2 py-3 text-left text-sm">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#605DFF] text-white font-bold text-[15px] overflow-hidden">
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
                      <Link href="/my-profile" className="flex w-full items-center text-[11px] font-bold uppercase tracking-widest py-3 cursor-pointer text-gray-600 hover:text-[#605DFF] hover:bg-[#605DFF]/5 focus:text-[#605DFF] focus:bg-[#605DFF]/5">
                        <UserIcon className="mr-2.5 size-4" />
                        My Profile
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard/settings" className="flex w-full items-center text-[11px] font-bold uppercase tracking-widest py-3 cursor-pointer text-gray-600 hover:text-[#605DFF] hover:bg-[#605DFF]/5 focus:text-[#605DFF] focus:bg-[#605DFF]/5">
                        <Settings2 className="mr-2.5 size-4" />
                        Settings
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-[11px] font-bold uppercase tracking-widest py-3 cursor-pointer text-gray-600 hover:text-[#605DFF] hover:bg-[#605DFF]/5 focus:text-[#605DFF] focus:bg-[#605DFF]/5">
                      <FileText className="mr-2.5 size-4" />
                      Privacy Policy
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator className="bg-gray-100" />
                  <DropdownMenuItem
                    className="text-[11px] font-bold uppercase tracking-widest text-red-500 py-3 cursor-pointer hover:bg-red-50 hover:text-red-600 focus:bg-red-50 focus:text-red-600"
                    onClick={async () => {
                      await authApi.logout();
                    }}
                  >
                    <LogOut className="mr-2.5 size-4" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </header>

        {/* POS Content — full height */}
        <main className="flex-1 overflow-hidden">
          {children}
        </main>
      </div>
    </ToastProvider>
  );
}
