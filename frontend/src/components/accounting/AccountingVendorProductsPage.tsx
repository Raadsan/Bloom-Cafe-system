"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Package,
  Plus,
  Search,
  Eye,
  Edit,
  Trash2,
  Building2,
  Layers,
  DollarSign,
  AlertCircle,
} from "lucide-react";
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
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";
import {
  menuItemApi,
  MenuItem,
  CreateMenuItemPayload,
  UpdateMenuItemPayload,
} from "@/lib/api/restaurant/menuItemApi";
import { categoryApi, Category } from "@/lib/api/restaurant/categoryApi";
import { vendorApi, Vendor } from "@/lib/api/accounting/payables/vendorApi";
import {
  dashboardPageClass,
  dashboardPageStyle,
  pageHeaderTitleClass,
  pageHeaderWrapperClass,
  dashboardTableHeaderClass,
  dashboardTableHeadRowClass,
  dashboardTableHeadClass,
  dashboardTableBodyRowClass,
  dashboardTableCellClass,
  dashboardTableIdClass,
  actionBtnView,
  actionBtnEdit,
  actionBtnDelete,
  getTableStatusBadgeClass,
} from "@/lib/dashboard-ui";

const formLabelClass = "text-xs font-semibold text-zinc-700 dark:text-zinc-300";
const formInputClass =
  "w-full px-3.5 py-2.5 bg-white dark:bg-[#161616] border border-zinc-200 dark:border-[#2a2a2a] rounded-lg outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 text-sm font-medium dark:text-white placeholder:text-zinc-400 transition-all";

