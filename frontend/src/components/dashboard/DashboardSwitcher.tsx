"use client";

import { usePathname, useRouter } from "next/navigation";
import { Check, ChevronDown, Landmark, LayoutGrid, Store } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { workspaceFromPath } from "@/lib/workspaces";

const dashboards = [
  { key: "CORE", label: "Main Dashboard", href: "/dashboard", icon: LayoutGrid },
  { key: "RESTAURANT", label: "Restaurant Dashboard", href: "/restaurant/dashboard", icon: Store },
  { key: "ACCOUNTING", label: "Accounting Dashboard", href: "/accounting/dashboard", icon: Landmark },
] as const;

export function DashboardSwitcher() {
  const pathname = usePathname();
  const router = useRouter();
  const workspace = workspaceFromPath(pathname);
  const active = dashboards.find((item) => item.key === workspace) ?? dashboards[0];
  const ActiveIcon = active.icon;

  return (
    <div className="flex items-center justify-end gap-3">
      <span className="hidden text-[9px] font-bold uppercase tracking-[0.22em] text-muted-foreground sm:block">
        Dashboards
      </span>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="flex h-10 w-full min-w-0 items-center gap-2 rounded-full border border-border bg-background px-3 text-xs font-semibold text-foreground shadow-sm outline-none transition-colors hover:border-primary/30 hover:bg-muted/40 sm:w-auto sm:min-w-[220px]"
          >
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <ActiveIcon className="size-3.5" />
            </span>
            <span className="flex-1 truncate text-left">{active.label}</span>
            <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64 rounded-xl p-1.5 shadow-xl">
          <DropdownMenuLabel className="px-2 py-1.5 text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
            Select dashboard
          </DropdownMenuLabel>
          {dashboards.map((option) => {
            const Icon = option.icon;
            const selected = option.key === workspace;
            return (
              <DropdownMenuItem
                key={option.href}
                onSelect={() => router.push(option.href)}
                className="flex cursor-pointer items-center gap-3 rounded-lg px-2.5 py-2.5"
              >
                <span className={cn("flex size-8 items-center justify-center rounded-lg", selected ? "bg-primary text-white" : "bg-muted text-muted-foreground")}>
                  <Icon className="size-4" />
                </span>
                <span className="flex-1 text-xs font-semibold">{option.label}</span>
                {selected && <Check className="size-4 text-primary" />}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
