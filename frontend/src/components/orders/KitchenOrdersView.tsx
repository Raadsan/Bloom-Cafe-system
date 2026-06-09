"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Clock,
  ChefHat,
  Flame,
  CheckCircle2,
  UtensilsCrossed,
  MapPin,
  Loader2,
  User,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { orderApi, Order, OrderStatus } from "@/lib/api/orderApi";
import { MenuItem } from "@/lib/api/menuItemApi";
import { useToast } from "@/components/ui/toast";
import {
  dashboardPageClass,
  dashboardPageStyle,
  pageHeaderTitleClass,
  pageHeaderSubtitleClass,
  btnCreatePage,
} from "@/lib/dashboard-ui";
import { cn } from "@/lib/utils";
import {
  getElapsedLabel,
  getOrderCoverImage,
  getOrderMeta,
  getOrderSourceLabel,
  getOrderTitle,
  isKitchenPendingStatus,
} from "@/lib/kitchen-order-utils";

type KitchenTab = "pending" | "preparing" | "ready";

const TAB_CONFIG: {
  id: KitchenTab;
  label: string;
  icon: React.ElementType;
  status: OrderStatus;
  emptyTitle: string;
  emptyHint: string;
}[] = [
  {
    id: "pending",
    label: "Pending",
    icon: Clock,
    status: "pending",
    emptyTitle: "No pending orders",
    emptyHint: "New paid orders will appear here for the kitchen.",
  },
  {
    id: "preparing",
    label: "Preparing",
    icon: Flame,
    status: "preparing",
    emptyTitle: "Nothing cooking right now",
    emptyHint: "Start preparing from the Pending tab.",
  },
  {
    id: "ready",
    label: "Ready",
    icon: CheckCircle2,
    status: "ready",
    emptyTitle: "No orders ready yet",
    emptyHint: "Mark orders ready from the Preparing tab.",
  },
];

interface KitchenOrdersViewProps {
  orders: Order[];
  loading: boolean;
  menuItems: MenuItem[];
  onRefresh: () => Promise<void>;
}

