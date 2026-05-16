"use client";

import React, { useState, useEffect, useMemo } from "react";
import { cn } from "@/lib/utils";
import { Plus, Search, Edit, Trash2, Tag, UtensilsCrossed, Eye, X, RefreshCw, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { categoryApi, Category, CategoryWithItems } from "@/lib/api/categoryApi";
import { useToast } from "@/components/ui/toast";
import { usePermissions } from "@/context/PermissionContext";

export default function MenuCategoriesPage() {
  const { showToast } = useToast();
  const { canAdd: checkAdd, canEdit: checkEdit, canDelete: checkDelete } = usePermissions();
  const canAdd = checkAdd("/categories");
  const canEdit = checkEdit("/categories");
  const canDelete = checkDelete("/categories");
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
  const [formImage, setFormImage] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

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

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage, pageSize]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, pageSize]);

  const openAdd = () => {
    setFormName("");
    setFormDesc("");
    setFormImage("");
    setIsAddOpen(true);
  };

  const openEdit = (cat: CategoryWithItems) => {
    setSelected(cat);
    setFormName(cat.name);
    setFormDesc(cat.description || "");
    setFormImage(cat.imageUrl || "");
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
      const payload = {
        name: formName.trim(),
        description: formDesc.trim(),
        imageUrl: formImage.trim() || undefined
      };

      if (isEditOpen && selected) {
        await categoryApi.updateCategory(selected.id, payload);
        showToast("Category updated successfully", "success");
      } else {
        await categoryApi.createCategory(payload);
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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        return showToast("Image size should be less than 2MB", "error");
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormImage(reader.result as string);
      };
      reader.readAsDataURL(file);
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
  return (
    <div className="animate-in fade-in duration-500 font-sans mx-1 pt-0 pb-8">
      {/* Standard Pro Header: Title and Button on the same row */}
      <div className="mb-8 px-4 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1e293b] uppercase tracking-tight">Categories Management</h1>
          <p className="text-[12px] text-zinc-500 uppercase tracking-wider mt-1 font-medium italic">Organize your food and beverage items into distinct searchable categories.</p>
        </div>
        
        {canAdd && (
          <Button onClick={openAdd} className="h-[42px] px-6 bg-[#605DFF] hover:bg-[#4f4cef] text-white rounded-md flex items-center gap-2 transition-colors font-medium text-sm shadow-md">
            <Plus className="size-4" /> Add Category
          </Button>
        )}
      </div>

      <div className="px-4 min-h-[400px] mt-2">          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl border border-zinc-200 h-64 animate-pulse"></div>
              ))}
            </div>
          ) : paginated.length === 0 ? (
            <div className="py-20 text-center flex flex-col items-center gap-3">
              <div className="size-16 rounded-full bg-zinc-50 flex items-center justify-center border border-zinc-100">
                <Tag className="size-8 text-zinc-200" />
              </div>
              <p className="text-zinc-400 font-medium text-sm">No categories found in your catalog.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {paginated.map((cat) => (
                <div key={cat.id} className="group bg-white rounded-2xl border border-zinc-200 overflow-hidden hover:shadow-xl hover:shadow-[#605DFF]/5 hover:border-[#605DFF]/20 transition-all duration-300 flex flex-col">
                  {/* Category Image Area */}
                  <div className="relative h-44 overflow-hidden bg-zinc-100 border-b border-zinc-100">
                    {cat.imageUrl ? (
                      <img src={cat.imageUrl} alt={cat.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-zinc-300">
                        <ImageIcon className="size-10" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">No Preview</span>
                      </div>
                    )}
                    
                    {/* Status Badge Over Image */}
                    <div className="absolute top-3 right-3">
                      <span className={cn(
                        "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border shadow-sm bg-white/90 backdrop-blur-sm",
                        cat.isActive ? "text-emerald-600 border-emerald-100" : "text-rose-600 border-rose-100"
                      )}>
                        {cat.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>

                    {/* Simple View Details Trigger - No blue overlay */}
                    <button 
                      onClick={() => openView(cat)}
                      className="absolute inset-0 z-10 w-full h-full bg-transparent"
                    />
                  </div>

                  {/* Category Content */}
                  <div className="p-5 flex-1 flex flex-col">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-[15px] font-bold text-zinc-800 leading-tight group-hover:text-[#605DFF] transition-colors line-clamp-1">{cat.name}</h3>
                      <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-zinc-100 border border-zinc-200">
                        <UtensilsCrossed className="size-3 text-zinc-500" />
                        <span className="text-[11px] font-black text-zinc-600">{cat.menuitem?.length || 0}</span>
                      </div>
                    </div>
                    
                    <p className="text-[12px] text-zinc-500 line-clamp-2 mb-4 h-9 leading-relaxed">
                      {cat.description || "No description provided for this menu category."}
                    </p>

                    <div className="mt-auto pt-4 border-t border-zinc-50 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="size-7 rounded-full bg-[#605DFF]/5 flex items-center justify-center border border-[#605DFF]/10">
                           <RefreshCw className="size-3 text-[#605DFF]" />
                        </div>
                        <div>
                          <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Creator</p>
                          <p className="text-[11px] font-semibold text-zinc-700">Admin System</p>
                        </div>
                      </div>

                      <div className="flex gap-1.5">
                        {canEdit && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => openEdit(cat)}
                            className="size-8 p-0 rounded-lg text-zinc-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          >
                            <Edit className="size-4" />
                          </Button>
                        )}
                        {canDelete && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => openDelete(cat)}
                            className="size-8 p-0 rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>



      {/* ADD / EDIT MODAL */}
      <Dialog open={isAddOpen || isEditOpen} onOpenChange={(open) => { if (!open) { setIsAddOpen(false); setIsEditOpen(false); } }}>
        <DialogContent className="sm:max-w-[640px] bg-white border-zinc-100 p-0 overflow-hidden">
          <DialogTitle className="sr-only">Category Form</DialogTitle>
          <div className="p-6 border-b border-zinc-100">
            <DialogTitle className="text-xl font-bold text-[#1e293b]">
              {isEditOpen ? "Edit Category" : "Add New Category"}
            </DialogTitle>
            <DialogDescription className="text-sm text-zinc-500 mt-1">
              {isEditOpen ? "Update the category details below." : "Fill in the details to create a new menu category."}
            </DialogDescription>
          </div>

          <div className="p-8 space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-[#1E293B]">Category Name *</label>
              <input
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g. Appetizers, Main Course..."
                className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-lg outline-none focus:border-[#605DFF]/30 focus:ring-4 focus:ring-[#605DFF]/5 transition-all text-[15px] font-medium"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-[#1E293B]">Category Image</label>
              <div className="flex flex-col gap-4">
                {formImage && (
                  <div className="relative w-full h-40 rounded-xl overflow-hidden border border-zinc-100 shadow-sm bg-zinc-50 group">
                    <img src={formImage} alt="Preview" className="w-full h-full object-cover" />
                    <button
                      onClick={() => setFormImage("")}
                      className="absolute top-3 right-3 p-2 bg-rose-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-rose-600"
                    >
                      <X className="size-4" />
                    </button>
                  </div>
                )}
                <div className="flex gap-3">
                  <div className="relative flex-1">
                    <Tag className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                    <input
                      type="text"
                      value={formImage}
                      onChange={(e) => setFormImage(e.target.value)}
                      placeholder="Paste image URL here..."
                      className="w-full pl-10 pr-4 py-3 bg-white border border-zinc-200 rounded-lg outline-none focus:border-[#605DFF]/30 focus:ring-4 focus:ring-[#605DFF]/5 transition-all text-[14px] font-medium"
                    />
                  </div>
                  <label className="cursor-pointer shrink-0">
                    <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                    <div className="h-[48px] px-6 rounded-lg bg-[#605DFF]/10 text-[#605DFF] hover:bg-[#605DFF]/20 flex items-center justify-center font-bold text-[13px] transition-colors">
                      Browse
                    </div>
                  </label>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-[#1E293B]">Description</label>
              <textarea
                value={formDesc}
                onChange={(e) => setFormDesc(e.target.value)}
                placeholder="Brief description of the category..."
                rows={3}
                className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-lg outline-none focus:border-[#605DFF]/30 focus:ring-4 focus:ring-[#605DFF]/5 transition-all text-[15px] font-medium resize-none"
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
      <Dialog open={isDeleteOpen} onOpenChange={(open) => { if (!open) setIsDeleteOpen(false); }}>
        <DialogContent className="sm:max-w-[500px] bg-white border-zinc-100 p-0 overflow-hidden">
          <DialogTitle className="sr-only">Delete Category Confirmation</DialogTitle>
          <div className="p-8 flex items-start gap-6">
            <div className="w-14 h-14 shrink-0 rounded-full bg-rose-50 flex items-center justify-center border border-rose-100">
              <Trash2 className="size-6 text-rose-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-[#1E293B] mb-2">Delete Category?</h3>
              <p className="text-sm text-zinc-500 leading-relaxed">
                Are you sure you want to delete <span className="font-bold text-[#1E293B]">"{selected?.name}"</span>?
                This will remove the category and may affect items assigned to it.
              </p>
            </div>
          </div>
          <DialogFooter className="p-6 bg-zinc-50/50 border-t border-zinc-100 gap-3">
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)} className="rounded-lg font-bold px-6 h-11" disabled={deleting}>
              Cancel
            </Button>
            <Button onClick={handleDelete} className="bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold border-none px-8 h-11 shadow-lg shadow-rose-600/10" disabled={deleting}>
              {deleting ? "Deleting..." : "Yes, Delete Category"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* VIEW ITEMS MODAL */}
      <Dialog open={isViewOpen} onOpenChange={() => setIsViewOpen(false)}>
        <DialogContent className="sm:max-w-[560px] bg-white border-zinc-100 p-0 overflow-hidden rounded-2xl">
          <DialogTitle className="sr-only">Category Details</DialogTitle>
          {selected && (
            <>
              <div className="p-8 border-b border-zinc-100">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-2xl font-bold text-[#1E293B]">{selected.name}</h3>
                    <p className="text-sm font-medium text-[#605DFF] mt-1 uppercase tracking-wider">
                      {selected.menuitem?.length || 0} Registered Items
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider mb-1">Created At</p>
                    <p className="text-xs font-medium text-zinc-600">
                      {selected.createdAt ? new Date(selected.createdAt).toLocaleDateString() : "N/A"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-8 space-y-6">
                <div>
                  <label className="text-[11px] text-zinc-400 font-bold uppercase tracking-wider mb-3 block">Description</label>
                  <p className="text-sm text-zinc-600 leading-relaxed bg-zinc-50 p-4 rounded-xl border border-zinc-100">
                    {selected.description || "No description provided for this category."}
                  </p>
                </div>

                <div>
                  <label className="text-[11px] text-zinc-400 font-bold uppercase tracking-wider mb-3 block">Items in Category</label>
                  <div className="max-h-[30vh] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                    {selected.menuitem?.length === 0 ? (
                      <p className="text-center py-8 text-zinc-400 italic text-sm">No items assigned to this category yet.</p>
                    ) : (
                      selected.menuitem?.map((item) => (
                        <div key={item.id} className="flex justify-between items-center py-3.5 px-5 bg-zinc-50 hover:bg-zinc-100 transition-colors rounded-xl border border-zinc-100">
                          <span className="text-sm font-semibold text-zinc-700">{item.name}</span>
                          <span className="text-sm font-bold text-[#605DFF]">${item.price.toFixed(2)}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-100 flex items-center gap-3">
                    <RefreshCw className="size-3.5 text-zinc-400" />
                    <div>
                      <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Created</p>
                      <p className="text-xs font-medium text-zinc-700">{selected.createdAt ? new Date(selected.createdAt).toLocaleDateString() : "N/A"}</p>
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-100 flex items-center gap-3">
                    <Eye className="size-3.5 text-zinc-400" />
                    <div>
                      <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Updated</p>
                      <p className="text-xs font-medium text-zinc-700">{selected.updatedAt ? new Date(selected.updatedAt).toLocaleDateString() : "Recently"}</p>
                    </div>
                  </div>
                </div>

                <DialogFooter className="pt-6 border-t border-zinc-100">
                  <Button variant="outline" onClick={() => setIsViewOpen(false)} className="w-full rounded-xl font-bold border-zinc-200 h-12 shadow-sm">
                    Done
                  </Button>
                </DialogFooter>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
