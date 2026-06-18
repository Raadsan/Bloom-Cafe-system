"use client";

import React, { useCallback, useEffect, useState } from "react";
import PosKitchenView from "@/components/orders/PosKitchenView";
import { orderApi, Order } from "@/lib/api/orderApi";
import { menuItemApi, MenuItem } from "@/lib/api/menuItemApi";
import { useToast } from "@/components/ui/toast";
import { onDebouncedEvent, ORDERS_CHANGED } from "@/lib/live-updates";

export default function PosKitchenPage() {
  const { showToast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async (force = false) => {
    try {
      const [orderData, items] = await Promise.all([
        orderApi.getAllOrders({ kitchenQueue: true, includeServed: true }, force),
        menuItemApi.getAllMenuItems(),
      ]);
      setOrders(orderData || []);
      setMenuItems(items || []);
    } catch {
      showToast("Failed to load kitchen queue", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchData(false);
    const removeListener = onDebouncedEvent(ORDERS_CHANGED, () => {
      fetchData(true);
    }, 700);
    return () => removeListener();
  }, [fetchData]);

  return (
    <PosKitchenView
      orders={orders}
      loading={loading}
      menuItems={menuItems}
      onRefresh={fetchData}
    />
  );
}