export default function KitchenOrdersView({
  orders,
  loading,
  menuItems,
  onRefresh,
}: KitchenOrdersViewProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<KitchenTab>("pending");
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const counts = useMemo(
    () => ({
      pending: orders.filter(o => isKitchenPendingStatus(o.status)).length,
      preparing: orders.filter(o => o.status === "preparing").length,
      ready: orders.filter(o => o.status === "ready").length,
    }),
    [orders]
  );

  const filtered = useMemo(() => {
    const list = orders.filter(o => {
      if (activeTab === "pending") return isKitchenPendingStatus(o.status);
      return o.status === activeTab;
    });
    return list.sort(
      (a, b) =>
        new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime()
    );
  }, [orders, activeTab]);

  const activeConfig = TAB_CONFIG.find(t => t.id === activeTab)!;

  const handleMarkReady = async (order: Order) => {
    setUpdatingId(order.id);
    try {
      await orderApi.updateStatus(order.id, "ready");
      showToast(`Order #${order.id} is ready for pickup`, "success");
      await onRefresh();
      setActiveTab("ready");
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Failed to update order status";
      showToast(message, "error");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className={dashboardPageClass} style={dashboardPageStyle}>
      <div className="mb-6 px-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className={pageHeaderTitleClass}>Kitchen Queue</h1>
          <p className={pageHeaderSubtitleClass}>
            Pick up orders, prepare dishes, and mark them ready for waiters.
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-zinc-500">
          <ChefHat className="size-4 text-primary" />
          <span>{counts.pending + counts.preparing} active tickets</span>
        </div>
      </div>

      <div className="px-4 mb-6 flex flex-wrap gap-2">
        {TAB_CONFIG.map(tab => {
          const Icon = tab.icon;
          const count = counts[tab.id];
          const isActive = activeTab === tab.id;
          return (
            <Button
              key={tab.id}
              type="button"
              variant={isActive ? "default" : "outline"}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "rounded-full h-11 px-5 gap-2 font-semibold",
                isActive && "shadow-md shadow-primary/15"
              )}
            >
              <Icon className="size-4" />
              {tab.label}
              <span
                className={cn(
                  "ml-1 min-w-[22px] h-[22px] px-1.5 rounded-full text-[11px] font-bold inline-flex items-center justify-center",
                  isActive ? "bg-white/20 text-white" : "bg-zinc-100 text-zinc-600"
                )}
              >
                {count}
              </span>
            </Button>
          );
        })}
      </div>

      <div className="px-4 pb-8">
        <div className="flex items-center gap-2.5 mb-5">
          <h2 className="text-lg font-bold text-[#1e293b]">{activeConfig.label} Orders</h2>
          <span className="px-2.5 py-0.5 rounded-full bg-zinc-100 text-zinc-600 text-xs font-semibold">
            {filtered.length}
          </span>
        </div>

        {loading ? (
          <div className="space-y-5 w-full">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-[190px] w-full bg-zinc-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center text-zinc-500 bg-white rounded-2xl border border-zinc-100 shadow-sm">
            <activeConfig.icon className="size-14 text-zinc-200" />
            <p className="mt-4 text-sm font-semibold text-zinc-600">{activeConfig.emptyTitle}</p>
            <p className="text-xs text-zinc-400 mt-1">{activeConfig.emptyHint}</p>
          </div>
        ) : (
          <div className="space-y-5 w-full">
            {filtered.map(order => {
              const imageUrl = getOrderCoverImage(order, menuItems);
              const isUpdating = updatingId === order.id;
              const itemCount = order.orderitem?.reduce((s, i) => s + i.quantity, 0) || 0;

              return (
                <article
                  key={order.id}
                  className="flex w-full bg-white rounded-2xl border border-zinc-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden min-h-[190px]"
                >
                  <div className="w-[38%] sm:w-[34%] md:w-[30%] lg:w-[28%] max-w-[320px] shrink-0 bg-zinc-50 self-stretch">
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={getOrderTitle(order)}
                        className="w-full h-full min-h-[190px] object-cover"
                      />
                    ) : (
                      <div className="w-full h-full min-h-[190px] flex items-center justify-center bg-gradient-to-br from-zinc-100 to-zinc-50">
                        <UtensilsCrossed className="size-12 text-zinc-300" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 p-5 sm:p-6 flex flex-col min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <h3 className="text-lg sm:text-xl font-bold text-[#3d2c1e] leading-snug">
                          {getOrderTitle(order)}
                        </h3>

                        <div className="mt-2.5 flex flex-wrap items-center gap-2">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-50 border border-zinc-100 text-[12px] text-zinc-600">
                            <Clock className="size-3.5 text-primary" />
                            {getElapsedLabel(order.createdAt)}
                          </span>
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-zinc-50 border border-zinc-100 text-[12px] font-medium text-zinc-600">
                            Order #{order.id}
                          </span>
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-zinc-50 border border-zinc-100 text-[12px] font-medium text-zinc-600">
                            {itemCount} items
                          </span>
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-primary/5 border border-primary/10 text-[12px] font-medium text-primary">
                            {getOrderSourceLabel(order)}
                          </span>
                        </div>

                        <p className="text-[13px] text-zinc-500 mt-2.5 flex items-center gap-1.5">
                          <MapPin className="size-3.5 shrink-0 text-zinc-400" />
                          <span className="font-medium">{getOrderMeta(order)}</span>
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 grid sm:grid-cols-2 gap-x-6 gap-y-2">
                      {order.orderitem?.map(item => (
                        <div
                          key={item.id}
                          className="flex items-center gap-2.5 text-[14px] text-zinc-700"
                        >
                          <span className="font-bold text-primary text-[15px] min-w-[32px]">
                            {item.quantity}x
                          </span>
                          <span className="font-medium truncate">{item.menuitem?.name || "Item"}</span>
                        </div>
                      ))}
                    </div>

                    {order.notes && (
                      <div className="mt-4 text-[13px] text-zinc-600 bg-zinc-100 border border-zinc-200/80 rounded-xl px-4 py-2.5">
                        <span className="font-semibold text-zinc-500">Note:</span>{" "}
                        <span className="text-zinc-700">{order.notes}</span>
                      </div>
                    )}

                    <div className="mt-auto pt-5 flex items-center justify-between gap-4 border-t border-zinc-50">
                      <div className="flex items-center gap-2 text-[13px] text-zinc-500 min-w-0">
                        <span className="flex items-center justify-center size-8 rounded-full bg-zinc-100 shrink-0">
                          <User className="size-3.5 text-zinc-500" />
                        </span>
                        <span className="truncate font-medium">
                          {order.user?.fullName || order.customerName || "Walk-in guest"}
                        </span>
                      </div>

                      {activeTab === "pending" && isKitchenPendingStatus(order.status) && (
                        <Button
                          type="button"
                          onClick={() => router.push(`/orders/kitchen/${order.id}`)}
                          className={cn(btnCreatePage, "h-11 px-6 text-sm shrink-0 rounded-full")}
                        >
                          <Eye className="size-4" />
                          View Order
                        </Button>
                      )}

                      {activeTab === "preparing" && (
                        <>
                          <Button
                            type="button"
                            onClick={() => router.push(`/orders/kitchen/${order.id}`)}
                            className={cn(btnCreatePage, "h-11 px-5 text-sm shrink-0 rounded-full")}
                          >
                            <Eye className="size-4" />
                            View Order
                          </Button>
                          <Button
                            type="button"
                            disabled={isUpdating}
                            onClick={() => handleMarkReady(order)}
                            className="h-11 px-6 text-sm shrink-0 rounded-full bg-emerald-600 !text-white hover:bg-emerald-700 hover:!text-white flex items-center gap-2 font-medium shadow-sm border-none"
                          >
                          {isUpdating ? (
                            <Loader2 className="size-4 animate-spin" />
                          ) : (
                            <CheckCircle2 className="size-4" />
                          )}
                          Mark as Ready
                        </Button>
                        </>
                      )}

                      {activeTab === "ready" && (
                        <span className="inline-flex items-center gap-1.5 h-11 px-5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 text-sm font-semibold shrink-0">
                          <CheckCircle2 className="size-4" />
                          Ready for pickup
                        </span>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
