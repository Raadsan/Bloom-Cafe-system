"use client";

import React, { useEffect, useState, useMemo } from "react";
import { orderApi, Order } from "@/lib/api/orderApi";
import { useToast } from "@/components/ui/toast";
import { 
  CircleDollarSign, 
  Loader2, 
  RefreshCw, 
  Calendar, 
  Search, 
  ArrowLeft,
  ClipboardList,
  DollarSign,
  TrendingUp,
  Download,
  Wallet
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";
import {
  dashboardTableHeaderClass,
  dashboardTableHeadRowClass,
  dashboardTableHeadClass,
  dashboardStatusBadgeClass,
  getOrderStatusBadgeClass,
  formatStatusLabel,
  dashboardPageClass,
  dashboardPageStyle,
  pageHeaderTitleClass,
  pageHeaderSubtitleClass,
  pageHeaderWrapperClass,
} from "@/lib/dashboard-ui";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";

export default function MySalesPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const { showToast } = useToast();

  const fetchMyOrders = async () => {
    setLoading(true);
    try {
      const data = await orderApi.getAllOrders({ onlyMine: true });
      // Only show non-held orders
      setOrders(data.filter(o => o.status !== 'held'));
    } catch (error) {
      showToast("Failed to fetch your sales", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyOrders();
  }, []);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(val || 0);
  };

  const filteredOrders = useMemo(() => {
    return orders.filter(o => 
      o.id.toString().includes(search) || 
      (o.customerName && o.customerName.toLowerCase().includes(search.toLowerCase()))
    );
  }, [orders, search]);

  const paginatedOrders = useMemo(() => {
    return filteredOrders.slice(0, pageSize);
  }, [filteredOrders, pageSize]);

  const totalSales = orders.reduce((sum, o) => sum + (o.total || 0), 0);
  const totalOrders = orders.length;
  const avgOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;
  const highestSale = totalOrders > 0 ? Math.max(...orders.map(o => o.total || 0)) : 0;

  return (
    <div className={cn(dashboardPageClass, "space-y-6")} style={dashboardPageStyle}>
      {/* Page Header */}
      <div className={cn(pageHeaderWrapperClass, "flex flex-col sm:flex-row sm:items-center justify-between gap-4")}>
        <div>
          <h1 className={pageHeaderTitleClass}>My Sales Analytics</h1>
          <p className={pageHeaderSubtitleClass}>Detailed tracking of your personal sales and performance.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={fetchMyOrders} variant="outline" className="h-10 border-zinc-200 text-zinc-600 rounded-xl shadow-sm font-bold px-4 hover:bg-zinc-50 flex items-center gap-2 text-xs uppercase tracking-widest">
            <RefreshCw className={cn("size-3.5", loading && "animate-spin")} /> Refresh
          </Button>
          <Link href="/pos-terminal">
            <Button className="h-10 bg-[#10b981] hover:bg-[#059669] text-white rounded-xl shadow-sm font-bold px-4 flex items-center gap-2 text-xs uppercase tracking-widest border-none">
              <ArrowLeft className="size-3.5" /> Back to POS
            </Button>
          </Link>
        </div>
      </div>

      {/* Top 4 Summary Boxes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
        <div className="bg-white p-5 rounded-xl border border-zinc-200 shadow-sm hover:border-primary/20 transition-all group flex flex-col gap-4">
          <div className="p-2.5 bg-primary/10 rounded-lg w-fit group-hover:bg-primary transition-colors">
            <ClipboardList className="size-4 text-primary group-hover:text-white transition-colors" />
          </div>
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-black text-zinc-400 uppercase tracking-widest">Total Orders</p>
            <h3 className="text-xl font-black text-[#1E293B]">{totalOrders}</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-zinc-200 shadow-sm hover:border-amber-500/20 transition-all group flex flex-col gap-4">
          <div className="p-2.5 bg-amber-50 rounded-lg w-fit group-hover:bg-amber-500 transition-colors">
            <DollarSign className="size-4 text-amber-600 group-hover:text-white transition-colors" />
          </div>
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-black text-zinc-400 uppercase tracking-widest">Total Sales</p>
            <h3 className="text-xl font-black text-[#1E293B]">{formatCurrency(totalSales)}</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-zinc-200 shadow-sm hover:border-emerald-500/20 transition-all group flex flex-col gap-4">
          <div className="p-2.5 bg-emerald-50 rounded-lg w-fit group-hover:bg-emerald-500 transition-colors">
            <TrendingUp className="size-4 text-emerald-600 group-hover:text-white transition-colors" />
          </div>
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-black text-zinc-400 uppercase tracking-widest">Avg Order Value</p>
            <h3 className="text-xl font-black text-emerald-600">{formatCurrency(avgOrderValue)}</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-zinc-200 shadow-sm hover:border-rose-500/20 transition-all group flex flex-col gap-4">
          <div className="p-2.5 bg-rose-50 rounded-lg w-fit group-hover:bg-rose-500 transition-colors">
            <Wallet className="size-4 text-rose-600 group-hover:text-white transition-colors" />
          </div>
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-black text-zinc-400 uppercase tracking-widest">Highest Sale</p>
            <h3 className="text-xl font-black text-rose-600">{formatCurrency(highestSale)}</h3>
          </div>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
        {/* Controls Row */}
        <div className="px-8 py-4 flex flex-wrap items-center gap-6 border-b border-zinc-50 bg-white">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-[13px] text-zinc-400 font-normal shrink-0">
                <span>Show</span>
                <select 
                    value={pageSize} 
                    onChange={(e) => setPageSize(Number(e.target.value))}
                    className="w-16 h-[38px] px-2 border border-zinc-200 rounded-md outline-none focus:border-primary transition-colors bg-white cursor-pointer text-sm font-normal text-zinc-600"
                >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                </select>
            </div>
          </div>

          <div className="flex-1"></div>

          <div className="flex items-center gap-3">
            <div className="relative w-64 group">
                <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-primary transition-colors" />
                <input 
                    type="text" 
                    placeholder="Search ID or Customer..." 
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full h-[38px] pl-10 pr-4 bg-zinc-50 border border-zinc-200 rounded-md outline-none focus:border-primary transition-all text-sm font-normal text-zinc-600"
                />
            </div>
            <Button variant="outline" className="h-[38px] px-4 border-zinc-200 text-zinc-600 hover:bg-zinc-50 rounded-md flex items-center gap-2 text-xs font-bold uppercase tracking-widest">
                <Download className="size-3.5" />
                Export
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-hidden bg-white">
          <div className="overflow-x-auto">
            <Table className="w-full">
              <TableHeader className={dashboardTableHeaderClass}>
                <TableRow className={dashboardTableHeadRowClass}>
                  <TableHead className={cn(dashboardTableHeadClass, "text-left")}>No</TableHead>
                  <TableHead className={cn(dashboardTableHeadClass, "text-left")}>Date & Time</TableHead>
                  <TableHead className={cn(dashboardTableHeadClass, "text-left")}>Customer</TableHead>
                  <TableHead className={cn(dashboardTableHeadClass, "text-left")}>Status</TableHead>
                  <TableHead className={cn(dashboardTableHeadClass, "text-right")}>Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <TableRow key={i} className="h-14 animate-pulse">
                      {[...Array(5)].map((_, j) => (
                        <TableCell key={j} className="px-8 py-3">
                          <div className="h-4 bg-zinc-100 rounded w-full"></div>
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : paginatedOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="px-8 py-20 text-center text-zinc-400">
                      <div className="flex flex-col items-center gap-2 opacity-50">
                        <ClipboardList className="size-10" />
                        <p className="text-xs font-bold uppercase tracking-widest">No sales found</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedOrders.map((order) => (
                    <TableRow key={order.id} className="border-zinc-100 hover:bg-zinc-50/50 transition-colors">
                      <TableCell className="px-8 py-3">
                        <div className="flex flex-col">
                          <span className="text-[13px] font-bold text-primary">{order.id}</span>
                        </div>
                      </TableCell>
                      <TableCell className="px-8 py-3">
                        <span className="text-[12px] font-medium text-zinc-600">
                          {order.createdAt ? new Date(order.createdAt).toLocaleString() : 'N/A'}
                        </span>
                      </TableCell>
                      <TableCell className="px-8 py-3">
                        <span className="text-[13px] font-medium text-zinc-600">{order.customerName || 'Walk-in Guest'}</span>
                      </TableCell>
                      <TableCell className="px-8 py-3">
                        <span className={cn(dashboardStatusBadgeClass, getOrderStatusBadgeClass(order.status))}>
                          {formatStatusLabel(order.status)}
                        </span>
                      </TableCell>
                      <TableCell className="px-8 py-3 text-right pr-12">
                        <span className="text-[13px] font-bold text-[#1E293B]">
                          {formatCurrency(order.total)}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Table Footer */}
        <div className="py-3 px-8 flex items-center justify-between bg-zinc-50/30 border-t border-zinc-100">
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Showing {paginatedOrders.length} of {filteredOrders.length} records</p>
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                    <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Filtered Sales:</p>
                    <p className="text-sm font-black text-primary">{formatCurrency(filteredOrders.reduce((sum, o) => sum + (o.total || 0), 0))}</p>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}
