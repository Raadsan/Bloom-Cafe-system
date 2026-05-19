"use client";

import React, { useState, useEffect, useMemo } from "react";
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
  Shield,
  LayoutGrid,
  Settings,
  MoreVertical,
  CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
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

  const filteredRoles = useMemo(() => {
    return (roles || []).filter(role => 
      role.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      role.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [roles, searchQuery]);

  return (
    <div className="animate-in fade-in duration-500 font-sans mx-1">
      {/* Page Header */}
      <div className="mb-6 px-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#1e293b] uppercase tracking-tight flex items-center gap-2">
            Roles & Access
          </h1>
          <p className="text-[12px] text-zinc-500 uppercase tracking-wider mt-1 font-medium italic">Define permission levels and staff responsibilities across the system.</p>
        </div>
      </div>

      {/* Main Container Box */}
      <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
        {/* Controls Row */}
        <div className="px-8 py-4 flex flex-wrap items-center gap-6 border-b border-zinc-50 bg-zinc-50/10">
          <div className="flex items-center gap-4">
            <div className="size-9 rounded-lg bg-white border border-zinc-200 flex items-center justify-center shadow-sm">
                <Users className="size-4 text-[#605DFF]" />
            </div>
            <div>
                <h3 className="text-[13px] font-bold text-zinc-800 uppercase tracking-tight">System Directories</h3>
            </div>
          </div>

          <div className="flex-1"></div>

          <div className="flex items-center gap-3">
            <div className="relative w-72 group">
              <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-[#605DFF] transition-colors" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search roles..."
                className="w-full h-[42px] pl-10 pr-4 bg-zinc-50 border border-zinc-200 rounded-md outline-none focus:border-[#605DFF] focus:ring-1 focus:ring-[#605DFF]/10 transition-all text-sm font-normal text-zinc-600"
              />
            </div>

            <Button
              onClick={() => setIsAddOpen(true)}
              className="h-[42px] px-6 bg-[#605DFF] hover:bg-[#4f4cef] text-white rounded-md flex items-center gap-2 transition-colors font-bold text-xs uppercase tracking-widest shadow-sm"
            >
              <Plus className="size-4" />
              Create Role
            </Button>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <Table className="w-full">
            <TableHeader className="bg-[#605DFF]">
              <TableRow className="hover:bg-transparent border-none">
                <TableHead className="px-6 py-4 text-[12px] font-black uppercase text-white border-none w-20">ID</TableHead>
                <TableHead className="px-6 py-4 text-[12px] font-black uppercase text-white border-none">Role Name</TableHead>
                <TableHead className="px-6 py-4 text-[12px] font-black uppercase text-white border-none">Description</TableHead>
                <TableHead className="px-6 py-4 text-[12px] font-black uppercase text-white border-none">Creation Date</TableHead>
                <TableHead className="px-6 py-4 text-[12px] font-black uppercase text-white border-none text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i} className="h-16 animate-pulse bg-muted/5"><TableCell colSpan={5} /></TableRow>
                ))
              ) : filteredRoles.length > 0 ? (
                filteredRoles.map((role) => (
                  <TableRow key={role.id} className="border-zinc-50 hover:bg-zinc-50/50 transition-colors group">
                    <TableCell className="px-6 py-4">
                      <span className="text-[13px] text-zinc-600">
                        {role.id}
                      </span>
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <span className="text-[13px] font-normal text-zinc-800 uppercase tracking-tight">{role.name}</span>
                    </TableCell>
                    <TableCell className="px-6 py-4">
                       <p className="text-[12.5px] font-medium text-zinc-500 max-w-xs truncate leading-relaxed">
                         {role.description || "No specific description defined for this level."}
                       </p>
                    </TableCell>
                    <TableCell className="px-6 py-4">
                        <div className="flex items-center gap-2 text-zinc-400 font-bold text-[11px] uppercase tracking-widest">
                            <Calendar className="size-3.5" />
                            {role.createdAt ? new Date(role.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : "System"}
                        </div>
                    </TableCell>
                    <TableCell className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                           <Button 
                             variant="ghost" 
                             size="sm" 
                             onClick={() => openEditModal(role)}
                             className="h-8 w-8 p-0 text-[#64748B] hover:text-[#605DFF] hover:bg-[#605DFF]/5 rounded-lg transition-colors"
                           >
                             <Edit className="size-4" />
                           </Button>
                           <Button 
                             variant="ghost" 
                             size="sm" 
                             onClick={() => { setSelectedRole(role); setIsDeleteOpen(true); }}
                             className="h-8 w-8 p-0 text-[#64748B] hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                           >
                             <Trash2 className="size-4" />
                           </Button>
                        </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="px-6 py-24 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <Shield className="size-12 text-zinc-100" />
                      <p className="text-zinc-400 font-black uppercase text-[11px] tracking-widest">No roles found in directory</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* CREATE / EDIT MODAL */}
      <Dialog open={isAddOpen || isEditOpen} onOpenChange={(open) => { if(!open) { setIsAddOpen(false); setIsEditOpen(false); resetForm(); } }}>
        <DialogContent className="sm:max-w-[500px] bg-white border-none p-0 overflow-hidden rounded-2xl shadow-xl">
          <div className="p-8 border-b border-zinc-100 bg-zinc-50/30">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-[#1e293b]">
                {isEditOpen ? "Edit Role" : "Create New Role"}
              </DialogTitle>
              <DialogDescription className="text-zinc-500 text-sm mt-1">
                Define the identity and purpose of this system role.
              </DialogDescription>
            </DialogHeader>
          </div>
          
          <form onSubmit={isEditOpen ? handleUpdateRole : handleAddRole} className="p-8 space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-[#1e293b]">Role Name *</label>
              <input 
                type="text"
                value={formData.name} 
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="e.g. Sales Manager"
                required
                className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-lg outline-none focus:border-[#605DFF] focus:ring-4 focus:ring-[#605DFF]/5 transition-all text-[15px] font-medium placeholder:text-zinc-400"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-bold text-[#1e293b]">Description</label>
              <textarea 
                value={formData.description} 
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Describe what this role does..."
                rows={4}
                className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-lg outline-none focus:border-[#605DFF] focus:ring-4 focus:ring-[#605DFF]/5 transition-all text-[15px] font-medium placeholder:text-zinc-400 resize-none"
              />
            </div>

            <DialogFooter className="pt-6 flex gap-3 sm:justify-end">
              <Button type="button" variant="outline" onClick={() => { setIsAddOpen(false); setIsEditOpen(false); }} className="px-6 h-11 rounded-lg font-bold text-zinc-500">
                Cancel
              </Button>
              <Button type="submit" className="px-8 h-11 rounded-lg font-bold bg-[#605DFF] hover:bg-[#4E4BCB] text-white shadow-lg shadow-[#605DFF]/20 border-none">
                {isEditOpen ? "Update Role" : "Save Role"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DELETE MODAL */}
      <Dialog open={isDeleteOpen} onOpenChange={(open) => { if(!open) setIsDeleteOpen(false); }}>
        <DialogContent className="sm:max-w-[480px] bg-white border-none p-0 overflow-hidden rounded-2xl shadow-xl">
          <div className="p-8 flex items-start gap-6 pt-10">
            <div className="w-14 h-14 shrink-0 rounded-full bg-rose-50 flex items-center justify-center border border-rose-100">
              <Trash2 className="size-6 text-rose-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-[#1E293B] mb-2">Delete Role?</h3>
              <p className="text-sm text-zinc-500 leading-relaxed">
                Are you sure you want to delete <span className="font-bold text-[#1E293B]">"{selectedRole?.name}"</span>? 
                This action cannot be undone and may affect staff members assigned to this role.
              </p>
            </div>
          </div>
          <DialogFooter className="p-6 bg-zinc-50/50 border-t border-zinc-100 gap-3">
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)} className="rounded-lg font-bold px-6 h-11 text-zinc-500">
              Cancel
            </Button>
            <Button onClick={handleDeleteRole} className="bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold border-none px-8 h-11 shadow-lg shadow-rose-600/10">
              Yes, Delete Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
