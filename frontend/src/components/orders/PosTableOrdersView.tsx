"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Clock, Edit, Eye, PackageCheck, Search, Trash2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { orderApi, Order } from "@/lib/api/orderApi";
import { menuItemApi, MenuItem } from "@/lib/api/menuItemApi";
import { authApi } from "@/lib/api/authApi";
import { usePermissions } from "@/context/PermissionContext";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { isKitchenPendingStatus } from "@/lib/kitchen-order-utils";
import { resolveOrderChannel } from "@/lib/order-type-utils";
import { onDebouncedEvent, ORDERS_CHANGED } from "@/lib/live-updates";
import KitchenOrderDetailDialog from "@/components/orders/KitchenOrderDetailDialog";
import PosOrderEditDialog from "@/components/orders/PosOrderEditDialog";
import {
  dashboardPageClass,
  dashboardPageStyle,
  pageHeaderTitleClass,
  pageHeaderWrapperClass,
  actionBtnView,
  actionBtnEdit,
  actionBtnDelete,
  dashboardTableHeaderClass,
  dashboardTableHeadRowClass,
  dashboardTableHeadClass,
  dashboardTableBodyRowClass,
  dashboardTableCellClass,
  dashboardStatusBadgeClass,
  getOrderStatusBadgeClass,
  formatStatusLabel,
  dashboardCardClass,
  dashboardControlsRowClass,
  dashboardTableWrapClass,
  dashboardPaginationClass,
  dashboardSelectClass,
  dashboardInputClass,
  dashboardTextPrimary,
  dashboardTextSecondary,
  dashboardLabelClass,
  dashboardTableIdClass,
} from "@/lib/dashboard-ui";

type QueueTab = "pending" | "served";

function isDineInOrder(order: Order) {
  return resolveOrderChannel(order) === "dine-in" && !!order.tableId;
}

function isActiveOrder(order: Order) {
  const s = order.status;
  return isKitchenPendingStatus(s) || s === "preparing" || s === "ready";
}

function formatTimeAgo(dateStr?: string) {
  if (!dateStr) return "—";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return new Date(dateStr).toLocaleDateString();
}

function getOrderTypeLabel(order: Order) {
  const channel = resolveOrderChannel(order);
  if (channel === "dine-in") return "Dine-in";
  if (channel === "delivery") return "Delivery";
  return "Takeaway";
}

