"use client";

import Link from "next/link";
import {
  ChefHat,
  CircleDollarSign,
  History,
  LogOut,
  ShoppingCart,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { STATIC_APP_LOGO } from "@/lib/branding";

type PosSidebarNavProps = {
  pathname: string;
  cartCount: number;
  kitchenCount: number;
  onLogout?: () => void;
};

function SideBadge({
  count,
  active,
  className,
}: {
  count: number;
  active?: boolean;
  className?: string;
}) {
  if (count <= 0) return null;
  return (
    <span
      className={cn(
        "absolute top-1.5 right-1.5 min-w-[15px] h-[15px] px-0.5 rounded-full text-[8px] font-bold flex items-center justify-center",
        active ? "bg-primary text-white" : className ?? "bg-white text-primary"
      )}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}

function SideNavLink({
  href,
  label,
  icon: Icon,
  active,
  badge,
  badgeClass,
}: {
  href: string;
  label: string;
  icon: LucideIcon;
  active?: boolean;
  badge?: number;
  badgeClass?: string;
}) {
  return (
    <Link
      href={href}
      title={label}
      aria-label={label}
      aria-current={active ? "page" : undefined}
      className={cn(
        "relative w-full flex items-center justify-center py-3 transition-colors",
        active ? "bg-white text-primary" : "text-white hover:bg-white/10"
      )}
    >
      <Icon className="size-6" strokeWidth={2} />
      {badge !== undefined && (
        <SideBadge count={badge} active={active} className={badgeClass} />
      )}
    </Link>
  );
}

function SideNavButton({
  label,
  icon: Icon,
  onClick,
  compact,
}: {
  label: string;
  icon: LucideIcon;
  onClick: () => void;
  compact?: boolean;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className={cn(
        "w-full flex items-center justify-center text-white/60 hover:bg-white/10 hover:text-white transition-colors",
        compact ? "py-2" : "py-2.5"
      )}
    >
      <Icon className={cn(compact ? "size-4" : "size-5")} strokeWidth={2} />
    </button>
  );
}

/** Vertical POS sidebar — logo aligns with header; nav starts with main content. */
export default function PosSidebarNav({
  pathname,
  cartCount,
  kitchenCount,
  onLogout,
}: PosSidebarNavProps) {
  return (
    <aside
      aria-label="POS navigation"
      className="w-[68px] shrink-0 flex flex-col bg-primary border-r border-primary/80 shadow-xl z-50"
    >
      {/* Logo — same height as top header (h-14) */}
      <div className="shrink-0 h-14 flex items-center justify-center border-b border-white/15 bg-primary">
        <Link href="/pos-terminal" className="hover:opacity-90 transition-opacity">
          <img
            src={STATIC_APP_LOGO}
            alt="POS"
            className="h-8 w-8 object-contain brightness-0 invert"
          />
        </Link>
      </div>

      {/* Extra offset — nav starts lower, aligned with product area */}
      <div className="shrink-0 pt-6 md:pt-8" aria-hidden />

      {/* Main nav */}
      <div className="flex flex-col flex-1 min-h-0">
        <SideNavLink
          href="/pos-terminal"
          label="POS Terminal"
          icon={ShoppingCart}
          active={pathname === "/pos-terminal"}
          badge={cartCount}
        />
        
        <SideNavLink
          href="/kitchen"
          label="Kitchen"
          icon={ChefHat}
          active={pathname === "/kitchen"}
          badge={kitchenCount}
          badgeClass="bg-orange-400 text-white"
        />
        <SideNavLink
          href="/ready-orders"
          label="Order history"
          icon={History}
          active={pathname === "/ready-orders"}
        />

<SideNavLink
          href="/my-sales"
          label="My Sales"
          icon={CircleDollarSign}
          active={pathname === "/my-sales"}
        />
      </div>

      {/* Bottom — logout only */}
      <div className="shrink-0 flex flex-col border-t border-white/15 pb-1">
        {onLogout && (
          <SideNavButton label="Log out" icon={LogOut} onClick={onLogout} compact />
        )}
      </div>
    </aside>
  );
}
