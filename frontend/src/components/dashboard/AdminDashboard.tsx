import React from "react";
import {
  DollarSign,
  Users,
  Store,
  Clock,
  Briefcase,
  ArrowUpRight,
  ArrowDownRight,
  MoreHorizontal,
  Search,
  Filter,
  Calendar
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
  Cell,
  PieChart,
  Pie
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
  dashboardStatusBadgeClass,
  getOrderStatusBadgeClass,
  formatStatusLabel,
} from "@/lib/dashboard-ui";

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

const MOCK_CATEGORY_DATA = [
  { name: 'Main Course', value: 450 },
  { name: 'Appetizers', value: 200 },
  { name: 'Drinks', value: 300 },
  { name: 'Desserts', value: 150 },
];
const COLORS = [...chartPrimaryVariants];

export default function AdminDashboard({ data, recentOrders }: { data: DashboardData | null, recentOrders: Order[] }) {
  const statCards = [
    {
      title: "Total Orders",
      value: data?.totalOrders || 0,
      icon: Briefcase,
      trend: "+12.5%",
      trendUp: true
    },
    {
      title: "Gross Revenue",
      value: `$${(data?.totalRevenue || 0).toLocaleString()}`,
      icon: DollarSign,
      trend: "+8.2%",
      trendUp: true
    },
    {
      title: "Pending Orders",
      value: data?.totalPendingPayments || 0,
      icon: Clock,
      trend: "-2.4%",
      trendUp: false
    },
    {
      title: "Total Customers",
      value: data?.totalCustomers || 0,
      icon: Users,
      trend: "+15.1%",
      trendUp: true
    },
    {
      title: "Active Tables",
      value: data?.totalTables || 0,
      icon: Store,
      trend: "Stable",
      trendUp: null
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground uppercase">Admin Dashboard</h1>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-3">Track your restaurant performance and daily operations.</p>
        </div>
        {/* <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="text-[11px] font-bold uppercase tracking-widest h-10 rounded-xl bg-white border border-zinc-100 text-[#64748B] hover:bg-zinc-50 hover:text-primary transition-all shadow-sm">
            <Calendar className="mr-2 size-3.5" />
            Last 7 Days
          </Button>
          <Button size="sm" className="text-[11px] font-bold uppercase tracking-widest h-10 rounded-xl bg-[#F3F4FF] text-primary hover:bg-primary hover:text-white transition-all border-none shadow-none px-6">
            Generate Report
          </Button>
        </div> */}
      </div>

      {/* Stat Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {statCards.map((stat, i) => (
          <div key={i} className="trezo-card p-6 flex flex-col justify-between group hover:border-primary/30 transition-all hover:shadow-md">
            <div className="flex items-start justify-between">
              <div className={dashboardStatIconClass(i)}>
                <stat.icon className="size-5 text-white" />
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
                    <stop offset="5%" stopColor={chartPrimary} stopOpacity={0.25} />
                    <stop offset="95%" stopColor={chartPrimary} stopOpacity={0} />
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
                  contentStyle={chartTooltipStyle}
                  itemStyle={{ color: "#ffffff" }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke={chartPrimary}
                  strokeWidth={2.5}
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
                  cursor={{ fill: 'rgba(91, 16, 23, 0.06)' }}
                  contentStyle={chartTooltipStyle}
                  itemStyle={{ color: "#ffffff" }}
                />
                <Bar dataKey="orders" radius={[4, 4, 0, 0]}>
                  {MOCK_REVENUE_DATA.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={chartPrimaryVariants[index % chartPrimaryVariants.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders Table Section */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
          <div className="px-8 py-4 flex flex-wrap items-center justify-between border-b border-zinc-50">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-tight text-[#1E293B]">Recent Orders</h3>
              <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-widest mt-0.5">Last 5 activities</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative w-48 group">
                <Search className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-primary transition-colors" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="w-full h-9 pl-9 pr-3 bg-zinc-50 border border-zinc-200 rounded-md outline-none focus:border-primary focus:ring-1 focus:ring-primary/10 transition-all text-xs font-medium text-zinc-600"
                />
              </div>
              <Button variant="ghost" size="sm" className="h-9 px-3 bg-zinc-50 border border-zinc-200 text-zinc-500 hover:text-primary hover:border-primary/30">
                <Filter className="size-3.5 mr-1.5" />
                <span className="text-xs font-semibold">Filter</span>
              </Button>
            </div>
          </div>

          <div className="border-t border-zinc-100 overflow-x-auto">
            <Table className="w-full">
              <TableHeader className={dashboardTableHeaderClass}>
                <TableRow className={dashboardTableHeadRowClass}>
                  <TableHead className={cn(dashboardTableHeadClass, "text-left")}>No</TableHead>
                  <TableHead className={cn(dashboardTableHeadClass, "text-left")}>Customer</TableHead>
                  <TableHead className={cn(dashboardTableHeadClass, "text-left")}>Table</TableHead>
                  <TableHead className={cn(dashboardTableHeadClass, "text-left")}>Status</TableHead>
                  <TableHead className={cn(dashboardTableHeadClass, "text-right")}>Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="bg-white">
                {recentOrders.length > 0 ? recentOrders.map((order) => (
                  <TableRow key={order.id} className={dashboardTableBodyRowClass}>
                  <TableCell className={dashboardTableCellClass}>
                    <span className="text-[13px] font-bold text-primary">{order.id}</span>
                  </TableCell>
                  <TableCell className={dashboardTableCellClass}>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[13px] font-medium text-zinc-700">{order.customerName || "Walk-in Guest"}</span>
                      <span className="text-[11px] text-zinc-500">{order.customerPhone || "No Phone"}</span>
                    </div>
                  </TableCell>
                  <TableCell className={dashboardTableCellClass}>
                    <span className="text-[13px] font-medium text-zinc-600">
                      Table {order.table?.number || order.tableId}
                    </span>
                  </TableCell>
                  <TableCell className={dashboardTableCellClass}>
                    <span className={cn(dashboardStatusBadgeClass, getOrderStatusBadgeClass(order.status))}>
                      {formatStatusLabel(order.status)}
                    </span>
                  </TableCell>
                  <TableCell className={cn(dashboardTableCellClass, "text-right")}>
                    <span className="text-[13px] font-bold text-zinc-700">${order.total.toLocaleString()}</span>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={5} className="px-6 py-10 text-center text-zinc-500">
                    No recent orders found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <div className="p-5 border-t border-zinc-100 bg-white text-center">
          <button className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary hover:underline transition-all">
            View All Transactions
          </button>
        </div>
        </div>

        {/* Sales by Category Pie Chart */}
        <div className="trezo-card p-6">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-foreground">Sales by Category</h3>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Distribution of items</p>
            </div>
          </div>
          
          <div className="h-[300px] w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={MOCK_CATEGORY_DATA}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {MOCK_CATEGORY_DATA.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    borderColor: "hsl(var(--border))",
                    borderRadius: "12px",
                    fontSize: "12px",
                    fontWeight: 700
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Custom Legend */}
            <div className="flex flex-wrap items-center justify-center gap-4 mt-2">
              {MOCK_CATEGORY_DATA.map((entry, index) => (
                <div key={`legend-${index}`} className="flex items-center gap-1.5">
                  <div className="size-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">{entry.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
