"use client";

import { cn } from "@/lib/utils";
import { ReceiptSettings } from "@/lib/api/receiptSettingsApi";

export interface ReceiptLineItem {
  menuItemId: number;
  name: string;
  price: number;
  quantity: number;
}

export interface ReceiptSnapshot {
  orderId: number;
  customerName: string;
  customerPhone: string;
  paymentMethod: string;
  orderTypeLabel: string;
  locationLabel?: string;
  items: ReceiptLineItem[];
  subtotal: number;
  tax: number;
  total: number;
  createdAt: string;
}

function ReceiptPhones({ phone }: { phone?: string }) {
  if (!phone) return null;
  try {
    const phones = JSON.parse(phone);
    if (Array.isArray(phones)) {
      return phones.map((p: { provider?: string; number?: string }, i: number) => (
        <p key={i}>
          {p.provider && <span className="font-bold">{p.provider}: </span>}
          {p.number}
        </p>
      ));
    }
  } catch {
    return <p>Tel: {phone}</p>;
  }
  return null;
}

export function ReceiptBody({
  data,
  settings,
  className,
}: {
  data: ReceiptSnapshot;
  settings: ReceiptSettings | null;
  className?: string;
}) {
  return (
    <div className={cn("font-mono text-[10px] text-zinc-800", className)}>
      <div className="text-center mb-4 space-y-1">
        {settings?.logoUrl && (
          <div className="flex justify-center mb-2">
            <img src={settings.logoUrl} alt="Logo" className="max-h-12 w-auto" />
          </div>
        )}
        <h2 className="text-sm font-bold uppercase">{settings?.name || "RESTAURANT NAME"}</h2>
        <div className="text-[9px] text-zinc-500">
          {settings?.address && <p>{settings.address}</p>}
          <ReceiptPhones phone={settings?.phone} />
          {settings?.vatNumber && <p className="font-bold">VAT: {settings.vatNumber}</p>}
        </div>
      </div>

      <div className="border-b border-dashed border-zinc-300 mb-2 pb-2 space-y-0.5">
        <p>Order #: {data.orderId}</p>
        <p>Date: {new Date(data.createdAt).toLocaleString()}</p>
        <p>Customer: {data.customerName}</p>
        {data.customerPhone && <p>Phone: {data.customerPhone}</p>}
        <p>Type: {data.orderTypeLabel}</p>
        {data.locationLabel && <p>Location: {data.locationLabel}</p>}
        <p>Payment: {data.paymentMethod}</p>
      </div>

      <div className="mb-2 space-y-0.5">
        {data.items.map(item => (
          <div key={item.menuItemId} className="flex justify-between gap-2">
            <span className="truncate">
              {item.quantity}x {item.name}
            </span>
            <span className="shrink-0">${(item.quantity * item.price).toFixed(2)}</span>
          </div>
        ))}
      </div>

      <div className="border-t border-dashed border-zinc-300 pt-2 space-y-1">
        <div className="flex justify-between">
          <span>Subtotal:</span>
          <span>${data.subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span>Tax / VAT:</span>
          <span>${data.tax.toFixed(2)}</span>
        </div>
        <div className="flex justify-between font-bold text-sm pt-2 border-t border-dashed border-zinc-300 mt-2">
          <span>TOTAL:</span>
          <span>${data.total.toFixed(2)}</span>
        </div>
      </div>

      <div className="text-center mt-6 space-y-1">
        <p className="italic text-[9px]">
          {settings?.footerText || "Thank you for your visit! Please come again"}
        </p>
        {settings?.email && <p className="text-[9px] font-bold">{settings.email}</p>}
      </div>
    </div>
  );
}
