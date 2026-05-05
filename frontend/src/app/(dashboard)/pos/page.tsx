"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Utensils, Search, Plus, Minus, ShoppingCart, CreditCard, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { categoryApi, Category } from "@/lib/api/categoryApi";
import { menuItemApi, MenuItem } from "@/lib/api/menuItemApi";
import { cn } from "@/lib/utils";

export default function PosPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<MenuItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [cats, items] = await Promise.all([
          categoryApi.getAllCategories(),
          menuItemApi.getAllMenuItems()
        ]);
        setCategories(cats);
        setProducts(items);
      } catch (error) {
        console.error("Failed to fetch POS data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredProducts = products.filter(p => {
    const matchesCategory = selectedCategory === "All" || p.categoryId === selectedCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground uppercase">POS System</h1>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-2">Process orders and manage real-time sales.</p>
        </div>
        <div className="relative group w-full md:w-80">
          <Search className="size-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-[#605DFF] transition-colors" />
          <input 
            type="text" 
            placeholder="Search products..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-11 pl-10 pr-4 text-[11px] font-bold bg-white border border-zinc-100 rounded-xl outline-none focus:border-[#605DFF]/30 focus:ring-4 focus:ring-[#605DFF]/5 transition-all shadow-sm" 
          />
        </div>
      </div>

      <div className="flex flex-1 gap-6 overflow-hidden">
        {/* Products Side */}
        <div className="flex-1 flex flex-col gap-6 overflow-hidden">

        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide shrink-0">
          <Button 
            variant="ghost" 
            onClick={() => setSelectedCategory("All")}
            className={cn(
              "rounded-xl px-6 h-9 text-[10px] font-bold uppercase tracking-widest whitespace-nowrap transition-all",
              selectedCategory === "All" 
                ? "bg-[#605DFF] text-white shadow-lg shadow-[#605DFF]/20" 
                : "bg-white border border-zinc-100 text-[#64748B] hover:bg-zinc-50 hover:text-[#605DFF]"
            )}
          >
            All Items
          </Button>
          {categories.map((cat) => (
            <Button 
              key={cat.id} 
              variant="ghost" 
              onClick={() => setSelectedCategory(cat.id)}
              className={cn(
                "rounded-xl px-6 h-9 text-[10px] font-bold uppercase tracking-widest whitespace-nowrap transition-all",
                selectedCategory === cat.id 
                  ? "bg-[#605DFF] text-white shadow-lg shadow-[#605DFF]/20" 
                  : "bg-white border border-zinc-100 text-[#64748B] hover:bg-zinc-50 hover:text-[#605DFF]"
              )}
            >
              {cat.name}
            </Button>
          ))}
        </div>

        {/* Products Grid */}
        <div className="flex-1 overflow-y-auto pr-2 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {loading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <Card key={i} className="animate-pulse border-border shadow-sm rounded-xl overflow-hidden h-64 bg-muted/20" />
            ))
          ) : filteredProducts.length > 0 ? (
            filteredProducts.map((product) => (
              <div key={product.id} className="trezo-card group cursor-pointer hover:border-primary/50 transition-all p-0 overflow-hidden flex flex-col">
                <div className="aspect-[4/3] bg-zinc-50 flex items-center justify-center relative overflow-hidden">
                  {product.imageUrl ? (
                    <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <Utensils className="size-8 text-zinc-200 group-hover:scale-110 group-hover:text-primary/20 transition-all duration-500" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/5 transition-colors" />
                  <div className="absolute bottom-3 right-3 translate-y-12 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                    <Button size="icon" className="rounded-xl shadow-xl h-9 w-9 bg-[#605DFF] text-white hover:scale-110 transition-transform border-none">
                      <Plus className="size-4" />
                    </Button>
                  </div>
                </div>
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <p className="text-[9px] font-bold text-[#605DFF] uppercase tracking-[0.2em] mb-1">
                      {categories.find(c => c.id === product.categoryId)?.name || "Guest Menu"}
                    </p>
                    <p className="font-bold text-[13px] text-[#1E293B] line-clamp-1">{product.name}</p>
                  </div>
                  <p className="text-lg font-black mt-2 text-[#1E293B]">${product.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full flex flex-col items-center justify-center py-20 text-center">
              <Search className="size-10 text-muted-foreground/20 mb-4" />
              <p className="text-muted-foreground font-bold uppercase text-xs tracking-widest">No products found</p>
            </div>
          )}
        </div>
      </div>

      {/* Cart Side */}
      <div className="w-[380px] shrink-0">
        <div className="trezo-card h-full flex flex-col p-0 overflow-hidden shadow-xl border-zinc-100">
          <div className="bg-zinc-50/50 p-6 border-b border-zinc-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingCart className="size-4 text-[#605DFF]" />
                <h3 className="text-xs font-bold uppercase tracking-widest text-[#1E293B]">Current Order</h3>
              </div>
              <span className="text-[10px] font-bold text-white bg-[#605DFF] px-2 py-0.5 rounded-full">0 Items</span>
            </div>
          </div>
          <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
             <div className="flex items-center justify-center h-full text-center flex-col gap-4">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                  <ShoppingCart className="size-8 text-muted-foreground/30" />
                </div>
                <p className="text-muted-foreground font-medium uppercase text-xs tracking-widest">Cart is empty</p>
             </div>
          </CardContent>
          <div className="p-6 bg-zinc-50/30 border-t border-zinc-100 space-y-5">
            <div className="space-y-3">
              <div className="flex justify-between text-[11px] font-bold uppercase tracking-widest text-[#64748B]">
                <span>Subtotal</span>
                <span className="text-[#1E293B]">$0.00</span>
              </div>
              <div className="flex justify-between text-[11px] font-bold uppercase tracking-widest text-[#64748B]">
                <span>Tax (5%)</span>
                <span className="text-[#1E293B]">$0.00</span>
              </div>
              <div className="flex justify-between items-center pt-4 border-t border-zinc-100">
                <span className="text-sm font-black uppercase tracking-widest text-[#1E293B]">Total</span>
                <span className="text-2xl font-black text-[#605DFF]">$0.00</span>
              </div>
            </div>
            <Button className="w-full h-14 text-[11px] font-black uppercase tracking-widest gap-3 bg-[#605DFF] hover:bg-[#4E4BCB] text-white rounded-xl shadow-lg shadow-[#605DFF]/20 border-none transition-all">
              <CreditCard className="size-4" />
              Proceed to Payment
            </Button>
        </div>
      </div>
    </div>
    </div>
  </div>
  );
}
