"use client";

import React, { useState, useEffect } from "react";
import {
  LayoutGrid,
  Plus,
  Search,
  Edit,
  Trash2,
  Users,
  CheckCircle2,
  Clock,
  AlertCircle,
  QrCode,
  Filter,
  Eye,
  MoreVertical,
  Printer,
  Download
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { tableApi, Table as RestaurantTable, TableStatus } from "@/lib/api/tableApi";
import { useToast } from "@/components/ui/toast";
import { usePermissions } from "@/context/PermissionContext";

export default function TablesPage() {
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const { showToast } = useToast();
  const { canAdd: checkAdd, canEdit: checkEdit, canDelete: checkDelete } = usePermissions();
  const canAdd = checkAdd("/tables");
  const canEdit = checkEdit("/tables");
  const canDelete = checkDelete("/tables");

  // Modal states
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedTable, setSelectedTable] = useState<RestaurantTable | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    number: "",
    name: "",
    capacity: "4",
    status: "active" as TableStatus
  });

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const fetchTables = async () => {
    try {
      setLoading(true);
      const data = await tableApi.getAllTables();
      setTables(data || []);
    } catch (error) {
      console.error("Failed to fetch tables:", error);
      showToast("Failed to load tables", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTables();
  }, []);

  const handleAddTable = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await tableApi.createTable({
        number: parseInt(formData.number),
        name: formData.name || `Table ${formData.number}`,
        capacity: parseInt(formData.capacity),
        status: formData.status
      });
      showToast("Table created successfully", "success");
      setIsAddOpen(false);
      resetForm();
      fetchTables();
    } catch (error: any) {
      showToast(error.response?.data?.message || "Failed to create table", "error");
    }
  };

  const handleUpdateTable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTable) return;
    try {
      await tableApi.updateTable(selectedTable.id.toString(), {
        number: parseInt(formData.number),
        name: formData.name,
        capacity: parseInt(formData.capacity),
        status: formData.status
      });
      showToast("Table updated successfully", "success");
      setIsEditOpen(false);
      fetchTables();
    } catch (error: any) {
      showToast(error.response?.data?.message || "Failed to update table", "error");
    }
  };

  const handleDeleteTable = async () => {
    if (!selectedTable) return;
    try {
      await tableApi.deleteTable(selectedTable.id.toString());
      showToast("Table deleted successfully", "success");
      setIsDeleteOpen(false);
      fetchTables();
    } catch (error: any) {
      showToast(error.response?.data?.message || "Failed to delete table", "error");
    }
  };

  const resetForm = () => {
    setFormData({
      number: "",
      name: "",
      capacity: "4",
      status: "active"
    });
  };

  const openEditModal = (table: RestaurantTable) => {
    setSelectedTable(table);
    setFormData({
      number: table.number.toString(),
      name: table.name || "",
      capacity: table.capacity?.toString() || "4",
      status: table.status
    });
    setIsEditOpen(true);
  };

  const openViewModal = (table: RestaurantTable) => {
    setSelectedTable(table);
    setIsViewOpen(true);
  };

  const handlePrint = () => {
    if (!selectedTable) return;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(selectedTable.qrCode || '')}`;
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Print Table QR - ${selectedTable.number}</title>
            <style>
              body { 
                margin: 0; 
                display: flex; 
                flex-direction: column; 
                align-items: center; 
                justify-content: center; 
                height: 100vh; 
                font-family: 'Inter', sans-serif;
                background-color: white;
              }
              .print-card {
                width: 400px;
                padding: 40px;
                border: 2px solid #f1f5f9;
                border-radius: 32px;
                text-align: center;
                box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05);
              }
              .logo {
                font-size: 24px;
                font-weight: 900;
                color: #605DFF;
                margin-bottom: 30px;
                text-transform: uppercase;
                letter-spacing: -0.02em;
              }
              .qr-container {
                background: white;
                padding: 20px;
                border-radius: 24px;
                display: inline-block;
                margin-bottom: 25px;
                border: 1px solid #f1f5f9;
              }
              img { width: 250px; height: 250px; display: block; }
              .table-num {
                font-size: 42px;
                font-weight: 900;
                color: #1E293B;
                margin: 0;
                line-height: 1;
              }
              .table-name {
                font-size: 16px;
                font-weight: 600;
                color: #64748B;
                margin: 8px 0 0 0;
                text-transform: uppercase;
                letter-spacing: 0.1em;
              }
              .footer {
                margin-top: 30px;
                font-size: 12px;
                font-weight: 700;
                color: #94a3b8;
                text-transform: uppercase;
                letter-spacing: 0.2em;
              }
              @media print {
                body { background: white; }
                .print-card { border: none; box-shadow: none; }
              }
            </style>
          </head>
          <body>
            <div class="print-card">
              <div class="logo">Restaurant POS</div>
              <div class="qr-container">
                <img src="${qrUrl}" />
              </div>
              <h1 class="table-num">Table ${selectedTable.number}</h1>
              <p class="table-name">${selectedTable.name || 'Seating Area'}</p>
              <div class="footer">Scan to order</div>
            </div>
            <script>
              window.onload = () => {
                setTimeout(() => {
                  window.print();
                  window.close();
                }, 500);
              };
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const filteredTables = (tables || []).filter(table =>
    table.number.toString().includes(searchQuery) ||
    table.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(filteredTables.length / pageSize);
  const paginatedTables = React.useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredTables.slice(start, start + pageSize);
  }, [filteredTables, currentPage, pageSize]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, pageSize]);

  const getStatusInfo = (status: TableStatus) => {
    switch (status) {
      case "active":
        return { label: "Active", color: "bg-emerald-50 text-emerald-600 border-emerald-100" };
      case "inactive":
        return { label: "Inactive", color: "bg-rose-50 text-rose-600 border-rose-100" };
      default:
        return { label: "Active", color: "bg-emerald-50 text-emerald-600 border-emerald-100" };
    }
  };

  return (
    <div className="animate-in fade-in duration-500 font-sans mx-1 pt-0 pb-8">
      {/* Page Header: Outside the box */}
      <div className="mb-6 px-4">
        <h1 className="text-2xl font-bold text-[#1e293b] uppercase tracking-tight">Tables Management</h1>
        <p className="text-[12px] text-zinc-500 uppercase tracking-wider mt-1 font-medium">Manage restaurant floor plans, table statuses, and QR code assignments.</p>
      </div>

      {/* Main Container Box */}
      <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
        {/* Controls Row: Inside the box */}
        <div className="px-8 py-4 flex flex-wrap items-center gap-6 border-b border-zinc-50">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-[13px] text-zinc-400 font-normal shrink-0">
              <span>Show</span>
              <select 
                value={pageSize} 
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="w-16 h-[42px] px-2 border border-zinc-200 rounded-md outline-none focus:border-[#605DFF] transition-colors bg-white cursor-pointer text-sm font-normal text-zinc-600"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>

          <div className="flex-1"></div>

          <div className="flex items-center gap-3">
            <div className="relative w-64 group">
              <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-[#605DFF] transition-colors" />
              <input 
                type="text" 
                placeholder="Search tables..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-[42px] pl-10 pr-4 bg-zinc-50 border border-zinc-200 rounded-md outline-none focus:border-[#605DFF] focus:ring-1 focus:ring-[#605DFF]/10 transition-all text-sm font-normal text-zinc-600"
              />
            </div>

            {canAdd && (
              <Button 
                onClick={() => setIsAddOpen(true)}
                className="h-[42px] px-6 bg-[#605DFF] hover:bg-[#4f4cef] text-white rounded-md flex items-center gap-2 transition-colors font-medium text-sm shadow-sm"
              >
                <Plus className="size-4" />
                Add Table
              </Button>
            )}
          </div>
        </div>

        {/* Table - Flush to sides */}
        <div className="border-t border-zinc-100 overflow-hidden bg-white">
          <div className="overflow-x-auto">
            <Table className="w-full">
                  <TableHeader className="bg-[#605DFF]">
                    <TableRow className="hover:bg-transparent border-none">
                      <TableHead className="px-6 py-4 text-[12px] font-black uppercase text-white border-none text-left">Table ID</TableHead>
                      <TableHead className="px-6 py-4 text-[12px] font-black uppercase text-white border-none text-left">Table Name</TableHead>
                      <TableHead className="px-6 py-4 text-[12px] font-black uppercase text-white border-none text-left">Pars</TableHead>
                      <TableHead className="px-6 py-4 text-[12px] font-black uppercase text-white border-none text-center">QR Code</TableHead>
                      <TableHead className="px-6 py-4 text-[12px] font-black uppercase text-white border-none text-right">Status</TableHead>
                      <TableHead className="px-6 py-4 text-[12px] font-black uppercase text-white border-none text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i} className="h-14 animate-pulse">
                      {[...Array(6)].map((_, j) => (
                        <TableCell key={j} className="px-6 py-4">
                          <div className="h-4 bg-zinc-100 rounded w-full"></div>
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : paginatedTables.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="px-6 py-10 text-center text-zinc-500">
                      No tables found
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedTables.map((table) => {
                    const statusInfo = getStatusInfo(table.status);
                    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(table.qrCode || '')}`;

                    return (
                      <TableRow key={table.id} className="border-zinc-100 hover:bg-zinc-50/50 transition-colors">
                        <TableCell className="px-6 py-3 text-[13px] text-zinc-500 font-medium">ID: {table.id}</TableCell>
                        <TableCell className="px-6 py-3">
                          <span className="text-[13px] font-medium text-zinc-700">{table.name || `Table ${table.number}`}</span>
                        </TableCell>
                        <TableCell className="px-6 py-3">
                          <div className="flex items-center gap-1.5 text-[13px] font-medium text-zinc-600">
                            {table.capacity || 4} Pars
                          </div>
                        </TableCell>
                        <TableCell className="px-6 py-3 text-[13px] text-zinc-500 font-medium text-center">
                          {table.qrCode || "No QR"}
                        </TableCell>
                        <TableCell className="px-6 py-3 text-right">
                          <span className={cn(
                            "px-3 py-1 rounded-md text-[10px] font-semibold uppercase tracking-wider border",
                            statusInfo.color
                          )}>
                            {statusInfo.label}
                          </span>
                        </TableCell>
                        <TableCell className="px-6 py-3 text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openViewModal(table)}
                              className="h-8 w-8 p-0 text-[#64748B] hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                            >
                              <Eye className="size-4" />
                            </Button>
                            {canEdit && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openEditModal(table)}
                                className="h-8 w-8 p-0 text-[#64748B] hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              >
                                <Edit className="size-4" />
                              </Button>
                            )}
                            {canDelete && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => { setSelectedTable(table); setIsDeleteOpen(true); }}
                                className="h-8 w-8 p-0 text-[#64748B] hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              >
                                <Trash2 className="size-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Table Footer / Pagination */}
        <div className="py-2 px-8 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs text-zinc-400 border-t border-zinc-100 bg-zinc-50/30">
          <div>
            {Math.min(filteredTables.length, (currentPage - 1) * pageSize + 1)}-{Math.min(filteredTables.length, currentPage * pageSize)} of {filteredTables.length}
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-2 py-1 border border-zinc-200 rounded-md hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              &lt;
            </button>
            <div className="px-3 py-1 border border-zinc-200 rounded-md text-zinc-400">
              {currentPage} of {totalPages || 1}
            </div>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages || totalPages === 0}
              className="px-2 py-1 border border-zinc-200 rounded-md hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              &gt;
            </button>
          </div>
        </div>
      </div>

      {/* ADD MODAL */}
      <Dialog open={isAddOpen} onOpenChange={(open) => { if (!open) { setIsAddOpen(false); resetForm(); } }}>
        <DialogContent className="sm:max-w-[640px] bg-white border-zinc-100 p-0 overflow-hidden">
          <DialogTitle className="sr-only">Table Registration Form</DialogTitle>
          <div className="p-6 border-b border-zinc-100">
            <DialogTitle className="text-xl font-bold text-[#1e293b]">Register New Table</DialogTitle>
            <DialogDescription className="text-sm text-zinc-500 mt-1">
              Create a new seating table for your restaurant.
            </DialogDescription>
          </div>
          <form onSubmit={handleAddTable} className="p-8 grid grid-cols-2 gap-x-8 gap-y-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-[#1E293B]">Table Number *</label>
              <input
                type="number"
                value={formData.number}
                onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                placeholder="e.g. 5"
                required
                className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-lg outline-none focus:border-[#605DFF]/30 focus:ring-4 focus:ring-[#605DFF]/5 transition-all text-[15px] font-medium"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-[#1E293B]">Capacity *</label>
              <input
                type="number"
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                placeholder="4"
                required
                className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-lg outline-none focus:border-[#605DFF]/30 focus:ring-4 focus:ring-[#605DFF]/5 transition-all text-[15px] font-medium"
              />
            </div>
            <div className="col-span-2 space-y-2">
              <label className="text-sm font-bold text-[#1E293B]">Display Name (Optional)</label>
              <input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. VIP Booth 1"
                className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-lg outline-none focus:border-[#605DFF]/30 focus:ring-4 focus:ring-[#605DFF]/5 transition-all text-[15px] font-medium"
              />
            </div>
            <div className="col-span-2 space-y-2">
              <label className="text-sm font-bold text-[#1E293B]">Initial Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as TableStatus })}
                className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-lg outline-none focus:border-[#605DFF]/30 transition-all text-[15px] font-medium appearance-none cursor-pointer"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <DialogFooter className="col-span-2 pt-6 border-t border-zinc-100 mt-4 -mx-8 px-8 bg-zinc-50/50 gap-3">
              <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)} className="rounded-lg font-bold px-6 h-11">Cancel</Button>
              <Button type="submit" className="bg-[#605DFF] hover:bg-[#4E4BCB] text-white rounded-lg font-bold border-none px-8 h-11 shadow-lg shadow-[#605DFF]/20">Save Table</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* EDIT MODAL */}
      <Dialog open={isEditOpen} onOpenChange={(open) => { if (!open) setIsEditOpen(false); }}>
        <DialogContent className="sm:max-w-[640px] bg-white border-zinc-100 p-0 overflow-hidden">
          <DialogTitle className="sr-only">Edit Table Details</DialogTitle>
          <div className="p-6 border-b border-zinc-100">
            <DialogTitle className="text-xl font-bold text-[#1e293b]">Edit Table #{selectedTable?.number}</DialogTitle>
            <DialogDescription className="text-sm text-zinc-500 mt-1">
              Update table details and seating availability.
            </DialogDescription>
          </div>
          <form onSubmit={handleUpdateTable} className="p-8 grid grid-cols-2 gap-x-8 gap-y-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-[#1E293B]">Table Number *</label>
              <input
                type="number"
                value={formData.number}
                onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                required
                className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-lg outline-none focus:border-[#605DFF]/30 focus:ring-4 focus:ring-[#605DFF]/5 transition-all text-[15px] font-medium"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-[#1E293B]">Capacity *</label>
              <input
                type="number"
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                required
                className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-lg outline-none focus:border-[#605DFF]/30 focus:ring-4 focus:ring-[#605DFF]/5 transition-all text-[15px] font-medium"
              />
            </div>
            <div className="col-span-2 space-y-2">
              <label className="text-sm font-bold text-[#1E293B]">Display Name</label>
              <input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-lg outline-none focus:border-[#605DFF]/30 focus:ring-4 focus:ring-[#605DFF]/5 transition-all text-[15px] font-medium"
              />
            </div>
            <div className="col-span-2 space-y-2">
              <label className="text-sm font-bold text-[#1E293B]">Current Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as TableStatus })}
                className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-lg outline-none focus:border-[#605DFF]/30 transition-all text-[15px] font-medium appearance-none cursor-pointer"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <DialogFooter className="col-span-2 pt-6 border-t border-zinc-100 mt-4 -mx-8 px-8 bg-zinc-50/50 gap-3">
              <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)} className="rounded-lg font-bold px-6 h-11">Cancel</Button>
              <Button type="submit" className="bg-[#605DFF] hover:bg-[#4E4BCB] text-white rounded-lg font-bold border-none px-8 h-11 shadow-lg shadow-[#605DFF]/20">Update Table</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* VIEW MODAL */}
      <Dialog open={isViewOpen} onOpenChange={(open) => { if (!open) setIsViewOpen(false); }}>
        <DialogContent className="sm:max-w-[540px] bg-white border-zinc-100 p-0 overflow-hidden rounded-2xl">
          <DialogTitle className="sr-only">Table View Details</DialogTitle>
          <DialogTitle className="sr-only">Table Details</DialogTitle>
          {selectedTable && (
            <>
              <div className="p-8 pb-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-2xl font-black text-[#1E293B] uppercase tracking-tight flex items-center gap-2">
                      <span className="text-[#605DFF]">#</span>Table {selectedTable.number}
                    </h2>
                    <p className="text-[13px] font-bold text-muted-foreground uppercase tracking-[0.2em] mt-1">
                      System Identifier: {selectedTable.id}
                    </p>
                  </div>
                  <div className={cn(
                    "px-4 py-1.5 rounded-full text-[13px] font-black uppercase tracking-widest border",
                    getStatusInfo(selectedTable.status).color
                  )}>
                    {getStatusInfo(selectedTable.status).label}
                  </div>
                </div>
              </div>

              <div className="px-8 py-6 bg-zinc-50/50 border-y border-zinc-100 flex gap-8">
                <div className="flex-1 space-y-5">
                  <div>
                    <label className="text-[12px] font-black text-muted-foreground uppercase tracking-widest block mb-1.5">Table Name</label>
                    <p className="text-[15px] font-bold text-[#1E293B]">{selectedTable.name || "Main Seating Area"}</p>
                  </div>
                  <div className="flex gap-6">
                    <div>
                      <label className="text-[12px] font-black text-muted-foreground uppercase tracking-widest block mb-1.5">Capacity</label>
                      <div className="flex items-center gap-2 text-[15px] font-bold text-[#1E293B]">
                        <Users className="size-4 text-[#605DFF]" />
                        {selectedTable.capacity || 4} Pers
                      </div>
                    </div>
                  </div>
                </div>

                <div className="size-44 bg-white p-3 rounded-2xl border border-zinc-200 shadow-sm flex items-center justify-center group relative overflow-hidden">
                  <div className="absolute inset-0 bg-[#605DFF]/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(selectedTable.qrCode || '')}`}
                    alt="QR"
                    className="w-full h-full object-contain relative z-10"
                  />
                </div>
              </div>

              <div className="p-6 bg-white flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setIsViewOpen(false)}
                  className="rounded-xl font-bold border-zinc-200 px-6 h-12 text-[11px] uppercase tracking-widest hover:bg-zinc-50"
                >
                  Close Detail
                </Button>
                <Button
                  onClick={handlePrint}
                  className="bg-[#605DFF] hover:bg-[#4E4BCB] text-white rounded-xl font-bold border-none px-8 h-12 text-[11px] uppercase tracking-widest shadow-lg shadow-primary/20 flex items-center gap-2"
                >
                  <Printer className="size-4" />
                  Print QR Code
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* DELETE MODAL */}
      <Dialog open={isDeleteOpen} onOpenChange={(open) => { if (!open) setIsDeleteOpen(false); }}>
        <DialogContent className="sm:max-w-[500px] bg-white border-zinc-100 p-0 overflow-hidden">
          <DialogTitle className="sr-only">Delete Table Confirmation</DialogTitle>
          <div className="p-8 flex items-start gap-6">
            <div className="w-14 h-14 shrink-0 rounded-full bg-rose-50 flex items-center justify-center border border-rose-100">
              <Trash2 className="size-6 text-rose-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-[#1E293B] mb-2">Delete Table?</h3>
              <p className="text-sm text-zinc-500 leading-relaxed">
                Are you sure you want to delete <span className="font-bold text-[#1E293B]">"Table {selectedTable?.number}"</span>?
                This action cannot be undone.
              </p>
            </div>
          </div>
          <DialogFooter className="p-6 bg-zinc-50/50 border-t border-zinc-100 gap-3">
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)} className="rounded-lg font-bold px-6 h-11">
              Cancel
            </Button>
            <Button onClick={handleDeleteTable} className="bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold border-none px-8 h-11 shadow-lg shadow-rose-600/10">
              Yes, Delete Table
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
