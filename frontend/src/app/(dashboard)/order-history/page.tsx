"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Search, Eye, TrendingUp, ShoppingBag, CheckCircle2, XCircle, CalendarDays, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { orderApi, Order } from "@/lib/api/orderApi";

const HISTORY_STATUSES = ["paid", "served", "cancelled"];

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  paid:      { label: "Paid",      bg: "bg-emerald-100", text: "text-emerald-700" },
  served:    { label: "Served",    bg: "bg-blue-100",    text: "text-blue-700" },
  cancelled: { label: "Cancelled", bg: "bg-rose-100",    text: "text-rose-700" },
};

export default function OrderHistoryPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isViewOpen, setIsViewOpen] = useState(false);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const all = await orderApi.getAllOrders();
        setOrders((all || []).filter(o => HISTORY_STATUSES.includes(o.status)));
      } catch (err) {
        console.error("Failed to fetch order history", err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const filtered = useMemo(() => {
    const now = new Date();
    return orders.filter(o => {
      const matchStatus = statusFilter === "all" || o.status === statusFilter;
      const matchSearch =
        search === "" ||
        String(o.id).includes(search) ||
        (o.customerName || "").toLowerCase().includes(search.toLowerCase()) ||
        (o.customerPhone || "").includes(search);

      let matchDate = true;
      if (dateFilter !== "all" && o.createdAt) {
        const created = new Date(o.createdAt);
        if (dateFilter === "today") {
          matchDate = created.toDateString() === now.toDateString();
        } else if (dateFilter === "week") {
          const weekAgo = new Date(now);
          weekAgo.setDate(weekAgo.getDate() - 7);
          matchDate = created >= weekAgo;
        } else if (dateFilter === "month") {
          matchDate = created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
        }
      }

      return matchStatus && matchSearch && matchDate;
    });
  }, [orders, statusFilter, search, dateFilter]);

  const stats = useMemo(() => {
    const paid = orders.filter(o => o.status === "paid" || o.status === "served");
    const cancelled = orders.filter(o => o.status === "cancelled");
    const revenue = paid.reduce((sum, o) => sum + o.total, 0);
    return { total: orders.length, paid: paid.length, cancelled: cancelled.length, revenue };
  }, [orders]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground uppercase">Order History</h1>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-3">
            View all completed, served, and cancelled orders.
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="trezo-card p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#605DFF]/10 flex items-center justify-center shrink-0">
            <ShoppingBag className="size-6 text-[#605DFF]" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Total Orders</p>
            <p className="text-2xl font-bold text-foreground mt-0.5">{stats.total}</p>
          </div>
        </div>
        <div className="trezo-card p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
            <CheckCircle2 className="size-6 text-emerald-600" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Completed</p>
            <p className="text-2xl font-bold text-foreground mt-0.5">{stats.paid}</p>
          </div>
        </div>
        <div className="trezo-card p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-100 flex items-center justify-center shrink-0">
            <XCircle className="size-6 text-rose-600" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Cancelled</p>
            <p className="text-2xl font-bold text-foreground mt-0.5">{stats.cancelled}</p>
          </div>
        </div>
        <div className="trezo-card p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
            <TrendingUp className="size-6 text-blue-600" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Total Revenue</p>
            <p className="text-2xl font-bold text-foreground mt-0.5">
              ${stats.revenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      </div>

      {/* Table Card */}
      <div className="trezo-card overflow-hidden">
        {/* Filters */}
        <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-zinc-50/30 border-b border-zinc-100">
          <div>
            <h3 className="text-sm font-bold text-foreground">Transaction Log</h3>
            <p className="text-[12px] font-medium text-muted-foreground mt-1">{filtered.length} record{filtered.length !== 1 ? "s" : ""} found</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative group w-full md:w-64">
              <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by ID, name, phone..."
                className="w-full pl-10 pr-4 py-2.5 text-[14px] font-medium bg-white border border-zinc-100 rounded-lg outline-none focus:border-[#605DFF]/30 focus:ring-4 focus:ring-[#605DFF]/5 transition-all shadow-sm"
              />
            </div>

            {/* Status Filter */}
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="appearance-none pl-4 pr-10 py-2.5 text-[14px] font-medium bg-white border border-zinc-100 rounded-lg outline-none focus:border-[#605DFF]/30 shadow-sm cursor-pointer"
              >
                <option value="all">All Statuses</option>
                <option value="paid">Paid</option>
                <option value="served">Served</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <ChevronDown className="size-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            </div>

            {/* Date Filter */}
            <div className="relative">
              <CalendarDays className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="appearance-none pl-10 pr-10 py-2.5 text-[14px] font-medium bg-white border border-zinc-100 rounded-lg outline-none focus:border-[#605DFF]/30 shadow-sm cursor-pointer"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
              </select>
              <ChevronDown className="size-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-zinc-50/50">
              <TableRow className="border-zinc-100 hover:bg-transparent">
                <TableHead className="px-6 py-5 text-[11px] font-bold uppercase tracking-widest text-[#64748B]">Order ID</TableHead>
                <TableHead className="px-6 py-5 text-[11px] font-bold uppercase tracking-widest text-[#64748B]">Customer</TableHead>
                <TableHead className="px-6 py-5 text-[11px] font-bold uppercase tracking-widest text-[#64748B]">Table</TableHead>
                <TableHead className="px-6 py-5 text-[11px] font-bold uppercase tracking-widest text-[#64748B]">Items</TableHead>
                <TableHead className="px-6 py-5 text-[11px] font-bold uppercase tracking-widest text-[#64748B]">Total</TableHead>
                <TableHead className="px-6 py-5 text-[11px] font-bold uppercase tracking-widest text-[#64748B] text-center">Status</TableHead>
                <TableHead className="px-6 py-5 text-[11px] font-bold uppercase tracking-widest text-[#64748B]">Date & Time</TableHead>
                <TableHead className="px-6 py-5 text-right text-[11px] font-bold uppercase tracking-widest text-[#64748B] w-20">View</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={i} className="h-14 animate-pulse bg-muted/10">
                    <TableCell colSpan={8} />
                  </TableRow>
                ))
              ) : filtered.length > 0 ? (
                filtered.map((order) => {
                  const cfg = STATUS_CONFIG[order.status] ?? { label: order.status, bg: "bg-zinc-100", text: "text-zinc-600" };
                  return (
                    <TableRow key={order.id} className="border-zinc-50 hover:bg-zinc-50/40 transition-colors">
                      <TableCell className="px-6 py-4 text-[13px] font-medium text-[#1E293B]">#{order.id}</TableCell>
                      <TableCell className="px-6 py-4 text-[13px] font-medium text-[#1E293B]">
                        <div>{order.customerName || "Walk-in Guest"}</div>
                        {order.customerPhone && (
                          <div className="text-[11px] text-muted-foreground mt-0.5">{order.customerPhone}</div>
                        )}
                      </TableCell>
                      <TableCell className="px-6 py-4 text-[13px] text-[#64748B]">
                        Table {order.table?.number || order.tableId}
                      </TableCell>
                      <TableCell className="px-6 py-4 text-[13px] text-[#64748B] max-w-[180px] truncate">
                        {order.orderitem?.map(i => `${i.quantity}x ${i.menuitem?.name}`).join(", ") || "-"}
                      </TableCell>
                      <TableCell className="px-6 py-4 text-[13px] font-bold text-[#1E293B]">
                        ${order.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="px-6 py-4 text-center">
                        <span className={`px-3 py-1 rounded-md text-[12px] font-medium ${cfg.bg} ${cfg.text}`}>
                          {cfg.label}
                        </span>
                      </TableCell>
                      <TableCell className="px-6 py-4 text-[12px] text-[#64748B]">
                        {order.createdAt
                          ? new Date(order.createdAt).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })
                          : "-"}
                      </TableCell>
                      <TableCell className="px-6 py-4 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => { setSelectedOrder(order); setIsViewOpen(true); }}
                          className="h-8 w-8 p-0 text-[#64748B] hover:text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors"
                        >
                          <Eye className="size-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="px-6 py-24 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <ShoppingBag className="size-12 text-zinc-200" />
                      <p className="text-[#64748B] font-bold uppercase text-[11px] tracking-widest">No history records found</p>
                      <p className="text-muted-foreground text-sm">Try adjusting your filters</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* View Order Details Modal */}
      <Dialog open={isViewOpen} onOpenChange={(open) => { if(!open) setIsViewOpen(false); }}>
        <DialogContent
          className="sm:max-w-[540px] bg-white border-zinc-100 p-0 overflow-hidden"
        >
          <DialogTitle className="sr-only">Order Details</DialogTitle>
          {selectedOrder && (
            <>
              {/* Modal Header */}
              <div className="p-6 bg-zinc-50/50 border-b border-zinc-100 flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-bold text-foreground">Order #{selectedOrder.id}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {selectedOrder.createdAt
                      ? new Date(selectedOrder.createdAt).toLocaleString([], { dateStyle: "long", timeStyle: "short" })
                      : "-"}
                  </p>
                </div>
                {(() => {
                  const cfg = STATUS_CONFIG[selectedOrder.status] ?? { label: selectedOrder.status, bg: "bg-zinc-100", text: "text-zinc-600" };
                  return (
                    <span className={`px-3 py-1 rounded-md text-[13px] font-bold uppercase tracking-widest ${cfg.bg} ${cfg.text}`}>
                      {cfg.label}
                    </span>
                  );
                })()}
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-5">
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground font-bold tracking-widest text-[11px] uppercase mb-1">Customer</p>
                    <p className="font-medium text-foreground">{selectedOrder.customerName || "Walk-in Guest"}</p>
                    {selectedOrder.customerPhone && <p className="text-muted-foreground text-[12px]">{selectedOrder.customerPhone}</p>}
                  </div>
                  <div>
                    <p className="text-muted-foreground font-bold tracking-widest text-[11px] uppercase mb-1">Table</p>
                    <p className="font-medium text-foreground">Table {selectedOrder.table?.number || selectedOrder.tableId}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground font-bold tracking-widest text-[11px] uppercase mb-1">Items</p>
                    <p className="font-medium text-foreground">{selectedOrder.orderitem?.length || 0} item{(selectedOrder.orderitem?.length || 0) !== 1 ? "s" : ""}</p>
                  </div>
                </div>

                <div>
                  <p className="text-muted-foreground font-bold tracking-widest text-[11px] uppercase mb-3 border-b border-zinc-100 pb-2">Order Breakdown</p>
                  <div className="space-y-3 max-h-[28vh] overflow-y-auto pr-1">
                    {selectedOrder.orderitem?.map((item) => (
                      <div key={item.id} className="flex justify-between items-center text-sm py-1">
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-[#605DFF] bg-[#605DFF]/10 px-2 py-0.5 rounded text-[12px]">x{item.quantity}</span>
                          <span className="font-medium text-foreground">{item.menuitem?.name}</span>
                        </div>
                        <span className="font-bold text-foreground">
                          ${(item.quantity * (item.menuitem?.price || item.unitPrice)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-zinc-100 flex justify-between items-center">
                  <span className="text-base font-bold text-foreground uppercase tracking-widest">Grand Total</span>
                  <span className="text-2xl font-bold text-[#605DFF]">
                    ${selectedOrder.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    onClick={() => setIsViewOpen(false)}
                    className="rounded-lg font-bold border-zinc-200 px-8 h-11"
                  >
                    Close
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