export default function AccountingVendorProductsPage() {
  const { showToast } = useToast();
  const [items, setItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & search
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [vendorFilter, setVendorFilter] = useState("all");

  // Modal dialog states
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);

  // Form states (Item Name, Category, Vendor Name, Purchase Price, Notes)
  const [formName, setFormName] = useState("");
  const [formCategoryId, setFormCategoryId] = useState("");
  const [formVendorId, setFormVendorId] = useState("");
  const [formVendorName, setFormVendorName] = useState("");
  const [formPurchasePrice, setFormPurchasePrice] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [saving, setSaving] = useState(false);

  // Load all items, categories, and vendors
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [itemList, catList, vendorList] = await Promise.all([
        menuItemApi.getAllMenuItems(true),
        categoryApi.getAllCategories(true),
        vendorApi.getAll().catch(() => [] as Vendor[]),
      ]);
      setItems(itemList || []);
      setCategories(catList || []);
      setVendors(vendorList || []);
    } catch (error: any) {
      showToast(error?.message || "Failed to load vendor products data", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filter vendor items: either isPurchasable is true, isSellable is false, or vendorName is set
  const vendorProducts = useMemo(() => {
    return items.filter((item) => {
      // In vendor products view, include items explicitly marked purchasable, or with vendor set, or non-sellable
      // Or if there are no items marked purchasable yet, show all items with cost prices
      return item.isPurchasable || !item.isSellable || !!item.vendorName || (item.costPrice ?? 0) > 0;
    });
  }, [items]);

  // Filtered by search, category, and vendor
  const filteredProducts = useMemo(() => {
    return vendorProducts.filter((it) => {
      const matchesSearch =
        search.trim() === "" ||
        it.name.toLowerCase().includes(search.toLowerCase()) ||
        (it.vendorName && it.vendorName.toLowerCase().includes(search.toLowerCase())) ||
        (it.category?.name && it.category.name.toLowerCase().includes(search.toLowerCase()));

      const matchesCat =
        categoryFilter === "all" || String(it.categoryId) === categoryFilter;

      const matchesVendor =
        vendorFilter === "all" ||
        (it.vendorName && it.vendorName === vendorFilter) ||
        (it.vendorId && String(it.vendorId) === vendorFilter);

      return matchesSearch && matchesCat && matchesVendor;
    });
  }, [vendorProducts, search, categoryFilter, vendorFilter]);

  // Unique vendor names list for dropdowns
  const availableVendorOptions = useMemo(() => {
    const list: { id?: number; name: string }[] = [];
    const seen = new Set<string>();

    vendors.forEach((v) => {
      const vName = String((v as any).name || '').trim();
      if (vName && !seen.has(vName.toLowerCase())) {
        seen.add(vName.toLowerCase());
        list.push({ id: (v as any).id ? Number((v as any).id) : undefined, name: vName });
      }
    });

    items.forEach((it) => {
      if (it.vendorName && !seen.has(it.vendorName.toLowerCase())) {
        seen.add(it.vendorName.toLowerCase());
        list.push({ id: it.vendorId || undefined, name: it.vendorName });
      }
    });

    return list;
  }, [vendors, items]);

  // Only show categories that have at least one vendor product
  const categoriesWithProducts = useMemo(() => {
    const usedIds = new Set(vendorProducts.map((it) => it.categoryId));
    return categories.filter((c) => usedIds.has(c.id));
  }, [categories, vendorProducts]);

  // Reset form
  const resetForm = () => {
    setFormName("");
    setFormCategoryId(categories[0]?.id ? String(categories[0].id) : "");
    setFormVendorId("");
    setFormVendorName("");
    setFormPurchasePrice("");
    setFormDescription("");
    setSelectedItem(null);
  };

  // Open Add Modal
  const handleOpenAdd = () => {
    resetForm();
    if (categories.length > 0) {
      setFormCategoryId(String(categories[0].id));
    }
    if (availableVendorOptions.length > 0) {
      setFormVendorName(availableVendorOptions[0].name);
      setFormVendorId(availableVendorOptions[0].id ? String(availableVendorOptions[0].id) : "");
    }
    setIsAddOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (item: MenuItem) => {
    setSelectedItem(item);
    setFormName(item.name);
    setFormCategoryId(String(item.categoryId));
    setFormVendorId(item.vendorId ? String(item.vendorId) : "");
    setFormVendorName(item.vendorName || "");
    setFormPurchasePrice(
      item.costPrice !== undefined && item.costPrice !== null
        ? String(item.costPrice)
        : String(item.price || 0)
    );
    setFormDescription(item.description || "");
    setIsEditOpen(true);
  };

  // Open View Modal
  const handleOpenView = (item: MenuItem) => {
    setSelectedItem(item);
    setIsViewOpen(true);
  };

  // Open Delete Modal
  const handleOpenDelete = (item: MenuItem) => {
    setSelectedItem(item);
    setIsDeleteOpen(true);
  };

  // Submit Add Product
  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      showToast("Please enter an item name", "error");
      return;
    }
    if (!formCategoryId) {
      showToast("Please select a category", "error");
      return;
    }

    setSaving(true);
    try {
      const cost = parseFloat(formPurchasePrice) || 0;
      const payload: CreateMenuItemPayload = {
        name: formName.trim(),
        categoryId: Number(formCategoryId),
        costPrice: cost,
        price: cost, // For accounting vendor products, purchase price is the primary price
        isPurchasable: true,
        isSellable: false, // Vendor product: not sold directly in restaurant menu
        isAvailable: true,
        vendorId: formVendorId ? Number(formVendorId) : null,
        vendorName: formVendorName.trim() || null,
        description: formDescription.trim() || undefined,
      };

      await menuItemApi.createMenuItem(payload);
      showToast("Vendor product added successfully!", "success");
      setIsAddOpen(false);
      resetForm();
      loadData();
    } catch (error: any) {
      showToast(error?.message || "Failed to add vendor product", "error");
    } finally {
      setSaving(false);
    }
  };

  // Submit Edit Product
  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;
    if (!formName.trim()) {
      showToast("Please enter an item name", "error");
      return;
    }

    setSaving(true);
    try {
      const cost = parseFloat(formPurchasePrice) || 0;
      const payload: UpdateMenuItemPayload = {
        name: formName.trim(),
        categoryId: Number(formCategoryId),
        costPrice: cost,
        price: cost,
        isPurchasable: true,
        isSellable: false,
        vendorId: formVendorId ? Number(formVendorId) : null,
        vendorName: formVendorName.trim() || null,
        description: formDescription.trim() || undefined,
      };

      await menuItemApi.updateMenuItem(selectedItem.id, payload);
      showToast("Vendor product updated successfully!", "success");
      setIsEditOpen(false);
      resetForm();
      loadData();
    } catch (error: any) {
      showToast(error?.message || "Failed to update vendor product", "error");
    } finally {
      setSaving(false);
    }
  };

  // Confirm Delete
  const handleDeleteProduct = async () => {
    if (!selectedItem) return;
    setSaving(true);
    try {
      await menuItemApi.deleteMenuItem(selectedItem.id);
      showToast("Vendor product deleted successfully!", "success");
      setIsDeleteOpen(false);
      setSelectedItem(null);
      loadData();
    } catch (error: any) {
      showToast(error?.message || "Failed to delete product", "error");
    } finally {
      setSaving(false);
    }
  };

  // Handle vendor select change
  const handleVendorSelect = (val: string) => {
    if (val === "__custom__") {
      setFormVendorId("");
      setFormVendorName("");
    } else {
      const found = availableVendorOptions.find((v) => v.name === val);
      setFormVendorName(val);
      setFormVendorId(found?.id ? String(found.id) : "");
    }
  };

  // KPI Calculations
  const totalProductsCount = vendorProducts.length;
  const totalVendorsCount = availableVendorOptions.length;
  const activeCatsCount = new Set(vendorProducts.map((p) => p.categoryId)).size;
  const avgPurchasePrice =
    totalProductsCount > 0
      ? vendorProducts.reduce((sum, p) => sum + (p.costPrice ?? p.price ?? 0), 0) /
        totalProductsCount
      : 0;

