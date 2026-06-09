"use client";

import React, { useState, useEffect, useMemo } from "react";
import { cn } from "@/lib/utils";
import { Search, Plus, Edit, Trash2, DoorOpen, Eye, LayoutGrid, RefreshCw } from "lucide-react";
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
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { roomApi, Room } from "@/lib/api/roomApi";
import { useToast } from "@/components/ui/toast";
import { usePermissions } from "@/context/PermissionContext";
import {
  dashboardPageClass,
  dashboardPageStyle,
  pageHeaderTitleClass,
  pageHeaderSubtitleClass,
  actionBtnView,
  actionBtnEdit,
  actionBtnDelete,
  dashboardTableHeaderClass,
  dashboardTableHeadRowClass,
  dashboardTableHeadClass,
  dashboardTableBodyRowClass,
  dashboardTableCellClass,
  dashboardStatusBadgeClass,
  getTableStatusBadgeClass,
  btnCreatePage,
} from "@/lib/dashboard-ui";

export default function RoomsPage() {
  const { showToast } = useToast();
  const { canAdd: checkAdd, canEdit: checkEdit, canDelete: checkDelete } = usePermissions();
  const canAdd = checkAdd("/rooms");
  const canEdit = checkEdit("/rooms");
  const canDelete = checkDelete("/rooms");

  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [tablesFilter, setTablesFilter] = useState("all");

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selected, setSelected] = useState<Room | null>(null);

  const [formName, setFormName] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formActive, setFormActive] = useState(true);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const data = await roomApi.getAllRooms();
      setRooms(data || []);
    } catch (err) {
      console.error("Failed to fetch rooms", err);
      showToast("Failed to load rooms", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  const filtered = useMemo(() => {
    return rooms.filter((r) => {
      const matchesSearch =
        r.name.toLowerCase().includes(search.toLowerCase()) ||
        (r.description || "").toLowerCase().includes(search.toLowerCase());

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && r.isActive) ||
        (statusFilter === "inactive" && !r.isActive);

      const tableCount = r._count?.table ?? 0;
      const matchesTables =
        tablesFilter === "all" ||
        (tablesFilter === "with_tables" && tableCount > 0) ||
        (tablesFilter === "empty" && tableCount === 0);

      return matchesSearch && matchesStatus && matchesTables;
    });
  }, [rooms, search, statusFilter, tablesFilter]);

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage, pageSize]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, pageSize, statusFilter, tablesFilter]);

  const openAddModal = () => {
    setFormName("");
    setFormDesc("");
    setFormActive(true);
    setIsAddOpen(true);
  };

  const openEditModal = (room: Room) => {
    setSelected(room);
    setFormName(room.name);
    setFormDesc(room.description || "");
    setFormActive(room.isActive);
    setIsEditOpen(true);
  };

  const openDeleteModal = (room: Room) => {
    setSelected(room);
    setIsDeleteOpen(true);
  };

  const openViewModal = (room: Room) => {
    setSelected(room);
    setIsViewOpen(true);
  };

  const handleSave = async () => {
    if (!formName.trim()) {
      showToast("Room name is required", "error");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: formName.trim(),
        description: formDesc.trim() || undefined,
        isActive: formActive,
      };
      if (isEditOpen && selected) {
        await roomApi.updateRoom(selected.id, payload);
        showToast("Room updated successfully", "success");
      } else {
        await roomApi.createRoom(payload);
        showToast("Room created successfully", "success");
      }
      setIsAddOpen(false);
      setIsEditOpen(false);
      fetchRooms();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Failed to save room";
      showToast(message, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await roomApi.deleteRoom(selected.id);
      showToast("Room deleted successfully", "success");
      setIsDeleteOpen(false);
      fetchRooms();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Failed to delete room";
      showToast(message, "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={dashboardPageClass} style={dashboardPageStyle}>
      {/* Page Header */}
      <div className="mb-6 px-4">
        <h1 className={pageHeaderTitleClass}>Rooms & Halls</h1>
        <p className={pageHeaderSubtitleClass}>
          Manage dining halls and rooms — assign tables to rooms when creating tables.
        </p>
      </div>

      {/* Main Container */}
      <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
        {/* Controls Row */}
        <div className="px-8 py-4 flex flex-wrap items-center gap-6 border-b border-zinc-50">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-[13px] text-zinc-400 font-normal shrink-0">
              <span>Show</span>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="w-16 h-[42px] px-2 border border-zinc-200 rounded-md outline-none focus:border-primary transition-colors bg-white cursor-pointer text-sm font-normal text-zinc-600"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>

            <div className="flex items-center gap-2 text-[13px] text-zinc-400 font-normal shrink-0">
              <span>Filter Status</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-36 h-[42px] px-3 border border-zinc-200 rounded-md outline-none focus:border-primary transition-colors bg-white cursor-pointer text-sm font-normal text-zinc-600"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <div className="flex items-center gap-2 text-[13px] text-zinc-400 font-normal shrink-0">
              <span>Filter Tables</span>
              <select
                value={tablesFilter}
                onChange={(e) => setTablesFilter(e.target.value)}
                className="w-40 h-[42px] px-3 border border-zinc-200 rounded-md outline-none focus:border-primary transition-colors bg-white cursor-pointer text-sm font-normal text-zinc-600"
              >
                <option value="all">All Rooms</option>
                <option value="with_tables">With Tables</option>
                <option value="empty">No Tables</option>
              </select>
            </div>
          </div>

          <div className="flex-1" />

          <div className="flex items-center gap-3">
            <div className="relative w-64 group">
              <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-primary transition-colors" />
              <input
                type="text"
                placeholder="Search rooms..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-[42px] pl-10 pr-4 bg-zinc-50 border border-zinc-200 rounded-md outline-none focus:border-primary focus:ring-1 focus:ring-primary/10 transition-all text-sm font-normal text-zinc-600"
              />
            </div>

            {canAdd && (
              <Button onClick={openAddModal} className={btnCreatePage}>
                <Plus className="size-4" />
                Add Room
              </Button>
            )}
          </div>
        </div>

        {/* Table - Flush to sides */}
        <div className="border-t border-zinc-100 overflow-hidden bg-white">
          <div className="overflow-x-auto">
            <Table className="w-full">
              <TableHeader className={dashboardTableHeaderClass}>
                <TableRow className={dashboardTableHeadRowClass}>
                  <TableHead className={cn(dashboardTableHeadClass, "text-left")}>Room No</TableHead>
                  <TableHead className={cn(dashboardTableHeadClass, "text-left")}>Name</TableHead>
                  <TableHead className={cn(dashboardTableHeadClass, "text-left")}>Description</TableHead>
                  <TableHead className={cn(dashboardTableHeadClass, "text-left")}>Tables</TableHead>
                  <TableHead className={cn(dashboardTableHeadClass, "text-right")}>Status</TableHead>
                  <TableHead className={cn(dashboardTableHeadClass, "text-right")}>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <TableRow key={i} className="h-14 animate-pulse">
                      {[...Array(6)].map((_, j) => (
                        <TableCell key={j} className="px-6 py-4">
                          <div className="h-4 bg-zinc-100 rounded w-full" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : paginated.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="px-6 py-10 text-center text-zinc-500">
                      No rooms found
                    </TableCell>
                  </TableRow>
                ) : (
                  paginated.map((room) => (
                    <TableRow key={room.id} className={dashboardTableBodyRowClass}>
                      <TableCell className={dashboardTableCellClass}>
                        <span className="text-[13px] font-bold text-primary">{room.id}</span>
                      </TableCell>
                      <TableCell className={dashboardTableCellClass}>
                        <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-zinc-700">
                          <DoorOpen className="size-3.5 text-primary shrink-0" />
                          {room.name}
                        </span>
                      </TableCell>
                      <TableCell className={dashboardTableCellClass}>
                        <span
                          className="text-[13px] text-zinc-600 line-clamp-2 max-w-[220px]"
                          title={room.description || undefined}
                        >
                          {room.description || "—"}
                        </span>
                      </TableCell>
                      <TableCell className={dashboardTableCellClass}>
                        <span className="text-[13px] font-medium text-zinc-600">
                          {room._count?.table ?? 0}
                        </span>
                      </TableCell>
                      <TableCell className={cn(dashboardTableCellClass, "text-right")}>
                        <span
                          className={cn(
                            dashboardStatusBadgeClass,
                            getTableStatusBadgeClass(room.isActive ? "active" : "inactive")
                          )}
                        >
                          {room.isActive ? "Active" : "Inactive"}
                        </span>
                      </TableCell>
                      <TableCell className={cn(dashboardTableCellClass, "text-right")}>
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openViewModal(room)}
                            className={actionBtnView}
                          >
                            <Eye className="size-4" />
                          </Button>
                          {canEdit && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditModal(room)}
                              className={actionBtnEdit}
                            >
                              <Edit className="size-4" />
                            </Button>
                          )}
                          {canDelete && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openDeleteModal(room)}
                              className={actionBtnDelete}
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Pagination Footer */}
        <div className="py-2 px-8 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs text-zinc-400 border-t border-zinc-100 bg-zinc-50/30">
          <div>
            {Math.min(filtered.length, (currentPage - 1) * pageSize + 1)}-
            {Math.min(filtered.length, currentPage * pageSize)} of {filtered.length}
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-2 py-1 border border-zinc-200 rounded-md hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              &lt;
            </button>
            <div className="px-3 py-1 border border-zinc-200 rounded-md text-zinc-400">
              {currentPage} of {totalPages || 1}
            </div>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages || totalPages === 0}
              className="px-2 py-1 border border-zinc-200 rounded-md hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              &gt;
            </button>
          </div>
        </div>
      </div>

      {/* ADD / EDIT MODAL */}
      <Dialog
        open={isAddOpen || isEditOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsAddOpen(false);
            setIsEditOpen(false);
          }
        }}
      >
        <DialogContent className="sm:max-w-[640px] bg-white border-zinc-100 p-0 overflow-hidden">
          <DialogTitle className="sr-only">Room Form</DialogTitle>
          <div className="p-6 border-b border-zinc-100">
            <DialogTitle className="text-xl font-bold text-[#1e293b]">
              {isEditOpen ? "Update Room" : "Add New Room"}
            </DialogTitle>
            <DialogDescription className="text-sm text-zinc-500 mt-1">
              {isEditOpen
                ? "Modify hall or room details and availability."
                : "Create a new hall or room for table assignment."}
            </DialogDescription>
          </div>

          <div className="p-8 grid grid-cols-2 gap-x-8 gap-y-6">
            <div className="col-span-2 space-y-2">
              <label className="text-sm font-bold text-[#1E293B]">Room Name *</label>
              <input
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g. VIP Room, Main Hall"
                className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-lg outline-none focus:border-primary/30 focus:ring-4 focus:ring-primary/5 transition-all text-[15px] font-medium"
              />
            </div>

            <div className="col-span-2 space-y-2">
              <label className="text-sm font-bold text-[#1E293B]">Description</label>
              <textarea
                value={formDesc}
                onChange={(e) => setFormDesc(e.target.value)}
                placeholder="Optional description for this room or hall"
                rows={3}
                className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-lg outline-none focus:border-primary/30 focus:ring-4 focus:ring-primary/5 transition-all text-[15px] font-medium resize-none"
              />
            </div>

            <div className="col-span-2 space-y-2">
              <label className="text-sm font-bold text-[#1E293B]">Room Status</label>
              <select
                value={formActive ? "active" : "inactive"}
                onChange={(e) => setFormActive(e.target.value === "active")}
                className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-lg outline-none focus:border-primary/30 transition-all text-[15px] font-medium appearance-none cursor-pointer"
              >
                <option value="active">Active (Available for tables)</option>
                <option value="inactive">Inactive (Hidden from assignment)</option>
              </select>
            </div>
          </div>

          <DialogFooter className="p-6 bg-zinc-50/50 border-t border-zinc-100 gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setIsAddOpen(false);
                setIsEditOpen(false);
              }}
              className="rounded-md font-bold px-6 h-11"
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              className="bg-primary !text-white hover:bg-primary/90 hover:!text-white rounded-md font-bold border-none px-8 h-11 shadow-lg shadow-primary/20"
              disabled={saving}
            >
              {saving ? "Processing..." : isEditOpen ? "Update Room" : "Create Room"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* VIEW MODAL */}
      <Dialog
        open={isViewOpen}
        onOpenChange={(open) => {
          if (!open) setIsViewOpen(false);
        }}
      >
        <DialogContent className="sm:max-w-[500px] bg-white border-zinc-100 p-0 overflow-hidden rounded-2xl">
          <DialogTitle className="sr-only">Room Details</DialogTitle>
          <div className="p-8">
            <div className="flex justify-between items-start mb-8">
              <div>
                <h3 className="text-2xl font-bold text-[#1E293B]">{selected?.name}</h3>
                <p className="text-sm font-medium text-primary mt-1 uppercase tracking-wider">
                  {selected?._count?.table ?? 0} Tables Assigned
                </p>
              </div>
              <span
                className={cn(
                  dashboardStatusBadgeClass,
                  getTableStatusBadgeClass(selected?.isActive ? "active" : "inactive")
                )}
              >
                {selected?.isActive ? "Active" : "Inactive"}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-100 flex items-center gap-3 group hover:border-primary/30 transition-colors">
                <div className="size-9 rounded-lg bg-white flex items-center justify-center shadow-sm group-hover:text-primary shrink-0">
                  <DoorOpen className="size-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
                    Description
                  </p>
                  <p className="text-sm font-medium text-zinc-700">
                    {selected?.description || "No description provided"}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-100 flex items-center gap-3">
                  <div className="size-9 rounded-lg bg-white flex items-center justify-center shadow-sm text-zinc-400 shrink-0">
                    <LayoutGrid className="size-4" />
                  </div>
                  <div>
                    <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
                      Tables
                    </p>
                    <p className="text-sm font-medium text-zinc-700">
                      {selected?._count?.table ?? 0} assigned
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-100 flex items-center gap-3">
                  <div className="size-9 rounded-lg bg-white flex items-center justify-center shadow-sm text-zinc-400 shrink-0">
                    <RefreshCw className="size-4" />
                  </div>
                  <div>
                    <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
                      Created At
                    </p>
                    <p className="text-sm font-medium text-zinc-700">
                      {selected?.createdAt
                        ? new Date(selected.createdAt).toLocaleDateString()
                        : "N/A"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 flex items-center gap-4">
                <div className="size-10 rounded-lg bg-white flex items-center justify-center shadow-sm text-primary">
                  <DoorOpen className="size-5" />
                </div>
                <div>
                  <p className="text-[11px] text-primary font-bold uppercase tracking-wider">
                    Table Assignment
                  </p>
                  <p className="text-sm font-medium text-[#1E293B]">
                    {selected?.isActive
                      ? "Available when creating new tables"
                      : "Not available for new table assignment"}
                  </p>
                </div>
              </div>
            </div>

            <DialogFooter className="mt-8 pt-6 border-t border-zinc-100">
              <Button
                onClick={() => setIsViewOpen(false)}
                className="w-full bg-primary !text-white hover:bg-primary/90 hover:!text-white rounded-md font-bold border-none h-12 shadow-lg shadow-primary/20"
              >
                Done
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* DELETE MODAL */}
      <Dialog
        open={isDeleteOpen}
        onOpenChange={(open) => {
          if (!open) setIsDeleteOpen(false);
        }}
      >
        <DialogContent className="sm:max-w-[500px] bg-white border-zinc-100 p-0 overflow-hidden">
          <DialogTitle className="sr-only">Delete Confirmation</DialogTitle>
          <div className="p-8 flex items-start gap-6">
            <div className="w-14 h-14 shrink-0 rounded-full bg-rose-50 flex items-center justify-center border border-rose-100">
              <Trash2 className="size-6 text-rose-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-[#1E293B] mb-2">Delete Room?</h3>
              <p className="text-sm text-zinc-500 leading-relaxed">
                Are you sure you want to delete{" "}
                <span className="font-bold text-[#1E293B]">&quot;{selected?.name}&quot;</span>?
                Rooms with assigned tables cannot be deleted.
              </p>
            </div>
          </div>
          <DialogFooter className="p-6 bg-zinc-50/50 border-t border-zinc-100 gap-3">
            <Button
              variant="outline"
              onClick={() => setIsDeleteOpen(false)}
              className="rounded-md font-bold px-6 h-11"
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDelete}
              className="bg-rose-600 hover:bg-rose-700 !text-white hover:!text-white rounded-md font-bold border-none px-8 h-11 shadow-lg shadow-rose-600/10"
              disabled={saving}
            >
              {saving ? "Deleting..." : "Yes, Delete Room"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
