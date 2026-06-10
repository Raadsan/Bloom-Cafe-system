"use client";

import { UtensilsCrossed } from "lucide-react";
import { cn } from "@/lib/utils";

type SystemBrandMarkProps = {
  logoUrl?: string | null;
  systemName?: string;
  size?: "sm" | "md";
  className?: string;
};

export default function SystemBrandMark({
  logoUrl,
  systemName = "Restaurant",
  size = "md",
  className,
}: SystemBrandMarkProps) {
  const box =
    size === "sm"
      ? "w-8 h-8 rounded-lg"
      : "h-10 w-10 rounded-lg ml-1 group-data-[collapsible=icon]:ml-0";

  if (logoUrl) {
    return (
      <div
        className={cn(
          box,
          "shrink-0 overflow-hidden border border-border bg-white dark:bg-[#161616] shadow-sm",
          className
        )}
      >
        <img
          src={logoUrl}
          alt={systemName}
          className="w-full h-full object-contain p-0.5"
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        box,
        "shrink-0 flex items-center justify-center bg-primary text-white shadow-lg shadow-primary/20 font-bold",
        size === "md" ? "text-lg" : "text-sm",
        className
      )}
    >
      <UtensilsCrossed className={size === "sm" ? "size-4" : "size-5"} />
    </div>
  );
}
