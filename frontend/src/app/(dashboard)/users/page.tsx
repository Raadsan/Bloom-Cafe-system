"use client";

import React, { useState, useEffect, useMemo } from "react";
import { cn } from "@/lib/utils";
import {
  Search,
  Plus,
  Edit,
  Trash2,
  UserPlus,
  Shield,
  Mail,
  Phone,
  UserCheck,
  UserX,
  Lock,
  ChevronDown,
  RefreshCw,
  MoreHorizontal,
  Eye
} from "lucide-react";
import { usePermissions } from "@/context/PermissionContext";
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
import { userApi, User } from "@/lib/api/userApi";
import { roleApi, Role } from "@/lib/api/roleApi";
import { useToast } from "@/components/ui/toast";

export default function UsersPage() {
  const { showToast } = useToast();
  const { canAdd: checkAdd, canEdit: checkEdit, canDelete: checkDelete } = usePermissions();

  const canAdd = checkAdd("/users");
  const canEdit = checkEdit("/users");
  const canDelete = checkDelete("/users");

  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);

  // Modal states
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Form states
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formRoleId, setFormRoleId] = useState<number>(0);
  const [formIsActive, setFormIsActive] = useState(true);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [roleFilter, setRoleFilter] = useState("all");

  const fetchData = async () => {
    try {
      setLoading(true);
      const [userData, roleData] = await Promise.all([
        userApi.getAllUsers(),
        roleApi.getAllRoles()
      ]);
      setUsers(userData);
      setRoles(roleData);
    } catch (error) {
      console.error("Failed to fetch user data:", error);
      showToast("Failed to load staff data", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch = u.fullName.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase()) ||
        (u.phone && u.phone.toLowerCase().includes(search.toLowerCase()));

      const matchesRole = roleFilter === "all" || String(u.roleId) === roleFilter || u.role?.name.toLowerCase() === roleFilter.toLowerCase();

      return matchesSearch && matchesRole;
    });
  }, [users, search, roleFilter]);

  const totalPages = Math.ceil(filteredUsers.length / pageSize);
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredUsers.slice(start, start + pageSize);
  }, [filteredUsers, currentPage, pageSize]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, pageSize, roleFilter]);

  const openAddModal = () => {
    setFormName("");
    setFormEmail("");
    setFormPhone("");
    setFormPassword("");
    setFormRoleId(roles[0]?.id || 0);
    setFormIsActive(true);
    setIsAddOpen(true);
  };

  const openEditModal = (u: User) => {
    setSelectedUser(u);
    setFormName(u.fullName);
    setFormEmail(u.email);
    setFormPhone(u.phone || "");
    setFormPassword(""); // Don't show password
    setFormRoleId(u.roleId);
    setFormIsActive(u.isActive);
    setIsEditOpen(true);
  };

  const openDeleteModal = (u: User) => {
    setSelectedUser(u);
    setIsDeleteOpen(true);
  };

  const openViewModal = (u: User) => {
    setSelectedUser(u);
    setIsViewOpen(true);
  };

  const handleSave = async () => {
    if (!formName || !formEmail || (isAddOpen && !formPassword) || !formRoleId) {
      showToast("Please fill in all required fields", "error");
      return;
    }

    try {
      setSaving(true);
      if (isEditOpen && selectedUser) {
        await userApi.updateUser(selectedUser.id, {
          fullName: formName,
          email: formEmail,
          phone: formPhone,
          roleId: formRoleId,
          isActive: formIsActive,
          ...(formPassword ? { password: formPassword } : {})
        });
        showToast("Staff profile updated", "success");
      } else {
        await userApi.createUser({
          fullName: formName,
          email: formEmail,
          phone: formPhone,
          password: formPassword,
          roleId: formRoleId
        });
        showToast("New staff member registered", "success");
      }
      setIsAddOpen(false);
      setIsEditOpen(false);
      fetchData();
    } catch (error: any) {
      console.error("Failed to save user:", error);
      showToast(error.response?.data?.message || "Failed to save user", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedUser) return;
    try {
      setSaving(true);
      await userApi.deleteUser(selectedUser.id);
      showToast("Staff member removed", "success");
      setIsDeleteOpen(false);
      fetchData();
    } catch (error: any) {
      console.error("Failed to delete user:", error);
      showToast(error.response?.data?.message || "Failed to delete record", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="animate-in fade-in duration-700 font-sans mx-1 pt-0 pb-8">
      {/* Page Header: Outside the box */}
      <div className="mb-6 px-4">
        <h1 className="text-2xl font-bold text-[#1e293b] uppercase tracking-tight">Admins Management</h1>
        <p className="text-[12px] text-zinc-500 uppercase tracking-wider mt-1 font-medium">Manage system administrators, roles, and security permissions in one place.</p>
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

            <div className="flex items-center gap-2 text-[13px] text-zinc-400 font-normal shrink-0">
              <span>Filter Role</span>
              <select 
                value={roleFilter} 
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-40 h-[42px] px-3 border border-zinc-200 rounded-md outline-none focus:border-[#605DFF] transition-colors bg-white cursor-pointer text-sm font-normal text-zinc-600"
              >
                <option value="all">All Roles</option>
                {roles.map(r => (
                  <option key={r.id} value={String(r.id)}>{r.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex-1"></div>

          <div className="flex items-center gap-3">
            <div className="relative w-64 group">
              <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-[#605DFF] transition-colors" />
              <input 
                type="text" 
                placeholder="Search admins..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-[42px] pl-10 pr-4 bg-zinc-50 border border-zinc-200 rounded-md outline-none focus:border-[#605DFF] focus:ring-1 focus:ring-[#605DFF]/10 transition-all text-sm font-normal text-zinc-600"
              />
            </div>

            {canAdd && (
              <Button 
                onClick={openAddModal}
                className="h-[42px] px-6 bg-[#605DFF] hover:bg-[#4f4cef] text-white rounded-md flex items-center gap-2 transition-colors font-medium text-sm shadow-sm"
              >
                <Plus className="size-4" />
                Add Admin
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
                  <TableHead className="px-14 py-4 text-[12px] font-black uppercase text-white border-none">Full Name</TableHead>
                  <TableHead className="px-14 py-4 text-[12px] font-black uppercase text-white border-none">Email</TableHead>
                  <TableHead className="px-14 py-4 text-[12px] font-black uppercase text-white border-none">Phone</TableHead>
                  <TableHead className="px-14 py-4 text-[12px] font-black uppercase text-white border-none text-center">Role</TableHead>
                  <TableHead className="px-14 py-4 text-[12px] font-black uppercase text-white border-none text-right pr-20">Status</TableHead>
                  <TableHead className="px-14 py-4 text-[12px] font-black uppercase text-white border-none text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <TableRow key={i} className="h-14 animate-pulse">
                      {[...Array(6)].map((_, j) => (
                        <TableCell key={j} className="px-6 py-4">
                          <div className="h-4 bg-zinc-100 rounded w-full"></div>
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : paginatedUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="px-6 py-10 text-center text-zinc-500">
                      No users found
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedUsers.map((u) => {
                    return (
                      <TableRow key={u.id} className="border-zinc-100 hover:bg-zinc-50/50 transition-colors">
                        <TableCell className="px-6 py-3 text-[13px] text-zinc-700 font-medium">{u.fullName}</TableCell>
                        <TableCell className="px-6 py-3 text-[13px] text-zinc-700 font-medium">{u.email}</TableCell>
                        <TableCell className="px-6 py-3 text-[13px] text-zinc-700 font-medium">{u.phone || "-"}</TableCell>
                        <TableCell className="px-14 py-3 text-center">
                          <span className={cn(
                            "px-3 py-1 rounded-md text-[10px] font-semibold uppercase tracking-wider border",
                            u.role?.name?.toLowerCase() === 'admin' ? "bg-indigo-50 text-indigo-600 border-indigo-100" :
                              u.role?.name?.toLowerCase() === 'manager' ? "bg-amber-50 text-amber-600 border-amber-100" :
                                u.role?.name?.toLowerCase() === 'waiter' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                                  u.role?.name?.toLowerCase() === 'cashier' ? "bg-blue-50 text-blue-600 border-blue-100" :
                                    "bg-zinc-100 text-zinc-600 border-zinc-200"
                          )}>
                            {u.role?.name || "No Role"}
                          </span>
                        </TableCell>
                        <TableCell className="px-6 py-3 text-right pr-10">
                          <span className={cn(
                            "px-3 py-1 rounded-md text-[10px] font-semibold uppercase tracking-wider",
                            u.isActive ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-rose-50 text-rose-600 border border-rose-100"
                          )}>
                            {u.isActive ? "Active" : "Inactive"}
                          </span>
                        </TableCell>
                        <TableCell className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openViewModal(u)}
                              className="h-8 w-8 p-0 text-[#64748B] hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                            >
                              <Eye className="size-4" />
                            </Button>
                            {canEdit && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openEditModal(u)}
                                className="h-8 w-8 p-0 text-[#64748B] hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              >
                                <Edit className="size-4" />
                              </Button>
                            )}
                            {canDelete && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openDeleteModal(u)}
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
            {Math.min(filteredUsers.length, (currentPage - 1) * pageSize + 1)}-{Math.min(filteredUsers.length, currentPage * pageSize)} of {filteredUsers.length}
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

      {/* ADD / EDIT MODAL */}
      <Dialog open={isAddOpen || isEditOpen} onOpenChange={(open) => { if (!open) { setIsAddOpen(false); setIsEditOpen(false); } }}>
        <DialogContent className="sm:max-w-[640px] bg-white border-zinc-100 p-0 overflow-hidden">
          <DialogTitle className="sr-only">User Profile Form</DialogTitle>
          <div className="p-6 border-b border-zinc-100">
            <DialogTitle className="text-xl font-bold text-[#1e293b]">
              {isEditOpen ? "Update Staff Profile" : "Register New Staff Member"}
            </DialogTitle>
            <DialogDescription className="text-sm text-zinc-500 mt-1">
              {isEditOpen ? "Modify account details and access permissions." : "Create a new administrative or kitchen account for your staff."}
            </DialogDescription>
          </div>

          <div className="p-8 grid grid-cols-2 gap-x-8 gap-y-6">
            <div className="col-span-2 space-y-2">
              <label className="text-sm font-bold text-[#1E293B]">Full Name *</label>
              <input
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g. Mohamed Ali"
                className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-lg outline-none focus:border-[#605DFF]/30 focus:ring-4 focus:ring-[#605DFF]/5 transition-all text-[15px] font-medium"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-[#1E293B]">Email Address *</label>
              <input
                type="email"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                placeholder="staff@example.com"
                className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-lg outline-none focus:border-[#605DFF]/30 focus:ring-4 focus:ring-[#605DFF]/5 transition-all text-[15px] font-medium"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-[#1E293B]">Phone Number</label>
              <input
                type="text"
                value={formPhone}
                onChange={(e) => setFormPhone(e.target.value)}
                placeholder="+252..."
                className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-lg outline-none focus:border-[#605DFF]/30 focus:ring-4 focus:ring-[#605DFF]/5 transition-all text-[15px] font-medium"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-[#1E293B]">Access Role *</label>
              <select
                value={formRoleId}
                onChange={(e) => setFormRoleId(Number(e.target.value))}
                className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-lg outline-none focus:border-[#605DFF]/30 transition-all text-[15px] font-medium appearance-none cursor-pointer"
              >
                <option value={0}>Select a role...</option>
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>{r.name.toUpperCase()}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-[#1E293B]">Account Status</label>
              <select
                value={formIsActive ? "active" : "inactive"}
                onChange={(e) => setFormIsActive(e.target.value === "active")}
                className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-lg outline-none focus:border-[#605DFF]/30 transition-all text-[15px] font-medium appearance-none cursor-pointer"
              >
                <option value="active">Active (Grant Access)</option>
                <option value="inactive">Inactive (Revoke Access)</option>
              </select>
            </div>

            <div className="col-span-2 space-y-2">
              <label className="text-sm font-bold text-[#1E293B]">
                {isEditOpen ? "Update Password (Optional)" : "Account Password *"}
              </label>
              <div className="relative group">
                <Lock className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type="password"
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  placeholder={isEditOpen ? "Leave blank to keep current" : "Min. 6 characters"}
                  className="w-full pl-10 pr-4 py-3 bg-white border border-zinc-200 rounded-lg outline-none focus:border-[#605DFF]/30 focus:ring-4 focus:ring-[#605DFF]/5 transition-all text-[15px] font-medium"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="p-6 bg-zinc-50/50 border-t border-zinc-100 gap-3">
            <Button variant="outline" onClick={() => { setIsAddOpen(false); setIsEditOpen(false); }} className="rounded-lg font-bold px-6 h-11" disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSave} className="bg-[#605DFF] hover:bg-[#4E4BCB] text-white rounded-lg font-bold border-none px-8 h-11 shadow-lg shadow-[#605DFF]/20" disabled={saving}>
              {saving ? "Processing..." : isEditOpen ? "Update Account" : "Register User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* VIEW MODAL */}
      <Dialog open={isViewOpen} onOpenChange={(open) => { if (!open) setIsViewOpen(false); }}>
        <DialogContent className="sm:max-w-[500px] bg-white border-zinc-100 p-0 overflow-hidden rounded-2xl">
          <DialogTitle className="sr-only">Staff Member Details</DialogTitle>
          <div className="p-8">
            <div className="flex justify-between items-start mb-8">
              <div>
                <h3 className="text-2xl font-bold text-[#1E293B]">{selectedUser?.fullName}</h3>
                <p className="text-sm font-medium text-[#605DFF] mt-1 uppercase tracking-wider">{selectedUser?.role?.name || "Staff Member"}</p>
              </div>
              <span className={cn(
                "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border",
                selectedUser?.isActive
                  ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                  : "bg-rose-50 text-rose-600 border-rose-100"
              )}>
                {selectedUser?.isActive ? "Active Account" : "Inactive Account"}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div className="flex gap-4">
                <div className="flex-1 p-4 rounded-xl bg-zinc-50 border border-zinc-100 flex items-center gap-3 group hover:border-[#605DFF]/30 transition-colors">
                  <div className="size-9 rounded-lg bg-white flex items-center justify-center shadow-sm group-hover:text-[#605DFF] shrink-0">
                    <Mail className="size-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Email Address</p>
                    <p className="text-sm font-medium text-zinc-700 truncate">{selectedUser?.email}</p>
                  </div>
                </div>

                <div className="flex-1 p-4 rounded-xl bg-zinc-50 border border-zinc-100 flex items-center gap-3 group hover:border-[#605DFF]/30 transition-colors">
                  <div className="size-9 rounded-lg bg-white flex items-center justify-center shadow-sm group-hover:text-[#605DFF] shrink-0">
                    <Phone className="size-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Phone Number</p>
                    <p className="text-sm font-medium text-zinc-700 truncate">{selectedUser?.phone || "N/A"}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-100 flex items-center gap-3">
                  <div className="size-9 rounded-lg bg-white flex items-center justify-center shadow-sm text-zinc-400 shrink-0">
                    <RefreshCw className="size-4" />
                  </div>
                  <div>
                    <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Created At</p>
                    <p className="text-sm font-medium text-zinc-700">{selectedUser?.createdAt ? new Date(selectedUser.createdAt).toLocaleDateString() : "N/A"}</p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-100 flex items-center gap-3">
                  <div className="size-9 rounded-lg bg-white flex items-center justify-center shadow-sm text-zinc-400 shrink-0">
                    <Shield className="size-4" />
                  </div>
                  <div>
                    <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Last Update</p>
                    <p className="text-sm font-medium text-zinc-700">{selectedUser?.updatedAt ? new Date(selectedUser.updatedAt).toLocaleDateString() : "Just Now"}</p>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#605DFF]/5 border border-[#605DFF]/10 flex items-center gap-4">
                <div className="size-10 rounded-lg bg-white flex items-center justify-center shadow-sm text-[#605DFF]">
                  <Lock className="size-5" />
                </div>
                <div>
                  <p className="text-[11px] text-[#605DFF] font-bold uppercase tracking-wider">Security Access</p>
                  <p className="text-sm font-medium text-[#1E293B]">Restricted to {selectedUser?.role?.name} Panel</p>
                </div>
              </div>
            </div>

            <DialogFooter className="mt-8 pt-6 border-t border-zinc-100">
              <Button
                onClick={() => setIsViewOpen(false)}
                className="w-full bg-[#605DFF] hover:bg-[#4E4BCB] text-white rounded-xl font-bold border-none h-12 shadow-lg shadow-[#605DFF]/20"
              >
                Done
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* DELETE MODAL */}
      <Dialog open={isDeleteOpen} onOpenChange={(open) => { if (!open) setIsDeleteOpen(false); }}>
        <DialogContent className="sm:max-w-[500px] bg-white border-zinc-100 p-0 overflow-hidden">
          <DialogTitle className="sr-only">Delete Confirmation</DialogTitle>
          <div className="p-8 flex items-start gap-6">
            <div className="w-14 h-14 shrink-0 rounded-full bg-rose-50 flex items-center justify-center border border-rose-100">
              <Trash2 className="size-6 text-rose-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-[#1E293B] mb-2">Remove Staff Account?</h3>
              <p className="text-sm text-zinc-500 leading-relaxed">
                Are you sure you want to remove <span className="font-bold text-[#1E293B]">"{selectedUser?.fullName}"</span> from the system?
                This action is permanent and they will lose all access immediately.
              </p>
            </div>
          </div>
          <DialogFooter className="p-6 bg-zinc-50/50 border-t border-zinc-100 gap-3">
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)} className="rounded-lg font-bold px-6 h-11" disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleDelete} className="bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold border-none px-8 h-11 shadow-lg shadow-rose-600/10" disabled={saving}>
              {saving ? "Deleting..." : "Yes, Remove User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
