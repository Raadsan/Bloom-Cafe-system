"use client";

import React, { useState, useEffect, useMemo } from "react";
import { 
  History, 
  Search, 
  User, 
  Activity, 
  Calendar,
  Clock,
  Filter,
  RefreshCcw,
  ArrowDownCircle,
  Database,
  Shield,
  Key
} from "lucide-react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { trackingApi, AuditLog } from "@/lib/api/trackingApi";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

const ACTION_COLORS: Record<string, { bg: string; text: string }> = {
  LOGIN: { bg: "bg-emerald-50", text: "text-emerald-600" },
  LOGOUT: { bg: "bg-rose-50", text: "text-rose-600" },
  CREATE: { bg: "bg-blue-50", text: "text-blue-600" },
  UPDATE: { bg: "bg-amber-50", text: "text-amber-600" },
  DELETE: { bg: "bg-rose-50", text: "text-rose-600" },
  AUTH: { bg: "bg-indigo-50", text: "text-indigo-600" }
};

export default function TrackingPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState(25);
  const [dateFilter, setDateFilter] = useState({
    start: "",
    end: ""
  });
  const { showToast } = useToast();

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const data = await trackingApi.getAllLogs();
      setLogs(data || []);
    } catch (error) {
      console.error("Failed to fetch logs", error);
      showToast("Error loading activity logs", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    // Auto refresh every 60 seconds
    const interval = setInterval(fetchLogs, 60000);
    return () => clearInterval(interval);
  }, []);

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const matchesSearch = 
        log.action.toLowerCase().includes(search.toLowerCase()) ||
        log.entity.toLowerCase().includes(search.toLowerCase()) ||
        log.description.toLowerCase().includes(search.toLowerCase()) ||
        log.user?.fullName.toLowerCase().includes(search.toLowerCase());
      
      let matchesDate = true;
      if (dateFilter.start || dateFilter.end) {
        const logDate = new Date(log.createdAt).toISOString().split('T')[0];
        if (dateFilter.start && logDate < dateFilter.start) matchesDate = false;
        if (dateFilter.end && logDate > dateFilter.end) matchesDate = false;
      }

      return matchesSearch && matchesDate;
    }).slice(0, pageSize);
  }, [logs, search, pageSize, dateFilter]);

  const getActionStyle = (action: string) => {
    const act = action.toUpperCase();
    if (act.includes('CREATE')) return ACTION_COLORS.CREATE;
    if (act.includes('UPDATE')) return ACTION_COLORS.UPDATE;
    if (act.includes('DELETE')) return ACTION_COLORS.DELETE;
    if (act.includes('LOGIN')) return ACTION_COLORS.LOGIN;
    if (act.includes('LOGOUT')) return ACTION_COLORS.LOGOUT;
    return { bg: "bg-zinc-100", text: "text-zinc-600" };
  };

  return (
    <div className="animate-in fade-in duration-500 font-sans mx-1">
      {/* Header */}
      <div className="mb-8 px-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#1e293b] uppercase tracking-tight flex items-center gap-2">
          
            System Tracking
          </h1>
          <p className="text-[12px] text-zinc-500 uppercase tracking-wider mt-1 font-medium italic">Monitor every click, login, and change happening in the system in real-time.</p>
        </div>
        <button 
          onClick={fetchLogs}
          disabled={loading}
          className="flex items-center gap-2 px-4 h-10 rounded-xl bg-white border border-zinc-100 text-[#64748B] hover:text-[#605DFF] hover:bg-zinc-50 transition-all shadow-sm text-xs font-black uppercase tracking-widest"
        >
          <RefreshCcw className={cn("size-3.5", loading && "animate-spin")} />
          Refresh Log
        </button>
      </div>

      {/* Main Table Box */}
      <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
        {/* Controls Row */}
        <div className="px-8 py-4 flex flex-wrap items-center gap-6 border-b border-zinc-50 bg-zinc-50/10">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-[13px] text-zinc-400 font-normal shrink-0">
                <span>Show</span>
                <select 
                    value={pageSize} 
                    onChange={(e) => setPageSize(Number(e.target.value))}
                    className="w-16 h-[38px] px-2 border border-zinc-200 rounded-md outline-none focus:border-[#605DFF] transition-colors bg-white cursor-pointer text-sm font-normal text-zinc-600"
                >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-zinc-200 rounded-md shadow-sm">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">From:</span>
                <input 
                    type="date" 
                    value={dateFilter.start}
                    onChange={(e) => setDateFilter(prev => ({ ...prev, start: e.target.value }))}
                    className="bg-transparent text-[11px] font-bold text-zinc-600 outline-none cursor-pointer"
                />
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-zinc-200 rounded-md shadow-sm">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">To:</span>
                <input 
                    type="date" 
                    value={dateFilter.end}
                    onChange={(e) => setDateFilter(prev => ({ ...prev, end: e.target.value }))}
                    className="bg-transparent text-[11px] font-bold text-zinc-600 outline-none cursor-pointer"
                />
            </div>
            {(dateFilter.start || dateFilter.end) && (
                <button 
                    onClick={() => setDateFilter({ start: "", end: "" })}
                    className="text-[10px] font-bold text-rose-500 uppercase hover:underline ml-1"
                >
                    Clear
                </button>
            )}
          </div>

          <div className="flex-1"></div>

          <div className="flex items-center gap-3">
            <div className="relative w-72 group">
              <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-[#605DFF] transition-colors" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search who or what..."
                className="w-full h-[42px] pl-10 pr-4 bg-zinc-50 border border-zinc-200 rounded-md outline-none focus:border-[#605DFF] focus:ring-1 focus:ring-[#605DFF]/10 transition-all text-sm font-normal text-zinc-600"
              />
            </div>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <Table className="w-full">
            <TableHeader className="bg-[#605DFF]">
              <TableRow className="hover:bg-transparent border-none">
                <TableHead className="px-6 py-4 text-[12px] font-black uppercase text-white border-none">Actor (Who)</TableHead>
                <TableHead className="px-6 py-4 text-[12px] font-black uppercase text-white border-none text-center">Event</TableHead>
                <TableHead className="px-6 py-4 text-[12px] font-black uppercase text-white border-none">Description</TableHead>
                <TableHead className="px-6 py-4 text-[12px] font-black uppercase text-white border-none">Module</TableHead>
                <TableHead className="px-6 py-4 text-[12px] font-black uppercase text-white border-none text-right">Date/Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && logs.length === 0 ? (
                Array.from({ length: 10 }).map((_, i) => (
                  <TableRow key={i} className="h-16 animate-pulse bg-muted/5"><TableCell colSpan={5} /></TableRow>
                ))
              ) : filteredLogs.length > 0 ? (
                filteredLogs.map((log) => {
                  const style = getActionStyle(log.action);
                  return (
                    <TableRow key={log.id} className="border-zinc-50 hover:bg-zinc-50/50 transition-colors">
                      <TableCell className="px-6 py-4">
                        <div>
                          <p className="text-[13px] font-normal text-zinc-800 leading-tight uppercase tracking-tight">{log.user?.fullName || "System"}</p>
                          <p className="text-[10px] text-zinc-400 font-medium lowercase italic">{log.user?.email || "automated"}</p>
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-4 text-center">
                        <span className={cn(
                          "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider",
                          style.text
                        )}>
                          {log.action}
                        </span>
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <p className="text-[12px] font-normal text-zinc-600 leading-relaxed max-w-sm">
                          {log.description}
                        </p>
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <span className="text-[11px] font-normal uppercase tracking-widest text-zinc-500">
                          {log.entity}
                        </span>
                      </TableCell>
                      <TableCell className="px-6 py-4 text-right">
                        <div className="flex flex-col items-end gap-0.5">
                          <span className="text-[11px] font-normal text-zinc-800">
                            {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <span className="text-[9px] font-normal text-zinc-400 uppercase">
                            {new Date(log.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="px-6 py-32 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="size-16 rounded-full bg-zinc-50 flex items-center justify-center shadow-inner">
                        <Activity className="size-8 text-zinc-100" />
                      </div>
                      <p className="text-zinc-400 font-black uppercase text-[11px] tracking-widest">No activity logs recorded yet</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Footer info */}
        <div className="px-8 py-4 bg-zinc-50/50 border-t border-zinc-100 flex justify-between items-center">
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                End of Activity stream
            </p>
            <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest">
                <div className="flex items-center gap-1.5">
                    <div className="size-2 rounded-full bg-emerald-500" />
                    <span className="text-zinc-500">Log Live</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <Database className="size-3 text-zinc-400" />
                    <span className="text-zinc-500">Synced</span>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}