return (
    <div
      className={cn(dashboardPageClass, "space-y-6 animate-in fade-in duration-500")}
      style={dashboardPageStyle}
    >
      {/* Page Header */}
      <div className={pageHeaderWrapperClass}>
        <h1 className={pageHeaderTitleClass}>Vendor Products</h1>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 px-4">
        <div className="trezo-card p-4 flex items-center gap-3.5">
          <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <Package className="size-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              Vendor Products
            </p>
            <h3 className="text-lg font-bold text-foreground mt-0.5">{totalProductsCount}</h3>
          </div>
        </div>

        <div className="trezo-card p-4 flex items-center gap-3.5">
          <div className="size-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <Building2 className="size-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              Active Vendors
            </p>
            <h3 className="text-lg font-bold text-foreground mt-0.5">{totalVendorsCount}</h3>
          </div>
        </div>

        <div className="trezo-card p-4 flex items-center gap-3.5">
          <div className="size-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <Layers className="size-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              Categories
            </p>
            <h3 className="text-lg font-bold text-foreground mt-0.5">{activeCatsCount}</h3>
          </div>
        </div>

        <div className="trezo-card p-4 flex items-center gap-3.5">
          <div className="size-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <DollarSign className="size-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              Avg Purchase Cost
            </p>
            <h3 className="text-lg font-bold text-foreground mt-0.5">
              ${avgPurchasePrice.toFixed(2)}
            </h3>
          </div>
        </div>
      </div>

      {/* Main Table Box – matches menus page style */}
      <div className="bg-white dark:bg-card rounded-xl border border-zinc-200 dark:border-border shadow-sm overflow-hidden mx-4">

        {/* Controls Row: inside the box, same as menus page */}
        <div className="px-8 py-4 flex flex-wrap items-center gap-4 border-b border-zinc-50 dark:border-border">

          {/* Left: filters */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-[13px] text-zinc-400 font-normal shrink-0">
              <span>Category</span>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="h-[42px] px-3 border border-zinc-200 dark:border-border rounded-md outline-none focus:border-primary transition-colors bg-white dark:bg-background cursor-pointer text-sm font-normal text-zinc-600 dark:text-foreground"
              >
                <option value="all">All Categories</option>
                {categoriesWithProducts.map((c) => (
                  <option key={c.id} value={String(c.id)}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 text-[13px] text-zinc-400 font-normal shrink-0">
              <span>Vendor</span>
              <select
                value={vendorFilter}
                onChange={(e) => setVendorFilter(e.target.value)}
                className="h-[42px] px-3 border border-zinc-200 dark:border-border rounded-md outline-none focus:border-primary transition-colors bg-white dark:bg-background cursor-pointer text-sm font-normal text-zinc-600 dark:text-foreground"
              >
                <option value="all">All Vendors</option>
                {availableVendorOptions.map((v) => (
                  <option key={v.name} value={v.name}>{v.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex-1" />

          {/* Right: search + Add button */}
          <div className="flex items-center gap-3">
            <div className="relative w-64 group">
              <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-primary transition-colors" />
              <input
                type="text"
                placeholder="Search item or vendor..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-[42px] pl-10 pr-4 bg-zinc-50 dark:bg-muted border border-zinc-200 dark:border-border rounded-md outline-none focus:border-primary focus:ring-1 focus:ring-primary/10 transition-all text-sm font-normal text-zinc-600 dark:text-foreground"
              />
            </div>

            <Button
              onClick={handleOpenAdd}
              className="h-[42px] px-6 bg-primary !text-white hover:bg-primary/90 hover:!text-white rounded-md flex items-center gap-2 transition-colors font-medium text-sm shadow-sm"
            >
              <Plus className="size-4" />
              Add Vendor Product
            </Button>
          </div>
        </div>

        {/* Table – flush to sides */}
        <div className="border-t border-zinc-100 dark:border-border overflow-hidden">
          <div className="overflow-x-auto">
            <Table className="w-full">
              <TableHeader className={dashboardTableHeaderClass}>
                <TableRow className={dashboardTableHeadRowClass}>
                  <TableHead className={cn(dashboardTableHeadClass, "text-left")}>No</TableHead>
                  <TableHead className={cn(dashboardTableHeadClass, "text-left")}>Item Name</TableHead>
                  <TableHead className={cn(dashboardTableHeadClass, "text-left")}>Category</TableHead>
                  <TableHead className={cn(dashboardTableHeadClass, "text-left")}>Vendor Name</TableHead>
                  <TableHead className={cn(dashboardTableHeadClass, "text-right")}>Purchase Price</TableHead>
                  <TableHead className={cn(dashboardTableHeadClass, "text-right")}>Status</TableHead>
                  <TableHead className={cn(dashboardTableHeadClass, "text-right px-10")}>Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i} className="h-14 animate-pulse">
                      {[...Array(7)].map((_, j) => (
                        <TableCell key={j} className="px-6 py-4">
                          <div className="h-4 bg-zinc-100 dark:bg-muted rounded w-full" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : filteredProducts.length > 0 ? (
                  filteredProducts.map((it) => {
                    const cost = it.costPrice !== undefined && it.costPrice !== null ? it.costPrice : it.price;
                    return (
                      <TableRow key={it.id} className="border-zinc-100 dark:border-border hover:bg-zinc-50/50 dark:hover:bg-muted/30 transition-colors">
                        {/* No */}
                        <TableCell className="px-6 py-3 text-[13px] text-zinc-500 font-medium">
                          {it.id}
                        </TableCell>

                        {/* Item Name */}
                        <TableCell className="px-6 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-md overflow-hidden flex items-center justify-center shrink-0 border border-zinc-100 dark:border-border bg-primary/5">
                              <Package className="size-4 text-primary" />
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[13px] font-medium text-zinc-700 dark:text-zinc-200 leading-tight">
                                {it.name}
                              </span>
                              {it.description && (
                                <span className="text-[10px] text-zinc-400 truncate max-w-[200px]">
                                  {it.description}
                                </span>
                              )}
                            </div>
                          </div>
                        </TableCell>

                        {/* Category */}
                        <TableCell className="px-6 py-3 text-[13px] font-medium text-zinc-500">
                          {it.category?.name || "—"}
                        </TableCell>

                        {/* Vendor Name */}
                        <TableCell className="px-6 py-3">
                          {it.vendorName ? (
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-semibold">
                              <Building2 className="size-3" />
                              <span>{it.vendorName}</span>
                            </div>
                          ) : (
                            <span className="text-xs text-zinc-400 italic">—</span>
                          )}
                        </TableCell>

                        {/* Purchase Price */}
                        <TableCell className="px-6 py-3 text-[13px] font-semibold text-primary text-right tabular-nums">
                          ${Number(cost || 0).toFixed(2)}
                        </TableCell>

                        {/* Status */}
                        <TableCell className="px-6 py-3 text-right">
                          <span className={cn(
                            "text-[11px] font-semibold px-2.5 py-0.5 rounded-full border",
                            it.isAvailable
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800"
                              : "bg-zinc-100 text-zinc-500 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700"
                          )}>
                            {it.isAvailable ? "Active" : "Inactive"}
                          </span>
                        </TableCell>

                        {/* Actions */}
                        <TableCell className="px-10 py-3 text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenView(it)}
                              className={actionBtnView}
                              title="View details"
                            >
                              <Eye className="size-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenEdit(it)}
                              className={actionBtnEdit}
                              title="Edit"
                            >
                              <Edit className="size-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenDelete(it)}
                              className={actionBtnDelete}
                              title="Delete"
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="px-6 py-10 text-center text-zinc-500 text-sm">
                      No vendor products found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Table Footer / Summary */}
        <div className="py-2 px-8 flex items-center justify-between text-xs text-zinc-400 border-t border-zinc-100 dark:border-border bg-zinc-50/30 dark:bg-muted/10">
          <div>
            {filteredProducts.length} of {vendorProducts.length} vendor products
          </div>
        </div>
      </div>

      {/* ADD VENDOR PRODUCT MODAL */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-lg bg-card text-card-foreground border-border p-6 rounded-2xl shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-foreground flex items-center gap-2">
              <Package className="size-5 text-primary" />
              <span>Add Vendor Product</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Register a purchased item, raw material, or supply from your vendors.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateProduct} className="space-y-4 mt-2">
            {/* Item Name */}
            <div className="space-y-1.5">
              <label className={formLabelClass}>
                Item Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g. Arabica Coffee Beans 1kg"
                className={formInputClass}
              />
            </div>

            {/* Category & Vendor Name Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Category */}
              <div className="space-y-1.5">
                <label className={formLabelClass}>
                  Category <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={formCategoryId}
                  onChange={(e) => setFormCategoryId(e.target.value)}
                  className={formInputClass}
                >
                  <option value="">Select Category...</option>
                  {categories.map((c) => (
                    <option key={c.id} value={String(c.id)}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Vendor Selection */}
              <div className="space-y-1.5">
                <label className={formLabelClass}>Vendor Name</label>
                <select
                  value={formVendorName}
                  onChange={(e) => handleVendorSelect(e.target.value)}
                  className={formInputClass}
                >
                  <option value="">Select Vendor...</option>
                  {availableVendorOptions.map((v) => (
                    <option key={v.name} value={v.name}>
                      {v.name}
                    </option>
                  ))}
                  <option value="__custom__">+ Enter Custom Vendor...</option>
                </select>
              </div>
            </div>

            {/* If custom vendor or no vendor selected */}
            {(formVendorName === "" || !availableVendorOptions.some((v) => v.name === formVendorName)) && (
              <div className="space-y-1.5">
                <label className={formLabelClass}>Custom Vendor / Supplier Name</label>
                <input
                  type="text"
                  value={formVendorName}
                  onChange={(e) => setFormVendorName(e.target.value)}
                  placeholder="Enter vendor or supplier name"
                  className={formInputClass}
                />
              </div>
            )}

            {/* Purchase Price (Price aan kuso gadany) */}
            <div className="space-y-1.5">
              <label className={formLabelClass}>
                Purchase Price (Cost Price aan kuso gadany) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground">
                  $
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={formPurchasePrice}
                  onChange={(e) => setFormPurchasePrice(e.target.value)}
                  placeholder="0.00"
                  className={cn(formInputClass, "pl-8 font-bold tabular-nums")}
                />
              </div>
              <p className="text-[11px] text-muted-foreground">
                The unit purchase cost you pay to the vendor.
              </p>
            </div>

            {/* Description / Notes */}
            <div className="space-y-1.5">
              <label className={formLabelClass}>Notes / Description</label>
              <textarea
                rows={2}
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Optional notes, supplier SKU, or specifications..."
                className={cn(formInputClass, "resize-none")}
              />
            </div>

            <DialogFooter className="pt-3 border-t border-border flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddOpen(false)}
                disabled={saving}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="bg-primary text-white hover:bg-primary/90 text-xs font-bold px-4"
              >
                {saving ? "Saving..." : "Save Vendor Product"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* EDIT VENDOR PRODUCT MODAL */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-lg bg-card text-card-foreground border-border p-6 rounded-2xl shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-foreground flex items-center gap-2">
              <Edit className="size-5 text-primary" />
              <span>Edit Vendor Product</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Modify product details, vendor, or purchase cost.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUpdateProduct} className="space-y-4 mt-2">
            {/* Item Name */}
            <div className="space-y-1.5">
              <label className={formLabelClass}>
                Item Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className={formInputClass}
              />
            </div>

            {/* Category & Vendor Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Category */}
              <div className="space-y-1.5">
                <label className={formLabelClass}>
                  Category <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={formCategoryId}
                  onChange={(e) => setFormCategoryId(e.target.value)}
                  className={formInputClass}
                >
                  {categories.map((c) => (
                    <option key={c.id} value={String(c.id)}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Vendor Selection */}
              <div className="space-y-1.5">
                <label className={formLabelClass}>Vendor Name</label>
                <select
                  value={formVendorName}
                  onChange={(e) => handleVendorSelect(e.target.value)}
                  className={formInputClass}
                >
                  <option value="">Select Vendor...</option>
                  {availableVendorOptions.map((v) => (
                    <option key={v.name} value={v.name}>
                      {v.name}
                    </option>
                  ))}
                  <option value="__custom__">+ Enter Custom Vendor...</option>
                </select>
              </div>
            </div>

            {/* Custom Vendor if applicable */}
            {(formVendorName === "" || !availableVendorOptions.some((v) => v.name === formVendorName)) && (
              <div className="space-y-1.5">
                <label className={formLabelClass}>Custom Vendor / Supplier Name</label>
                <input
                  type="text"
                  value={formVendorName}
                  onChange={(e) => setFormVendorName(e.target.value)}
                  placeholder="Enter vendor or supplier name"
                  className={formInputClass}
                />
              </div>
            )}

            {/* Purchase Price */}
            <div className="space-y-1.5">
              <label className={formLabelClass}>
                Purchase Price (Cost Price aan kuso gadany) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground">
                  $
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={formPurchasePrice}
                  onChange={(e) => setFormPurchasePrice(e.target.value)}
                  className={cn(formInputClass, "pl-8 font-bold tabular-nums")}
                />
              </div>
            </div>

            {/* Description / Notes */}
            <div className="space-y-1.5">
              <label className={formLabelClass}>Notes / Description</label>
              <textarea
                rows={2}
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Optional notes..."
                className={cn(formInputClass, "resize-none")}
              />
            </div>

            <DialogFooter className="pt-3 border-t border-border flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditOpen(false)}
                disabled={saving}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="bg-primary text-white hover:bg-primary/90 text-xs font-bold px-4"
              >
                {saving ? "Updating..." : "Update Product"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* VIEW DETAILS MODAL */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="sm:max-w-md bg-card text-card-foreground border-border p-6 rounded-2xl shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-foreground flex items-center gap-2">
              <Package className="size-5 text-primary" />
              <span>Vendor Product Details</span>
            </DialogTitle>
          </DialogHeader>

          {selectedItem && (
            <div className="space-y-4 mt-2">
              <div className="bg-muted/40 p-4 rounded-xl space-y-3 border border-border">
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase">Item Name</p>
                  <p className="text-base font-bold text-foreground mt-0.5">{selectedItem.name}</p>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border/60">
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">Category</p>
                    <p className="text-xs font-semibold text-foreground mt-0.5">
                      {selectedItem.category?.name || "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">Vendor</p>
                    <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 mt-0.5 flex items-center gap-1">
                      <Building2 className="size-3.5" />
                      {selectedItem.vendorName || "Not specified"}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border/60">
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">Purchase Cost</p>
                    <p className="text-base font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                      ${Number(selectedItem.costPrice ?? selectedItem.price ?? 0).toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">Status</p>
                    <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded uppercase mt-1 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                      {selectedItem.isAvailable ? "Active / In Stock" : "Inactive"}
                    </span>
                  </div>
                </div>

                {selectedItem.description && (
                  <div className="pt-2 border-t border-border/60">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">Notes / Description</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{selectedItem.description}</p>
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsViewOpen(false)}
                  className="w-full text-xs"
                >
                  Close
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* DELETE CONFIRMATION MODAL */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="sm:max-w-sm bg-card text-card-foreground border-border p-6 rounded-2xl shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-foreground flex items-center gap-2 text-rose-600">
              <AlertCircle className="size-5" />
              <span>Delete Vendor Product?</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground pt-1">
              Are you sure you want to delete <strong>{selectedItem?.name}</strong>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="pt-3 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDeleteOpen(false)}
              disabled={saving}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleDeleteProduct}
              disabled={saving}
              className="bg-rose-600 text-white hover:bg-rose-700 text-xs font-bold px-4"
            >
              {saving ? "Deleting..." : "Yes, Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
