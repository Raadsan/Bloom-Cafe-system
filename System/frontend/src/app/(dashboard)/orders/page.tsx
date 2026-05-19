"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  Eye,
  TrendingUp,
  ShoppingBag,
  CheckCircle2,
  XCircle,
  CalendarDays,
  ChevronDown,
  Filter,
  Plus,
  PackageOpen,
  Clock,
  History,
  Trash2,
  Edit,
  AlertCircle
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogHeader, DialogFooter } from "@/components/ui/dialog";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { orderApi, Order, OrderStatus } from "@/lib/api/orderApi";
import { tableApi, Table as RestaurantTable } from "@/lib/api/tableApi";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

const LIVE_STATUSES = ["pending", "preparing", "ready"];
const HISTORY_STATUSES = ["paid", "served", "cancelled"];

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  pending: { label: "Pending", bg: "bg-orange-100", text: "text-orange-700" },
  preparing: { label: "Preparing", bg: "bg-blue-100", text: "text-blue-700" },
  ready: { label: "Ready", bg: "bg-green-100", text: "text-green-700" },
  paid: { label: "Paid", bg: "bg-emerald-100", text: "text-emerald-700" },
  served: { label: "Served", bg: "bg-zinc-100", text: "text-zinc-700" },
  cancelled: { label: "Cancelled", bg: "bg-rose-100", text: "text-rose-700" },
};

