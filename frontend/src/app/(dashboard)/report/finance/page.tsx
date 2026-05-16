"use client";

import React, { useState, useEffect } from "react";
import {
  DollarSign,
  TrendingUp,
  CreditCard,
  Smartphone,
  Calendar,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  PieChart as PieIcon,
  BarChart3
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

const COLORS = ['#605DFF', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

export default function FinanceReportPage() {
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
      const res = await reportApi.getFinanceReport(dateRange);
      if (res.success) {
        setData(res.data);
      }
    } catch (error) {
      console.error("Failed to fetch finance report:", error);
      showToast("Error loading finance data", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const StatCard = ({ title, value, icon: Icon, trend, color }: any) => (
    <div className="bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm hover:shadow-md transition-all group">
      <div className="flex items-center justify-between mb-4">
        <div className={cn("p-2.5 rounded-xl transition-colors", color)}>
          <Icon className="size-5 text-white" />
        </div>
        {trend && (
          <div className={cn(
            "flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-full",
            trend > 0 ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
          )}>
            {trend > 0 ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{title}</p>
      <h3 className="text-2xl font-black text-[#1E293B] mt-1 tracking-tight">
        {typeof value === 'number' && title.toLowerCase().includes('revenue') ? formatCurrency(value) : value}
      </h3>
    </div>
  );

  const getMethodChartData = () => {
    if (!data?.breakdownByMethod) return [];
    return Object.entries(data.breakdownByMethod).map(([name, value]: [string, any]) => ({ name, value }));
  };

  const getSourceChartData = () => {
    if (!data?.breakdownBySource) return [];
    return Object.entries(data.breakdownBySource).map(([name, value]: [string, any]) => ({ name, value }));
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground uppercase">Finance Report</h1>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-[0.2em] mt-2 flex items-center gap-2">
            <TrendingUp className="size-3 text-[#605DFF]" />
            Revenue Analysis & Financial Performance
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
            {loading ? "Updating..." : "Apply Filter"}
          </Button>
        </div>
      </div>

      {loading && !data ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 bg-white rounded-2xl border border-zinc-100 animate-pulse" />
          ))}
        </div>
      ) : data && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <StatCard title="Total Revenue" value={data.totalRevenue} icon={DollarSign} color="bg-emerald-500" trend={12.5} />
            <StatCard title="Average Order Value" value={data.averageTransaction} icon={TrendingUp} color="bg-[#605DFF]" trend={3.2} />
            <StatCard title="Total Transactions" value={data.transactionCount} icon={CreditCard} color="bg-amber-500" trend={-1.4} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Pie Chart: Payment Methods */}
            <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-8">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-lg font-black text-foreground uppercase tracking-tight">Payment Breakdown</h3>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Revenue by Method</p>
                </div>
                <div className="p-2 bg-indigo-50 rounded-lg">
                  <PieIcon className="size-4 text-indigo-500" />
                </div>
              </div>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={getMethodChartData()}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {getMethodChartData().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: any) => formatCurrency(Number(value))}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    />
                    <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Bar Chart: Channels */}
            <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-8">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-lg font-black text-foreground uppercase tracking-tight">Channel Revenue</h3>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Performance by Source</p>
                </div>
                <div className="p-2 bg-emerald-50 rounded-lg">
                  <BarChart3 className="size-4 text-emerald-500" />
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
                      tickFormatter={(value) => `$${value}`}
                    />
                    <Tooltip
                      cursor={{ fill: '#F8FAFC' }}
                      formatter={(value: any) => formatCurrency(Number(value))}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    />
                    <Bar dataKey="value" fill="#605DFF" radius={[6, 6, 0, 0]} barSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Table Breakdown */}
          <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-zinc-100 bg-zinc-50/30">
              <h3 className="text-sm font-black text-foreground uppercase tracking-tight">Detailed Breakdown</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 divide-x divide-zinc-100">
              <div className="p-6">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-4">Payment Methods</p>
                <div className="space-y-3">
                  {Object.entries(data.breakdownByMethod || {}).map(([name, value]: any) => (
                    <div key={name} className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 border border-zinc-100">
                      <span className="text-xs font-bold text-[#1E293B] uppercase">{name}</span>
                      <span className="text-sm font-black text-[#605DFF]">{formatCurrency(value)}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="p-6">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-4">Channel Sources</p>
                <div className="space-y-3">
                  {Object.entries(data.breakdownBySource || {}).map(([name, value]: any) => (
                    <div key={name} className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 border border-zinc-100">
                      <span className="text-xs font-bold text-[#1E293B] uppercase">{name}</span>
                      <span className="text-sm font-black text-emerald-600">{formatCurrency(value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
