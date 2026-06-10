"use client";

import React from "react";
import { CheckCircle2, Phone, Save, User } from "lucide-react";
import { Customer } from "@/lib/api/customerApi";
import { cn } from "@/lib/utils";

function getInitial(name?: string) {
  const n = (name || "G").trim();
  return n.charAt(0).toUpperCase();
}

function DetailRow({
  label,
  children,
  value,
}: {
  label: string;
  children?: React.ReactNode;
  value?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 text-sm">
      <span className="font-semibold text-zinc-700 shrink-0">{label}</span>
      {children ? (
        <div className="flex-1 min-w-0 text-right">{children}</div>
      ) : (
        <span className="text-zinc-500 text-right break-all">{value || "—"}</span>
      )}
    </div>
  );
}

interface PosCustomerProfileCardProps {
  variant?: "full" | "compact";
  customerName: string;
  customerPhone: string;
  selectedCustomer: number | null;
  selectPhoneOptions: Customer[];
  orderTypeLabel: string;
  locationLabel: string;
  onNameChange: (value: string) => void;
  onPhoneChange: (value: string) => void;
  onPhoneBlur: () => void;
  onSelectCustomer: (customerId: string) => void;
  onSave?: () => void;
  onCall?: () => void;
  className?: string;
}

export default function PosCustomerProfileCard({
  variant = "full",
  customerName,
  customerPhone,
  selectedCustomer,
  selectPhoneOptions,
  orderTypeLabel,
  locationLabel,
  onNameChange,
  onPhoneChange,
  onPhoneBlur,
  onSelectCustomer,
  onSave,
  onCall,
  className,
}: PosCustomerProfileCardProps) {
  const displayName = customerName.trim() || "Walk-in Guest";
  const isCompact = variant === "compact";

  return (
    <div
      className={cn(
        "rounded-2xl border border-zinc-100 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.08)] overflow-hidden",
        className
      )}
    >
      <div className={cn("flex items-start gap-4", isCompact ? "p-4" : "p-5")}>
        <div className="relative shrink-0">
          <div
            className={cn(
              "rounded-full bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center font-bold text-primary border-2 border-white shadow-md",
              isCompact ? "size-12 text-base" : "size-16 text-xl"
            )}
          >
            {customerName.trim() ? (
              getInitial(customerName)
            ) : (
              <User className={isCompact ? "size-5" : "size-7"} strokeWidth={2} />
            )}
          </div>
          {selectedCustomer && (
            <span className="absolute -bottom-0.5 -right-0.5 size-5 rounded-full bg-amber-400 border-2 border-white flex items-center justify-center">
              <CheckCircle2 className="size-3 text-white" />
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0 pt-0.5">
          {isCompact ? (
            <>
              <p className="text-base font-bold text-zinc-900 truncate">{displayName}</p>
              <p className="text-xs text-zinc-400 mt-0.5 truncate">{orderTypeLabel}</p>
            </>
          ) : (
            <>
              <input
                type="text"
                value={customerName}
                onChange={e => onNameChange(e.target.value)}
                placeholder="Customer name"
                className="w-full text-xl font-bold text-zinc-900 bg-transparent border-0 p-0 focus:outline-none focus:ring-0 placeholder:text-zinc-300"
              />
              <p className="text-sm text-zinc-400 mt-0.5">{orderTypeLabel}</p>
            </>
          )}
        </div>
      </div>

      <div className="border-t border-zinc-100 mx-4 sm:mx-5" />

      <div className={cn("space-y-3", isCompact ? "px-4 py-3" : "px-5 py-4")}>
        {isCompact ? (
          <>
            <DetailRow label="Phone:" value={customerPhone || "—"} />
            <DetailRow label="Location:" value={locationLabel} />
          </>
        ) : (
          <>
            <DetailRow label="Phone no:">
              <input
                type="tel"
                value={customerPhone}
                onChange={e => onPhoneChange(e.target.value)}
                onBlur={onPhoneBlur}
                placeholder="Enter number"
                className="w-full text-right text-sm text-zinc-600 bg-zinc-50 border border-zinc-100 rounded-lg px-3 py-2 focus:outline-none focus:border-primary/40"
                autoComplete="tel"
              />
            </DetailRow>
            <DetailRow label="Saved no:">
              <select
                value={selectedCustomer ?? ""}
                onChange={e => onSelectCustomer(e.target.value)}
                className="w-full text-sm text-zinc-600 bg-zinc-50 border border-zinc-100 rounded-lg px-3 py-2 focus:outline-none focus:border-primary/40"
              >
                <option value="">Choose number</option>
                {selectPhoneOptions.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.phone}
                  </option>
                ))}
              </select>
            </DetailRow>
            <DetailRow label="Order type:" value={orderTypeLabel} />
            <DetailRow label="Location:" value={locationLabel} />
          </>
        )}
      </div>

      {!isCompact && (onSave || onCall) && (
        <div className="px-5 pb-5 pt-1 flex items-center gap-2">
          {onCall && (
            <button
              type="button"
              onClick={onCall}
              className="flex-1 h-11 rounded-full bg-amber-400 hover:bg-amber-500 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-sm transition-colors"
            >
              <Phone className="size-4" />
              Call Customer
            </button>
          )}
          {onSave && (
            <button
              type="button"
              onClick={onSave}
              className="size-11 rounded-full bg-teal-700 hover:bg-teal-800 text-white flex items-center justify-center shadow-sm transition-colors shrink-0"
              title="Save"
            >
              <Save className="size-4" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
