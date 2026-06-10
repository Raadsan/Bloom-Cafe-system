"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  UtensilsCrossed,
  Filter,
  Eye,
  Image as ImageIcon,
  CheckCircle2,
  XCircle,
  MoreVertical,
  ChevronDown,
  X,
  RefreshCw,
  Star
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { menuItemApi, MenuItem, parseMenuItemOptions } from "@/lib/api/menuItemApi";
import { categoryApi, Category } from "@/lib/api/categoryApi";
import { useToast } from "@/components/ui/toast";
import {
  dashboardPageClass,
  dashboardPageStyle,
  pageHeaderTitleClass,
  pageHeaderSubtitleClass,
  pageHeaderWrapperClass,
  actionBtnView,
  actionBtnEdit,
  actionBtnDelete,
  dashboardTableHeaderClass,
  dashboardTableHeadRowClass,
  dashboardTableHeadClass,
  dashboardStatusBadgeClass,
  getTableStatusBadgeClass,
} from "@/lib/dashboard-ui";

export default function MenuPage() {
  const { showToast } = useToast();
  const [items, setItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  // Modal states
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);

  // Form states
  const [formName, setFormName] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formCostPrice, setFormCostPrice] = useState("");
  const [formPrice, setFormPrice] = useState("");
  const [formCategoryId, setFormCategoryId] = useState("");
  const [formIsAvailable, setFormIsAvailable] = useState(true);
  const [formIsRecommended, setFormIsRecommended] = useState(false);
  const [formImageUrl, setFormImageUrl] = useState("");
  const [formTax, setFormTax] = useState("");
  const [formOptions, setFormOptions] = useState("");
  const [saving, setSaving] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [itemsData, catsData] = await Promise.all([
        menuItemApi.getAllMenuItems(),
        categoryApi.getAllCategories()
      ]);
      setItems(itemsData || []);
      setCategories(catsData || []);
    } catch (err) {
      console.error("Failed to fetch menu data", err);
      showToast("Failed to load menu items", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase()) ||
        (item.description || "").toLowerCase().includes(search.toLowerCase());
      const matchesCategory = categoryFilter === "all" || String(item.categoryId) === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [items, search, categoryFilter]);

  const totalPages = Math.ceil(filteredItems.length / pageSize);
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredItems.slice(start, start + pageSize);
  }, [filteredItems, currentPage, pageSize]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, categoryFilter, pageSize]);

  const stats = useMemo(() => {
    const total = items.length;
    const available = items.filter(i => i.isAvailable).length;
    const outOfStock = total - available;
    return { total, available, outOfStock };
  }, [items]);

  const openAddModal = () => {
    setFormName("");
    setFormDesc("");
    setFormCostPrice("");
    setFormPrice("");
    setFormCategoryId("");
    setFormIsAvailable(true);
    setFormIsRecommended(false);
    setFormImageUrl("");
    setFormTax("0");
    setFormOptions("");
    setIsAddOpen(true);
  };

  const openEditModal = (item: MenuItem) => {
    setSelectedItem(item);
    setFormName(item.name);
    setFormDesc(item.description || "");
    setFormCostPrice(String(item.costPrice || ""));
    setFormPrice(String(item.price));
    setFormCategoryId(String(item.categoryId));
    setFormIsAvailable(item.isAvailable);
    setFormIsRecommended(item.isRecommended || false);
    setFormImageUrl(item.imageUrl || "");
    setFormTax(String(item.tax || 0));
    setFormOptions(parseMenuItemOptions(item).join(", "));
    setIsEditOpen(true);
  };

  const openDeleteModal = (item: MenuItem) => {
    setSelectedItem(item);
    setIsDeleteOpen(true);
  };

  const openViewModal = (item: MenuItem) => {
    setSelectedItem(item);
    setIsViewOpen(true);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        return showToast("Image size should be less than 2MB", "error");
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormImageUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!formName.trim()) return showToast("Item name is required", "error");
    if (!formPrice || isNaN(Number(formPrice))) return showToast("Valid price is required", "error");
    if (!formCategoryId) return showToast("Please select a category", "error");

    setSaving(true);
    try {
      const payload = {
        name: formName.trim(),
        description: formDesc.trim() || undefined,
        costPrice: formCostPrice ? Number(formCostPrice) : undefined,
        price: Number(formPrice),
        tax: Number(formTax || 0),
        categoryId: Number(formCategoryId),
        isAvailable: formIsAvailable,
        isRecommended: formIsRecommended,
        imageUrl: formImageUrl.trim() || undefined,
        options: formOptions.trim()
          ? formOptions.split(",").map(s => s.trim()).filter(Boolean)
          : null,
      };

      if (isEditOpen && selectedItem) {
        await menuItemApi.updateMenuItem(selectedItem.id, payload);
        showToast("Menu item updated successfully", "success");
      } else {
        await menuItemApi.createMenuItem(payload);
        showToast("Menu item created successfully", "success");
      }

      await fetchData();
      setIsAddOpen(false);
      setIsEditOpen(false);
    } catch (err: any) {
      const msg = err.response?.data?.message || "Failed to save menu item";
      showToast(msg, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedItem) return;
    try {
      await menuItemApi.deleteMenuItem(selectedItem.id);
      showToast("Menu item deleted", "success");
      await fetchData();
      setIsDeleteOpen(false);
    } catch (err: any) {
      showToast("Failed to delete item", "error");
    }
  };

  return (
    <div className={dashboardPageClass} style={dashboardPageStyle}>
      {/* Page Header: Outside the box */}
      <div className={pageHeaderWrapperClass}>
        <h1 className={pageHeaderTitleClass}>Menu Management</h1>
        <p className={pageHeaderSubtitleClass}>Manage your restaurant menu items, categories, and availability in one place.</p>
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
                className="w-16 h-[42px] px-2 border border-zinc-200 rounded-md outline-none focus:border-primary transition-colors bg-white cursor-pointer text-sm font-normal text-zinc-600"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>

            <div className="flex items-center gap-2 text-[13px] text-zinc-400 font-normal shrink-0">
              <span>Filter Category</span>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-40 h-[42px] px-3 border border-zinc-200 rounded-md outline-none focus:border-primary transition-colors bg-white cursor-pointer text-sm font-normal text-zinc-600"
              >
                <option value="all">All Categories</option>
                {categories.map(c => (
                  <option key={c.id} value={String(c.id)}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex-1"></div>

          <div className="flex items-center gap-3">
            <div className="relative w-64 group">
              <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-primary transition-colors" />
              <input
                type="text"
                placeholder="Search menu..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-[42px] pl-10 pr-4 bg-zinc-50 border border-zinc-200 rounded-md outline-none focus:border-primary focus:ring-1 focus:ring-primary/10 transition-all text-sm font-normal text-zinc-600"
              />
            </div>

            <Button
              onClick={openAddModal}
              className="h-[42px] px-6 bg-primary !text-white hover:bg-primary/90 hover:!text-white rounded-md flex items-center gap-2 transition-colors font-medium text-sm shadow-sm"
            >
              <Plus className="size-4" />
              Add Menu Item
            </Button>
          </div>
        </div>

        {/* Table - Flush to sides */}
        <div className="border-t border-zinc-100 overflow-hidden bg-white">
          <div className="overflow-x-auto">
            <Table className="w-full">
              <TableHeader className={dashboardTableHeaderClass}>
                <TableRow className={dashboardTableHeadRowClass}>
                  <TableHead className={cn(dashboardTableHeadClass, "text-left")}>No</TableHead>
                  <TableHead className={cn(dashboardTableHeadClass, "text-left")}>Item Name</TableHead>
                  <TableHead className={cn(dashboardTableHeadClass, "text-right")}>Cost Price</TableHead>
                  <TableHead className={cn(dashboardTableHeadClass, "text-right")}>Selling Price</TableHead>
                  <TableHead className={cn(dashboardTableHeadClass, "text-right")}>Tax (%)</TableHead>
                  <TableHead className={cn(dashboardTableHeadClass, "text-right")}>Status</TableHead>
                  <TableHead className={cn(dashboardTableHeadClass, "text-right")}>Actions</TableHead>
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
                ) : paginatedItems.length > 0 ? (
                  paginatedItems.map((item) => (
                    <TableRow key={item.id} className="border-zinc-100 hover:bg-zinc-50/50 transition-colors">
                      <TableCell className="px-6 py-3 text-[13px] text-zinc-500 font-medium">{item.id}</TableCell>
                      <TableCell className="px-6 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-md overflow-hidden flex items-center justify-center shrink-0 border border-zinc-100 bg-zinc-50">
                            {item.imageUrl ? (
                              <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                            ) : (
                              <ImageIcon className="size-4 text-zinc-300" />
                            )}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[13px] font-medium text-zinc-700 leading-tight flex items-center gap-1.5">
                              {item.name}
                              {item.isRecommended && <Star className="size-3 fill-amber-400 text-amber-400" />}
                            </span>
                            <span className="text-[10px] text-zinc-400 uppercase tracking-wider">{item.category?.name || "No Category"}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-3 text-[13px] font-medium text-zinc-400 text-right">
                        ${(item.costPrice || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="px-6 py-3 text-[13px] font-bold text-primary text-right">
                        ${item.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="px-6 py-3 text-[13px] font-medium text-zinc-500 text-right">
                        {item.tax}%
                      </TableCell>
                      <TableCell className="px-6 py-3 text-right">
                        <span className={cn(
                          dashboardStatusBadgeClass,
                          getTableStatusBadgeClass(item.isAvailable ? "active" : "inactive")
                        )}>
                          {item.isAvailable ? "Active" : "Inactive"}
                        </span>
                      </TableCell>
                      <TableCell className="px-10 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className={actionBtnView}
                          >
                            <Eye className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditModal(item)}
                            className={actionBtnEdit}
                          >
                            <Edit className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openDeleteModal(item)}
                            className={actionBtnDelete}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="px-6 py-10 text-center text-zinc-500">
                      No menu items found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Table Footer / Pagination */}
        <div className="py-2 px-8 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs text-zinc-400 border-t border-zinc-100 bg-zinc-50/30">
          <div>
            {Math.min(filteredItems.length, (currentPage - 1) * pageSize + 1)}-{Math.min(filteredItems.length, currentPage * pageSize)} of {filteredItems.length}
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
        <DialogContent className="sm:max-w-[750px] bg-white border-none p-0 overflow-hidden rounded-2xl shadow-xl animate-in fade-in zoom-in-95 duration-200">
          <div className="p-8 border-b border-zinc-100 bg-zinc-50/30">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-[#1e293b]">
                {isEditOpen ? "Edit Menu Item" : "Add New Menu Item"}
              </DialogTitle>
              <DialogDescription className="text-zinc-500 text-sm mt-1">
                Configure the details and pricing for this menu entry.
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="px-8 py-8 space-y-6 max-h-[75vh] overflow-y-auto">
            {/* Row 1: Name and Category */}
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-[#1e293b]">Item Name *</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Grilled Salmon"
                  className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-lg outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all text-[15px] font-medium placeholder:text-zinc-400"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-[#1e293b]">Category *</label>
                <div className="relative">
                  <select
                    value={formCategoryId}
                    onChange={(e) => setFormCategoryId(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-lg outline-none focus:border-primary transition-all text-[15px] font-medium appearance-none cursor-pointer"
                  >
                    <option value="">Select Category</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                  <ChevronDown className="size-4 absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Row 2: Prices */}
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-[#1e293b]">Cost Price ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formCostPrice}
                  onChange={(e) => setFormCostPrice(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-lg outline-none focus:border-primary transition-all text-[15px] font-medium text-zinc-600"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-[#1e293b]">Selling Price ($) *</label>
                <input
                  type="number"
                  step="0.01"
                  value={formPrice}
                  onChange={(e) => setFormPrice(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-lg outline-none focus:border-primary transition-all text-[15px] font-medium"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-[#1e293b]">Tax / VAT (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={formTax}
                  onChange={(e) => setFormTax(e.target.value)}
                  placeholder="0"
                  className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-lg outline-none focus:border-primary transition-all text-[15px] font-medium"
                />
              </div>
            </div>

            {/* Row 3: Availability & Recommended */}
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-[#1e293b]">Availability</label>
                <select
                  value={formIsAvailable ? "available" : "unavailable"}
                  onChange={(e) => setFormIsAvailable(e.target.value === "available")}
                  className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-lg outline-none focus:border-primary transition-all text-[15px] font-medium appearance-none cursor-pointer"
                >
                  <option value="available">Available</option>
                  <option value="unavailable">Out of Stock</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-[#1e293b]">Recommended</label>
                <select
                  value={formIsRecommended ? "yes" : "no"}
                  onChange={(e) => setFormIsRecommended(e.target.value === "yes")}
                  className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-lg outline-none focus:border-primary transition-all text-[15px] font-medium appearance-none cursor-pointer"
                >
                  <option value="yes">Yes (Recommended)</option>
                  <option value="no">No</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-[#1e293b]">POS Options</label>
              <input
                type="text"
                value={formOptions}
                onChange={(e) => setFormOptions(e.target.value)}
                placeholder="e.g. Small, Medium, Large (comma separated)"
                className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-lg outline-none focus:border-primary transition-all text-[15px] font-medium"
              />
              <p className="text-xs text-zinc-400">Shown on POS terminal for this item. Leave empty if none.</p>
            </div>

            {/* Description — shown to kitchen when preparing orders */}
            <div className="space-y-2 pt-2">
              <label className="text-sm font-bold text-[#1e293b]">Description</label>
              <textarea
                value={formDesc}
                onChange={(e) => setFormDesc(e.target.value)}
                placeholder="Ingredients, prep notes, allergens… (visible to kitchen staff)"
                rows={3}
                className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-lg outline-none focus:border-primary transition-all text-[15px] font-medium resize-y min-h-[88px]"
              />
            </div>

            {/* Row 4: Image */}
            <div className="space-y-3 pt-4 border-t border-zinc-100">
              <label className="text-sm font-bold text-[#1e293b] flex items-center gap-2">
                <ImageIcon className="size-4 text-zinc-400" />
                Item Image
              </label>

              <div className="flex items-center gap-4">
                <div className="flex-1 flex gap-3">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={formImageUrl}
                      onChange={(e) => setFormImageUrl(e.target.value)}
                      placeholder="Paste image URL here..."
                      className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-lg outline-none focus:border-primary transition-all text-[14px] font-medium"
                    />
                  </div>
                  <label className="cursor-pointer">
                    <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                    <div className="h-[46px] px-6 rounded-lg bg-primary/5 text-primary hover:bg-primary/10 flex items-center justify-center font-bold text-[13px] transition-all border border-primary/20">
                      Upload
                    </div>
                  </label>
                </div>

                {formImageUrl && (
                  <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-zinc-200 shadow-sm shrink-0">
                    <img src={formImageUrl} alt="Preview" className="w-full h-full object-cover" />
                    <button
                      onClick={() => setFormImageUrl("")}
                      className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center text-white"
                    >
                      <X className="size-3" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <DialogFooter className="px-8 py-6 bg-zinc-50/50 border-t border-zinc-100 flex items-center sm:justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => { setIsAddOpen(false); setIsEditOpen(false); }}
              className="text-zinc-500 font-bold px-6 h-11 rounded-lg transition-all"
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              className="bg-primary !text-white hover:bg-primary/90 hover:!text-white rounded-lg font-bold border-none px-8 h-11 transition-all active:scale-95"
              disabled={saving}
            >
              {saving ? "Saving..." : isEditOpen ? "Update Item" : "Create Item"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* VIEW MODAL */}
      <Dialog open={isViewOpen} onOpenChange={(open) => { if (!open) setIsViewOpen(false); }}>
        <DialogContent className="sm:max-w-[500px] bg-white border-zinc-100 p-0 overflow-hidden rounded-2xl">
          <DialogTitle className="sr-only">Menu Item Details</DialogTitle>
          <div className="p-8">
            <div className="flex justify-between items-start mb-6">
              <div className="min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-2xl font-bold text-[#1E293B] truncate">{selectedItem?.name}</h3>
                  <span className={cn(
                    dashboardStatusBadgeClass,
                    getTableStatusBadgeClass(selectedItem?.isAvailable ? "active" : "inactive"),
                    "shrink-0"
                  )}>
                    {selectedItem?.isAvailable ? "Active" : "Inactive"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 bg-primary/10 text-primary text-[11px] font-bold rounded-md uppercase tracking-wider">
                    {categories.find(c => String(c.id) === String(selectedItem?.categoryId))?.name || "Uncategorized"}
                  </span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-2xl font-black text-primary">${Number(selectedItem?.price).toFixed(2)}</p>
                <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider mt-1">Per serving</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-[11px] text-zinc-400 font-bold uppercase tracking-wider mb-2">Description</p>
                <p className="text-sm text-zinc-600 leading-relaxed bg-zinc-50/50 p-4 rounded-xl border border-zinc-100">
                  {selectedItem?.description || "No description provided for this item."}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-100 flex items-center gap-3">
                  <RefreshCw className="size-3.5 text-zinc-400" />
                  <div>
                    <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Created</p>
                    <p className="text-xs font-medium text-zinc-700">{selectedItem?.createdAt ? new Date(selectedItem.createdAt).toLocaleDateString() : "N/A"}</p>
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-100 flex items-center gap-3">
                  <CheckCircle2 className="size-3.5 text-zinc-400" />
                  <div>
                    <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Tax / VAT</p>
                    <p className="text-xs font-medium text-zinc-700">{selectedItem?.tax || 0}%</p>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="mt-8 pt-6 border-t border-zinc-100">
              <Button
                onClick={() => setIsViewOpen(false)}
                className="w-full bg-primary !text-white hover:bg-primary/90 hover:!text-white rounded-xl font-bold border-none h-12 shadow-lg shadow-primary/20"
              >
                Close View
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* DELETE MODAL */}
      <Dialog open={isDeleteOpen} onOpenChange={(open) => { if (!open) setIsDeleteOpen(false); }}>
        <DialogContent className="sm:max-w-[500px] bg-white border-zinc-100 p-0 overflow-hidden">
          <DialogTitle className="sr-only">Delete Item Confirmation</DialogTitle>
          <div className="p-8 flex items-start gap-6">
            <div className="w-14 h-14 shrink-0 rounded-full bg-rose-50 flex items-center justify-center border border-rose-100">
              <Trash2 className="size-6 text-rose-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-[#1E293B] mb-2">Delete Menu Item?</h3>
              <p className="text-sm text-zinc-500 leading-relaxed">
                Are you sure you want to remove <span className="font-bold text-[#1E293B]">"{selectedItem?.name}"</span>?
                This action cannot be undone and will remove the item from all active menus.
              </p>
            </div>
          </div>
          <DialogFooter className="p-6 bg-zinc-50/50 border-t border-zinc-100 gap-3">
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)} className="rounded-lg font-bold px-6 h-11">
              Cancel
            </Button>
            <Button onClick={handleDelete} className="bg-rose-600 hover:bg-rose-700 !text-white hover:!text-white rounded-lg font-bold border-none px-8 h-11 shadow-lg shadow-rose-600/10">
              Yes, Delete Item
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
