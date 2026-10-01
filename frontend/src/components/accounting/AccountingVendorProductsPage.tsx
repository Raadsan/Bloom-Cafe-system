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
  CheckCircle2,
  ShoppingBag,
  TrendingUp,
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
  actionBtnView,
  actionBtnEdit,
  actionBtnDelete,
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
  const [typeFilter, setTypeFilter] = useState<"all" | "purchasable_only" | "resellable">("all");

  // Modal dialog states
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);

  // Form states
  const [formName, setFormName] = useState("");
  const [formCategoryId, setFormCategoryId] = useState("");
  const [formVendorId, setFormVendorId] = useState("");
  const [formVendorName, setFormVendorName] = useState("");
  const [formIsPurchasable, setFormIsPurchasable] = useState(true);
  const [formIsSellable, setFormIsSellable] = useState(false);
  const [formPurchasePrice, setFormPurchasePrice] = useState("");
  const [formSellingPrice, setFormSellingPrice] = useState("");
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

  // Filter vendor items: purchasable, non-sellable, or with vendor set or cost price > 0
  const vendorProducts = useMemo(() => {
    return items.filter((item) => {
      return item.isPurchasable || !item.isSellable || !!item.vendorName || (item.costPrice ?? 0) > 0;
    });
  }, [items]);

  // Filtered by search, category, vendor, and classification type
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

      const isResellable = it.isPurchasable && it.isSellable !== false;
      const isPurchasableOnly = it.isSellable === false;

      const matchesType =
        typeFilter === "all" ||
        (typeFilter === "purchasable_only" && isPurchasableOnly) ||
        (typeFilter === "resellable" && isResellable);

      return matchesSearch && matchesCat && matchesVendor && matchesType;
    });
  }, [vendorProducts, search, categoryFilter, vendorFilter, typeFilter]);

  // Unique vendor names list for dropdowns
  const availableVendorOptions = useMemo(() => {
    const list: { id?: number; name: string }[] = [];
    const seen = new Set<string>();

    vendors.forEach((v) => {
      const vName = String((v as any).name || "").trim();
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
    setFormIsPurchasable(true);
    setFormIsSellable(false);
    setFormPurchasePrice("");
    setFormSellingPrice("");
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
    setFormIsPurchasable(true);
    setFormIsSellable(false);
    setIsAddOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (item: MenuItem) => {
    setSelectedItem(item);
    setFormName(item.name);
    setFormCategoryId(String(item.categoryId));
    setFormVendorId(item.vendorId ? String(item.vendorId) : "");
    setFormVendorName(item.vendorName || "");
    setFormIsPurchasable(item.isPurchasable !== false);
    setFormIsSellable(item.isSellable === true);
    setFormPurchasePrice(
      item.costPrice !== undefined && item.costPrice !== null
        ? String(item.costPrice)
        : String(item.price || 0)
    );
    setFormSellingPrice(item.isSellable ? String(item.price || "") : "");
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
    if (!formIsPurchasable && !formIsSellable) {
      showToast("Item must be Purchasable, Sellable, or both", "error");
      return;
    }

    const cost = parseFloat(formPurchasePrice) || 0;
    const sellPrice = formIsSellable ? (parseFloat(formSellingPrice) || 0) : cost;

    if (formIsSellable && (!formSellingPrice || parseFloat(formSellingPrice) <= 0)) {
      showToast("Please enter a valid selling price for sellable items", "error");
      return;
    }

    setSaving(true);
    try {
      const payload: CreateMenuItemPayload = {
        name: formName.trim(),
        categoryId: Number(formCategoryId),
        costPrice: cost,
        price: sellPrice,
        isPurchasable: formIsPurchasable,
        isSellable: formIsSellable,
        isAvailable: true,
        vendorId: formVendorId ? Number(formVendorId) : null,
        vendorName: formVendorName.trim() || null,
        description: formDescription.trim() || undefined,
      };

      await menuItemApi.createMenuItem(payload);
      menuItemApi.clearPosMenuCache();
      categoryApi.clearCategoryCache();
      showToast(
        formIsSellable
          ? "Vendor product added (Purchasable & Resellable)!"
          : "Vendor product added (Purchasable Only)!",
        "success"
      );
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
    if (!formIsPurchasable && !formIsSellable) {
      showToast("Item must be Purchasable, Sellable, or both", "error");
      return;
    }

    const cost = parseFloat(formPurchasePrice) || 0;
    const sellPrice = formIsSellable ? (parseFloat(formSellingPrice) || 0) : cost;

    if (formIsSellable && (!formSellingPrice || parseFloat(formSellingPrice) <= 0)) {
      showToast("Please enter a valid selling price for sellable items", "error");
      return;
    }

    setSaving(true);
    try {
      const payload: UpdateMenuItemPayload = {
        name: formName.trim(),
        categoryId: Number(formCategoryId),
        costPrice: cost,
        price: sellPrice,
        isPurchasable: formIsPurchasable,
        isSellable: formIsSellable,
        vendorId: formVendorId ? Number(formVendorId) : null,
        vendorName: formVendorName.trim() || null,
        description: formDescription.trim() || undefined,
      };

      await menuItemApi.updateMenuItem(selectedItem.id, payload);
      menuItemApi.clearPosMenuCache();
      categoryApi.clearCategoryCache();
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
      menuItemApi.clearPosMenuCache();
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
  const purchasableOnlyCount = vendorProducts.filter((p) => p.isSellable === false).length;
  const resellableCount = vendorProducts.filter((p) => p.isPurchasable && p.isSellable !== false).length;
  const totalVendorsCount = availableVendorOptions.length;

  // Margin calculation helpers for form
  const parsedCost = parseFloat(formPurchasePrice) || 0;
  const parsedSell = parseFloat(formSellingPrice) || 0;
  const formProfit = parsedSell - parsedCost;
  const formMarginPct = parsedSell > 0 ? (formProfit / parsedSell) * 100 : 0;

  return (
    <div
      className={cn(dashboardPageClass, "space-y-6 animate-in fade-in duration-500")}
      style={dashboardPageStyle}
    >
      {/* Page Header */}
      <div className={pageHeaderWrapperClass}>
        <div>
          <h1 className={pageHeaderTitleClass}>Vendor Products & Purchasing</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Diiwaangeli waxyaabaha aad vendor-ka ka soo gadaneyso (Purchasable Only) iyo kuwa aad sii iibin karto (Resellable).
          </p>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 px-4">
        {/* Total Products */}
        <div
          onClick={() => setTypeFilter("all")}
          className={cn(
            "trezo-card p-4 flex items-center gap-3.5 cursor-pointer transition-all hover:ring-2 hover:ring-primary/20",
            typeFilter === "all" && "ring-2 ring-primary bg-primary/5"
          )}
        >
          <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Package className="size-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              All Vendor Items
            </p>
            <h3 className="text-lg font-bold text-foreground mt-0.5">{totalProductsCount}</h3>
          </div>
        </div>

        {/* Purchasable Only (Raw supplies / Kitchen) */}
        <div
          onClick={() => setTypeFilter("purchasable_only")}
          className={cn(
            "trezo-card p-4 flex items-center gap-3.5 cursor-pointer transition-all hover:ring-2 hover:ring-blue-500/20",
            typeFilter === "purchasable_only" && "ring-2 ring-blue-500 bg-blue-50/20 dark:bg-blue-950/20"
          )}
        >
          <div className="size-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <ShoppingBag className="size-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
              Purchasable Only
            </p>
            <h3 className="text-lg font-bold text-foreground mt-0.5">{purchasableOnlyCount}</h3>
            <span className="text-[9px] text-muted-foreground">Soo gado kaliya (Raw goods)</span>
          </div>
        </div>

        {/* Resellable (Purchasable & Sellable) */}
        <div
          onClick={() => setTypeFilter("resellable")}
          className={cn(
            "trezo-card p-4 flex items-center gap-3.5 cursor-pointer transition-all hover:ring-2 hover:ring-emerald-500/20",
            typeFilter === "resellable" && "ring-2 ring-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/20"
          )}
        >
          <div className="size-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="size-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              Resellable Items
            </p>
            <h3 className="text-lg font-bold text-foreground mt-0.5">{resellableCount}</h3>
            <span className="text-[9px] text-muted-foreground">Soo gado & sii iibi</span>
          </div>
        </div>

        {/* Active Vendors */}
        <div className="trezo-card p-4 flex items-center gap-3.5">
          <div className="size-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <Building2 className="size-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              Active Vendors
            </p>
            <h3 className="text-lg font-bold text-foreground mt-0.5">{totalVendorsCount}</h3>
            <span className="text-[9px] text-muted-foreground">Suppliers & vendors</span>
          </div>
        </div>
      </div>

      {/* Main Table Box */}
      <div className="bg-white dark:bg-card rounded-xl border border-zinc-200 dark:border-border shadow-sm overflow-hidden mx-4">
        {/* Controls Row */}
        <div className="px-6 py-4 flex flex-wrap items-center gap-4 border-b border-zinc-100 dark:border-border">
          {/* Classification Type Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-zinc-100 dark:bg-muted rounded-lg shrink-0">
            <button
              type="button"
              onClick={() => setTypeFilter("all")}
              className={cn(
                "px-3 py-1.5 rounded-md text-xs font-semibold transition-all",
                typeFilter === "all"
                  ? "bg-white dark:bg-card text-foreground shadow-xs"
                  : "text-zinc-500 hover:text-foreground"
              )}
            >
              All Items ({totalProductsCount})
            </button>
            <button
              type="button"
              onClick={() => setTypeFilter("purchasable_only")}
              className={cn(
                "px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5",
                typeFilter === "purchasable_only"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-zinc-500 hover:text-blue-600"
              )}
            >
              <ShoppingBag className="size-3" />
              Purchasable Only ({purchasableOnlyCount})
            </button>
            <button
              type="button"
              onClick={() => setTypeFilter("resellable")}
              className={cn(
                "px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5",
                typeFilter === "resellable"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-zinc-500 hover:text-emerald-600"
              )}
            >
              <CheckCircle2 className="size-3" />
              Resellable ({resellableCount})
            </button>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs text-zinc-400 font-medium shrink-0">
              <span>Category:</span>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="h-[38px] px-3 border border-zinc-200 dark:border-border rounded-lg outline-none focus:border-primary transition-colors bg-white dark:bg-background cursor-pointer text-xs font-medium text-zinc-700 dark:text-foreground"
              >
                <option value="all">All Categories</option>
                {categoriesWithProducts.map((c) => (
                  <option key={c.id} value={String(c.id)}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 text-xs text-zinc-400 font-medium shrink-0">
              <span>Vendor:</span>
              <select
                value={vendorFilter}
                onChange={(e) => setVendorFilter(e.target.value)}
                className="h-[38px] px-3 border border-zinc-200 dark:border-border rounded-lg outline-none focus:border-primary transition-colors bg-white dark:bg-background cursor-pointer text-xs font-medium text-zinc-700 dark:text-foreground"
              >
                <option value="all">All Vendors</option>
                {availableVendorOptions.map((v) => (
                  <option key={v.name} value={v.name}>
                    {v.name}
                  </option>
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
                placeholder="Search vendor product..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-[38px] pl-9 pr-3 bg-zinc-50 dark:bg-muted border border-zinc-200 dark:border-border rounded-lg outline-none focus:border-primary focus:ring-1 focus:ring-primary/10 transition-all text-xs text-zinc-700 dark:text-foreground"
              />
            </div>

            <Button
              onClick={handleOpenAdd}
              className="h-[38px] px-4 bg-primary !text-white hover:bg-primary/90 hover:!text-white rounded-lg flex items-center gap-2 transition-colors font-semibold text-xs shadow-xs"
            >
              <Plus className="size-4" />
              Add Vendor Product
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="border-t border-zinc-100 dark:border-border overflow-hidden">
          <div className="overflow-x-auto">
            <Table className="w-full">
              <TableHeader className={dashboardTableHeaderClass}>
                <TableRow className={dashboardTableHeadRowClass}>
                  <TableHead className={cn(dashboardTableHeadClass, "text-left")}>No</TableHead>
                  <TableHead className={cn(dashboardTableHeadClass, "text-left")}>Item Name</TableHead>
                  <TableHead className={cn(dashboardTableHeadClass, "text-left")}>Category</TableHead>
                  <TableHead className={cn(dashboardTableHeadClass, "text-left")}>Vendor</TableHead>
                  <TableHead className={cn(dashboardTableHeadClass, "text-left")}>Classification</TableHead>
                  <TableHead className={cn(dashboardTableHeadClass, "text-right")}>Purchase Cost</TableHead>
                  <TableHead className={cn(dashboardTableHeadClass, "text-right")}>Selling Price</TableHead>
                  <TableHead className={cn(dashboardTableHeadClass, "text-right")}>Profit Margin</TableHead>
                  <TableHead className={cn(dashboardTableHeadClass, "text-right")}>Status</TableHead>
                  <TableHead className={cn(dashboardTableHeadClass, "text-right px-6")}>Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i} className="h-14 animate-pulse">
                      {[...Array(10)].map((_, j) => (
                        <TableCell key={j} className="px-6 py-4">
                          <div className="h-4 bg-zinc-100 dark:bg-muted rounded w-full" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : filteredProducts.length > 0 ? (
                  filteredProducts.map((it) => {
                    const cost =
                      it.costPrice !== undefined && it.costPrice !== null
                        ? Number(it.costPrice)
                        : Number(it.price || 0);
                    const isResellable = it.isPurchasable && it.isSellable !== false;
                    const isPurchasableOnly = it.isSellable === false;
                    const sellingPrice = isResellable ? Number(it.price || 0) : null;
                    const profit = sellingPrice !== null ? sellingPrice - cost : null;
                    const profitPct =
                      sellingPrice !== null && sellingPrice > 0
                        ? ((profit || 0) / sellingPrice) * 100
                        : null;

                    return (
                      <TableRow
                        key={it.id}
                        className="border-zinc-100 dark:border-border hover:bg-zinc-50/50 dark:hover:bg-muted/30 transition-colors"
                      >
                        {/* No */}
                        <TableCell className="px-6 py-3 text-[13px] text-zinc-500 font-medium">
                          {it.id}
                        </TableCell>

                        {/* Item Name */}
                        <TableCell className="px-6 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg overflow-hidden flex items-center justify-center shrink-0 border border-zinc-100 dark:border-border bg-primary/5">
                              {it.imageUrl ? (
                                <img
                                  src={it.imageUrl}
                                  alt={it.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : isPurchasableOnly ? (
                                <ShoppingBag className="size-4 text-blue-600 dark:text-blue-400" />
                              ) : (
                                <Package className="size-4 text-primary" />
                              )}
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[13px] font-semibold text-zinc-800 dark:text-zinc-200 leading-tight">
                                {it.name}
                              </span>
                              {it.description && (
                                <span className="text-[10px] text-zinc-400 truncate max-w-[200px] mt-0.5">
                                  {it.description}
                                </span>
                              )}
                            </div>
                          </div>
                        </TableCell>

                        {/* Category */}
                        <TableCell className="px-6 py-3 text-[13px] font-medium text-zinc-600 dark:text-zinc-300">
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

                        {/* Classification */}
                        <TableCell className="px-6 py-3">
                          {isResellable ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[11px] font-semibold">
                              <CheckCircle2 className="size-3 text-emerald-600" />
                              Resellable (Buy & Sell)
                            </span>
                          ) : isPurchasableOnly ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-[11px] font-semibold">
                              <ShoppingBag className="size-3 text-blue-600" />
                              Purchasable Only
                            </span>
                          ) : (
                            <span className="text-xs text-zinc-400">Standard</span>
                          )}
                        </TableCell>

                        {/* Purchase Price */}
                        <TableCell className="px-6 py-3 text-[13px] font-bold text-zinc-800 dark:text-zinc-100 text-right tabular-nums">
                          ${cost.toFixed(2)}
                        </TableCell>

                        {/* Selling Price */}
                        <TableCell className="px-6 py-3 text-right">
                          {isResellable && sellingPrice !== null ? (
                            <span className="text-[13px] font-bold text-primary tabular-nums">
                              ${sellingPrice.toFixed(2)}
                            </span>
                          ) : (
                            <span className="text-[11px] text-zinc-400 italic">Not sellable</span>
                          )}
                        </TableCell>

                        {/* Profit Margin */}
                        <TableCell className="px-6 py-3 text-right">
                          {isResellable && profit !== null && profitPct !== null ? (
                            <div className="flex flex-col items-end">
                              <span
                                className={cn(
                                  "text-[12px] font-bold tabular-nums",
                                  profit >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600"
                                )}
                              >
                                {profit >= 0 ? `+$${profit.toFixed(2)}` : `-$${Math.abs(profit).toFixed(2)}`}
                              </span>
                              <span className="text-[10px] text-zinc-400">
                                {profitPct >= 0 ? `${profitPct.toFixed(0)}% margin` : "Loss"}
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-zinc-400">—</span>
                          )}
                        </TableCell>

                        {/* Status */}
                        <TableCell className="px-6 py-3 text-right">
                          <span
                            className={cn(
                              "text-[10px] font-semibold px-2 py-0.5 rounded-full border",
                              it.isAvailable
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800"
                                : "bg-zinc-100 text-zinc-500 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700"
                            )}
                          >
                            {it.isAvailable ? "Active" : "Inactive"}
                          </span>
                        </TableCell>

                        {/* Actions */}
                        <TableCell className="px-6 py-3 text-right">
                          <div className="flex justify-end gap-1.5">
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
                    <TableCell colSpan={10} className="px-6 py-12 text-center text-zinc-500 text-sm">
                      No vendor products found matching the criteria.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Table Footer */}
        <div className="py-2.5 px-6 flex items-center justify-between text-xs text-zinc-400 border-t border-zinc-100 dark:border-border bg-zinc-50/30 dark:bg-muted/10">
          <div>
            Showing {filteredProducts.length} of {vendorProducts.length} vendor items
          </div>
          <div className="flex items-center gap-4">
            <span>
              Purchasable Only: <strong>{purchasableOnlyCount}</strong>
            </span>
            <span>
              Resellable: <strong>{resellableCount}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* ADD VENDOR PRODUCT MODAL */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-lg bg-card text-card-foreground border-border p-6 rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-foreground flex items-center gap-2">
              <Package className="size-5 text-primary" />
              <span>Add Vendor Product</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Diiwaangeli badeecad aad vendor ka soo gadaneyso (Purchasable Only ama Resellable).
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateProduct} className="space-y-4 mt-2">
            {/* Classification: Purchasable & Sellable Tick Checkboxes */}
            <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-[#2a2a2a] bg-zinc-50/70 dark:bg-[#161616] space-y-2.5">
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2.5 cursor-pointer group select-none">
                  <span
                    onClick={() => setFormIsPurchasable(!formIsPurchasable)}
                    className={cn(
                      "w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-150 shrink-0",
                      formIsPurchasable
                        ? "bg-primary border-primary"
                        : "border-zinc-300 dark:border-zinc-600 group-hover:border-primary/50"
                    )}
                  >
                    {formIsPurchasable && (
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </span>
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">Purchasable</span>
                    <span className="text-[10px] text-zinc-400">Waa soo gadaneynaa</span>
                  </div>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer group select-none">
                  <span
                    onClick={() => setFormIsSellable(!formIsSellable)}
                    className={cn(
                      "w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-150 shrink-0",
                      formIsSellable
                        ? "bg-primary border-primary"
                        : "border-zinc-300 dark:border-zinc-600 group-hover:border-primary/50"
                    )}
                  >
                    {formIsSellable && (
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </span>
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">Sellable</span>
                    <span className="text-[10px] text-zinc-400">Waan sii iibinaynaa</span>
                  </div>
                </label>
              </div>

              {/* Explanatory banner */}
              <div className="text-[11px] font-medium pt-1 border-t border-zinc-200/60 dark:border-[#2a2a2a]">
                {formIsPurchasable && !formIsSellable && (
                  <span className="text-blue-600 dark:text-blue-400">
                    📦 <strong>Purchasable Only:</strong> Waa wax vendor-ka laga soo gato kaliya (raw materials, supplies, ingredients). Aan macaamiisha loo iibinayn.
                  </span>
                )}
                {formIsPurchasable && formIsSellable && (
                  <span className="text-emerald-600 dark:text-emerald-400">
                    ✨ <strong>Resellable:</strong> Waa badeecad la soo gadano oo macaamiisha dib looga sii iibiyo (waxaa la gelinayaa Qiimaha Soo Iibsiga & Qiimaha Iibka).
                  </span>
                )}
                {!formIsPurchasable && formIsSellable && (
                  <span className="text-amber-600 dark:text-amber-400">
                    ☕ <strong>Sellable Only:</strong> Waa cunto/cabitaan toos ah oo la iibinayo.
                  </span>
                )}
              </div>
            </div>

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
                placeholder="e.g. Arabica Coffee Beans 1kg ama Coca-Cola 330ml"
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

            {/* If custom vendor */}
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

            {/* Pricing Section */}
            <div className={cn("grid gap-3.5", formIsSellable ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1")}>
              {/* Purchase Cost */}
              <div className="space-y-1.5">
                <label className={formLabelClass}>
                  Purchase Price (Cost aan ku soo gadany) <span className="text-rose-500">*</span>
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
                <p className="text-[10px] text-muted-foreground">
                  Qiimaha aad vendor-ka kaga soo iibsatay.
                </p>
              </div>

              {/* Selling Price (Only if Sellable) */}
              {formIsSellable && (
                <div className="space-y-1.5 animate-in fade-in duration-200">
                  <label className={formLabelClass}>
                    Selling Price (Qiimaha aad sii iibinayso) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground">
                      $
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required={formIsSellable}
                      value={formSellingPrice}
                      onChange={(e) => setFormSellingPrice(e.target.value)}
                      placeholder="0.00"
                      className={cn(formInputClass, "pl-8 font-bold tabular-nums text-primary")}
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    Qiimaha macaamiisha cafe-ga/POS looga iibinayo.
                  </p>
                </div>
              )}
            </div>

            {/* Profit margin live preview when Sellable */}
            {formIsSellable && parsedCost > 0 && parsedSell > 0 && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-lg flex items-center justify-between text-xs">
                <span className="font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                  <TrendingUp className="size-3.5" />
                  Expected Profit per Unit:
                </span>
                <span className="font-bold text-emerald-700 dark:text-emerald-300 tabular-nums">
                  ${formProfit.toFixed(2)} ({formMarginPct.toFixed(1)}% margin)
                </span>
              </div>
            )}

            {/* Description / Notes */}
            <div className="space-y-1.5">
              <label className={formLabelClass}>Notes / Description</label>
              <textarea
                rows={2}
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Optional notes, supplier code, or packaging info..."
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
        <DialogContent className="sm:max-w-lg bg-card text-card-foreground border-border p-6 rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-foreground flex items-center gap-2">
              <Edit className="size-5 text-primary" />
              <span>Edit Vendor Product</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Beddel faahfaahinta, nooca badeecada (Purchasable / Sellable), iyo qiimaha.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUpdateProduct} className="space-y-4 mt-2">
            {/* Classification Checkboxes */}
            <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-[#2a2a2a] bg-zinc-50/70 dark:bg-[#161616] space-y-2.5">
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2.5 cursor-pointer group select-none">
                  <span
                    onClick={() => setFormIsPurchasable(!formIsPurchasable)}
                    className={cn(
                      "w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-150 shrink-0",
                      formIsPurchasable
                        ? "bg-primary border-primary"
                        : "border-zinc-300 dark:border-zinc-600 group-hover:border-primary/50"
                    )}
                  >
                    {formIsPurchasable && (
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </span>
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">Purchasable</span>
                    <span className="text-[10px] text-zinc-400">Waa soo gadaneynaa</span>
                  </div>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer group select-none">
                  <span
                    onClick={() => setFormIsSellable(!formIsSellable)}
                    className={cn(
                      "w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-150 shrink-0",
                      formIsSellable
                        ? "bg-primary border-primary"
                        : "border-zinc-300 dark:border-zinc-600 group-hover:border-primary/50"
                    )}
                  >
                    {formIsSellable && (
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </span>
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">Sellable</span>
                    <span className="text-[10px] text-zinc-400">Waan sii iibinaynaa</span>
                  </div>
                </label>
              </div>

              {/* Explanatory banner */}
              <div className="text-[11px] font-medium pt-1 border-t border-zinc-200/60 dark:border-[#2a2a2a]">
                {formIsPurchasable && !formIsSellable && (
                  <span className="text-blue-600 dark:text-blue-400">
                    📦 <strong>Purchasable Only:</strong> Waa wax vendor-ka laga soo gato kaliya (raw materials, supplies, ingredients). Aan macaamiisha loo iibinayn.
                  </span>
                )}
                {formIsPurchasable && formIsSellable && (
                  <span className="text-emerald-600 dark:text-emerald-400">
                    ✨ <strong>Resellable:</strong> Waa badeecad la soo gadano oo macaamiisha dib looga sii iibiyo (waxaa la gelinayaa Qiimaha Soo Iibsiga & Qiimaha Iibka).
                  </span>
                )}
                {!formIsPurchasable && formIsSellable && (
                  <span className="text-amber-600 dark:text-amber-400">
                    ☕ <strong>Sellable Only:</strong> Waa cunto/cabitaan toos ah oo la iibinayo.
                  </span>
                )}
              </div>
            </div>

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

            {/* Pricing Section */}
            <div className={cn("grid gap-3.5", formIsSellable ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1")}>
              {/* Purchase Cost */}
              <div className="space-y-1.5">
                <label className={formLabelClass}>
                  Purchase Price (Cost aan ku soo gadany) <span className="text-rose-500">*</span>
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

              {/* Selling Price (if sellable) */}
              {formIsSellable && (
                <div className="space-y-1.5 animate-in fade-in duration-200">
                  <label className={formLabelClass}>
                    Selling Price (Qiimaha la sii iibinayo) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground">
                      $
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required={formIsSellable}
                      value={formSellingPrice}
                      onChange={(e) => setFormSellingPrice(e.target.value)}
                      className={cn(formInputClass, "pl-8 font-bold tabular-nums text-primary")}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Margin preview in edit */}
            {formIsSellable && parsedCost > 0 && parsedSell > 0 && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-lg flex items-center justify-between text-xs">
                <span className="font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                  <TrendingUp className="size-3.5" />
                  Expected Profit per Unit:
                </span>
                <span className="font-bold text-emerald-700 dark:text-emerald-300 tabular-nums">
                  ${formProfit.toFixed(2)} ({formMarginPct.toFixed(1)}% margin)
                </span>
              </div>
            )}

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
              <div className="bg-muted/40 p-4 rounded-xl space-y-3.5 border border-border">
                {/* Name & Classification badge */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">Item Name</p>
                    <p className="text-base font-bold text-foreground mt-0.5">{selectedItem.name}</p>
                  </div>
                  <div>
                    {selectedItem.isPurchasable && selectedItem.isSellable !== false ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[10px] font-bold">
                        <CheckCircle2 className="size-3 text-emerald-600" />
                        Resellable
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-[10px] font-bold">
                        <ShoppingBag className="size-3 text-blue-600" />
                        Purchasable Only
                      </span>
                    )}
                  </div>
                </div>

                {/* Category & Vendor */}
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

                {/* Pricing & Profit */}
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border/60">
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">Purchase Cost</p>
                    <p className="text-base font-bold text-zinc-800 dark:text-zinc-100 mt-0.5">
                      ${Number(selectedItem.costPrice ?? selectedItem.price ?? 0).toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">Selling Price</p>
                    {selectedItem.isPurchasable && selectedItem.isSellable !== false ? (
                      <p className="text-base font-bold text-primary mt-0.5">
                        ${Number(selectedItem.price || 0).toFixed(2)}
                      </p>
                    ) : (
                      <p className="text-xs text-zinc-400 italic mt-1">Not for sale</p>
                    )}
                  </div>
                </div>

                {/* Profit Margin if resellable */}
                {selectedItem.isPurchasable && selectedItem.isSellable !== false && selectedItem.price > 0 && (
                  <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg border border-emerald-200 dark:border-emerald-800 flex items-center justify-between text-xs">
                    <span className="font-semibold text-emerald-800 dark:text-emerald-300">Unit Profit:</span>
                    <span className="font-bold text-emerald-700 dark:text-emerald-300">
                      +${(Number(selectedItem.price) - Number(selectedItem.costPrice || 0)).toFixed(2)} (
                      {(
                        ((Number(selectedItem.price) - Number(selectedItem.costPrice || 0)) /
                          Number(selectedItem.price)) *
                        100
                      ).toFixed(0)}
                      % margin)
                    </span>
                  </div>
                )}

                {/* Status */}
                <div className="pt-2 border-t border-border/60 flex items-center justify-between">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase">Status</p>
                  <span
                    className={cn(
                      "text-[10px] font-bold px-2 py-0.5 rounded-full border",
                      selectedItem.isAvailable
                        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800"
                        : "bg-zinc-100 text-zinc-500 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700"
                    )}
                  >
                    {selectedItem.isAvailable ? "Active" : "Inactive"}
                  </span>
                </div>

                {/* Notes */}
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
