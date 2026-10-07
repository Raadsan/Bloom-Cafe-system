"use client";

import React, { useCallback, useEffect, useState } from "react";
import PosKitchenView from "@/components/orders/PosKitchenView";
import { orderApi, Order } from "@/lib/api/restaurant/orderApi";
import { menuItemApi, MenuItem } from "@/lib/api/restaurant/menuItemApi";
import { useToast } from "@/components/ui/toast";
import { onDebouncedEvent, ORDERS_CHANGED, MENU_CHANGED, POS_SOFT_REFRESH } from "@/lib/live-updates";
import { businessDateKey, dateFromBusinessKey, formatLocalKey } from "@/lib/businessDay";

export default function PosKitchenPage() {
  const { showToast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [datePreset, setDatePreset] = useState<"today" | "yesterday" | "week" | "last-month" | "custom">("today");
  const [dateRange, setDateRange] = useState(() => getPresetRange("today"));

  const fetchData = useCallback(async (force = false) => {
    setLoading(true);
    try {
      const [orderData, items] = await Promise.all([
        orderApi.getAllOrders({
          kitchenQueue: true,
          includeServed: true,
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
        }, force),
        menuItemApi.getAllMenuItems(),
      ]);
      setOrders(orderData || []);
      setMenuItems(items || []);
    } catch {
      showToast("Failed to load kitchen queue", "error");
    } finally {
      setLoading(false);
    }
  }, [dateRange, showToast]);

  const applyDatePreset = (preset: typeof datePreset) => {
    setDatePreset(preset);
    if (preset !== "custom") setDateRange(getPresetRange(preset));
  };

  useEffect(() => {
    fetchData(false);
    const removeOrders = onDebouncedEvent(ORDERS_CHANGED, () => fetchData(true), 700);
    const removePos = onDebouncedEvent(POS_SOFT_REFRESH, () => fetchData(true), 400);
    const removeMenu = onDebouncedEvent(MENU_CHANGED, async () => {
      menuItemApi.clearPosMenuCache();
      try {
        const items = await menuItemApi.getPosMenuCatalog(true);
        setMenuItems(items || []);
      } catch {
        /* keep current menu */
      }
    }, 400);
    return () => {
      removeOrders();
      removePos();
      removeMenu();
    };
  }, [fetchData]);

  return (
    <PosKitchenView
      orders={orders}
      loading={loading}
      menuItems={menuItems}
      onRefresh={fetchData}
      datePreset={datePreset}
      dateRange={dateRange}
      onDatePresetChange={applyDatePreset}
      onDateRangeChange={setDateRange}
    />
  );
}

function getPresetRange(preset: "today" | "yesterday" | "week" | "last-month") {
  const today = dateFromBusinessKey(businessDateKey());
  const todayStr = formatLocalKey(today);
  if (preset === "today") return { startDate: todayStr, endDate: todayStr };
  if (preset === "yesterday") {
    const date = new Date(today);
    date.setDate(date.getDate() - 1);
    return { startDate: formatLocalKey(date), endDate: formatLocalKey(date) };
  }
  if (preset === "week") {
    const start = new Date(today);
    start.setDate(start.getDate() - 6);
    return { startDate: formatLocalKey(start), endDate: todayStr };
  }
  return {
    startDate: formatLocalKey(new Date(today.getFullYear(), today.getMonth() - 1, 1)),
    endDate: formatLocalKey(new Date(today.getFullYear(), today.getMonth(), 0)),
  };
}
