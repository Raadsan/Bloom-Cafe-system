"use client";

import React, { useState, useEffect } from "react";
import { Plus, Search, Edit, Trash2, Tag, UtensilsCrossed, Eye, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { categoryApi, Category, CategoryWithItems } from "@/lib/api/categoryApi";
import { useToast } from "@/components/ui/toast";
import { usePermissions } from "@/context/PermissionContext";

export default function MenuCategoriesPage() {
  const { showToast } = useToast();
  const { canAdd: checkAdd, canEdit: checkEdit, canDelete: checkDelete } = usePermissions();
  const canAdd = checkAdd("/menu/categories");
  const canEdit = checkEdit("/menu/categories");
  const canDelete = checkDelete("/menu/categories");
  const [categories, setCategories] = useState<CategoryWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Modal states
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selected, setSelected] = useState<CategoryWithItems | null>(null);

  // Form state
  const [formName, setFormName] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchCategories = async () => {
    try {
      const data = await categoryApi.getCategoriesWithItems();
      setCategories(data || []);
    } catch (err) {
      console.error("Failed to fetch categories", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCategories(); }, []);

  const filtered = categories.filter(c =>
    search === "" || c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.description || "").toLowerCase().includes(search.toLowerCase())
  );

  const openAdd = () => {
    setFormName("");
    setFormDesc("");
    setIsAddOpen(true);
  };

  const openEdit = (cat: CategoryWithItems) => {
    setSelected(cat);
    setFormName(cat.name);
    setFormDesc(cat.description || "");
    setIsEditOpen(true);
  };

  const openDelete = (cat: CategoryWithItems) => {
    setSelected(cat);
    setIsDeleteOpen(true);
  };

  const openView = (cat: CategoryWithItems) => {
    setSelected(cat);
    setIsViewOpen(true);
  };

  const handleSave = async () => {
    if (!formName.trim()) return showToast("Category name is required", "error");
    setSaving(true);
    try {
      if (isEditOpen && selected) {
        await categoryApi.updateCategory(selected.id, { name: formName.trim(), description: formDesc.trim() });
        showToast("Category updated successfully", "success");
      } else {
        await categoryApi.createCategory({ name: formName.trim(), description: formDesc.trim() });
        showToast("Category created successfully", "success");
      }
      await fetchCategories();
      setIsAddOpen(false);
      setIsEditOpen(false);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || "Failed to save category";
      showToast(msg, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selected) return;
    setDeleting(true);
    try {
      await categoryApi.deleteCategory(selected.id);
      showToast("Category deleted successfully", "success");
      await fetchCategories();
      setIsDeleteOpen(false);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || "Failed to delete category";
      showToast(msg, "error");
    } finally {
      setDeleting(false);
    }
  };

  const totalItems = categories.reduce((sum, c) => sum + (c.menuitem?.length || 0), 0);
  const availableItems = categories.reduce((sum, c) => sum + (c.menuitem?.filter(i => i.isAvailable).length || 0), 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground uppercase">Menu Categories</h1>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-3">
            Organise your menu by creating and managing categories.
          </p>
        </div>
      </div>

      {/* Main Container Card */}
      <div className="trezo-card overflow-hidden">
        {/* Header/Filters inside card */}
        <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-zinc-50/10 border-b border-zinc-100">
          <div>
            <h3 className="text-sm font-bold text-foreground">All Categories</h3>
            <p className="text-[12px] font-medium text-muted-foreground mt-1">{filtered.length} categor{filtered.length !== 1 ? "ies" : "y"}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative group w-full md:w-64">
              <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search categories..."
                className="w-full pl-10 pr-4 py-2.5 text-[14px] font-medium bg-white border border-zinc-100 rounded-lg outline-none focus:border-[#605DFF]/30 focus:ring-4 focus:ring-[#605DFF]/5 transition-all shadow-sm"
              />
            </div>
            {canAdd && (
              <Button onClick={openAdd} size="sm" className="h-[42px] px-5 rounded-lg bg-[#605DFF] text-white hover:bg-[#4E4BCB] font-bold border-none shadow-md whitespace-nowrap">
                <Plus className="mr-2 size-4" /> Add Category
              </Button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-zinc-50/50">
              <TableRow className="border-zinc-100 hover:bg-transparent">
                <TableHead className="px-6 py-5 text-[11px] font-bold uppercase tracking-widest text-[#64748B]">#</TableHead>
                <TableHead className="px-6 py-5 text-[11px] font-bold uppercase tracking-widest text-[#64748B]">Category Name</TableHead>
                <TableHead className="px-6 py-5 text-[11px] font-bold uppercase tracking-widest text-[#64748B]">Description</TableHead>
                <TableHead className="px-6 py-5 text-[11px] font-bold uppercase tracking-widest text-[#64748B] text-center">Total Items</TableHead>
                <TableHead className="px-6 py-5 text-[11px] font-bold uppercase tracking-widest text-[#64748B] text-center">Available</TableHead>
                <TableHead className="px-6 py-5 text-right text-[11px] font-bold uppercase tracking-widest text-[#64748B]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i} className="h-14 animate-pulse bg-muted/10">
                    <TableCell colSpan={6} />
                  </TableRow>
                ))
              ) : filtered.length > 0 ? (
                filtered.map((cat, idx) => {
                  const itemCount = cat.menuitem?.length || 0;
                  const availCount = cat.menuitem?.filter(i => i.isAvailable).length || 0;
                  return (
                    <TableRow key={cat.id} className="border-zinc-50 hover:bg-zinc-50/40 transition-colors">
                      <TableCell className="px-6 py-4 text-[13px] font-medium text-muted-foreground">{idx + 1}</TableCell>
                      <TableCell className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-[#605DFF]/10 flex items-center justify-center shrink-0">
                            <Tag className="size-4 text-[#605DFF]" />
                          </div>
                          <span className="text-[13px] font-bold text-[#1E293B]">{cat.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-4 text-[13px] text-[#64748B] max-w-[220px] truncate">
                        {cat.description || <span className="text-zinc-300 italic">No description</span>}
                      </TableCell>
                      <TableCell className="px-6 py-4 text-center">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-zinc-100 text-[13px] font-bold text-zinc-600">
                          {itemCount}
                        </span>
                      </TableCell>
                      <TableCell className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-[13px] font-bold ${availCount > 0 ? "bg-emerald-100 text-emerald-700" : "bg-zinc-100 text-zinc-400"}`}>
                          {availCount}
                        </span>
                      </TableCell>
                      <TableCell className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm" onClick={() => openView(cat)} className="h-8 w-8 p-0 text-[#64748B] hover:text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors" title="View items">
                            <Eye className="size-4" />
                          </Button>
                          {canEdit && (
                            <Button variant="ghost" size="sm" onClick={() => openEdit(cat)} className="h-8 w-8 p-0 text-[#64748B] hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors" title="Edit">
                              <Edit className="size-4" />
                            </Button>
                          )}
                          {canDelete && (
                            <Button variant="ghost" size="sm" onClick={() => openDelete(cat)} className="h-8 w-8 p-0 text-[#64748B] hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors" title="Delete">
                              <Trash2 className="size-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="px-6 py-24 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <Tag className="size-12 text-zinc-200" />
                      <p className="text-[#64748B] font-bold uppercase text-[11px] tracking-widest">No categories found</p>
                      <p className="text-muted-foreground text-sm">Create your first category using the button above</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* ADD / EDIT MODAL */}
      <Dialog open={isAddOpen || isEditOpen} onOpenChange={(open) => { if(!open) { setIsAddOpen(false); setIsEditOpen(false); } }}>
        <DialogContent className="sm:max-w-[500px] bg-white border-zinc-100">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              {isEditOpen ? "Edit Category" : "Add New Category"}
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              {isEditOpen ? "Update the category details below." : "Fill in the details to create a new menu category."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-5 py-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-[#1E293B]">Category Name *</label>
              <input
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g. Appetizers, Main Course, Desserts..."
                className="w-full px-4 py-3 border border-zinc-200 rounded-lg text-[15px] focus:outline-none focus:ring-2 focus:ring-[#605DFF]/20"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-[#1E293B]">Description <span className="font-normal text-muted-foreground">(optional)</span></label>
              <textarea
                value={formDesc}
                onChange={(e) => setFormDesc(e.target.value)}
                placeholder="Brief description of this category..."
                rows={3}
                className="w-full px-4 py-3 border border-zinc-200 rounded-lg text-[15px] focus:outline-none focus:ring-2 focus:ring-[#605DFF]/20 resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsAddOpen(false); setIsEditOpen(false); }} className="rounded-lg font-bold px-6 h-11" disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSave} className="bg-[#605DFF] hover:bg-[#4E4BCB] text-white rounded-lg font-bold border-none px-8 h-11" disabled={saving}>
              {saving ? "Saving..." : isEditOpen ? "Update Category" : "Create Category"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DELETE MODAL */}
      <Dialog open={isDeleteOpen} onOpenChange={(open) => { if(!open) setIsDeleteOpen(false); }}>
        <DialogContent
          className="sm:max-w-[440px] bg-white border-zinc-100"
        >
          <DialogTitle className="sr-only">Delete Category</DialogTitle>
          <div className="p-6 flex flex-col items-center text-center pt-10">
            <div className="w-16 h-16 rounded-full bg-rose-100 flex items-center justify-center mb-4">
              <Trash2 className="size-8 text-rose-600" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">Delete Category?</h3>
            <p className="text-sm text-muted-foreground">
              Are you sure you want to delete{" "}
              <span className="font-bold text-foreground">"{selected?.name}"</span>?
              {(selected?.menuitem?.length || 0) > 0 && (
                <span className="block mt-2 text-rose-600 font-medium">
                  ⚠️ This category has {selected?.menuitem?.length} menu item{(selected?.menuitem?.length || 0) !== 1 ? "s" : ""}. You must remove them first.
                </span>
              )}
            </p>
          </div>
          <div className="p-4 bg-zinc-50 border-t border-zinc-100 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)} className="rounded-lg font-bold border-zinc-200 px-6 h-11" disabled={deleting}>
              Cancel
            </Button>
            <Button onClick={handleDelete} className="bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold border-none shadow-sm px-6 h-11" disabled={deleting || (selected?.menuitem?.length || 0) > 0}>
              {deleting ? "Deleting..." : "Yes, Delete"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* VIEW ITEMS MODAL */}
      <Dialog open={isViewOpen} onOpenChange={() => {}}>
        <DialogContent
          className="sm:max-w-[560px] bg-white border-zinc-100 p-0 overflow-hidden"
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <DialogTitle className="sr-only">Category Items</DialogTitle>
          {selected && (
            <>
              <div className="p-6 bg-zinc-50/50 border-b border-zinc-100 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-foreground">{selected.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{selected.menuitem?.length || 0} menu item{(selected.menuitem?.length || 0) !== 1 ? "s" : ""}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-[#605DFF]/10 flex items-center justify-center">
                  <Tag className="size-6 text-[#605DFF]" />
                </div>
              </div>
              <div className="p-6 space-y-4">
                {selected.description && (
                  <p className="text-sm text-muted-foreground border-b border-zinc-100 pb-4">{selected.description}</p>
                )}
                <div className="max-h-[40vh] overflow-y-auto space-y-2 pr-1">
                  {(selected.menuitem?.length || 0) === 0 ? (
                    <div className="text-center py-8 text-muted-foreground text-sm">No menu items in this category yet.</div>
                  ) : (
                    selected.menuitem?.map((item) => (
                      <div key={item.id} className="flex justify-between items-center py-3 px-4 bg-zinc-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${item.isAvailable ? "bg-emerald-500" : "bg-zinc-300"}`} />
                          <span className="text-[14px] font-medium text-foreground">{item.name}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-[13px] font-bold text-[#605DFF]">${item.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${item.isAvailable ? "bg-emerald-100 text-emerald-700" : "bg-zinc-100 text-zinc-500"}`}>
                            {item.isAvailable ? "Available" : "Unavailable"}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <div className="flex justify-end pt-2">
                  <Button variant="outline" onClick={() => setIsViewOpen(false)} className="rounded-lg font-bold border-zinc-200 px-8 h-11">
                    Close
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
