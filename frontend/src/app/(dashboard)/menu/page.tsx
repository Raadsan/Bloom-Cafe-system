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
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from "@/components/ui/dialog";
import { menuItemApi, MenuItem } from "@/lib/api/menuItemApi";
import { categoryApi, Category } from "@/lib/api/categoryApi";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

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
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);

  // Form states
  const [formName, setFormName] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formPrice, setFormPrice] = useState("");
  const [formCategoryId, setFormCategoryId] = useState("");
  const [formIsAvailable, setFormIsAvailable] = useState(true);
  const [formImageUrl, setFormImageUrl] = useState("");
  const [saving, setSaving] = useState(false);

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

  const stats = useMemo(() => {
    const total = items.length;
    const available = items.filter(i => i.isAvailable).length;
    const outOfStock = total - available;
    return { total, available, outOfStock };
  }, [items]);

  const openAddModal = () => {
    setFormName("");
    setFormDesc("");
    setFormPrice("");
    setFormCategoryId("");
    setFormIsAvailable(true);
    setFormImageUrl("");
    setIsAddOpen(true);
  };

  const openEditModal = (item: MenuItem) => {
    setSelectedItem(item);
    setFormName(item.name);
    setFormDesc(item.description || "");
    setFormPrice(String(item.price));
    setFormCategoryId(String(item.categoryId));
    setFormIsAvailable(item.isAvailable);
    setFormImageUrl(item.imageUrl || "");
    setIsEditOpen(true);
  };

  const openDeleteModal = (item: MenuItem) => {
    setSelectedItem(item);
    setIsDeleteOpen(true);
  };

  const handleSave = async () => {
    if (!formName.trim()) return showToast("Item name is required", "error");
    if (!formPrice || isNaN(Number(formPrice))) return showToast("Valid price is required", "error");
    if (!formCategoryId) return showToast("Please select a category", "error");

    setSaving(true);
    try {
      const payload = {
        name: formName.trim(),
        description: formDesc.trim(),
        price: Number(formPrice),
        categoryId: formCategoryId,
        isAvailable: formIsAvailable,
        imageUrl: formImageUrl.trim() || undefined
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
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground uppercase">Menu Management</h1>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-3">
            Manage your restaurant dishes, drinks and availability.
          </p>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="trezo-card overflow-hidden">
        {/* Filters */}
        <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-zinc-50/10 border-b border-zinc-100">
          <div>
            <h3 className="text-sm font-bold text-foreground">Menu Item List</h3>
            <p className="text-[12px] font-medium text-muted-foreground mt-1">{filteredItems.length} items currently showing</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative group w-full md:w-64">
              <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search menu..."
                className="w-full pl-10 pr-4 py-2.5 text-[14px] font-medium bg-white border border-zinc-100 rounded-lg outline-none focus:border-[#605DFF]/30 focus:ring-4 focus:ring-[#605DFF]/5 transition-all shadow-sm"
              />
            </div>

            <div className="relative">
              <Filter className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="appearance-none pl-10 pr-10 py-2.5 text-[14px] font-medium bg-white border border-zinc-100 rounded-lg outline-none focus:border-[#605DFF]/30 shadow-sm cursor-pointer min-w-[160px]"
              >
                <option value="all">All Categories</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
              <ChevronDown className="size-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            </div>

            <Button onClick={openAddModal} className="h-[42px] px-5 rounded-lg bg-[#605DFF] text-white hover:bg-[#4E4BCB] font-bold border-none shadow-md whitespace-nowrap">
              <Plus className="mr-2 size-4" /> Add New Item
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-zinc-50/50">
              <TableRow className="border-zinc-100 hover:bg-transparent">
                <TableHead className="px-6 py-5 text-[11px] font-bold uppercase tracking-widest text-[#64748B]">Item</TableHead>
                <TableHead className="px-6 py-5 text-[11px] font-bold uppercase tracking-widest text-[#64748B]">Category</TableHead>
                <TableHead className="px-6 py-5 text-[11px] font-bold uppercase tracking-widest text-[#64748B]">Price</TableHead>
                <TableHead className="px-6 py-5 text-[11px] font-bold uppercase tracking-widest text-[#64748B] text-center">Status</TableHead>
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
              ) : filteredItems.length > 0 ? (
                filteredItems.map((item) => (
                  <TableRow key={item.id} className="border-zinc-50 hover:bg-zinc-50/40 transition-colors">
                    <TableCell className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-zinc-100 overflow-hidden flex items-center justify-center shrink-0 border border-zinc-200">
                          {item.imageUrl ? (
                            <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                          ) : (
                            <ImageIcon className="size-5 text-zinc-400" />
                          )}
                        </div>
                        <div>
                          <p className="text-[14px] font-bold text-[#1E293B]">{item.name}</p>
                          {item.description && (
                            <p className="text-[11px] text-muted-foreground truncate max-w-[200px]">{item.description}</p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <span className="text-[12px] font-bold px-2.5 py-1 rounded bg-zinc-100 text-zinc-600 uppercase tracking-tight">
                        {item.category?.name || "Uncategorized"}
                      </span>
                    </TableCell>
                    <TableCell className="px-6 py-4 text-[14px] font-bold text-[#1E293B]">
                      ${item.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="px-6 py-4 text-center">
                      <span className={cn(
                        "px-3 py-1 rounded-md text-[11px] font-bold uppercase tracking-widest",
                        item.isAvailable 
                          ? "bg-emerald-100 text-emerald-700" 
                          : "bg-rose-100 text-rose-700"
                      )}>
                        {item.isAvailable ? "In Stock" : "Sold Out"}
                      </span>
                    </TableCell>
                    <TableCell className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => openEditModal(item)} className="h-8 w-8 p-0 text-[#64748B] hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors">
                          <Edit className="size-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => openDeleteModal(item)} className="h-8 w-8 p-0 text-[#64748B] hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors">
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
                      <UtensilsCrossed className="size-12 text-zinc-200" />
                      <p className="text-[#64748B] font-bold uppercase text-[11px] tracking-widest">No menu items found</p>
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
        <DialogContent className="sm:max-w-[600px] bg-white border-zinc-100">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              {isEditOpen ? "Edit Menu Item" : "Add Menu Item"}
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Configure the details and pricing for this menu entry.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-2 gap-5 py-4">
            <div className="col-span-2 space-y-2">
              <label className="text-sm font-bold text-[#1E293B]">Item Name *</label>
              <input
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g. Grilled Salmon"
                className="w-full px-4 py-3 border border-zinc-200 rounded-lg text-[15px] focus:outline-none focus:ring-2 focus:ring-[#605DFF]/20"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-[#1E293B]">Price ($) *</label>
              <input
                type="number"
                step="0.01"
                value={formPrice}
                onChange={(e) => setFormPrice(e.target.value)}
                placeholder="0.00"
                className="w-full px-4 py-3 border border-zinc-200 rounded-lg text-[15px] focus:outline-none focus:ring-2 focus:ring-[#605DFF]/20"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-[#1E293B]">Category *</label>
              <select
                value={formCategoryId}
                onChange={(e) => setFormCategoryId(e.target.value)}
                className="w-full px-4 py-3 border border-zinc-200 rounded-lg text-[15px] focus:outline-none focus:ring-2 focus:ring-[#605DFF]/20"
              >
                <option value="">Select Category</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div className="col-span-2 space-y-2">
              <label className="text-sm font-bold text-[#1E293B]">Description</label>
              <textarea
                value={formDesc}
                onChange={(e) => setFormDesc(e.target.value)}
                placeholder="Brief description of the dish..."
                rows={2}
                className="w-full px-4 py-3 border border-zinc-200 rounded-lg text-[15px] focus:outline-none focus:ring-2 focus:ring-[#605DFF]/20 resize-none"
              />
            </div>

            <div className="col-span-2 space-y-2">
              <label className="text-sm font-bold text-[#1E293B]">Image URL</label>
              <input
                type="text"
                value={formImageUrl}
                onChange={(e) => setFormImageUrl(e.target.value)}
                placeholder="https://example.com/image.jpg"
                className="w-full px-4 py-3 border border-zinc-200 rounded-lg text-[15px] focus:outline-none focus:ring-2 focus:ring-[#605DFF]/20"
              />
            </div>

            <div className="col-span-2 flex items-center gap-2 pt-2">
              <input 
                type="checkbox" 
                id="available"
                checked={formIsAvailable}
                onChange={(e) => setFormIsAvailable(e.target.checked)}
                className="size-4 rounded border-zinc-300 text-[#605DFF] focus:ring-[#605DFF]"
              />
              <label htmlFor="available" className="text-sm font-bold text-[#1E293B] cursor-pointer">
                Item is currently available for orders
              </label>
            </div>
          </div>

        <DialogFooter className="gap-3">
          <Button variant="outline" onClick={() => { setIsAddOpen(false); setIsEditOpen(false); }} className="rounded-lg font-bold px-6 h-11" disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} className="bg-[#605DFF] hover:bg-[#4E4BCB] text-white rounded-lg font-bold border-none px-8 h-11" disabled={saving}>
            {saving ? "Saving..." : isEditOpen ? "Update Item" : "Create Item"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

      <Dialog open={isDeleteOpen} onOpenChange={(open) => { if(!open) setIsDeleteOpen(false); }}>
        <DialogContent
          className="sm:max-w-[440px] bg-white border-zinc-100"
        >
          <DialogTitle className="sr-only">Delete Menu Item</DialogTitle>
          <div className="p-6 flex flex-col items-center text-center pt-10">
            <div className="w-16 h-16 rounded-full bg-rose-100 flex items-center justify-center mb-4">
              <Trash2 className="size-8 text-rose-600" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">Delete Item?</h3>
            <p className="text-sm text-muted-foreground">
              Are you sure you want to delete <span className="font-bold text-foreground">"{selectedItem?.name}"</span>? 
              This action cannot be undone.
            </p>
          </div>
          <div className="p-4 bg-zinc-50 border-t border-zinc-100 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)} className="rounded-lg font-bold border-zinc-200 px-6 h-11">
              Cancel
            </Button>
            <Button onClick={handleDelete} className="bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold border-none shadow-sm px-6 h-11">
              Yes, Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
