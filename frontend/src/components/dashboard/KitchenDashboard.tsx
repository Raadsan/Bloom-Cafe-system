import React, { useMemo } from "react";
import {
  ChefHat,
  Flame,
  CheckSquare,
  Clock,
  MoreHorizontal,
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
  PieChart,
  Pie,
  Cell
} from "recharts";
import { Order } from "@/lib/api/orderApi";
import { isToday, format, subDays } from "date-fns";

export default function KitchenDashboard({ orders }: { orders: Order[] }) {
  const stats = useMemo(() => {
    const todayOrders = orders.filter(o => isToday(new Date(o.createdAt)));
    
    const inQueue = todayOrders.filter(o => o.status === 'pending').length;
    const preparing = todayOrders.filter(o => o.status === 'preparing').length;
    const completed = todayOrders.filter(o => o.status === 'ready' || o.status === 'served').length;

    return {
      totalToday: todayOrders.length,
      inQueue,
      preparing,
      completed
    };
  }, [orders]);

  const weeklyData = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dayName = format(date, 'EEE');
      const dateStr = format(date, 'yyyy-MM-dd');
      
      const count = orders.filter(o => format(new Date(o.createdAt), 'yyyy-MM-dd') === dateStr).length;
      days.push({ name: dayName, orders: count });
    }
    return days;
  }, [orders]);

  // Mock Category Data for Kitchen (could be calculated if orderItems were fully populated with categories)
  const categoryData = [
    { name: 'Main Course', value: 45 },
    { name: 'Appetizers', value: 20 },
    { name: 'Desserts', value: 15 },
  ];
  const COLORS = ['#ef4444', '#f97316', '#f59e0b'];

  const pendingOrders = useMemo(() => orders.filter(o => o.status === 'pending' || o.status === 'preparing').slice(0, 5), [orders]);

  const statCards = [
    {
      title: "Today's Orders",
      value: stats.totalToday,
      icon: CheckSquare,
      color: "bg-[#605DFF]"
    },
    {
      title: "In Queue (Pending)",
      value: stats.inQueue,
      icon: Clock,
      color: "bg-amber-500"
    },
    {
      title: "Currently Cooking",
      value: stats.preparing,
      icon: Flame,
      color: "bg-orange-500"
    },
    {
      title: "Completed Today",
      value: stats.completed,
      icon: ChefHat,
      color: "bg-emerald-500"
    }
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground uppercase">Kitchen Dashboard</h1>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-3">Monitor active orders and kitchen workload.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, i) => (
          <div key={i} className="trezo-card p-6 flex flex-col justify-between group hover:border-primary/30 transition-all hover:shadow-md">
            <div className="flex items-start justify-between">
              <div className={cn("p-2.5 rounded-xl text-white shadow-lg transition-all group-hover:scale-110", stat.color)}>
                <stat.icon className="size-5" />
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
        <div className="lg:col-span-2 trezo-card p-6">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-foreground">Weekly Kitchen Load</h3>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Dishes prepared last 7 days</p>
            </div>
          </div>

          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorKitchen" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.5} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: "hsl(var(--muted-foreground))" }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))", borderRadius: "12px", fontSize: "12px", fontWeight: 700 }} />
                <Area type="monotone" dataKey="orders" stroke="#f97316" strokeWidth={3} fillOpacity={1} fill="url(#colorKitchen)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="trezo-card p-6">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-foreground">Active Categories</h3>
            </div>
          </div>
          
          <div className="h-[300px] w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={categoryData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value" stroke="none">
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))", borderRadius: "12px", fontSize: "12px", fontWeight: 700 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap items-center justify-center gap-4 mt-2">
              {categoryData.map((entry, index) => (
                <div key={`legend-${index}`} className="flex items-center gap-1.5">
                  <div className="size-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">{entry.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
          <div className="px-8 py-4 flex flex-wrap items-center justify-between border-b border-zinc-50">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-tight text-[#1E293B]">Priority Orders</h3>
              <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-widest mt-0.5">Pending and preparing tickets</p>
            </div>
          </div>

          <div className="border-t border-zinc-100 overflow-x-auto">
            <Table className="w-full">
              <TableHeader className="bg-[#605DFF]">
                <TableRow className="hover:bg-transparent border-none">
                  <TableHead className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-white border-none">Order ID</TableHead>
                  <TableHead className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-white border-none">Table</TableHead>
                  <TableHead className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-white border-none">Status</TableHead>
                  <TableHead className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-white border-none">Items count</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="bg-white">
                {pendingOrders.length > 0 ? pendingOrders.map((order) => (
                  <TableRow key={order.id} className="border-zinc-100 hover:bg-zinc-50/50 transition-colors group">
                  <TableCell className="px-6 py-5 text-[13px] font-bold text-[#1E293B]">#{order.id}</TableCell>
                  <TableCell className="px-6 py-5">
                    <span className="text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 bg-zinc-50 text-[#64748B] rounded-lg border border-zinc-100">
                      Table {order.table?.number || order.tableId}
                    </span>
                  </TableCell>
                  <TableCell className="px-6 py-5">
                    <span className={cn(
                      "text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full border shadow-sm",
                      order.status === 'preparing' ? 'bg-blue-500/10 text-blue-600 border-blue-500/20' : 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                    )}>
                      {order.status}
                    </span>
                  </TableCell>
                  <TableCell className="px-6 py-5">
                    <span className="text-[13px] font-bold text-[#1E293B]">{order.items?.length || 0} items</span>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={4} className="px-6 py-16 text-center">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-[#64748B]">No pending orders right now</p>
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
