"use client";

import React, { useState, useEffect } from "react";
import { 
  Users, 
  Star, 
  Search,
  Calendar,
  Smartphone,
  Layout,
  ExternalLink,
  BarChart3,
  TrendingUp,
  Award
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { reportApi } from "@/lib/api/reportApi";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

const COLORS = ['#605DFF', '#8B5CF6', '#A78BFA', '#C4B5FD', '#DDD6FE'];

export default function ClientsReportPage() {
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
      const res = await reportApi.getClientsReport(dateRange);
      if (res.success) {
        setData(res.data);
      }
    } catch (error) {
      console.error("Failed to fetch clients report:", error);
      showToast("Error loading client data", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  const getTopClientsChartData = () => {
    if (!data?.topClients) return [];
    return data.topClients.slice(0, 5).map((c: any) => ({
      name: c.fullName.split(' ')[0],
      spent: c.totalSpent
    }));
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground uppercase">Clients Report</h1>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-[0.2em] mt-2 flex items-center gap-2">
            <Users className="size-3 text-[#605DFF]" />
            Customer Value & Retention Analysis
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
            {loading ? "Updating..." : "Filter Clients"}
          </Button>
        </div>
      </div>

      {loading && !data ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-white rounded-2xl border border-zinc-100 animate-pulse" />
          ))}
        </div>
      ) : data && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Total Active Clients</p>
                  <h3 className="text-3xl font-black text-[#1E293B] mt-1">{data.totalClients}</h3>
                </div>
                <div className="p-3 bg-[#605DFF]/10 rounded-xl">
                  <Users className="size-6 text-[#605DFF]" />
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Avg Spent per Client</p>
                  <h3 className="text-3xl font-black text-[#1E293B] mt-1">
                    ${data.totalClients > 0 
                      ? (data.fullStats.reduce((s: any, c: any) => s + c.totalSpent, 0) / data.totalClients).toFixed(2) 
                      : '0.00'}
                  </h3>
                </div>
                <div className="p-3 bg-emerald-100 rounded-xl">
                  <TrendingUp className="size-6 text-emerald-600" />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Top Client Source</p>
                  <h3 className="text-2xl font-black text-[#1E293B] mt-1 uppercase">
                    {data.fullStats.length > 0 ? data.fullStats[0].primarySource : 'None'}
                  </h3>
                </div>
                <div className="p-3 bg-amber-100 rounded-xl">
                  <Smartphone className="size-6 text-amber-600" />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Top 5 Clients Bar Chart */}
            <div className="lg:col-span-1 bg-white rounded-2xl border border-zinc-100 shadow-sm p-8">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-lg font-black text-foreground uppercase tracking-tight">Top Spenders</h3>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Highest total spending (USD)</p>
                </div>
                <div className="p-2 bg-indigo-50 rounded-lg">
                  <BarChart3 className="size-4 text-indigo-500" />
                </div>
              </div>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={getTopClientsChartData()} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F1F5F9" />
                    <XAxis type="number" hide />
                    <YAxis 
                      dataKey="name" 
                      type="category" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 11, fontWeight: 700, fill: '#64748B' }}
                      width={80}
                    />
                    <Tooltip 
                      cursor={{ fill: '#F8FAFC' }}
                      formatter={(value: any) => `$${Number(value).toFixed(2)}`}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    />
                    <Bar dataKey="spent" radius={[0, 4, 4, 0]} barSize={24}>
                      {getTopClientsChartData().map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Top Customers Table */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-zinc-100 shadow-sm overflow-hidden">
              <div className="p-8 border-b border-zinc-100 flex items-center gap-2">
                <Award className="size-5 text-amber-500" />
                <h3 className="text-lg font-black text-foreground uppercase tracking-tight">VIP Client Leaderboard</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-zinc-50/50 border-b border-zinc-100">
                      <th className="px-8 py-4 text-[10px] font-black text-[#64748B] uppercase tracking-[0.15em]">Rank</th>
                      <th className="px-8 py-4 text-[10px] font-black text-[#64748B] uppercase tracking-[0.15em]">Client</th>
                      <th className="px-8 py-4 text-[10px] font-black text-[#64748B] uppercase tracking-[0.15em]">Total Orders</th>
                      <th className="px-8 py-4 text-[10px] font-black text-[#64748B] uppercase tracking-[0.15em] text-right">Total Spent</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-50">
                    {data.topClients?.slice(0, 10).map((c: any, i: number) => (
                      <tr key={c.id} className="hover:bg-[#605DFF]/[0.02] transition-colors">
                        <td className="px-8 py-4 font-black text-zinc-400">#{i + 1}</td>
                        <td className="px-8 py-4">
                          <p className="text-[13px] font-bold text-[#1E293B]">{c.fullName}</p>
                          <p className="text-[10px] font-medium text-[#64748B]">{c.phone}</p>
                        </td>
                        <td className="px-8 py-4">
                          <span className="text-[12px] font-bold text-[#1E293B]">{c.orderCount} orders</span>
                        </td>
                        <td className="px-8 py-4 text-right">
                          <p className="text-[15px] font-black text-[#1E293B]">${c.totalSpent.toFixed(2)}</p>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
