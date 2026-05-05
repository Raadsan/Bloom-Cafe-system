"use client";

import React, { useEffect, useState } from "react";
import { 
  DollarSign, 
  Users, 
  Store, 
  Clock, 
  Briefcase, 
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  MoreHorizontal,
  Search,
  Filter
} from "lucide-react";
import { reportApi } from "@/lib/api/reportApi";
import { orderApi, Order } from "@/lib/api/orderApi";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from "recharts";

interface DashboardData {
  totalOrders: number;
  totalCustomers: number;
  totalTables: number;
  totalPaidPayments: number;
  totalPendingPayments: number;
  totalRevenue: number;
}

const MOCK_REVENUE_DATA = [
  { name: "Mon", revenue: 4000, orders: 24 },
  { name: "Tue", revenue: 3000, orders: 18 },
  { name: "Wed", revenue: 5000, orders: 32 },
  { name: "Thu", revenue: 4500, orders: 28 },
  { name: "Fri", revenue: 6000, orders: 45 },
  { name: "Sat", revenue: 8000, orders: 58 },
  { name: "Sun", revenue: 7000, orders: 50 },
];

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [summaryRes, ordersRes] = await Promise.all([
          reportApi.getDashboardSummary(),
          orderApi.getAllOrders()
        ]);
        setData(summaryRes.data);
        setRecentOrders(ordersRes.slice(0, 5)); // Get top 5 recent orders
      } catch (error) {
        console.error("Failed to load dashboard data", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-20 bg-muted/20 rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-32 bg-muted/20 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-[400px] bg-muted/20 rounded-xl" />
          <div className="h-[400px] bg-muted/20 rounded-xl" />
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: "Total Orders",
      value: data?.totalOrders || 0,
      icon: Briefcase,
      color: "bg-primary",
      trend: "+12.5%",
      trendUp: true
    },
    {
      title: "Gross Revenue",
      value: `$${(data?.totalRevenue || 0).toLocaleString()}`,
      icon: DollarSign,
      color: "bg-emerald-500",
      trend: "+8.2%",
      trendUp: true
    },
    {
      title: "Pending Orders",
      value: data?.totalPendingPayments || 0,
      icon: Clock,
      color: "bg-amber-500",
      trend: "-2.4%",
      trendUp: false
    },
    {
      title: "Total Customers",
      value: data?.totalCustomers || 0,
      icon: Users,
      color: "bg-blue-500",
      trend: "+15.1%",
      trendUp: true
    },
    {
      title: "Active Tables",
      value: data?.totalTables || 0,
      icon: Store,
      color: "bg-purple-500",
      trend: "Stable",
      trendUp: null
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
      case 'served':
        return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
      case 'preparing':
      case 'ready':
        return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      case 'pending':
        return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
      case 'cancelled':
        return 'bg-rose-500/10 text-rose-600 border-rose-500/20';
      default:
        return 'bg-slate-500/10 text-slate-600 border-slate-500/20';
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground uppercase">Dashboard Overview</h1>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-3">Track your restaurant performance and daily operations.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="text-[11px] font-bold uppercase tracking-widest h-10 rounded-xl bg-white border border-zinc-100 text-[#64748B] hover:bg-zinc-50 hover:text-[#605DFF] transition-all shadow-sm">
            <Calendar className="mr-2 size-3.5" />
            Last 7 Days
          </Button>
          <Button size="sm" className="text-[11px] font-bold uppercase tracking-widest h-10 rounded-xl bg-[#F3F4FF] text-[#605DFF] hover:bg-[#605DFF] hover:text-white transition-all border-none shadow-none px-6">
            Generate Report
          </Button>
        </div>
      </div>

      {/* Stat Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {statCards.map((stat, i) => (
          <div key={i} className="trezo-card p-6 flex flex-col justify-between group hover:border-primary/30 transition-all hover:shadow-md">
            <div className="flex items-start justify-between">
              <div className={cn("p-2.5 rounded-xl text-white shadow-lg transition-all group-hover:scale-110", stat.color)}>
                <stat.icon className="size-5" />
              </div>
              {stat.trendUp !== null && (
                <div className={cn("flex items-center text-[10px] font-black uppercase tracking-widest", stat.trendUp ? "text-emerald-500" : "text-rose-500")}>
                  {stat.trendUp ? <ArrowUpRight className="size-3 mr-0.5" /> : <ArrowDownRight className="size-3 mr-0.5" />}
                  {stat.trend}
                </div>
              )}
            </div>
            <div className="mt-4">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">{stat.title}</p>
              <h3 className="text-2xl font-bold tracking-tight text-foreground mt-1">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart Section */}
        <div className="lg:col-span-2 trezo-card p-6">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-foreground">Revenue Analytics</h3>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Weekly earnings report</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 mr-4">
                <div className="size-2 rounded-full bg-primary" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Revenue</span>
              </div>
              <button className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors">
                <MoreHorizontal className="size-4" />
              </button>
            </div>
          </div>
          
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={MOCK_REVENUE_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.5} />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 700, fill: "hsl(var(--muted-foreground))" }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 700, fill: "hsl(var(--muted-foreground))" }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "hsl(var(--card))", 
                    borderColor: "hsl(var(--border))",
                    borderRadius: "12px",
                    fontSize: "12px",
                    fontWeight: 700,
                    boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)"
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="var(--primary)" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorRevenue)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Order Volume Chart */}
        <div className="trezo-card p-6">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-foreground">Order Volume</h3>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Orders by weekday</p>
            </div>
          </div>
          
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={MOCK_REVENUE_DATA}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.5} />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 700, fill: "hsl(var(--muted-foreground))" }}
                  dy={10}
                />
                <YAxis hide />
                <Tooltip 
                  cursor={{ fill: 'transparent' }}
                  contentStyle={{ 
                    backgroundColor: "hsl(var(--card))", 
                    borderColor: "hsl(var(--border))",
                    borderRadius: "12px",
                    fontSize: "12px",
                    fontWeight: 700
                  }}
                />
                <Bar dataKey="orders" radius={[4, 4, 0, 0]}>
                  {MOCK_REVENUE_DATA.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 5 ? "var(--primary)" : "hsl(var(--primary) / 0.2)"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Orders Table Section */}
      <div className="trezo-card">
        <div className="p-6 border-b border-border flex items-center justify-between bg-muted/10">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-foreground">Recent Orders</h3>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Last 5 activities</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative group">
              <Search className="size-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input 
                type="text" 
                placeholder="Search..." 
                className="h-8 pl-8 pr-3 text-[10px] font-bold bg-background border border-border/50 rounded-md outline-none focus:border-primary/30 w-32 focus:w-48 transition-all"
              />
            </div>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <Filter className="size-3.5" />
            </Button>
          </div>
        </div>
        
        <div className="border-t border-zinc-100">
          <Table>
            <TableHeader className="bg-zinc-50/50">
              <TableRow className="border-zinc-100 hover:bg-transparent">
                <TableHead className="px-6 py-5 text-[11px] font-bold uppercase tracking-widest text-[#64748B]">Order ID</TableHead>
                <TableHead className="px-6 py-5 text-[11px] font-bold uppercase tracking-widest text-[#64748B]">Customer</TableHead>
                <TableHead className="px-6 py-5 text-[11px] font-bold uppercase tracking-widest text-[#64748B]">Table</TableHead>
                <TableHead className="px-6 py-5 text-[11px] font-bold uppercase tracking-widest text-[#64748B]">Status</TableHead>
                <TableHead className="px-6 py-5 text-[11px] font-bold uppercase tracking-widest text-[#64748B] text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentOrders.length > 0 ? recentOrders.map((order) => (
                <TableRow key={order.id} className="border-zinc-50 hover:bg-zinc-50/30 transition-colors group">
                  <TableCell className="px-6 py-5 text-[13px] font-bold text-[#1E293B]">#{order.id}</TableCell>
                  <TableCell className="px-6 py-5">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[13px] font-bold text-[#1E293B] uppercase tracking-tight">{order.customerName || "Walk-in Guest"}</span>
                      <span className="text-[10px] font-medium text-[#64748B] uppercase tracking-widest">{order.customerPhone || "No Phone"}</span>
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-5">
                    <span className="text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 bg-zinc-50 text-[#64748B] rounded-lg border border-zinc-100">
                      Table {order.table?.number || order.tableId}
                    </span>
                  </TableCell>
                  <TableCell className="px-6 py-5">
                    <span className={cn(
                      "text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full border shadow-sm",
                      getStatusColor(order.status)
                    )}>
                      {order.status}
                    </span>
                  </TableCell>
                  <TableCell className="px-6 py-5 text-right">
                    <span className="text-[13px] font-bold text-[#1E293B]">${order.total.toLocaleString()}</span>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={5} className="px-6 py-16 text-center">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-[#64748B]">No recent orders found</p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <div className="p-5 border-t border-zinc-100 bg-white text-center">
          <button className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#605DFF] hover:underline transition-all">
            View All Transactions
          </button>
        </div>
      </div>

    </div>
  );
}
