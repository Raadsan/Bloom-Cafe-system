"use client";

import React, { useState, useEffect } from "react";
import { 
  ShoppingBag, 
  Clock, 
  CheckCircle2, 
  XCircle,
  Package,
  Calendar,
  PieChart as PieIcon,
  BarChart3,
  Activity
} from "lucide-react";
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid,
  Legend
} from 'recharts';
import { reportApi } from "@/lib/api/reportApi";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

const STATUS_COLORS = {
  served: '#10B981',
  pending: '#F59E0B',
  cancelled: '#EF4444',
  preparing: '#605DFF'
};

const SOURCE_COLORS = ['#605DFF', '#8B5CF6', '#A78BFA', '#C4B5FD'];

export default function OrdersReportPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const { showToast } = useToast();

  const fetchReport = async () => {
    try {
      setLoading(true);
      const res = await reportApi.getOrdersReport(dateRange);
      if (res.success) {
        setData(res.data);
      }
    } catch (error) {
      console.error("Failed to fetch orders report:", error);
      showToast("Error loading orders data", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  const getStatusChartData = () => {
    if (!data?.breakdownByStatus) return [];
    return Object.entries(data.breakdownByStatus).map(([name, value]) => ({ name, value }));
  };

  const getSourceChartData = () => {
    if (!data?.breakdownBySource) return [];
    return Object.entries(data.breakdownBySource).map(([name, value]) => ({ name, value }));
  };

  const StatCard = ({ title, value, subtext, icon: Icon, color }: any) => (
    <div className="bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm hover:shadow-md transition-all">
      <div className="flex items-center gap-4">
        <div className={cn("p-3 rounded-xl shadow-sm", color)}>
          <Icon className="size-6 text-white" />
        </div>
        <div>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{title}</p>
          <h3 className="text-2xl font-black text-[#1E293B] tracking-tight">{value}</h3>
          {subtext && <p className="text-[10px] font-bold text-zinc-400 mt-0.5">{subtext}</p>}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground uppercase">Orders Report</h1>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-[0.2em] mt-2 flex items-center gap-2">
            <Package className="size-3 text-[#605DFF]" />
            Volume, Status & Channel Distribution
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 bg-white p-2 rounded-2xl border border-zinc-100 shadow-sm">
          <div className="flex items-center gap-2 px-3">
            <Calendar className="size-4 text-muted-foreground" />
            <input 
              type="date" 
              value={dateRange.startDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
              className="text-xs font-bold bg-transparent outline-none border-none cursor-pointer"
            />
            <span className="text-zinc-300">to</span>
            <input 
              type="date" 
              value={dateRange.endDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
              className="text-xs font-bold bg-transparent outline-none border-none cursor-pointer"
            />
          </div>
          <div className="h-6 w-px bg-zinc-100 hidden md:block" />
          <Button 
            onClick={fetchReport}
            disabled={loading}
            className="bg-[#605DFF] hover:bg-[#4E4BCB] text-white font-bold h-10 px-6 rounded-xl shadow-lg shadow-[#605DFF]/20 transition-all active:scale-95"
          >
            {loading ? "Updating..." : "Update Results"}
          </Button>
        </div>
      </div>

      {loading && !data ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-24 bg-white rounded-2xl border border-zinc-100 animate-pulse" />
          ))}
        </div>
      ) : data && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard title="Total Orders" value={data.totalOrders} icon={ShoppingBag} color="bg-[#605DFF]" subtext="Volume for this period" />
            <StatCard title="Served" value={data.breakdownByStatus?.served || 0} icon={CheckCircle2} color="bg-emerald-500" subtext="Successfully completed" />
            <StatCard title="Pending" value={data.breakdownByStatus?.pending || 0} icon={Clock} color="bg-amber-500" subtext="Awaiting service" />
            <StatCard title="Cancelled" value={data.breakdownByStatus?.cancelled || 0} icon={XCircle} color="bg-rose-500" subtext="Rejected or voided" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Pie Chart: Status Breakdown */}
            <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-8">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-lg font-black text-foreground uppercase tracking-tight">Order Status</h3>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Fulfillment Distribution</p>
                </div>
                <div className="p-2 bg-rose-50 rounded-lg">
                  <PieIcon className="size-4 text-rose-500" />
                </div>
              </div>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={getStatusChartData()}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {getStatusChartData().map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={(STATUS_COLORS as any)[entry.name] || '#CBD5E1'} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                    <Legend verticalAlign="bottom" height={36}/>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Bar Chart: Sources */}
            <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-8">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-lg font-black text-foreground uppercase tracking-tight">Source Volume</h3>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Orders by Channel</p>
                </div>
                <div className="p-2 bg-indigo-50 rounded-lg">
                  <BarChart3 className="size-4 text-indigo-500" />
                </div>
              </div>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={getSourceChartData()}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 10, fontWeight: 700, fill: '#64748B' }}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 10, fontWeight: 700, fill: '#64748B' }}
                    />
                    <Tooltip 
                      cursor={{ fill: '#F8FAFC' }}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    />
                    <Bar dataKey="value" fill="#605DFF" radius={[6, 6, 0, 0]} barSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Activity Table */}
          <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-zinc-100 bg-zinc-50/30 flex items-center gap-2">
              <Activity className="size-4 text-[#605DFF]" />
              <h3 className="text-sm font-black text-foreground uppercase tracking-tight">Recent Order Activity</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-zinc-50/50 border-b border-zinc-100">
                    <th className="px-6 py-4 text-[10px] font-black text-[#64748B] uppercase tracking-[0.15em]">Order ID</th>
                    <th className="px-6 py-4 text-[10px] font-black text-[#64748B] uppercase tracking-[0.15em]">Customer</th>
                    <th className="px-6 py-4 text-[10px] font-black text-[#64748B] uppercase tracking-[0.15em]">Source</th>
                    <th className="px-6 py-4 text-[10px] font-black text-[#64748B] uppercase tracking-[0.15em]">Status</th>
                    <th className="px-6 py-4 text-[10px] font-black text-[#64748B] uppercase tracking-[0.15em] text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-50">
                  {data.orders?.map((o: any) => (
                    <tr key={o.id} className="hover:bg-zinc-50/30 transition-colors">
                      <td className="px-6 py-4 font-bold text-[#1E293B]">#{o.id}</td>
                      <td className="px-6 py-4">
                        <p className="text-[13px] font-bold text-[#1E293B]">{o.customerName || 'Walk-in'}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-[10px] font-black text-[#605DFF] bg-[#605DFF]/5 px-2 py-0.5 rounded uppercase tracking-wider">
                          {o.source}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5">
                          <div className={cn(
                            "size-1.5 rounded-full",
                            (STATUS_COLORS as any)[o.status] || "bg-zinc-300"
                          )} />
                          <span className="text-[12px] font-bold text-[#1E293B] capitalize">{o.status}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right font-black text-[#1E293B]">
                        ${o.total.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
