import React, { useMemo } from "react";
import {
  ClipboardList,
  CheckCircle,
  Clock,
  TrendingUp,
  ArrowUpRight,
  MoreHorizontal,
  Search,
  Filter
} from "lucide-react";
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
import { Order } from "@/lib/api/orderApi";
import { isToday, isThisMonth, format, subDays, subMonths } from "date-fns";

export default function WaiterDashboard({ orders }: { orders: Order[] }) {
  // Calculate Stats
  const stats = useMemo(() => {
    const todayOrders = orders.filter(o => isToday(new Date(o.createdAt)));
    const thisMonthOrders = orders.filter(o => isThisMonth(new Date(o.createdAt)));
    
    const lastMonthDate = subMonths(new Date(), 1);
    const lastMonthOrders = orders.filter(o => {
      const d = new Date(o.createdAt);
      return d.getMonth() === lastMonthDate.getMonth() && d.getFullYear() === lastMonthDate.getFullYear();
    });

    const successOrders = orders.filter(o => o.status === 'served');
    const pendingOrders = orders.filter(o => ['pending', 'preparing', 'ready'].includes(o.status));

    // Calculate growth (mocking positive if no last month data)
    let growth = "+10.0%";
    if (lastMonthOrders.length > 0) {
      const g = ((thisMonthOrders.length - lastMonthOrders.length) / lastMonthOrders.length) * 100;
      growth = `${g >= 0 ? '+' : ''}${g.toFixed(1)}%`;
    }

    return {
      daily: todayOrders.length,
      success: successOrders.length,
      pending: pendingOrders.length,
      growth
    };
  }, [orders]);

  // Calculate Weekly Chart Data (Sat to Fri) - just last 7 days for simplicity
  const weeklyData = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dayName = format(date, 'EEE'); // Mon, Tue, etc.
      const dateStr = format(date, 'yyyy-MM-dd');
      
      const count = orders.filter(o => format(new Date(o.createdAt), 'yyyy-MM-dd') === dateStr).length;
      days.push({ name: dayName, orders: count });
    }
    return days;
  }, [orders]);

  // Calculate Status Bar Chart Data
  const statusBarData = useMemo(() => {
    const pending = orders.filter(o => o.status === 'pending').length;
    const preparing = orders.filter(o => o.status === 'preparing' || o.status === 'ready').length;
    const success = orders.filter(o => o.status === 'served').length;

    return [
      { name: 'Pending', count: pending, fill: '#f59e0b' },
      { name: 'In Progress', count: preparing, fill: '#3b82f6' },
      { name: 'Success', count: success, fill: '#10b981' }
    ];
  }, [orders]);

  const recentOrders = useMemo(() => orders.slice(0, 5), [orders]);

  const statCards = [
    {
      title: "Daily Orders",
      value: stats.daily,
      icon: ClipboardList,
      color: "bg-[#605DFF]",
      trend: "Today",
      trendUp: true
    },
    {
      title: "Success Orders",
      value: stats.success,
      icon: CheckCircle,
      color: "bg-emerald-500",
      trend: "All time",
      trendUp: true
    },
    {
      title: "Pending Orders",
      value: stats.pending,
      icon: Clock,
      color: "bg-amber-500",
      trend: "Active",
      trendUp: false
    },
    {
      title: "Monthly Growth",
      value: stats.growth,
      icon: TrendingUp,
      color: "bg-purple-500",
      trend: "vs last month",
      trendUp: stats.growth.startsWith('+')
    }
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
          <h1 className="text-2xl font-bold tracking-tight text-foreground uppercase">Waiter Dashboard</h1>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-3">Monitor your daily tasks and active orders.</p>
        </div>
      </div>

      {/* Stat Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, i) => (
          <div key={i} className="trezo-card p-6 flex flex-col justify-between group hover:border-primary/30 transition-all hover:shadow-md">
            <div className="flex items-start justify-between">
              <div className={cn("p-2.5 rounded-xl text-white shadow-lg transition-all group-hover:scale-110", stat.color)}>
                <stat.icon className="size-5" />
              </div>
              <div className={cn("flex items-center text-[10px] font-black uppercase tracking-widest text-muted-foreground")}>
                {stat.trend}
              </div>
            </div>
            <div className="mt-4">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">{stat.title}</p>
              <h3 className="text-2xl font-bold tracking-tight text-foreground mt-1">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Orders Area Chart */}
        <div className="lg:col-span-2 trezo-card p-6">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-foreground">Weekly Orders</h3>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Activity over the last 7 days</p>
            </div>
            <div className="flex items-center gap-2">
              <button className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors">
                <MoreHorizontal className="size-4" />
              </button>
            </div>
          </div>

          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#605DFF" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#605DFF" stopOpacity={0} />
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
                    backgroundColor: "#1E293B",
                    borderColor: "#1E293B",
                    borderRadius: "12px",
                    fontSize: "12px",
                    fontWeight: 700,
                    color: "#ffffff",
                    boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)"
                  }}
                  itemStyle={{ color: "#ffffff" }}
                />
                <Area
                  type="monotone"
                  dataKey="orders"
                  stroke="#818cf8"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorOrders)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Bar Chart */}
        <div className="trezo-card p-6">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-foreground">Order Status</h3>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Pending vs Success</p>
            </div>
          </div>

          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusBarData}>
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
                    backgroundColor: "#1E293B",
                    borderColor: "#1E293B",
                    borderRadius: "12px",
                    fontSize: "12px",
                    fontWeight: 700,
                    color: "#ffffff"
                  }}
                  itemStyle={{ color: "#ffffff" }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {statusBarData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 2 ? '#605DFF' : index === 1 ? '#818cf8' : '#cbd5e1'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
        {/* Recent Orders Table Section */}
        <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
          <div className="px-8 py-4 flex flex-wrap items-center justify-between border-b border-zinc-50">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-tight text-[#1E293B]">Recent Orders</h3>
              <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-widest mt-0.5">Last 5 activities</p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" className="h-9 px-3 bg-zinc-50 border border-zinc-200 text-zinc-500 hover:text-[#605DFF] hover:border-[#605DFF]/30">
                <Filter className="size-3.5 mr-1.5" />
                <span className="text-xs font-semibold">Filter</span>
              </Button>
            </div>
          </div>

          <div className="border-t border-zinc-100 overflow-x-auto">
            <Table className="w-full">
              <TableHeader className="bg-[#605DFF]">
                <TableRow className="hover:bg-transparent border-none">
                  <TableHead className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-white border-none">Order ID</TableHead>
                  <TableHead className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-white border-none">Customer</TableHead>
                  <TableHead className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-white border-none">Table</TableHead>
                  <TableHead className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-white border-none">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="bg-white">
                {recentOrders.length > 0 ? recentOrders.map((order) => (
                  <TableRow key={order.id} className="border-zinc-100 hover:bg-zinc-50/50 transition-colors group">
                  <TableCell className="px-6 py-5 text-[13px] font-bold text-[#1E293B]">#{order.id}</TableCell>
                  <TableCell className="px-6 py-5">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[13px] font-bold text-[#1E293B] uppercase tracking-tight">{order.customerName || "Walk-in Guest"}</span>
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
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={4} className="px-6 py-16 text-center">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-[#64748B]">No recent orders found</p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        </div>
      </div>
    </div>
  );
}
