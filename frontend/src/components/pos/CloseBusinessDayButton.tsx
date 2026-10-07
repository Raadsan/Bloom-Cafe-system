"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Moon } from "lucide-react";
import { reportApi } from "@/lib/api/restaurant/reportApi";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

type BusinessDayStatus = {
  businessDate: string;
  closed: boolean;
  canClose: boolean;
  reason: string | null;
};

export default function CloseBusinessDayButton() {
  const { showToast } = useToast();
  const [status, setStatus] = useState<BusinessDayStatus | null>(null);
  const [closing, setClosing] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await reportApi.getBusinessDay();
      if (res?.success) setStatus(res.data);
    } catch {
      setStatus(null);
    }
  }, []);

  useEffect(() => {
    load();
    const timer = window.setInterval(load, 60_000);
    return () => window.clearInterval(timer);
  }, [load]);

  const closed = Boolean(status?.closed);

  const onClose = async () => {
    if (!status?.canClose || closing) return;
    const ok = window.confirm(
      `Close ${status.businessDate}? Orders after this count on the next day. The day also closes by itself after 2 hours with no orders.`
    );
    if (!ok) return;
    setClosing(true);
    try {
      const res = await reportApi.closeBusinessDay();
      if (res?.success) {
        setStatus(res.data);
        showToast(`Business day ${res.data.businessDate} is closed`, "success");
      } else {
        showToast(res?.message || "Could not close the day", "error");
      }
    } catch (error: any) {
      showToast(error?.response?.data?.message || "Could not close the day", "error");
      load();
    } finally {
      setClosing(false);
    }
  };

  return (
    <button
      type="button"
      onClick={onClose}
      disabled={closed || closing || !status?.canClose}
      title={
        closed
          ? status?.reason === "idle"
            ? "Closed after 2 hours with no orders"
            : "This business day is closed"
          : "Close the business day. New orders go on the next day."
      }
      className={cn(
        "h-8 px-3 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 shrink-0",
        closed
          ? "bg-zinc-100 text-zinc-400 cursor-default"
          : "bg-amber-600 text-white hover:bg-amber-700"
      )}
    >
      <Moon className="size-3.5" />
      {closing ? "Closing..." : closed ? "Day closed" : "Close the day"}
    </button>
  );
}
