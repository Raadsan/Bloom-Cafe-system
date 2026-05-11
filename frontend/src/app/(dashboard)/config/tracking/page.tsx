"use client";

import React, { useState, useEffect } from "react";
import { 
  Activity, 
  Search, 
  Filter, 
  Calendar,
  LayoutGrid,
  Trash2,
  Eye
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
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { auditLogApi, AuditLog } from "@/lib/api/auditLogApi";
import { useToast } from "@/components/ui/toast";

export default function TrackingPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const { showToast } = useToast();

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const data = await auditLogApi.getAllLogs();
      setLogs(data || []);
    } catch (error) {
      console.error("Failed to fetch audit logs:", error);
      showToast("Failed to load audit logs", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleDelete = async () => {
    if (!selectedLog) return;
    try {
      await auditLogApi.deleteLog(selectedLog.id);
      showToast("Audit log deleted successfully", "success");
      setIsDeleteOpen(false);
      setSelectedLog(null);
      fetchLogs();
    } catch (error: any) {
      showToast(error.response?.data?.message || "Failed to delete log", "error");
    }
  };

  const filteredLogs = (logs || []).filter(log =>
    (log.user?.fullName || "System").toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.entity.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (log.description || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHrs = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    if (diffHrs < 24) return `${diffHrs} hour${diffHrs > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString([], { dateStyle: 'medium' });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground uppercase flex items-center gap-2">
            <Activity className="size-6 text-[#605DFF]" />
            Activity Tracking
          </h1>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-3">
            Monitor all system changes and user actions in real-time.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="text-[14.5px] font-bold h-10 rounded-lg bg-white border border-zinc-100 text-[#64748B] hover:bg-zinc-50 hover:text-[#605DFF] transition-all shadow-sm px-4">
            <Filter className="mr-2 size-4" />
            Filter
          </Button>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="trezo-card overflow-hidden">
        {/* Card Header with Search */}
        <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-zinc-50/30">
          <div>
            <h3 className="text-sm font-bold text-foreground">Audit Logs</h3>
            <p className="text-[12px] font-medium text-muted-foreground mt-1">{filteredLogs.length} tracked actions in system</p>
          </div>
          <div className="flex flex-col md:flex-row items-center gap-3">
            <div className="relative group w-full md:w-72">
              <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-[#605DFF] transition-colors" />
              <input 
                type="text" 
                placeholder="Search logs..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-[14.5px] font-medium bg-white border border-zinc-100 rounded-lg outline-none focus:border-[#605DFF]/30 focus:ring-4 focus:ring-[#605DFF]/5 transition-all shadow-sm"
              />
            </div>
          </div>
        </div>

        {/* Table Content */}
        <div className="border-t border-zinc-100">
          <Table>
            <TableHeader className="bg-zinc-50/50">
              <TableRow className="border-zinc-100 hover:bg-transparent">
                <TableHead className="px-6 py-5 text-[11px] font-bold uppercase tracking-widest text-[#64748B] w-[80px]">#</TableHead>
                <TableHead className="px-6 py-5 text-[11px] font-bold uppercase tracking-widest text-[#64748B]">User</TableHead>
                <TableHead className="px-6 py-5 text-[11px] font-bold uppercase tracking-widest text-[#64748B]">Action</TableHead>
                <TableHead className="px-6 py-5 text-[11px] font-bold uppercase tracking-widest text-[#64748B]">Entity</TableHead>
                <TableHead className="px-6 py-5 text-[11px] font-bold uppercase tracking-widest text-[#64748B]">Description</TableHead>
                <TableHead className="px-6 py-5 text-[11px] font-bold uppercase tracking-widest text-[#64748B]">Time</TableHead>
                <TableHead className="px-6 py-5 text-right text-[11px] font-bold uppercase tracking-widest text-[#64748B] w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i} className="h-16 animate-pulse bg-muted/10">
                    <TableCell colSpan={7} />
                  </TableRow>
                ))
              ) : filteredLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="px-6 py-24 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <LayoutGrid className="size-12 text-zinc-200" />
                      <p className="text-[#64748B] font-bold uppercase text-[11px] tracking-widest">No activity logs found</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredLogs.map((log) => (
                  <TableRow key={log.id} className="border-zinc-50 hover:bg-zinc-50/30 transition-colors group">
                    <TableCell className="px-6 py-5">
                      <span className="text-[14px] font-medium text-[#605DFF]">#{log.id}</span>
                    </TableCell>
                    <TableCell className="px-6 py-5">
                      <span className="text-[14px] font-medium text-[#1E293B]">{log.user?.fullName || "System"}</span>
                    </TableCell>
                    <TableCell className="px-6 py-5">
                      <span className="text-[13px] font-medium text-muted-foreground">{log.action}</span>
                    </TableCell>
                    <TableCell className="px-6 py-5">
                      <span className="text-[13px] font-medium text-muted-foreground">{log.entity}</span>
                    </TableCell>
                    <TableCell className="px-6 py-5">
                      <p className="text-[13px] font-medium text-muted-foreground max-w-[200px] truncate">
                        {log.description || "—"}
                      </p>
                    </TableCell>
                    <TableCell className="px-6 py-5">
                      <div className="flex items-center gap-1.5 text-[13px] font-medium text-zinc-500">
                        <Calendar className="size-3.5 text-zinc-400" />
                        {formatTimeAgo(log.createdAt)}
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-5 text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => { setSelectedLog(log); setIsViewOpen(true); }} className="h-8 w-8 p-0 text-[#64748B] hover:text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors">
                          <Eye className="size-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => { setSelectedLog(log); setIsDeleteOpen(true); }} className="h-8 w-8 p-0 text-[#64748B] hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors">
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* VIEW MODAL */}
      <Dialog open={isViewOpen} onOpenChange={(open) => { if(!open) setIsViewOpen(false); }}>
        <DialogContent className="sm:max-w-[540px] bg-white border-zinc-100 p-0 overflow-hidden rounded-2xl">
          <DialogTitle className="sr-only">Audit Log Details</DialogTitle>
          {selectedLog && (
            <>
              <div className="p-8 pb-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-2xl font-black text-[#1E293B] uppercase tracking-tight flex items-center gap-2">
                      <Activity className="size-6 text-[#605DFF]" />
                      {selectedLog.action}
                    </h2>
                    <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-[0.2em] mt-1">
                      Log ID: #{selectedLog.id}
                    </p>
                  </div>
                </div>
              </div>

              <div className="px-8 py-8 bg-zinc-50/50 border-y border-zinc-100 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block mb-1.5">User</label>
                    <p className="text-[15px] font-medium text-[#1E293B]">{selectedLog.user?.fullName || "System"}</p>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block mb-1.5">Entity</label>
                    <p className="text-[15px] font-medium text-[#1E293B]">{selectedLog.entity}</p>
                  </div>
                </div>
                {selectedLog.description && (
                  <div>
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block mb-1.5">Description</label>
                    <p className="text-[15px] font-medium text-[#1E293B] leading-relaxed">{selectedLog.description}</p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block mb-1.5">Entity ID</label>
                    <p className="text-[14px] font-medium text-[#1E293B]">{selectedLog.entityId ?? "—"}</p>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block mb-1.5">Date & Time</label>
                    <div className="flex items-center gap-2 text-[14px] font-medium text-[#1E293B]">
                      <Calendar className="size-4 text-[#605DFF]" />
                      {new Date(selectedLog.createdAt).toLocaleString([], { dateStyle: 'long', timeStyle: 'short' })}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-white flex justify-end gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => setIsViewOpen(false)} 
                  className="rounded-xl font-bold border-zinc-200 px-6 h-12 text-[11px] uppercase tracking-widest hover:bg-zinc-50"
                >
                  Close
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* DELETE MODAL */}
      <Dialog open={isDeleteOpen} onOpenChange={(open) => { if(!open) setIsDeleteOpen(false); }}>
        <DialogContent className="sm:max-w-[440px] bg-white border-zinc-100 rounded-xl p-0 overflow-hidden">
          <DialogTitle className="sr-only">Delete Log</DialogTitle>
          <div className="p-8 flex flex-col items-center text-center pt-10">
            <div className="w-16 h-16 rounded-full bg-rose-100 flex items-center justify-center mb-4">
              <Trash2 className="size-8 text-rose-600" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">Delete Log?</h3>
            <p className="text-sm text-muted-foreground px-4">
              Are you sure you want to delete audit log <span className="font-bold text-foreground">#{selectedLog?.id}</span>?
              This action cannot be undone.
            </p>
          </div>
          <div className="p-4 bg-zinc-50 border-t border-zinc-100 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)} className="rounded-lg font-bold border-zinc-200 px-6 h-11">
              Cancel
            </Button>
            <Button onClick={handleDelete} className="bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold border-none shadow-sm px-6 h-11">
              Yes, Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
