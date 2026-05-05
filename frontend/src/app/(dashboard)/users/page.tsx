"use client";

import React, { useState, useEffect, useMemo } from "react";
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
  MoreHorizontal
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
import { userApi, User } from "@/lib/api/userApi";
import { roleApi, Role } from "@/lib/api/roleApi";
import { useToast } from "@/components/ui/toast";

export default function UsersPage() {
  const { showToast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);

  // Modal states
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Form states
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formRoleId, setFormRoleId] = useState<number>(0);
  const [formIsActive, setFormIsActive] = useState(true);

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
      return matchesSearch;
    });
  }, [users, search]);

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
    <div className="space-y-6 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground uppercase">User Management</h1>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-3">
            Manage staff accounts, roles, and system permissions.
          </p>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-xl border border-zinc-100 shadow-sm overflow-hidden">
        <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-zinc-50/30">
          <div>
            <h3 className="text-sm font-bold text-foreground">Staff Directory Feed</h3>
            <p className="text-[12px] font-medium text-muted-foreground mt-1">Real-time user accounts database</p>
          </div>
          
          <div className="flex flex-col md:flex-row items-center gap-3">
            <div className="relative group w-full md:w-80">
              <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-[#605DFF] transition-colors" />
              <input
                type="text"
                placeholder="Search name, email or phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-[14.5px] font-medium bg-white border border-zinc-100 rounded-lg outline-none focus:border-[#605DFF]/30 focus:ring-4 focus:ring-[#605DFF]/5 transition-all shadow-sm"
              />
            </div>

            <Button onClick={openAddModal} className="h-[42px] px-6 rounded-lg bg-[#605DFF] text-white hover:bg-[#4E4BCB] font-bold border-none shadow-md whitespace-nowrap text-[14.5px]">
              <Plus className="mr-2 size-4" /> New User
            </Button>
          </div>
        </div>

        <div className="border-t border-zinc-100">
          <Table>
            <TableHeader className="bg-zinc-50/50">
              <TableRow className="border-zinc-100 hover:bg-transparent">
                <TableHead className="px-6 py-5 text-[11px] font-bold uppercase tracking-widest text-[#64748B]">Staff ID</TableHead>
                <TableHead className="px-6 py-5 text-[11px] font-bold uppercase tracking-widest text-[#64748B]">User Detail</TableHead>
                <TableHead className="px-6 py-5 text-[11px] font-bold uppercase tracking-widest text-[#64748B]">Access Level</TableHead>
                <TableHead className="px-6 py-5 text-[11px] font-bold uppercase tracking-widest text-[#64748B] text-center">Status</TableHead>
                <TableHead className="px-6 py-5 text-[11px] font-bold uppercase tracking-widest text-[#64748B]">Registration</TableHead>
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
              ) : filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <Shield className="size-12 text-zinc-200 mb-4" />
                      <p className="text-[#64748B] font-bold uppercase text-[11px] tracking-widest">No users found in database</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((u) => (
                  <TableRow key={u.id} className="border-zinc-50 hover:bg-zinc-50/30 transition-colors group">
                    <TableCell className="px-6 py-5 text-[13px] font-medium text-[#1E293B]">
                      #{u.id}
                    </TableCell>
                    <TableCell className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-zinc-100 flex items-center justify-center text-[#64748B] font-bold text-xs shadow-sm border border-zinc-200/50">
                          {u.fullName.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex flex-col">
                          <p className="font-bold text-[14.5px] text-[#1E293B] uppercase tracking-tight">{u.fullName}</p>
                          <p className="text-[12px] text-[#64748B] font-medium">{u.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-5">
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[#605DFF]/5 text-[#605DFF] text-[11px] font-bold uppercase tracking-widest border border-[#605DFF]/10">
                        <Shield className="size-3" />
                        {u.role?.name || "No Role"}
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-5 text-center">
                      <span className={`px-3 py-1 rounded-md text-[11px] font-bold uppercase tracking-widest inline-flex items-center gap-1.5 ${
                        u.isActive ? "bg-emerald-100 text-emerald-700" : "bg-zinc-100 text-zinc-400"
                      }`}>
                        {u.isActive ? <UserCheck className="size-3" /> : <UserX className="size-3" />}
                        {u.isActive ? "Active" : "Disabled"}
                      </span>
                    </TableCell>
                    <TableCell className="px-6 py-5">
                      <p className="text-[12px] font-semibold text-[#1E293B]">
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "-"}
                      </p>
                      <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">Date Joined</p>
                    </TableCell>
                    <TableCell className="px-6 py-5 text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => openEditModal(u)} 
                          className="h-8 w-8 p-0 text-[#64748B] hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                        >
                          <Edit className="size-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => openDeleteModal(u)} 
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
        <DialogContent className="sm:max-w-[500px] bg-white border-zinc-100 p-0 overflow-hidden">
          <div className="p-6 border-b border-zinc-100">
            <DialogTitle className="text-xl font-bold">
              {isEditOpen ? "Update Staff Profile" : "Register New Staff Member"}
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground mt-1">
              {isEditOpen ? "Modify account details and access permissions." : "Create a new administrative or kitchen account for your staff."}
            </DialogDescription>
          </div>
          
          <div className="p-6 grid grid-cols-2 gap-5">
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
                className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-lg outline-none focus:border-[#605DFF]/30 transition-all text-[15px] font-medium appearance-none"
              >
                <option value={0}>Select a role...</option>
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>{r.name.toUpperCase()}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-[#1E293B]">
                {isEditOpen ? "Update Password" : "Account Password *"}
              </label>
              <div className="relative group">
                <Lock className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="password"
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  placeholder={isEditOpen ? "Leave blank to keep current" : "Min. 6 characters"}
                  className="w-full pl-10 pr-4 py-3 bg-white border border-zinc-200 rounded-lg outline-none focus:border-[#605DFF]/30 focus:ring-4 focus:ring-[#605DFF]/5 transition-all text-[15px] font-medium"
                />
              </div>
            </div>

            {isEditOpen && (
              <div className="col-span-2 pt-2">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-zinc-50 border border-zinc-100">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formIsActive}
                    onChange={(e) => setFormIsActive(e.target.checked)}
                    className="size-4 rounded accent-[#605DFF]"
                  />
                  <label htmlFor="isActive" className="text-sm font-bold text-[#1E293B] cursor-pointer">
                    Account is Active (Grant access to system)
                  </label>
                </div>
              </div>
            )}
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

      {/* DELETE MODAL */}
      <Dialog open={isDeleteOpen} onOpenChange={(open) => { if(!open) setIsDeleteOpen(false); }}>
        <DialogContent className="sm:max-w-[420px] bg-white border-zinc-100">
          <DialogTitle className="sr-only">Delete Staff Account</DialogTitle>
          <div className="p-6 flex flex-col items-center text-center pt-10">
            <div className="w-16 h-16 rounded-full bg-rose-50 flex items-center justify-center mb-4 border border-rose-100">
              <Trash2 className="size-8 text-rose-600" />
            </div>
            <h3 className="text-xl font-bold text-[#1E293B] mb-2">Remove Staff Account?</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Are you sure you want to remove <span className="font-bold text-[#1E293B]">"{selectedUser?.fullName}"</span> from the system? 
              They will lose all access immediately.
            </p>
          </div>
          <DialogFooter className="p-6 pt-0 gap-3">
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)} className="rounded-lg font-bold px-6 h-11 flex-1" disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleDelete} className="bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold border-none px-6 h-11 flex-1" disabled={saving}>
              {saving ? "Deleting..." : "Yes, Remove User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
