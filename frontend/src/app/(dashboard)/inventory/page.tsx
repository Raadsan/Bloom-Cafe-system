"use client";

import React, { useState, useEffect, useMemo } from "react";
import { 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Package, 
  Filter,
  ChevronDown,
  History
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
import { ingredientApi, Ingredient } from "@/lib/api/ingredientApi";
import { useToast } from "@/components/ui/toast";
import Link from "next/link";

export default function InventoryPage() {
  const { showToast } = useToast();
  const { canAdd: checkAdd, canEdit: checkEdit, canDelete: checkDelete } = usePermissions();
  
  const canAdd = checkAdd("/inventory");
  const canEdit = checkEdit("/inventory");
  const canDelete = checkDelete("/inventory");

  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [saving, setSaving] = useState(false);

  // Modal states
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedIngredient, setSelectedIngredient] = useState<Ingredient | null>(null);

  // Form states
  const [formName, setFormName] = useState("");
  const [formUnit, setFormUnit] = useState("");
  const [formStock, setFormStock] = useState<number>(0);
  const [formMinLevel, setFormMinLevel] = useState<number>(0);
  const [formCost, setFormCost] = useState<number>(0);

  const fetchIngredients = async () => {
    try {
      setLoading(true);
      const data = await ingredientApi.getAllIngredients();
      setIngredients(data);
    } catch (error) {
      console.error("Failed to fetch ingredients:", error);
      showToast("Failed to load stock data", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIngredients();
  }, []);

  const filteredIngredients = useMemo(() => {
    return ingredients.filter((ing) => {
      const matchesSearch = ing.name.toLowerCase().includes(search.toLowerCase());
      const isLow = ing.stockQuantity <= ing.minStockLevel;
      const isOut = ing.stockQuantity <= 0;
      
      let matchesStatus = true;
      if (statusFilter === "low") matchesStatus = isLow && !isOut;
      if (statusFilter === "out") matchesStatus = isOut;
      if (statusFilter === "normal") matchesStatus = !isLow;

      return matchesSearch && matchesStatus;
    });
  }, [ingredients, search, statusFilter]);

  const openAddModal = () => {
    setFormName("");
    setFormUnit("");
    setFormStock(0);
    setFormMinLevel(0);
    setFormCost(0);
    setIsAddOpen(true);
  };

  const openEditModal = (ing: Ingredient) => {
    setSelectedIngredient(ing);
    setFormName(ing.name);
    setFormUnit(ing.unit);
    setFormStock(ing.stockQuantity);
    setFormMinLevel(ing.minStockLevel);
    setFormCost(ing.costPerUnit || 0);
    setIsEditOpen(true);
  };

  const openDeleteModal = (ing: Ingredient) => {
    setSelectedIngredient(ing);
    setIsDeleteOpen(true);
  };

  const handleSave = async () => {
    if (!formName || !formUnit) {
      showToast("Name and unit are required", "error");
      return;
    }

    try {
      setSaving(true);
      if (isEditOpen && selectedIngredient) {
        await ingredientApi.updateIngredient(selectedIngredient.id, {
          name: formName,
          unit: formUnit,
          stockQuantity: formStock,
          minStockLevel: formMinLevel,
          costPerUnit: formCost
        });
        showToast("Ingredient updated successfully", "success");
      } else {
        await ingredientApi.createIngredient({
          name: formName,
          unit: formUnit,
          stockQuantity: formStock,
          minStockLevel: formMinLevel,
          costPerUnit: formCost
        });
        showToast("Ingredient added successfully", "success");
      }
      setIsAddOpen(false);
      setIsEditOpen(false);
      fetchIngredients();
    } catch (error) {
      console.error("Failed to save ingredient:", error);
      showToast("Failed to save ingredient", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedIngredient) return;
    try {
      setSaving(true);
      await ingredientApi.deleteIngredient(selectedIngredient.id);
      showToast("Ingredient deleted successfully", "success");
      setIsDeleteOpen(false);
      fetchIngredients();
    } catch (error) {
      console.error("Failed to delete ingredient:", error);
      showToast("Failed to delete ingredient", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground uppercase">Current Stock</h1>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-3">
            Monitor and manage your restaurant inventory levels.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/inventory/movements">
            <Button variant="outline" className="h-[42px] px-4 rounded-lg font-bold border-zinc-100 hover:bg-zinc-50 shadow-sm text-[#64748B]">
              <History className="mr-2 size-4 text-[#605DFF]" /> Stock Movements
            </Button>
          </Link>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-xl border border-zinc-100 shadow-sm overflow-hidden">
        <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-zinc-50/30">
          <div>
            <h3 className="text-sm font-bold text-foreground">Stock Inventory Feed</h3>
            <p className="text-[12px] font-medium text-muted-foreground mt-1">Real-time inventory levels</p>
          </div>
          
          <div className="flex flex-col md:flex-row items-center gap-3">
            <div className="relative group w-full md:w-64">
              <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-[#605DFF] transition-colors" />
              <input
                type="text"
                placeholder="Search ingredients..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-[14.5px] font-medium bg-white border border-zinc-100 rounded-lg outline-none focus:border-[#605DFF]/30 focus:ring-4 focus:ring-[#605DFF]/5 transition-all shadow-sm"
              />
            </div>
            
            <div className="relative">
              <Filter className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="appearance-none pl-9 pr-9 py-2.5 text-[14px] font-medium bg-white border border-zinc-100 rounded-lg outline-none focus:border-[#605DFF]/30 shadow-sm cursor-pointer min-w-[140px]"
              >
                <option value="all">All Status</option>
                <option value="normal">In Stock</option>
                <option value="low">Low Stock</option>
                <option value="out">Out of Stock</option>
              </select>
              <ChevronDown className="size-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            </div>

            {canAdd && (
              <Button onClick={openAddModal} className="h-[42px] px-6 rounded-lg bg-[#605DFF] text-white hover:bg-[#4E4BCB] font-bold border-none shadow-md whitespace-nowrap text-[14.5px]">
                <Plus className="mr-2 size-4" /> Add Ingredient
              </Button>
            )}
          </div>
        </div>

        <div className="border-t border-zinc-100">
          <Table>
            <TableHeader className="bg-zinc-50/50">
              <TableRow className="border-zinc-100 hover:bg-transparent">
                <TableHead className="px-6 py-5 text-[11px] font-bold uppercase tracking-widest text-[#64748B]">Item ID</TableHead>
                <TableHead className="px-6 py-5 text-[11px] font-bold uppercase tracking-widest text-[#64748B]">Ingredient Name</TableHead>
                <TableHead className="px-6 py-5 text-[11px] font-bold uppercase tracking-widest text-[#64748B]">Current Stock</TableHead>
                <TableHead className="px-6 py-5 text-[11px] font-bold uppercase tracking-widest text-[#64748B]">Min. Level</TableHead>
                <TableHead className="px-6 py-5 text-[11px] font-bold uppercase tracking-widest text-[#64748B] text-center">Status</TableHead>
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
              ) : filteredIngredients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <Package className="size-12 text-zinc-200 mb-4" />
                      <p className="text-[#64748B] font-bold uppercase text-[11px] tracking-widest">No ingredients found</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredIngredients.map((ing) => {
                  const isOut = ing.stockQuantity <= 0;
                  const isLow = ing.stockQuantity <= ing.minStockLevel;

                  return (
                    <TableRow key={ing.id} className="border-zinc-50 hover:bg-zinc-50/30 transition-colors group">
                      <TableCell className="px-6 py-5 text-[13px] font-medium text-[#1E293B]">
                        #{ing.id}
                      </TableCell>
                      <TableCell className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center text-[#64748B]">
                            <Package className="size-4" />
                          </div>
                          <p className="font-bold text-[14px] text-[#1E293B] uppercase tracking-tight">{ing.name}</p>
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-5 text-[13px] font-bold text-[#1E293B]">
                        {ing.stockQuantity} <span className="text-[10px] text-muted-foreground uppercase ml-1 font-medium">{ing.unit}</span>
                      </TableCell>
                      <TableCell className="px-6 py-5 text-[13px] text-[#64748B]">
                        {ing.minStockLevel} <span className="text-[10px] text-zinc-400 uppercase ml-1">{ing.unit}</span>
                      </TableCell>
                      <TableCell className="px-6 py-5 text-center">
                        <span className={`px-3 py-1 rounded-md text-[11px] font-bold uppercase tracking-widest inline-flex items-center gap-1.5 ${
                          isOut ? "bg-rose-100 text-rose-700" : 
                          isLow ? "bg-amber-100 text-amber-700" : 
                          "bg-emerald-100 text-emerald-700"
                        }`}>
                          {isOut ? "Out of Stock" : isLow ? "Low Stock" : "In Stock"}
                        </span>
                      </TableCell>
                      <TableCell className="px-6 py-5 text-right">
                        <div className="flex justify-end gap-2">
                          {canEdit && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => openEditModal(ing)} 
                              className="h-8 w-8 p-0 text-[#64748B] hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                            >
                              <Edit className="size-4" />
                            </Button>
                          )}
                          {canDelete && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => openDeleteModal(ing)} 
                              className="h-8 w-8 p-0 text-[#64748B] hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
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

      {/* ADD / EDIT MODAL */}
      <Dialog open={isAddOpen || isEditOpen} onOpenChange={(open) => { if(!open) { setIsAddOpen(false); setIsEditOpen(false); } }}>
        <DialogContent className="sm:max-w-[500px] bg-white border-zinc-100 p-0 overflow-hidden">
          <div className="p-6 border-b border-zinc-100">
            <DialogTitle className="text-xl font-bold">
              {isEditOpen ? "Update Ingredient" : "Add New Ingredient"}
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground mt-1">
              {isEditOpen ? "Update the stock levels and details for this ingredient." : "Register a new ingredient to your inventory tracking system."}
            </DialogDescription>
          </div>
          
          <div className="p-6 grid grid-cols-2 gap-5">
            <div className="col-span-2 space-y-2">
              <label className="text-sm font-bold text-[#1E293B]">Ingredient Name *</label>
              <input
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g. Tomato, Flour, Milk"
                className="w-full px-4 py-2.5 bg-white border border-zinc-200 rounded-lg outline-none focus:border-[#605DFF]/30 focus:ring-2 focus:ring-[#605DFF]/10 transition-all text-sm font-medium"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-bold text-[#1E293B]">Measurement Unit *</label>
              <input
                type="text"
                value={formUnit}
                onChange={(e) => setFormUnit(e.target.value)}
                placeholder="e.g. kg, pcs, litters"
                className="w-full px-4 py-2.5 bg-white border border-zinc-200 rounded-lg outline-none focus:border-[#605DFF]/30 focus:ring-2 focus:ring-[#605DFF]/10 transition-all text-sm font-medium"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-[#1E293B]">Current Stock</label>
              <input
                type="number"
                value={formStock}
                onChange={(e) => setFormStock(Number(e.target.value))}
                className="w-full px-4 py-2.5 bg-white border border-zinc-200 rounded-lg outline-none focus:border-[#605DFF]/30 focus:ring-2 focus:ring-[#605DFF]/10 transition-all text-sm font-medium"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-[#1E293B]">Min. Level (Alert)</label>
              <input
                type="number"
                value={formMinLevel}
                onChange={(e) => setFormMinLevel(Number(e.target.value))}
                className="w-full px-4 py-2.5 bg-white border border-zinc-200 rounded-lg outline-none focus:border-[#605DFF]/30 focus:ring-2 focus:ring-[#605DFF]/10 transition-all text-sm font-medium"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-[#1E293B]">Cost per Unit</label>
              <input
                type="number"
                value={formCost}
                onChange={(e) => setFormCost(Number(e.target.value))}
                className="w-full px-4 py-2.5 bg-white border border-zinc-200 rounded-lg outline-none focus:border-[#605DFF]/30 focus:ring-2 focus:ring-[#605DFF]/10 transition-all text-sm font-medium"
              />
            </div>
          </div>

          <DialogFooter className="p-6 bg-zinc-50/50 border-t border-zinc-100 gap-3">
            <Button variant="outline" onClick={() => { setIsAddOpen(false); setIsEditOpen(false); }} className="rounded-lg font-bold px-6 h-11" disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSave} className="bg-[#605DFF] hover:bg-[#4E4BCB] text-white rounded-lg font-bold border-none px-8 h-11" disabled={saving}>
              {saving ? "Saving..." : isEditOpen ? "Update Item" : "Create Item"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DELETE MODAL */}
      <Dialog open={isDeleteOpen} onOpenChange={(open) => { if(!open) setIsDeleteOpen(false); }}>
        <DialogContent className="sm:max-w-[440px] bg-white border-zinc-100">
          <DialogTitle className="sr-only">Delete Ingredient</DialogTitle>
          <div className="p-6 flex flex-col items-center text-center pt-10">
            <div className="w-16 h-16 rounded-full bg-rose-100 flex items-center justify-center mb-4">
              <Trash2 className="size-8 text-rose-600" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">Delete Item?</h3>
            <p className="text-sm text-muted-foreground">
              Are you sure you want to delete <span className="font-bold text-foreground">"{selectedIngredient?.name}"</span> from inventory? 
              This action cannot be undone.
            </p>
          </div>
          <DialogFooter className="p-6 gap-3">
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)} className="rounded-lg font-bold px-6 h-11" disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleDelete} className="bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold border-none px-6 h-11" disabled={saving}>
              {saving ? "Deleting..." : "Yes, Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
