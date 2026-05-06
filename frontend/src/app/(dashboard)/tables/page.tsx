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
import { cn } from "@/lib/utils";

export default function TablesPage() {
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const { showToast } = useToast();

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
    status: "available" as TableStatus
  });

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
      status: "available"
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

  const getStatusInfo = (status: TableStatus) => {
    switch (status) {
      case "available":
        return { label: "Available", color: "bg-emerald-100 text-emerald-700" };
      case "occupied":
        return { label: "Occupied", color: "bg-amber-100 text-amber-700" };
      case "reserved":
        return { label: "Reserved", color: "bg-blue-100 text-blue-700" };
      default:
        return { label: status, color: "bg-zinc-100 text-zinc-600" };
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header Section (Synced with Orders Page) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground uppercase">Tables Management</h1>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-3">
            Manage your restaurant seating layout and QR codes.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="text-[14.5px] font-bold h-10 rounded-lg bg-white border border-zinc-100 text-[#64748B] hover:bg-zinc-50 hover:text-[#605DFF] transition-all shadow-sm px-4">
            <Filter className="mr-2 size-4" />
            Filter
          </Button>
        </div>
      </div>

      {/* Main Table Card (Trezo Style) */}
      <div className="trezo-card overflow-hidden">
        {/* Card Header with Filters */}
        <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-zinc-50/30">
          <div>
            <h3 className="text-sm font-bold text-foreground">Restaurant Floor Plan</h3>
            <p className="text-[12px] font-medium text-muted-foreground mt-1">{filteredTables.length} tables currently showing</p>
          </div>
          <div className="flex flex-col md:flex-row items-center gap-3">
            <div className="relative group w-full md:w-72">
              <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-[#605DFF] transition-colors" />
              <input 
                type="text" 
                placeholder="Search tables..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-[14.5px] font-medium bg-white border border-zinc-100 rounded-lg outline-none focus:border-[#605DFF]/30 focus:ring-4 focus:ring-[#605DFF]/5 transition-all shadow-sm"
              />
            </div>
            <Button size="sm" onClick={() => setIsAddOpen(true)} className="w-full md:w-auto text-[14.5px] font-bold h-[42px] rounded-lg bg-[#605DFF] text-white hover:bg-[#4E4BCB] transition-all border-none shadow-md px-6">
              <Plus className="mr-2 size-4" />
              Add New Table
            </Button>
          </div>
        </div>

        {/* Table Content */}
        <div className="border-t border-zinc-100">
          <Table>
            <TableHeader className="bg-zinc-50/50">
              <TableRow className="border-zinc-100 hover:bg-transparent">
                <TableHead className="px-6 py-5 text-[11px] font-bold uppercase tracking-widest text-[#64748B] w-[80px]">#</TableHead>
                <TableHead className="px-6 py-5 text-[11px] font-bold uppercase tracking-widest text-[#64748B]">Table Info</TableHead>
                <TableHead className="px-6 py-5 text-[11px] font-bold uppercase tracking-widest text-[#64748B]">Capacity</TableHead>
                <TableHead className="px-6 py-5 text-[11px] font-bold uppercase tracking-widest text-[#64748B] text-center">Status</TableHead>
                <TableHead className="px-6 py-5 text-[11px] font-bold uppercase tracking-widest text-[#64748B] text-center">QR Code</TableHead>
                <TableHead className="px-6 py-5 text-right text-[11px] font-bold uppercase tracking-widest text-[#64748B] w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i} className="h-16 animate-pulse bg-muted/10">
                    <TableCell colSpan={6} />
                  </TableRow>
                ))
              ) : filteredTables.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="px-6 py-24 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <LayoutGrid className="size-12 text-zinc-200" />
                      <p className="text-[#64748B] font-bold uppercase text-[11px] tracking-widest">No tables found</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredTables.map((table) => {
                  const statusInfo = getStatusInfo(table.status);
                  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(table.qrCode || '')}`;

                  return (
                    <TableRow key={table.id} className="border-zinc-50 hover:bg-zinc-50/30 transition-colors group">
                      <TableCell className="px-6 py-5">
                        <span className="text-[14px] font-bold text-[#605DFF]">#{table.number}</span>
                      </TableCell>
                      <TableCell className="px-6 py-5">
                        <div>
                          <p className="text-[14px] font-bold text-[#1E293B] uppercase tracking-tight">{table.name || `Table ${table.number}`}</p>
                          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest mt-0.5">ID: {table.id}</p>
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-5">
                        <div className="flex items-center gap-1.5 text-[13px] font-bold text-zinc-600">
                          <Users className="size-3.5 text-zinc-400" />
                          {table.capacity || 4} Pers
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-5 text-center">
                        <span className={cn(
                          "px-3 py-1 rounded-md text-[13px] font-medium whitespace-nowrap",
                          statusInfo.color
                        )}>
                          {statusInfo.label}
                        </span>
                      </TableCell>
                      <TableCell className="px-6 py-5">
                        <div className="flex justify-center">
                          <div className="size-10 bg-white border border-zinc-100 rounded-lg overflow-hidden p-0.5 shadow-sm group/qr relative">
                            <img src={qrUrl} alt="QR" className="w-full h-full object-contain cursor-pointer transition-transform group-hover/qr:scale-110" />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-5 text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm" onClick={() => openViewModal(table)} className="h-8 w-8 p-0 text-[#64748B] hover:text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors">
                            <Eye className="size-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => openEditModal(table)} className="h-8 w-8 p-0 text-[#64748B] hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors">
                            <Edit className="size-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => { setSelectedTable(table); setIsDeleteOpen(true); }} className="h-8 w-8 p-0 text-[#64748B] hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors">
                            <Trash2 className="size-4" />
                          </Button>
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

      {/* ADD MODAL */}
      <Dialog open={isAddOpen} onOpenChange={(open) => { if(!open) { setIsAddOpen(false); resetForm(); } }}>
        <DialogContent className="sm:max-w-[600px] bg-white border-zinc-100 p-0 overflow-hidden">
          <div className="flex items-center justify-between p-6 border-b border-zinc-100">
            <div className="space-y-1">
              <DialogTitle className="text-xl font-bold">Add New Table</DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                Create a new seating table for your restaurant.
              </DialogDescription>
            </div>
          </div>
          <form onSubmit={handleAddTable} className="p-6 grid grid-cols-2 gap-5">
            <div className="space-y-2">
              <label className="text-sm font-bold text-[#1E293B]">Table Number *</label>
              <input 
                type="number" 
                value={formData.number} 
                onChange={(e) => setFormData({...formData, number: e.target.value})}
                placeholder="e.g. 5"
                required
                className="w-full px-4 py-3 border border-zinc-200 rounded-lg text-[15px] focus:outline-none focus:ring-2 focus:ring-[#605DFF]/20"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-[#1E293B]">Capacity *</label>
              <input 
                type="number" 
                value={formData.capacity} 
                onChange={(e) => setFormData({...formData, capacity: e.target.value})}
                placeholder="4"
                required
                className="w-full px-4 py-3 border border-zinc-200 rounded-lg text-[15px] focus:outline-none focus:ring-2 focus:ring-[#605DFF]/20"
              />
            </div>
            <div className="col-span-2 space-y-2">
              <label className="text-sm font-bold text-[#1E293B]">Display Name (Optional)</label>
              <input 
                value={formData.name} 
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="e.g. VIP Booth 1"
                className="w-full px-4 py-3 border border-zinc-200 rounded-lg text-[15px] focus:outline-none focus:ring-2 focus:ring-[#605DFF]/20"
              />
            </div>
            <div className="col-span-2 space-y-2">
              <label className="text-sm font-bold text-[#1E293B]">Initial Status</label>
              <select 
                value={formData.status} 
                onChange={(e) => setFormData({...formData, status: e.target.value as TableStatus})}
                className="w-full px-4 py-3 border border-zinc-200 rounded-lg text-[15px] focus:outline-none focus:ring-2 focus:ring-[#605DFF]/20 bg-white"
              >
                <option value="available">Available</option>
                <option value="occupied">Occupied</option>
                <option value="reserved">Reserved</option>
              </select>
            </div>
            <DialogFooter className="col-span-2 pt-4 border-t border-zinc-100 mt-4 -mx-6 px-6">
              <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)} className="rounded-lg font-bold px-6 h-11">Cancel</Button>
              <Button type="submit" className="bg-[#605DFF] hover:bg-[#4E4BCB] text-white rounded-lg font-bold border-none px-8 h-11">Save Table</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* EDIT MODAL */}
      <Dialog open={isEditOpen} onOpenChange={(open) => { if(!open) setIsEditOpen(false); }}>
        <DialogContent className="sm:max-w-[600px] bg-white border-zinc-100 p-0 overflow-hidden">
          <div className="flex items-center justify-between p-6 border-b border-zinc-100">
            <div className="space-y-1">
              <DialogTitle className="text-xl font-bold">Edit Table #{selectedTable?.number}</DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                Update table details and seating availability.
              </DialogDescription>
            </div>
          </div>
          <form onSubmit={handleUpdateTable} className="p-6 grid grid-cols-2 gap-5">
            <div className="space-y-2">
              <label className="text-sm font-bold text-[#1E293B]">Table Number *</label>
              <input 
                type="number" 
                value={formData.number} 
                onChange={(e) => setFormData({...formData, number: e.target.value})}
                required
                className="w-full px-4 py-3 border border-zinc-200 rounded-lg text-[15px] focus:outline-none focus:ring-2 focus:ring-[#605DFF]/20"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-[#1E293B]">Capacity *</label>
              <input 
                type="number" 
                value={formData.capacity} 
                onChange={(e) => setFormData({...formData, capacity: e.target.value})}
                required
                className="w-full px-4 py-3 border border-zinc-200 rounded-lg text-[15px] focus:outline-none focus:ring-2 focus:ring-[#605DFF]/20"
              />
            </div>
            <div className="col-span-2 space-y-2">
              <label className="text-sm font-bold text-[#1E293B]">Display Name</label>
              <input 
                value={formData.name} 
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full px-4 py-3 border border-zinc-200 rounded-lg text-[15px] focus:outline-none focus:ring-2 focus:ring-[#605DFF]/20"
              />
            </div>
            <div className="col-span-2 space-y-2">
              <label className="text-sm font-bold text-[#1E293B]">Current Status</label>
              <select 
                value={formData.status} 
                onChange={(e) => setFormData({...formData, status: e.target.value as TableStatus})}
                className="w-full px-4 py-3 border border-zinc-200 rounded-lg text-[15px] focus:outline-none focus:ring-2 focus:ring-[#605DFF]/20 bg-white"
              >
                <option value="available">Available</option>
                <option value="occupied">Occupied</option>
                <option value="reserved">Reserved</option>
              </select>
            </div>
            <DialogFooter className="col-span-2 pt-4 border-t border-zinc-100 mt-4 -mx-6 px-6">
              <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)} className="rounded-lg font-bold px-6 h-11">Cancel</Button>
              <Button type="submit" className="bg-[#605DFF] hover:bg-[#4E4BCB] text-white rounded-lg font-bold border-none px-8 h-11">Update Table</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* VIEW MODAL */}
      <Dialog open={isViewOpen} onOpenChange={(open) => { if(!open) setIsViewOpen(false); }}>
        <DialogContent className="sm:max-w-[540px] bg-white border-zinc-100 p-0 overflow-hidden rounded-2xl">
          <DialogTitle className="sr-only">Table Details</DialogTitle>
          {selectedTable && (
            <>
              <div className="p-8 pb-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-2xl font-black text-[#1E293B] uppercase tracking-tight flex items-center gap-2">
                      <span className="text-[#605DFF]">#</span>Table {selectedTable.number}
                    </h2>
                    <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-[0.2em] mt-1">
                      System Identifier: {selectedTable.id}
                    </p>
                  </div>
                  <div className={cn(
                    "px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest border",
                    getStatusInfo(selectedTable.status).color
                  )}>
                    {getStatusInfo(selectedTable.status).label}
                  </div>
                </div>
              </div>

              <div className="px-8 py-6 bg-zinc-50/50 border-y border-zinc-100 flex gap-8">
                <div className="flex-1 space-y-5">
                  <div>
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block mb-1.5">Table Name</label>
                    <p className="text-[15px] font-bold text-[#1E293B]">{selectedTable.name || "Main Seating Area"}</p>
                  </div>
                  <div className="flex gap-6">
                    <div>
                      <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block mb-1.5">Capacity</label>
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
      <Dialog open={isDeleteOpen} onOpenChange={(open) => { if(!open) setIsDeleteOpen(false); }}>
        <DialogContent className="sm:max-w-[440px] bg-white border-zinc-100 rounded-xl">
          <div className="p-6 flex flex-col items-center text-center pt-10">
            <div className="w-16 h-16 rounded-full bg-rose-100 flex items-center justify-center mb-4">
              <Trash2 className="size-8 text-rose-600" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">Delete Table?</h3>
            <p className="text-sm text-muted-foreground">
              Are you sure you want to delete <span className="font-bold text-foreground">"Table {selectedTable?.number}"</span>? 
              This action cannot be undone.
            </p>
          </div>
          <div className="p-4 bg-zinc-50 border-t border-zinc-100 flex justify-end gap-2 rounded-b-xl">
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)} className="rounded-lg font-bold border-zinc-200 px-6 h-11">
              Cancel
            </Button>
            <Button onClick={handleDeleteTable} className="bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold border-none shadow-sm px-6 h-11">
              Yes, Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
