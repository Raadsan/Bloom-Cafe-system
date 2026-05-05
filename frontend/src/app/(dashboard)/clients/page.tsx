"use client";

import React, { useState, useEffect, useMemo } from "react";
import { 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Users, 
  Phone, 
  Calendar,
  MoreHorizontal,
  RefreshCw,
  UserCheck
} from "lucide-react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { customerApi, Customer } from "@/lib/api/customerApi";
import { useToast } from "@/components/ui/toast";

export default function ClientsPage() {
  const { showToast } = useToast();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);

  // Modal states
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // Form states
  const [formName, setFormName] = useState("");
  const [formPhone, setFormPhone] = useState("");

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const data = await customerApi.getAllCustomers();
      setCustomers(data);
    } catch (error) {
      console.error("Failed to fetch customers:", error);
      showToast("Failed to load clients data", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      const matchesSearch = c.fullName.toLowerCase().includes(search.toLowerCase()) || 
                           c.phone.toLowerCase().includes(search.toLowerCase());
      return matchesSearch;
    });
  }, [customers, search]);

  const openAddModal = () => {
    setFormName("");
    setFormPhone("");
    setIsAddOpen(true);
  };

  const openEditModal = (c: Customer) => {
    setSelectedCustomer(c);
    setFormName(c.fullName);
    setFormPhone(c.phone);
    setIsEditOpen(true);
  };

  const openDeleteModal = (c: Customer) => {
    setSelectedCustomer(c);
    setIsDeleteOpen(true);
  };

  const handleSave = async () => {
    if (!formName || !formPhone) {
      showToast("Name and phone number are required", "error");
      return;
    }

    try {
      setSaving(true);
      if (isEditOpen && selectedCustomer) {
        await customerApi.updateCustomer(selectedCustomer.id, {
          fullName: formName,
          phone: formPhone
        });
        showToast("Client profile updated", "success");
      } else {
        await customerApi.createCustomer({
          fullName: formName,
          phone: formPhone
        });
        showToast("New client registered", "success");
      }
      setIsAddOpen(false);
      setIsEditOpen(false);
      fetchCustomers();
    } catch (error: any) {
      console.error("Failed to save customer:", error);
      showToast(error.response?.data?.message || "Failed to save client", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedCustomer) return;
    try {
      setSaving(true);
      await customerApi.deleteCustomer(selectedCustomer.id);
      showToast("Client record deleted", "success");
      setIsDeleteOpen(false);
      fetchCustomers();
    } catch (error: any) {
      console.error("Failed to delete customer:", error);
      showToast(error.response?.data?.message || "Failed to delete record", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground uppercase">Client Management</h1>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-3">
            Maintain customer relationships and track order history.
          </p>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-xl border border-zinc-100 shadow-sm overflow-hidden">
        <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-zinc-50/30">
          <div>
            <h3 className="text-sm font-bold text-foreground">Client Directory Feed</h3>
            <p className="text-[12px] font-medium text-muted-foreground mt-1">Real-time customer database</p>
          </div>
          
          <div className="flex flex-col md:flex-row items-center gap-3">
            <div className="relative group w-full md:w-80">
              <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-[#605DFF] transition-colors" />
              <input
                type="text"
                placeholder="Search name or phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-[14.5px] font-medium bg-white border border-zinc-100 rounded-lg outline-none focus:border-[#605DFF]/30 focus:ring-4 focus:ring-[#605DFF]/5 transition-all shadow-sm"
              />
            </div>

            <Button onClick={openAddModal} className="h-[42px] px-6 rounded-lg bg-[#605DFF] text-white hover:bg-[#4E4BCB] font-bold border-none shadow-md whitespace-nowrap text-[14.5px]">
              <Plus className="mr-2 size-4" /> New Client
            </Button>
          </div>
        </div>

        <div className="border-t border-zinc-100">
          <Table>
            <TableHeader className="bg-zinc-50/50">
              <TableRow className="border-zinc-100 hover:bg-transparent">
                <TableHead className="px-6 py-5 text-[11px] font-bold uppercase tracking-widest text-[#64748B]">Client ID</TableHead>
                <TableHead className="px-6 py-5 text-[11px] font-bold uppercase tracking-widest text-[#64748B]">Full Name</TableHead>
                <TableHead className="px-6 py-5 text-[11px] font-bold uppercase tracking-widest text-[#64748B]">Contact Info</TableHead>
                <TableHead className="px-6 py-5 text-[11px] font-bold uppercase tracking-widest text-[#64748B] text-center">Total Orders</TableHead>
                <TableHead className="px-6 py-5 text-[11px] font-bold uppercase tracking-widest text-[#64748B]">Last Visit</TableHead>
                <TableHead className="px-6 py-5 text-right text-[11px] font-bold uppercase tracking-widest text-[#64748B] w-32">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <TableRow key={i} className="h-16 animate-pulse">
                    {[...Array(6)].map((_, j) => (
                      <TableCell key={j} className="px-6 py-4">
                        <div className="h-4 bg-zinc-50 rounded w-full"></div>
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : filteredCustomers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <Users className="size-12 text-zinc-200 mb-4" />
                      <p className="text-[#64748B] font-bold uppercase text-[11px] tracking-widest">No clients found in database</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredCustomers.map((c) => (
                  <TableRow key={c.id} className="border-zinc-50 hover:bg-zinc-50/30 transition-colors group">
                    <TableCell className="px-6 py-5 text-[13px] font-medium text-[#1E293B]">
                      #{c.id}
                    </TableCell>
                    <TableCell className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-[#F3F4FF] flex items-center justify-center text-[#605DFF] font-bold text-xs shadow-sm">
                          {c.fullName.charAt(0).toUpperCase()}
                        </div>
                        <p className="font-bold text-[14.5px] text-[#1E293B] uppercase tracking-tight">{c.fullName}</p>
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-5">
                      <div className="flex items-center gap-2 text-[13.5px] font-medium text-[#64748B]">
                        <Phone className="size-3.5 opacity-60" /> {c.phone}
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-5 text-center">
                      <span className="px-3 py-1 rounded-md text-[11px] font-bold uppercase tracking-widest bg-zinc-100 text-[#1E293B]">
                        {c.totalOrders || 0} Orders
                      </span>
                    </TableCell>
                    <TableCell className="px-6 py-5">
                      <div className="flex flex-col gap-0.5">
                        <p className="text-[12px] font-semibold text-[#1E293B]">
                          {c.lastOrderDate ? new Date(c.lastOrderDate).toLocaleDateString() : "No orders yet"}
                        </p>
                        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">
                          {c.lastOrderDate ? "Recent Activity" : "New Client"}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-5 text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => openEditModal(c)} 
                          className="h-8 w-8 p-0 text-[#64748B] hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                        >
                          <Edit className="size-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => openDeleteModal(c)} 
                          className="h-8 w-8 p-0 text-[#64748B] hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                        >
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

      {/* ADD / EDIT MODAL */}
      <Dialog open={isAddOpen || isEditOpen} onOpenChange={(open) => { if(!open) { setIsAddOpen(false); setIsEditOpen(false); } }}>
        <DialogContent className="sm:max-w-[440px] bg-white border-zinc-100 p-0 overflow-hidden">
          <div className="p-6 border-b border-zinc-100">
            <DialogTitle className="text-xl font-bold">
              {isEditOpen ? "Update Client Profile" : "Register New Client"}
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground mt-1">
              {isEditOpen ? "Modify customer contact details and information." : "Create a new customer profile for order tracking and loyalty."}
            </DialogDescription>
          </div>
          
          <div className="p-6 space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-bold text-[#1E293B]">Full Name *</label>
              <input
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g. Ali Ahmed"
                className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-lg outline-none focus:border-[#605DFF]/30 focus:ring-4 focus:ring-[#605DFF]/5 transition-all text-[15px] font-medium"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-bold text-[#1E293B]">Phone Number *</label>
              <input
                type="text"
                value={formPhone}
                onChange={(e) => setFormPhone(e.target.value)}
                placeholder="e.g. +252 61 1234567"
                className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-lg outline-none focus:border-[#605DFF]/30 focus:ring-4 focus:ring-[#605DFF]/5 transition-all text-[15px] font-medium"
              />
            </div>
          </div>

          <DialogFooter className="p-6 bg-zinc-50/50 border-t border-zinc-100 gap-3">
            <Button variant="outline" onClick={() => { setIsAddOpen(false); setIsEditOpen(false); }} className="rounded-lg font-bold px-6 h-11" disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSave} className="bg-[#605DFF] hover:bg-[#4E4BCB] text-white rounded-lg font-bold border-none px-8 h-11 shadow-lg shadow-[#605DFF]/20" disabled={saving}>
              {saving ? "Processing..." : isEditOpen ? "Update Profile" : "Register Client"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DELETE MODAL */}
      <Dialog open={isDeleteOpen} onOpenChange={(open) => { if(!open) setIsDeleteOpen(false); }}>
        <DialogContent className="sm:max-w-[420px] bg-white border-zinc-100">
          <DialogTitle className="sr-only">Delete Client Record</DialogTitle>
          <div className="p-6 flex flex-col items-center text-center pt-10">
            <div className="w-16 h-16 rounded-full bg-rose-50 flex items-center justify-center mb-4 border border-rose-100">
              <Trash2 className="size-8 text-rose-600" />
            </div>
            <h3 className="text-xl font-bold text-[#1E293B] mb-2">Delete Client Record?</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Are you sure you want to remove <span className="font-bold text-[#1E293B]">"{selectedCustomer?.fullName}"</span> from the database? 
              This action will remove their profile and history.
            </p>
          </div>
          <DialogFooter className="p-6 pt-0 gap-3">
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)} className="rounded-lg font-bold px-6 h-11 flex-1" disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleDelete} className="bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold border-none px-6 h-11 flex-1" disabled={saving}>
              {saving ? "Deleting..." : "Yes, Delete Record"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
