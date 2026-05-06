"use client";

import React, { useState, useEffect } from "react";
import { 
  ShieldCheck, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye,
  Filter,
  Users,
  Calendar,
  MoreVertical,
  Shield,
  LayoutGrid
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { roleApi, Role } from "@/lib/api/roleApi";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const { showToast } = useToast();

  // Modal states
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    name: "",
    description: ""
  });

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const data = await roleApi.getAllRoles();
      setRoles(data || []);
    } catch (error) {
      console.error("Failed to fetch roles:", error);
      showToast("Failed to load roles", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const handleAddRole = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await roleApi.createRole({
        name: formData.name,
        description: formData.description
      });
      showToast("Role created successfully", "success");
      setIsAddOpen(false);
      resetForm();
      fetchRoles();
    } catch (error: any) {
      showToast(error.response?.data?.message || "Failed to create role", "error");
    }
  };

  const handleUpdateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole) return;
    try {
      await roleApi.updateRole(selectedRole.id, {
        name: formData.name,
        description: formData.description
      });
      showToast("Role updated successfully", "success");
      setIsEditOpen(false);
      fetchRoles();
    } catch (error: any) {
      showToast(error.response?.data?.message || "Failed to update role", "error");
    }
  };

  const handleDeleteRole = async () => {
    if (!selectedRole) return;
    try {
      await roleApi.deleteRole(selectedRole.id);
      showToast("Role deleted successfully", "success");
      setIsDeleteOpen(false);
      fetchRoles();
    } catch (error: any) {
      showToast(error.response?.data?.message || "Failed to delete role", "error");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: ""
    });
  };

  const openEditModal = (role: Role) => {
    setSelectedRole(role);
    setFormData({
      name: role.name,
      description: role.description || ""
    });
    setIsEditOpen(true);
  };

  const openViewModal = (role: Role) => {
    setSelectedRole(role);
    setIsViewOpen(true);
  };

  const filteredRoles = (roles || []).filter(role => 
    role.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    role.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground uppercase flex items-center gap-2">
            <Shield className="size-6 text-[#605DFF]" />
            Roles Management
          </h1>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-3">
            Configure system access levels and user permissions.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="text-[14.5px] font-bold h-10 rounded-lg bg-white border border-zinc-100 text-[#64748B] hover:bg-zinc-50 hover:text-[#605DFF] transition-all shadow-sm px-4">
            <Filter className="mr-2 size-4" />
            Filter
          </Button>
        </div>
      </div>

      {/* Main Roles Table Card */}
      <div className="trezo-card overflow-hidden">
        {/* Card Header with Filters */}
        <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-zinc-50/30">
          <div>
            <h3 className="text-sm font-bold text-foreground">System Roles</h3>
            <p className="text-[12px] font-medium text-muted-foreground mt-1">{filteredRoles.length} active roles in directory</p>
          </div>
          <div className="flex flex-col md:flex-row items-center gap-3">
            <div className="relative group w-full md:w-72">
              <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-[#605DFF] transition-colors" />
              <input 
                type="text" 
                placeholder="Search roles..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-[14.5px] font-medium bg-white border border-zinc-100 rounded-lg outline-none focus:border-[#605DFF]/30 focus:ring-4 focus:ring-[#605DFF]/5 transition-all shadow-sm"
              />
            </div>
            <Button size="sm" onClick={() => setIsAddOpen(true)} className="w-full md:w-auto text-[14.5px] font-bold h-[42px] rounded-lg bg-[#605DFF] text-white hover:bg-[#4E4BCB] transition-all border-none shadow-md px-6">
              <Plus className="mr-2 size-4" />
              Create Role
            </Button>
          </div>
        </div>

        {/* Table Content */}
        <div className="border-t border-zinc-100">
          <Table>
            <TableHeader className="bg-zinc-50/50">
              <TableRow className="border-zinc-100 hover:bg-transparent">
                <TableHead className="px-6 py-5 text-[11px] font-bold uppercase tracking-widest text-[#64748B] w-[80px]">#</TableHead>
                <TableHead className="px-6 py-5 text-[11px] font-bold uppercase tracking-widest text-[#64748B]">Role Name</TableHead>
                <TableHead className="px-6 py-5 text-[11px] font-bold uppercase tracking-widest text-[#64748B]">Description</TableHead>
                <TableHead className="px-6 py-5 text-[11px] font-bold uppercase tracking-widest text-[#64748B]">Created At</TableHead>
                <TableHead className="px-6 py-5 text-right text-[11px] font-bold uppercase tracking-widest text-[#64748B] w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i} className="h-16 animate-pulse bg-muted/10">
                    <TableCell colSpan={5} />
                  </TableRow>
                ))
              ) : filteredRoles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="px-6 py-24 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <LayoutGrid className="size-12 text-zinc-200" />
                      <p className="text-[#64748B] font-bold uppercase text-[11px] tracking-widest">No roles found</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredRoles.map((role) => (
                  <TableRow key={role.id} className="border-zinc-50 hover:bg-zinc-50/30 transition-colors group">
                    <TableCell className="px-6 py-5">
                      <span className="text-[14px] font-bold text-[#605DFF]">#{role.id}</span>
                    </TableCell>
                    <TableCell className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        <div className="size-8 rounded-lg bg-[#605DFF]/10 flex items-center justify-center text-[#605DFF]">
                          <ShieldCheck className="size-4" />
                        </div>
                        <span className="text-[14px] font-bold text-[#1E293B] uppercase tracking-tight">{role.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-5">
                      <p className="text-[13px] text-muted-foreground font-medium max-w-[300px] truncate">
                        {role.description || "No description provided"}
                      </p>
                    </TableCell>
                    <TableCell className="px-6 py-5">
                      <div className="flex items-center gap-1.5 text-[13px] font-bold text-zinc-500 uppercase tracking-widest">
                        <Calendar className="size-3.5 text-zinc-400" />
                        {role.createdAt ? new Date(role.createdAt).toLocaleDateString([], { dateStyle: 'medium' }) : "N/A"}
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-5 text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => openViewModal(role)} className="h-8 w-8 p-0 text-[#64748B] hover:text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors">
                          <Eye className="size-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => openEditModal(role)} className="h-8 w-8 p-0 text-[#64748B] hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors">
                          <Edit className="size-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => { setSelectedRole(role); setIsDeleteOpen(true); }} className="h-8 w-8 p-0 text-[#64748B] hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors">
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

      {/* ADD MODAL */}
      <Dialog open={isAddOpen} onOpenChange={(open) => { if(!open) { setIsAddOpen(false); resetForm(); } }}>
        <DialogContent className="sm:max-w-[600px] bg-white border-zinc-100 p-0 overflow-hidden rounded-2xl">
          <div className="flex items-center justify-between p-6 border-b border-zinc-100">
            <div className="space-y-1">
              <DialogTitle className="text-xl font-bold">Create New Role</DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                Define a new permission level for system users.
              </DialogDescription>
            </div>
          </div>
          <form onSubmit={handleAddRole} className="p-6 space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-bold text-[#1E293B]">Role Name *</label>
              <input 
                value={formData.name} 
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="e.g. Cashier"
                required
                className="w-full px-4 py-3 border border-zinc-200 rounded-lg text-[15px] focus:outline-none focus:ring-2 focus:ring-[#605DFF]/20"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-[#1E293B]">Description</label>
              <textarea 
                value={formData.description} 
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Briefly describe the responsibilities of this role..."
                rows={4}
                className="w-full px-4 py-3 border border-zinc-200 rounded-lg text-[15px] focus:outline-none focus:ring-2 focus:ring-[#605DFF]/20 resize-none"
              />
            </div>
            <DialogFooter className="pt-4 border-t border-zinc-100 mt-4 -mx-6 px-6">
              <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)} className="rounded-lg font-bold px-6 h-11">Cancel</Button>
              <Button type="submit" className="bg-[#605DFF] hover:bg-[#4E4BCB] text-white rounded-lg font-bold border-none px-8 h-11">Save Role</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* EDIT MODAL */}
      <Dialog open={isEditOpen} onOpenChange={(open) => { if(!open) setIsEditOpen(false); }}>
        <DialogContent className="sm:max-w-[600px] bg-white border-zinc-100 p-0 overflow-hidden rounded-2xl">
          <div className="flex items-center justify-between p-6 border-b border-zinc-100">
            <div className="space-y-1">
              <DialogTitle className="text-xl font-bold">Edit Role: {selectedRole?.name}</DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                Update the role name or description.
              </DialogDescription>
            </div>
          </div>
          <form onSubmit={handleUpdateRole} className="p-6 space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-bold text-[#1E293B]">Role Name *</label>
              <input 
                value={formData.name} 
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                required
                className="w-full px-4 py-3 border border-zinc-200 rounded-lg text-[15px] focus:outline-none focus:ring-2 focus:ring-[#605DFF]/20"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-[#1E293B]">Description</label>
              <textarea 
                value={formData.description} 
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                rows={4}
                className="w-full px-4 py-3 border border-zinc-200 rounded-lg text-[15px] focus:outline-none focus:ring-2 focus:ring-[#605DFF]/20 resize-none"
              />
            </div>
            <DialogFooter className="pt-4 border-t border-zinc-100 mt-4 -mx-6 px-6">
              <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)} className="rounded-lg font-bold px-6 h-11">Cancel</Button>
              <Button type="submit" className="bg-[#605DFF] hover:bg-[#4E4BCB] text-white rounded-lg font-bold border-none px-8 h-11">Update Role</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* VIEW MODAL */}
      <Dialog open={isViewOpen} onOpenChange={(open) => { if(!open) setIsViewOpen(false); }}>
        <DialogContent className="sm:max-w-[540px] bg-white border-zinc-100 p-0 overflow-hidden rounded-2xl">
          <DialogTitle className="sr-only">Role Details</DialogTitle>
          {selectedRole && (
            <>
              <div className="p-8 pb-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-2xl font-black text-[#1E293B] uppercase tracking-tight flex items-center gap-2">
                      <ShieldCheck className="size-6 text-[#605DFF]" />
                      {selectedRole.name}
                    </h2>
                    <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-[0.2em] mt-1">
                      Role Identifier: #{selectedRole.id}
                    </p>
                  </div>
                </div>
              </div>

              <div className="px-8 py-8 bg-zinc-50/50 border-y border-zinc-100 space-y-6">
                <div>
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block mb-1.5">Description</label>
                  <p className="text-[15px] font-medium text-[#1E293B] leading-relaxed">
                    {selectedRole.description || "This role has no description attached. Consider adding one to clarify responsibilities."}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block mb-1.5">Date Created</label>
                    <div className="flex items-center gap-2 text-[14px] font-bold text-[#1E293B]">
                      <Calendar className="size-4 text-[#605DFF]" />
                      {selectedRole.createdAt ? new Date(selectedRole.createdAt).toLocaleDateString([], { dateStyle: 'long' }) : "N/A"}
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
                <Button 
                  onClick={() => { setIsViewOpen(false); openEditModal(selectedRole); }}
                  className="bg-[#605DFF] hover:bg-[#4E4BCB] text-white rounded-xl font-bold border-none px-8 h-12 text-[11px] uppercase tracking-widest shadow-lg shadow-primary/20 flex items-center gap-2"
                >
                  <Edit className="size-4" />
                  Edit Role
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* DELETE MODAL */}
      <Dialog open={isDeleteOpen} onOpenChange={(open) => { if(!open) setIsDeleteOpen(false); }}>
        <DialogContent className="sm:max-w-[440px] bg-white border-zinc-100 rounded-xl p-0 overflow-hidden">
          <div className="p-8 flex flex-col items-center text-center pt-10">
            <div className="w-16 h-16 rounded-full bg-rose-100 flex items-center justify-center mb-4">
              <Trash2 className="size-8 text-rose-600" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">Delete Role?</h3>
            <p className="text-sm text-muted-foreground px-4">
              Are you sure you want to delete <span className="font-bold text-foreground">"{selectedRole?.name}"</span>? 
              Users assigned to this role may lose access.
            </p>
          </div>
          <div className="p-4 bg-zinc-50 border-t border-zinc-100 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)} className="rounded-lg font-bold border-zinc-200 px-6 h-11">
              Cancel
            </Button>
            <Button onClick={handleDeleteRole} className="bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold border-none shadow-sm px-6 h-11">
              Yes, Delete Role
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