export default function PosTableOrdersView() {
  const { showToast } = useToast();
  const { isAdmin, canEdit: checkEdit, canDelete: checkDelete, canView: checkView } =
    usePermissions();

  const [userRole, setUserRole] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<QueueTab>("pending");
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [viewOrderId, setViewOrderId] = useState<number | null>(null);
  const [editOrder, setEditOrder] = useState<Order | null>(null);
  const [deleteOrder, setDeleteOrder] = useState<Order | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    authApi.getMe().then(user => {
      setUserRole(user.role?.toLowerCase() || "");
    });
  }, []);

  const canViewOrder =
    isAdmin || userRole === "pos" || userRole === "manager" || checkView("/orders");
  const canEditOrder =
    isAdmin || userRole === "pos" || userRole === "manager" || checkEdit("/orders");
  const canDeleteOrder =
    isAdmin || userRole === "pos" || userRole === "manager" || checkDelete("/orders");

  const fetchData = useCallback(async (force = false) => {
    try {
      const [orderData, items] = await Promise.all([
        orderApi.getAllOrders({ kitchenQueue: true, includeServed: true }, force),
        menuItemApi.getAllMenuItems(),
      ]);
      setOrders((orderData || []).filter(isDineInOrder));
      setMenuItems(items || []);
    } catch {
      showToast("Failed to load orders", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchData(false);
    const remove = onDebouncedEvent(ORDERS_CHANGED, () => fetchData(true), 700);
    return () => remove();
  }, [fetchData]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, pageSize, activeTab]);

  const tabOrders = useMemo(() => {
    const base =
      activeTab === "pending"
        ? orders.filter(isActiveOrder)
        : orders.filter(o => o.status === "served");
    return base.sort(
      (a, b) =>
        new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime()
    );
  }, [orders, activeTab]);

  const filteredOrders = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return tabOrders;
    return tabOrders.filter(order => {
      const type = getOrderTypeLabel(order).toLowerCase();
      const table = order.table?.number ? `table ${order.table.number}` : "";
      const customer = (order.customerName || "").toLowerCase();
      const id = String(order.id);
      return (
        type.includes(q) ||
        table.includes(q) ||
        customer.includes(q) ||
        id.includes(q)
      );
    });
  }, [tabOrders, search]);

  const totalPages = Math.ceil(filteredOrders.length / pageSize) || 1;
  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredOrders.slice(start, start + pageSize);
  }, [filteredOrders, currentPage, pageSize]);

  const activeCount = useMemo(() => orders.filter(isActiveOrder).length, [orders]);
  const servedCount = useMemo(
    () => orders.filter(o => o.status === "served").length,
    [orders]
  );

  const viewOrder = useMemo(
    () => (viewOrderId ? orders.find(o => o.id === viewOrderId) ?? null : null),
    [orders, viewOrderId]
  );

  const confirmDelete = async () => {
    if (!deleteOrder) return;
    setDeleting(true);
    try {
      await orderApi.deleteOrder(deleteOrder.id);
      showToast(`Order #${deleteOrder.id} deleted`, "success");
      setDeleteOrder(null);
      await fetchData(true);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Failed to delete order";
      showToast(message, "error");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className={cn(dashboardPageClass, "h-full min-h-0 flex flex-col overflow-hidden")} style={dashboardPageStyle}>
      <div className={cn(pageHeaderWrapperClass, "shrink-0 px-4 pt-4")}>
        <h1 className={pageHeaderTitleClass}>Order Queue</h1>
      </div>

      <div className={cn(dashboardCardClass, "mx-4 mb-4 flex-1 min-h-0 flex flex-col overflow-hidden")}>
        <div className={cn(dashboardControlsRowClass, "shrink-0 flex-wrap gap-3")}>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("pending")}
              className={cn(
                "inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold border transition-all",
                activeTab === "pending"
                  ? "bg-primary text-white border-primary"
                  : "bg-white text-zinc-500 border-zinc-200 hover:border-primary/30"
              )}
            >
              <Clock className="size-3.5" />
              Pending
              <span
                className={cn(
                  "min-w-5 h-5 px-1 rounded-full text-[10px] font-bold inline-flex items-center justify-center",
                  activeTab === "pending" ? "bg-white/20 text-white" : "bg-orange-100 text-orange-700"
                )}
              >
                {activeCount}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("served")}
              className={cn(
                "inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold border transition-all",
                activeTab === "served"
                  ? "bg-primary text-white border-primary"
                  : "bg-white text-zinc-500 border-zinc-200 hover:border-primary/30"
              )}
            >
              <PackageCheck className="size-3.5" />
              Served
              <span
                className={cn(
                  "min-w-5 h-5 px-1 rounded-full text-[10px] font-bold inline-flex items-center justify-center",
                  activeTab === "served" ? "bg-white/20 text-white" : "bg-zinc-100 text-zinc-600"
                )}
              >
                {servedCount}
              </span>
            </button>
          </div>

          <div className={cn("flex items-center gap-2", dashboardLabelClass)}>
            <span>Show</span>
            <select
              value={pageSize}
              onChange={e => setPageSize(Number(e.target.value))}
              className={cn("w-16", dashboardSelectClass)}
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </div>

          <div className="flex-1" />

          <div className="relative w-64 group">
            <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-primary transition-colors" />
            <input
              type="text"
              placeholder="Search order, type, customer..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className={dashboardInputClass}
            />
          </div>
        </div>

        <div className={cn(dashboardTableWrapClass, "flex-1 min-h-0 overflow-auto border-t border-border")}>
          <div className="overflow-x-auto min-h-0">
            <Table className="w-full">
              <TableHeader className={dashboardTableHeaderClass}>
                <TableRow className={dashboardTableHeadRowClass}>
                  <TableHead className={cn(dashboardTableHeadClass, "text-left")}>No</TableHead>
                  <TableHead className={cn(dashboardTableHeadClass, "text-left")}>Order</TableHead>
                  <TableHead className={cn(dashboardTableHeadClass, "text-left")}>Type</TableHead>
                  <TableHead className={cn(dashboardTableHeadClass, "text-left")}>Table</TableHead>
                  <TableHead className={cn(dashboardTableHeadClass, "text-left")}>Customer</TableHead>
                  <TableHead className={cn(dashboardTableHeadClass, "text-left")}>Items</TableHead>
                  <TableHead className={cn(dashboardTableHeadClass, "text-left")}>Total</TableHead>
                  <TableHead className={cn(dashboardTableHeadClass, "text-left")}>Time</TableHead>
                  <TableHead className={cn(dashboardTableHeadClass, "text-right")}>Status</TableHead>
                  <TableHead className={cn(dashboardTableHeadClass, "text-right")}>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <TableRow key={i} className="h-14 animate-pulse">
                      {[...Array(10)].map((_, j) => (
                        <TableCell key={j} className="px-6 py-4">
                          <div className="h-4 bg-zinc-100 rounded w-full" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : paginatedOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="px-6 py-10 text-center text-muted-foreground">
                      {activeTab === "pending"
                        ? "No pending, preparing, or ready orders"
                        : "No served orders yet"}
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedOrders.map((order, index) => {
                    const itemCount =
                      order.orderitem?.reduce((s, i) => s + i.quantity, 0) || 0;
                    const rowNo = (currentPage - 1) * pageSize + index + 1;

                    return (
                      <TableRow key={order.id} className={dashboardTableBodyRowClass}>
                        <TableCell className={dashboardTableCellClass}>
                          <span className={dashboardTableIdClass}>{rowNo}</span>
                        </TableCell>
                        <TableCell className={dashboardTableCellClass}>
                          <span className={dashboardTextPrimary}>#{order.id}</span>
                        </TableCell>
                        <TableCell className={dashboardTableCellClass}>
                          <span className={cn(dashboardTextSecondary, "capitalize")}>
                            {getOrderTypeLabel(order)}
                          </span>
                        </TableCell>
                        <TableCell className={dashboardTableCellClass}>
                          <span className={dashboardTextSecondary}>
                            {order.table?.number ? `Table ${order.table.number}` : "—"}
                          </span>
                        </TableCell>
                        <TableCell className={dashboardTableCellClass}>
                          <span className={dashboardTextPrimary}>
                            {order.customerName || "Walk-in"}
                          </span>
                        </TableCell>
                        <TableCell className={dashboardTableCellClass}>
                          <span className={dashboardTextSecondary}>{itemCount}</span>
                        </TableCell>
                        <TableCell className={dashboardTableCellClass}>
                          <span className={dashboardTextPrimary}>
                            ${order.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </span>
                        </TableCell>
                        <TableCell className={dashboardTableCellClass}>
                          <span className={dashboardTextSecondary}>
                            {formatTimeAgo(order.createdAt)}
                          </span>
                        </TableCell>
                        <TableCell className={cn(dashboardTableCellClass, "text-right")}>
                          <span
                            className={cn(
                              dashboardStatusBadgeClass,
                              getOrderStatusBadgeClass(order.status)
                            )}
                          >
                            {formatStatusLabel(order.status)}
                          </span>
                        </TableCell>
                        <TableCell className={cn(dashboardTableCellClass, "text-right")}>
                          <div className="flex justify-end gap-2">
                            {canViewOrder && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setViewOrderId(order.id)}
                                className={actionBtnView}
                                title="View order"
                              >
                                <Eye className="size-4" />
                              </Button>
                            )}
                            {canEditOrder && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setEditOrder(order)}
                                className={actionBtnEdit}
                                title="Edit order"
                              >
                                <Edit className="size-4" />
                              </Button>
                            )}
                            {canDeleteOrder && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setDeleteOrder(order)}
                                className={actionBtnDelete}
                                title="Delete order"
                              >
                                <Trash2 className="size-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        <div className={cn(dashboardPaginationClass, "shrink-0")}>
          <div>
            {filteredOrders.length === 0
              ? "0 of 0"
              : `${Math.min(filteredOrders.length, (currentPage - 1) * pageSize + 1)}-${Math.min(filteredOrders.length, currentPage * pageSize)} of ${filteredOrders.length}`}
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-2 py-1 border border-zinc-200 rounded-md hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              &lt;
            </button>
            <div className="px-3 py-1 border border-zinc-200 rounded-md text-zinc-400">
              {currentPage} of {totalPages}
            </div>
            <button
              type="button"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="px-2 py-1 border border-zinc-200 rounded-md hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              &gt;
            </button>
          </div>
        </div>
      </div>

      <KitchenOrderDetailDialog
        order={viewOrder}
        menuItems={menuItems}
        open={viewOrderId !== null}
        onOpenChange={open => {
          if (!open) setViewOrderId(null);
        }}
        readOnly
      />

      <PosOrderEditDialog
        order={editOrder}
        menuItems={menuItems}
        open={editOrder !== null}
        onOpenChange={open => {
          if (!open) setEditOrder(null);
        }}
        onSaved={() => fetchData(true)}
      />

      <Dialog
        open={deleteOrder !== null}
        onOpenChange={open => {
          if (!open && !deleting) setDeleteOrder(null);
        }}
      >
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Delete Order #{deleteOrder?.id}?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-zinc-500">
            This will permanently remove the order and its items. This action cannot be undone.
          </p>
          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteOrder(null)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={confirmDelete}
              disabled={deleting}
              className="bg-rose-600 hover:bg-rose-700 text-white"
            >
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
