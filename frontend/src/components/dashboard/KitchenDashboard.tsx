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
import {
  dashboardTableHeaderClass,
  dashboardTableHeadRowClass,
  dashboardTableHeadClass,
  dashboardTableBodyRowClass,
  dashboardTableCellClass,
  dashboardStatIconClass,
  chartPrimary,
  chartPrimaryVariants,
  chartTooltipStyle,
  chartAxisTick,
  dashboardTableIdClass,
  dashboardStatusBadgeClass,
  getOrderStatusBadgeClass,
  formatStatusLabel,
  dashboardPageClass,
  dashboardPageStyle,
  pageHeaderTitleClass,
  pageHeaderWrapperClass,
} from "@/lib/dashboard-ui";
import { isToday, format, subDays } from "date-fns";

export default function KitchenDashboard({ orders }: { orders: Order[] }) {
  const stats = useMemo(() => {
    const todayOrders = orders.filter(o => isToday(o.createdAt ? new Date(o.createdAt) : new Date()));
    
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
      
      const count = orders.filter(o => o.createdAt && format(new Date(o.createdAt), 'yyyy-MM-dd') === dateStr).length;
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
  const COLORS = [...chartPrimaryVariants];

  const pendingOrders = useMemo(() => orders.filter(o => o.status === 'pending' || o.status === 'preparing').slice(0, 5), [orders]);

  const statCards = [
    {
      title: "Today's Orders",
      value: stats.totalToday,
      icon: CheckSquare,
    },
    {
      title: "In Queue (Pending)",
      value: stats.inQueue,
      icon: Clock,
    },
    {
      title: "Currently Cooking",
      value: stats.preparing,
      icon: Flame,
    },
    {
      title: "Completed Today",
      value: stats.completed,
      icon: ChefHat,
    }
  ];

  return (
    <div className={cn(dashboardPageClass, "space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700")} style={dashboardPageStyle}>
      <div className={pageHeaderWrapperClass}>
        <h1 className={pageHeaderTitleClass}>Kitchen Dashboard</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, i) => (
          <div key={i} className="trezo-card p-6 flex flex-col justify-between group hover:border-primary/30 transition-all hover:shadow-md">
            <div className="flex items-start justify-between">
              <div className={dashboardStatIconClass(i)}>
                <stat.icon className="size-5 text-white" />
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
                    <stop offset="5%" stopColor={chartPrimary} stopOpacity={0.25} />
                    <stop offset="95%" stopColor={chartPrimary} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.5} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={chartAxisTick} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={chartAxisTick} />
                <Tooltip contentStyle={chartTooltipStyle} itemStyle={{ color: "#ffffff" }} />
                <Area type="monotone" dataKey="orders" stroke={chartPrimary} strokeWidth={2.5} fillOpacity={1} fill="url(#colorKitchen)" />
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
                <Tooltip contentStyle={chartTooltipStyle} itemStyle={{ color: "#ffffff" }} />
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
        <div className="trezo-card overflow-hidden">
          <div className="px-8 py-4 flex flex-wrap items-center justify-between border-b border-border">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-tight text-foreground">Priority Orders</h3>
              <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-widest mt-0.5">Pending and preparing tickets</p>
            </div>
          </div>

          <div className="border-t border-border overflow-x-auto">
            <Table className="w-full">
              <TableHeader className={dashboardTableHeaderClass}>
                <TableRow className={dashboardTableHeadRowClass}>
                  <TableHead className={cn(dashboardTableHeadClass, "text-left")}>No</TableHead>
                  <TableHead className={cn(dashboardTableHeadClass, "text-left")}>Table</TableHead>
                  <TableHead className={cn(dashboardTableHeadClass, "text-left")}>Status</TableHead>
                  <TableHead className={cn(dashboardTableHeadClass, "text-left")}>Items count</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="bg-card">
                {pendingOrders.length > 0 ? pendingOrders.map((order) => (
                  <TableRow key={order.id} className={dashboardTableBodyRowClass}>
                  <TableCell className={dashboardTableCellClass}>
                    <span className={dashboardTableIdClass}>{order.id}</span>
                  </TableCell>
                  <TableCell className={dashboardTableCellClass}>
                    <span className="text-[13px] font-medium text-muted-foreground">
                      Table {order.table?.number || order.tableId}
                    </span>
                  </TableCell>
                  <TableCell className={dashboardTableCellClass}>
                    <span className={cn(dashboardStatusBadgeClass, getOrderStatusBadgeClass(order.status))}>
                      {formatStatusLabel(order.status)}
                    </span>
                  </TableCell>
                  <TableCell className={dashboardTableCellClass}>
                    <span className="text-[13px] font-medium text-zinc-700">{order.orderitem?.length || 0} items</span>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={4} className="px-6 py-10 text-center text-zinc-500">
                    No pending orders right now
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
