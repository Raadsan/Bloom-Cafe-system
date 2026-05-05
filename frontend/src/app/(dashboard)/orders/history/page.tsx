"use client";

import React, { useEffect, useState } from "react";
import { Search, Filter, Calendar, PackageOpen, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { orderApi, Order } from "@/lib/api/orderApi";
import { cn } from "@/lib/utils";

export default function OrderHistoryPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const data = await orderApi.getAllOrders();
        // Filter for completed/paid orders for history
        const historyData = data?.filter(o => o.status === "paid" || o.status === "cancelled") || [];
        setOrders(historyData);
      } catch (error) {
        console.error("Failed to fetch order history", error);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground uppercase">Order History</h1>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-3">Review past transactions and generated revenue reports.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="text-[11px] font-bold uppercase tracking-widest h-10 rounded-xl bg-white border border-zinc-100 text-[#64748B] hover:bg-zinc-50 hover:text-[#605DFF] transition-all shadow-sm">
            <Download className="mr-2 size-3.5" />
            Export CSV
          </Button>
          <Button size="sm" className="text-[11px] font-bold uppercase tracking-widest h-10 rounded-xl bg-[#F3F4FF] text-[#605DFF] hover:bg-[#605DFF] hover:text-white transition-all border-none shadow-none px-6">
            <Calendar className="mr-2 size-4" />
            Last 30 Days
          </Button>
        </div>
      </div>

      <div className="trezo-card overflow-hidden">
        <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-zinc-50/30">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-foreground">Transaction Log</h3>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Detailed history of all completed sales</p>
          </div>
          <div className="relative group w-full md:w-72">
            <Search className="size-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-[#605DFF] transition-colors" />
            <input 
              type="text" 
              placeholder="Search by ID or Guest..." 
              className="w-full pl-10 pr-4 py-2.5 text-[11px] font-bold bg-white border border-zinc-100 rounded-xl outline-none focus:border-[#605DFF]/30 focus:ring-4 focus:ring-[#605DFF]/5 transition-all" 
            />
          </div>
        </div>

        <div className="border-t border-zinc-100">
          <Table>
            <TableHeader className="bg-zinc-50/50">
              <TableRow className="border-zinc-100 hover:bg-transparent">
                <TableHead className="px-6 py-5 text-[11px] font-bold uppercase tracking-widest text-[#64748B]">Date & Time</TableHead>
                <TableHead className="px-6 py-5 text-[11px] font-bold uppercase tracking-widest text-[#64748B]">Order ID</TableHead>
                <TableHead className="px-6 py-5 text-[11px] font-bold uppercase tracking-widest text-[#64748B]">Customer</TableHead>
                <TableHead className="px-6 py-5 text-[11px] font-bold uppercase tracking-widest text-[#64748B] text-right">Total Amount</TableHead>
                <TableHead className="px-6 py-5 text-[11px] font-bold uppercase tracking-widest text-[#64748B] text-center">Final Status</TableHead>
                <TableHead className="px-6 py-5 w-20"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i} className="h-16 animate-pulse bg-zinc-50/10 border-zinc-50">
                    <TableCell colSpan={6} />
                  </TableRow>
                ))
              ) : orders.length > 0 ? (
                orders.map((order) => (
                  <TableRow key={order.id} className="border-zinc-50 hover:bg-zinc-50/30 transition-colors group">
                    <TableCell className="px-6 py-5 text-[#64748B] text-[11px] font-bold uppercase tracking-widest">
                      {order.createdAt ? new Date(order.createdAt).toLocaleDateString() + ' ' + new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "-"}
                    </TableCell>
                    <TableCell className="px-6 py-5 text-[13px] font-bold text-[#1E293B]">#{order.id}</TableCell>
                    <TableCell className="px-6 py-5 text-[13px] font-bold text-[#1E293B] uppercase tracking-tight">
                      {order.customerName || "Walk-in Guest"}
                    </TableCell>
                    <TableCell className="px-6 py-5 text-right text-[13px] font-bold text-[#1E293B]">
                      ${order.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="px-6 py-5 text-center">
                      <span className={cn(
                        "px-3 py-1.5 rounded-full text-[10px] font-bold uppercase border shadow-sm",
                        order.status === "paid" ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : "bg-rose-500/10 text-rose-600 border-rose-500/20"
                      )}>
                        {order.status}
                      </span>
                    </TableCell>
                    <TableCell className="px-6 py-5 text-right">
                      <Button variant="ghost" size="sm" className="h-9 w-9 p-0 text-[#64748B] hover:text-[#605DFF] hover:bg-[#F3F4FF] rounded-lg">
                        <Download className="size-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center justify-center">
                       <PackageOpen className="size-12 text-zinc-200 mb-4" />
                       <p className="text-[#64748B] font-bold uppercase text-[11px] tracking-widest">No order history found</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