export default function AllOrdersPage() {
  const { showToast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [viewTab, setViewTab] = useState<"live" | "history">("live");
  const [tables, setTables] = useState<RestaurantTable[]>([]);

  // Modal states
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);

  const fetchOrders = async () => {
    try {
      const data = await orderApi.getAllOrders();
      setOrders(data || []);
    } catch (err) {
      console.error("Failed to fetch orders", err);
      showToast("Error loading orders", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchTables = async () => {
    try {
      const data = await tableApi.getAllTables();
      setTables(data || []);
    } catch (err) {
      console.error("Failed to fetch tables", err);
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchTables();
    // Refresh every 30 seconds for live orders
    const interval = setInterval(fetchOrders, 30000);
    return () => clearInterval(interval);
  }, []);

  const filtered = useMemo(() => {
    return orders.filter(o => {
      const isMatchTab = viewTab === "live"
        ? LIVE_STATUSES.includes(o.status)
        : HISTORY_STATUSES.includes(o.status);

      const matchSearch = search === "" ||
        String(o.id).includes(search) ||
        (o.customerName || "").toLowerCase().includes(search.toLowerCase());

      return isMatchTab && matchSearch;
    });
  }, [orders, viewTab, search]);

  const stats = useMemo(() => {
    const liveCount = orders.filter(o => LIVE_STATUSES.includes(o.status)).length;
    const historyCount = orders.filter(o => HISTORY_STATUSES.includes(o.status)).length;
    const todayRevenue = orders
      .filter(o => o.status === "paid" || o.status === "served")
      .reduce((sum, o) => sum + o.total, 0);
    return { liveCount, historyCount, todayRevenue };
  }, [orders]);

  const handleStatusUpdate = async (id: number, status: OrderStatus) => {
    try {
      await orderApi.updateStatus(id, status);
      showToast(`Order marked as ${status}`, "success");
      fetchOrders();
    } catch (err) {
      showToast("Failed to update status", "error");
    }
  };

  const confirmDelete = async () => {
    if (!selectedOrder) return;
    try {
      await orderApi.deleteOrder(selectedOrder.id);
      showToast("Order deleted", "success");
      fetchOrders();
      setIsDeleteOpen(false);
    } catch (err) {
      showToast("Failed to delete order", "error");
    }
  };

  return (
    <div className="animate-in fade-in duration-500 font-sans mx-1 pt-0 pb-8">
      {/* Page Header: Outside the box */}
      <div className="mb-6 px-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1e293b] uppercase tracking-tight">Orders Management</h1>
          <p className="text-[12px] text-zinc-500 uppercase tracking-wider mt-1 font-medium italic">Manage active floor operations and historical transactions in one place.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-zinc-100 p-1 rounded-xl border border-zinc-200">
            <button
              onClick={() => setViewTab("live")}
              className={cn(
                "flex items-center gap-2 px-4 h-9 rounded-lg text-[12px] font-bold uppercase transition-all",
                viewTab === "live" ? "bg-white text-[#605DFF] shadow-sm" : "text-zinc-500 hover:text-zinc-800"
              )}
            >
              <Clock className="size-3.5" />
              Live ({stats.liveCount})
            </button>
            <button
              onClick={() => setViewTab("history")}
              className={cn(
                "flex items-center gap-2 px-4 h-9 rounded-lg text-[12px] font-bold uppercase transition-all",
                viewTab === "history" ? "bg-white text-[#605DFF] shadow-sm" : "text-zinc-500 hover:text-zinc-800"
              )}
            >
              <History className="size-3.5" />
              History ({stats.historyCount})
            </button>
          </div>
        </div>
      </div>

      {/* Main Container Box */}
      <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
        {/* Controls Row: Inside the box */}
        <div className="px-8 py-4 flex flex-wrap items-center gap-6 border-b border-zinc-50 bg-zinc-50/10">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="size-9 rounded-lg bg-white border border-zinc-200 flex items-center justify-center shadow-sm">
                {viewTab === "live" ? <Clock className="size-4 text-orange-500" /> : <History className="size-4 text-emerald-500" />}
              </div>
              <div>
                <h3 className="text-[13px] font-bold text-zinc-800 uppercase tracking-tight">
                  {viewTab === "live" ? "Active Floor Orders" : "Closed Transaction Log"}
                </h3>
              </div>
            </div>
          </div>

          <div className="flex-1"></div>

          <div className="flex items-center gap-3">
            <div className="relative w-72 group">
              <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-[#605DFF] transition-colors" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search ID or customer..."
                className="w-full h-[42px] pl-10 pr-4 bg-zinc-50 border border-zinc-200 rounded-md outline-none focus:border-[#605DFF] focus:ring-1 focus:ring-[#605DFF]/10 transition-all text-sm font-normal text-zinc-600"
              />
            </div>

            <Button
              onClick={() => setIsAddOpen(true)}
              className="h-[42px] px-6 bg-[#605DFF] hover:bg-[#4f4cef] text-white rounded-md flex items-center gap-2 transition-colors font-medium text-sm shadow-sm"
            >
              <Plus className="size-4" />
              Create Order
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table className="w-full">
            <TableHeader className="bg-[#605DFF]">
              <TableRow className="hover:bg-transparent border-none">
                <TableHead className="px-6 py-4 text-[12px] font-black uppercase text-white border-none">ID</TableHead>
                <TableHead className="px-6 py-4 text-[12px] font-black uppercase text-white border-none">Customer</TableHead>
                <TableHead className="px-6 py-4 text-[12px] font-black uppercase text-white border-none">Source</TableHead>
                <TableHead className="px-6 py-4 text-[12px] font-black uppercase text-white border-none">Total</TableHead>
                <TableHead className="px-6 py-4 text-[12px] font-black uppercase text-white border-none text-center">Status</TableHead>
                <TableHead className="px-6 py-4 text-[12px] font-black uppercase text-white border-none text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={i} className="h-16 animate-pulse bg-muted/5"><TableCell colSpan={6} /></TableRow>
                ))
              ) : filtered.length > 0 ? (
                filtered.map((order) => {
                  const cfg = STATUS_CONFIG[order.status] || { label: order.status, bg: "bg-zinc-100", text: "text-zinc-600" };
                  return (
                    <TableRow key={order.id} className="border-zinc-50 hover:bg-zinc-50/50 transition-colors">
                      <TableCell className="px-6 py-4 font-bold text-zinc-800 text-[13px]">#{order.id}</TableCell>
                      <TableCell className="px-6 py-4">
                        <p className="text-[13px] font-normal text-zinc-600 uppercase tracking-tight">{order.customerName || "Guest"}</p>
                        <p className="text-[11px] text-zinc-400 font-medium">{order.table ? `Table ${order.table.number}` : "Pickup"}</p>
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <span className="text-[11px] font-black uppercase tracking-widest text-zinc-400 border border-zinc-100 px-2 py-1 rounded bg-zinc-50">
                          {order.tableId ? "Dine-in" : "Takeaway"}
                        </span>
                      </TableCell>
                      <TableCell className="px-6 py-4 text-[13px] font-black text-zinc-800">
                        ${order.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="px-6 py-4 text-center">
                        <span className={cn(
                          "px-3 py-1 rounded-md text-[10px] font-semibold uppercase tracking-wider border inline-block whitespace-nowrap",
                          cfg.bg, cfg.text,
                          cfg.bg === "bg-orange-100" ? "border-orange-200" :
                            cfg.bg === "bg-blue-100" ? "border-blue-200" :
                              cfg.bg === "bg-green-100" ? "border-green-200" :
                                cfg.bg === "bg-emerald-100" ? "border-emerald-200" :
                                  cfg.bg === "bg-zinc-100" ? "border-zinc-200" :
                                    "border-rose-200"
                        )}>
                          {cfg.label}
                        </span>
                      </TableCell>
                      <TableCell className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => { setSelectedOrder(order); setIsViewOpen(true); }}
                            className="h-8 w-8 p-0 text-[#64748B] hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                          >
                            <Eye className="size-4" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => { setSelectedOrder(order); /* Add edit logic or modal here if needed */ }}
                            className="h-8 w-8 p-0 text-[#64748B] hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Edit className="size-4" />
                          </Button>

                          {viewTab === "history" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => { setSelectedOrder(order); setIsDeleteOpen(true); }}
                              className="h-8 w-8 p-0 text-[#64748B] hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="px-6 py-24 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <PackageOpen className="size-12 text-zinc-100" />
                      <p className="text-zinc-400 font-black uppercase text-[11px] tracking-widest">No entries found</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>


      {/* VIEW ORDER DETAILS MODAL */}
      <Dialog open={isViewOpen} onOpenChange={(open) => { if (!open) setIsViewOpen(false); }}>
        <DialogContent className="sm:max-w-[540px] bg-white border-zinc-100 p-0 overflow-hidden">
          <DialogTitle className="sr-only">Order Details</DialogTitle>
          {selectedOrder && (
            <>
              <div className="p-6 bg-zinc-50/50 border-b border-zinc-100 flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-black text-zinc-800 uppercase tracking-tight">Order #{selectedOrder.id}</h3>
                  <p className="text-[11px] font-bold text-zinc-400 mt-1 uppercase tracking-widest">
                    {new Date(selectedOrder.createdAt || Date.now()).toLocaleString()}
                  </p>
                </div>
                <span className={cn(
                  "px-3 py-1 rounded-md text-[12px] font-black uppercase tracking-widest",
                  STATUS_CONFIG[selectedOrder.status]?.bg || "bg-zinc-100",
                  STATUS_CONFIG[selectedOrder.status]?.text || "text-zinc-600"
                )}>
                  {selectedOrder.status}
                </span>
              </div>

              <div className="p-6 space-y-6">
                <div className="grid grid-cols-2 gap-6 text-sm">
                  <div>
                    <p className="text-zinc-400 font-black tracking-widest text-[10px] uppercase mb-1">Customer</p>
                    <p className="font-bold text-zinc-800">{selectedOrder.customerName || "Guest"}</p>
                    {selectedOrder.customerPhone && <p className="text-zinc-400 text-xs">{selectedOrder.customerPhone}</p>}
                  </div>
                  <div>
                    <p className="text-zinc-400 font-black tracking-widest text-[10px] uppercase mb-1">Location</p>
                    <p className="font-bold text-zinc-800">{selectedOrder.table ? `Table ${selectedOrder.table.number}` : "Pickup"}</p>
                  </div>
                </div>

                <div>
                  <p className="text-zinc-400 font-black tracking-widest text-[10px] uppercase mb-3 border-b border-zinc-50 pb-2">Summary</p>
                  <div className="space-y-3 max-h-[30vh] overflow-y-auto pr-1">
                    {selectedOrder.orderitem?.map((item) => (
                      <div key={item.id} className="flex justify-between items-center text-[13px]">
                        <div className="flex items-center gap-3">
                          <span className="font-black text-[#605DFF] bg-[#605DFF]/5 px-2 py-0.5 rounded text-[11px]">x{item.quantity}</span>
                          <span className="font-bold text-zinc-700">{item.menuitem?.name}</span>
                        </div>
                        <span className="font-black text-zinc-800">
                          ${(item.quantity * (item.menuitem?.price || item.unitPrice)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-zinc-100 flex justify-between items-center">
                  <span className="text-sm font-black text-zinc-400 uppercase tracking-widest">Total Amount</span>
                  <span className="text-2xl font-black text-[#605DFF]">
                    ${selectedOrder.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="flex justify-end pt-2">
                  <Button variant="outline" onClick={() => setIsViewOpen(false)} className="rounded-xl font-black text-[12px] uppercase tracking-widest border-zinc-200 px-8 h-12">
                    Close
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* DELETE MODAL */}
      <Dialog open={isDeleteOpen} onOpenChange={(open) => { if (!open) setIsDeleteOpen(false); }}>
        <DialogContent className="sm:max-w-[440px] bg-white border-zinc-100">
          <div className="p-6 flex flex-col items-center text-center pt-10">
            <div className="w-16 h-16 rounded-full bg-rose-50 flex items-center justify-center mb-4">
              <Trash2 className="size-8 text-rose-600" />
            </div>
            <h3 className="text-xl font-black text-zinc-800 uppercase tracking-tight mb-2">Delete Order Record?</h3>
            <p className="text-sm text-zinc-400 font-medium">
              Are you sure you want to delete order <span className="font-bold text-zinc-800">#{selectedOrder?.id}</span>?
              This will remove it from all financial reports.
            </p>
          </div>
          <div className="p-4 bg-zinc-50 border-t border-zinc-100 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)} className="rounded-xl font-black text-[11px] uppercase tracking-widest px-6 h-11">
              Cancel
            </Button>
            <Button onClick={confirmDelete} className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-black text-[11px] uppercase tracking-widest px-6 h-11 shadow-md">
              Delete Forever
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* CREATE ORDER MODAL */}
      <Dialog open={isAddOpen} onOpenChange={(open) => { if (!open) setIsAddOpen(false); }}>
        <DialogContent className="sm:max-w-[640px] bg-white border-zinc-100 p-0 overflow-hidden">
          <DialogTitle className="sr-only">Create New Order</DialogTitle>
          <div className="p-6 border-b border-zinc-100">
            <DialogTitle className="text-xl font-bold text-[#1e293b]">Create New Order</DialogTitle>
            <DialogDescription className="text-sm text-zinc-500 mt-1">
              Set up the initial details for a new customer order.
            </DialogDescription>
          </div>

          <div className="p-8 space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-[#1E293B]">Customer Name</label>
                <input
                  type="text"
                  placeholder="e.g. John Doe"
                  className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-lg outline-none focus:border-[#605DFF]/30 focus:ring-4 focus:ring-[#605DFF]/5 transition-all text-[15px] font-medium"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-[#1E293B]">Customer Phone</label>
                <input
                  type="text"
                  placeholder="e.g. +252..."
                  className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-lg outline-none focus:border-[#605DFF]/30 focus:ring-4 focus:ring-[#605DFF]/5 transition-all text-[15px] font-medium"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-[#1E293B]">Select Table *</label>
              <select
                className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-lg outline-none focus:border-[#605DFF]/30 transition-all text-[15px] font-medium appearance-none cursor-pointer"
              >
                <option value="">Select a Table</option>
                {tables.filter(t => t.status === "active").map(t => (
                  <option key={t.id} value={t.id}>Table {t.number} - {t.name || 'Main Area'}</option>
                ))}
              </select>
            </div>

            <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl flex items-center gap-3">
              <div className="size-8 rounded-full bg-blue-100 flex items-center justify-center">
                <AlertCircle className="size-4 text-[#605DFF]" />
              </div>
              <p className="text-xs text-blue-700 font-medium leading-relaxed">
                After saving, you will be redirected to the POS interface to select items and complete the order.
              </p>
            </div>
          </div>

          <DialogFooter className="p-6 bg-zinc-50 border-t border-zinc-100 gap-3">
            <Button variant="outline" onClick={() => setIsAddOpen(false)} className="rounded-lg font-bold px-6 h-11">
              Cancel
            </Button>
            <Link href="/pos">
              <Button className="bg-[#605DFF] hover:bg-[#4E4BCB] text-white rounded-lg font-bold border-none px-8 h-11 shadow-lg shadow-[#605DFF]/20">
                Proceed to POS
              </Button>
            </Link>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
