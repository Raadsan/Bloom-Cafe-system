"use client";

import React, { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Utensils,
  Search,
  Plus,
  Minus,
  ShoppingCart,
  CreditCard,
  Loader2,
  Trash2,
  CheckCircle2,
  Smartphone,
  Banknote,
  Table as TableIcon,
  ChevronRight,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { categoryApi, Category } from "@/lib/api/categoryApi";
import { menuItemApi, MenuItem } from "@/lib/api/menuItemApi";
import { tableApi, Table } from "@/lib/api/tableApi";
import { orderApi } from "@/lib/api/orderApi";
import { paymentApi, PaymentMethod } from "@/lib/api/paymentApi";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import {
  dashboardPageClass,
  dashboardPageStyle,
  pageHeaderTitleClass,
  pageHeaderSubtitleClass,
} from "@/lib/dashboard-ui";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface CartItem extends MenuItem {
  quantity: number;
}

export default function PosPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<MenuItem[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | number>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  // Cart State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedTable, setSelectedTable] = useState<number | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");

  // Modal States
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const { showToast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [cats, items, tbls] = await Promise.all([
          categoryApi.getAllCategories(),
          menuItemApi.getAllMenuItems(),
          tableApi.getAllTables()
        ]);
        setCategories(cats);
        setProducts(items);
        setTables(tbls.filter(t => t.status === 'active'));
      } catch (error) {
        console.error("Failed to fetch POS data", error);
        showToast("Failed to load POS data", "error");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesCategory = selectedCategory === "All" || Number(p.categoryId) === Number(selectedCategory);
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  const addToCart = (product: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: number) => {
    setCart(prev => prev.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId: number, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === productId) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const tax = subtotal * 0.05;
  const total = subtotal + tax;

  const handleCheckout = async () => {
    if (!selectedTable) {
      showToast("Please select a table first", "error");
      return;
    }
    if (cart.length === 0) {
      showToast("Your cart is empty", "error");
      return;
    }

    try {
      setIsProcessing(true);

      // 1. Create Order
      const orderData = {
        tableId: selectedTable,
        items: cart.map(item => ({
          menuItemId: Number(item.id),
          quantity: item.quantity
        }))
      };

      const order = await orderApi.createOrder(orderData);

      // 2. Create Payment (Paid Status)
      await paymentApi.createPayment({
        orderId: order.id.toString(),
        amount: total,
        method: paymentMethod
      });

      showToast("Order placed and paid successfully!", "success");
      setCart([]);
      setSelectedTable(null);
      setIsCheckoutOpen(false);
    } catch (error) {
      console.error("Checkout failed", error);
      showToast("Payment failed. Please try again.", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className={`${dashboardPageClass} flex flex-col h-[calc(100vh-100px)]`} style={dashboardPageStyle}>
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 px-4">
        <div>
          <h1 className={pageHeaderTitleClass}>Restaurant POS</h1>
          <p className={pageHeaderSubtitleClass}>Pay first system - fast & reliable</p>
        </div>
        <div className="relative group w-full md:w-80">
          <Search className="size-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-11 pl-10 pr-4 text-[11px] font-bold bg-white border border-zinc-100 rounded-xl outline-none focus:border-primary/30 focus:ring-4 focus:ring-primary/5 transition-all shadow-sm"
          />
        </div>
      </div>

      <div className="flex flex-1 gap-6 overflow-hidden px-4">
        {/* Products Side */}
        <div className="flex-1 flex flex-col gap-6 overflow-hidden">
          {/* Categories */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide shrink-0">
            <Button
              variant="ghost"
              onClick={() => setSelectedCategory("All")}
              className={cn(
                "rounded-xl px-6 h-9 text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all",
                selectedCategory === "All"
                  ? "bg-primary !text-white shadow-lg shadow-primary/20"
                  : "bg-white border border-zinc-100 text-[#64748B] hover:bg-zinc-50 hover:text-primary"
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
                  "rounded-xl px-6 h-9 text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all",
                  selectedCategory === cat.id
                    ? "bg-primary !text-white shadow-lg shadow-primary/20"
                    : "bg-white border border-zinc-100 text-[#64748B] hover:bg-zinc-50 hover:text-primary"
                )}
              >
                {cat.name}
              </Button>
            ))}
          </div>

          {/* Products Grid */}
          <div className="flex-1 overflow-y-auto pr-2 grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-4">
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="animate-pulse bg-white border border-zinc-100 rounded-2xl h-64 shadow-sm" />
              ))
            ) : filteredProducts.length > 0 ? (
              filteredProducts.map((product) => (
                <div
                  key={product.id}
                  onClick={() => addToCart(product)}
                  className="bg-white rounded-2xl border border-zinc-100 shadow-sm hover:border-primary hover:shadow-xl hover:shadow-primary/5 transition-all p-3 cursor-pointer group flex flex-col"
                >
                  <div className="aspect-[4/3] bg-zinc-50 rounded-xl flex items-center justify-center relative overflow-hidden mb-4">
                    {product.imageUrl ? (
                      <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                    ) : (
                      <Utensils className="size-8 text-zinc-200 group-hover:scale-110 group-hover:text-primary/20 transition-all duration-500" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute bottom-2 right-2 translate-y-12 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                      <div className="bg-primary !text-white p-2 rounded-lg shadow-xl">
                        <Plus className="size-4" />
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 flex flex-col">
                    <p className="text-[9px] font-black text-primary uppercase tracking-[0.2em] mb-1">
                      {categories.find(c => c.id === product.categoryId)?.name || "Main Menu"}
                    </p>
                    <h3 className="font-bold text-[13px] text-[#1E293B] line-clamp-2 leading-tight h-8">{product.name}</h3>
                    <div className="mt-auto pt-3 border-t border-zinc-50 flex items-center justify-between">
                      <span className="text-base font-black text-[#1E293B]">${product.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full flex flex-col items-center justify-center py-20 text-center">
                <Search className="size-10 text-zinc-200 mb-4" />
                <p className="text-[#64748B] font-black uppercase text-[10px] tracking-widest">No products found</p>
              </div>
            )}
          </div>
        </div>

        {/* Cart Side */}
        <div className="w-[400px] shrink-0 pb-4">
          <div className="bg-white h-full flex flex-col rounded-3xl border border-zinc-100 shadow-2xl shadow-zinc-200/50 overflow-hidden">
            {/* Cart Header */}
            <div className="p-6 border-b border-zinc-50 bg-zinc-50/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary rounded-xl shadow-lg shadow-primary/20">
                    <ShoppingCart className="size-4 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-widest text-[#1E293B]">Current Order</h3>
                    <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-tight mt-0.5">{cart.length} unique items</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCart([])}
                  className="h-8 px-3 text-[9px] font-black uppercase tracking-widest text-rose-500 hover:bg-rose-50 rounded-lg"
                >
                  Clear All
                </Button>
              </div>
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {cart.length > 0 ? (
                cart.map((item) => (
                  <div key={item.id} className="flex gap-4 p-3 rounded-2xl hover:bg-zinc-50/50 transition-colors group">
                    <div className="size-16 rounded-xl bg-zinc-100 overflow-hidden shrink-0 border border-zinc-200/50">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-zinc-100">
                          <Utensils className="size-5 text-zinc-300" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-[12px] font-bold text-[#1E293B] line-clamp-1">{item.name}</h4>
                        <button onClick={() => removeFromCart(item.id)} className="text-zinc-300 hover:text-rose-500 transition-colors">
                          <X className="size-4" />
                        </button>
                      </div>
                      <p className="text-[10px] font-black text-primary mt-0.5">${item.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>

                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center gap-3 bg-zinc-50 rounded-lg p-1 border border-zinc-100">
                          <button
                            onClick={() => updateQuantity(item.id, -1)}
                            className="size-7 flex items-center justify-center rounded-md bg-white border border-zinc-200 text-zinc-500 hover:text-primary hover:border-primary transition-all shadow-sm"
                          >
                            <Minus className="size-3" />
                          </button>
                          <span className="text-[11px] font-black text-[#1E293B] w-4 text-center">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, 1)}
                            className="size-7 flex items-center justify-center rounded-md bg-white border border-zinc-200 text-zinc-500 hover:text-primary hover:border-primary transition-all shadow-sm"
                          >
                            <Plus className="size-3" />
                          </button>
                        </div>
                        <span className="text-[12px] font-black text-[#1E293B]">${(item.price * item.quantity).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center py-10">
                  <div className="w-20 h-20 bg-zinc-50 rounded-full flex items-center justify-center mb-4 border border-zinc-100 shadow-inner">
                    <ShoppingCart className="size-8 text-zinc-200" />
                  </div>
                  <h4 className="text-[11px] font-black uppercase tracking-widest text-[#1E293B]">Your cart is empty</h4>
                  <p className="text-[10px] text-zinc-400 mt-2 max-w-[180px]">Add some delicious items to start a new order</p>
                </div>
              )}
            </div>

            {/* Cart Footer */}
            <div className="p-6 bg-zinc-50/50 border-t border-zinc-100 space-y-5">
              <div className="space-y-3">
                <div className="flex justify-between text-[11px] font-bold uppercase tracking-widest text-zinc-400">
                  <span>Subtotal</span>
                  <span className="text-[#1E293B] font-black">${subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-[11px] font-bold uppercase tracking-widest text-zinc-400">
                  <span>Tax (5%)</span>
                  <span className="text-[#1E293B] font-black">${tax.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between items-center pt-4 border-t border-zinc-200/60">
                  <span className="text-sm font-black uppercase tracking-widest text-[#1E293B]">Grand Total</span>
                  <span className="text-2xl font-black text-primary">${total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
              </div>

              <Button
                onClick={() => setIsCheckoutOpen(true)}
                disabled={cart.length === 0}
                className="w-full h-14 text-[11px] font-black uppercase tracking-widest gap-3 bg-primary !text-white hover:bg-primary/90 hover:!text-white rounded-2xl shadow-xl shadow-primary/20 border-none transition-all active:scale-95 disabled:opacity-50 disabled:grayscale"
              >
                <CreditCard className="size-4" />
                Proceed to Checkout
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Checkout Modal */}
      <Dialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
        <DialogContent className="sm:max-w-[500px] bg-white p-0 overflow-hidden border-none shadow-2xl rounded-3xl">
          <DialogHeader className="p-8 bg-primary !text-white">
            <DialogTitle className="text-2xl font-black uppercase tracking-tight flex items-center gap-3">
              <CreditCard className="size-6" />
              Finalize Payment
            </DialogTitle>
            <p className="text-[11px] font-bold text-white/70 uppercase tracking-widest mt-2">Complete the payment to send order to kitchen</p>
          </DialogHeader>

          <div className="p-8 space-y-8">
            {/* Table Selection */}
            <div className="space-y-4">
              <label className="text-[11px] font-black uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                <TableIcon className="size-3.5" />
                Select Table *
              </label>
              <div className="grid grid-cols-4 gap-3">
                {tables.map(table => (
                  <button
                    key={table.id}
                    onClick={() => setSelectedTable(table.id)}
                    className={cn(
                      "h-12 rounded-xl border-2 font-black text-[11px] uppercase tracking-widest transition-all",
                      selectedTable === table.id
                        ? "bg-primary border-primary text-white shadow-lg shadow-primary/20"
                        : "bg-zinc-50 border-zinc-100 text-[#1E293B] hover:border-zinc-200"
                    )}
                  >
                    T-{table.number}
                  </button>
                ))}
              </div>
            </div>

            {/* Payment Method */}
            <div className="space-y-4">
              <label className="text-[11px] font-black uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                <Banknote className="size-3.5" />
                Payment Method *
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'cash', name: 'Cash', icon: Banknote },
                  { id: 'card', name: 'Card', icon: CreditCard },
                  { id: 'online', name: 'EVC / Online', icon: Smartphone },
                ].map(method => (
                  <button
                    key={method.id}
                    onClick={() => setPaymentMethod(method.id as PaymentMethod)}
                    className={cn(
                      "flex flex-col items-center justify-center gap-2 h-20 rounded-2xl border-2 transition-all",
                      paymentMethod === method.id
                        ? "bg-primary/5 border-primary text-primary shadow-inner"
                        : "bg-zinc-50 border-zinc-100 text-[#64748B] hover:border-zinc-200"
                    )}
                  >
                    <method.icon className="size-5" />
                    <span className="text-[9px] font-black uppercase tracking-widest">{method.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Amount Summary */}
            <div className="p-6 bg-zinc-50 rounded-3xl border border-zinc-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Amount to Pay</p>
                  <h4 className="text-3xl font-black text-[#1E293B] mt-1">${total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h4>
                </div>
                <div className="size-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="size-6" />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="p-8 pt-0 flex gap-4">
            <Button
              variant="ghost"
              onClick={() => setIsCheckoutOpen(false)}
              className="flex-1 h-14 rounded-2xl font-black text-[11px] uppercase tracking-widest text-zinc-400 hover:bg-zinc-50"
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCheckout}
              disabled={isProcessing}
              className="flex-[2] h-14 rounded-2xl font-black text-[11px] uppercase tracking-widest bg-primary !text-white hover:bg-primary/90 hover:!text-white shadow-xl shadow-primary/30"
            >
              {isProcessing ? (
                <Loader2 className="size-5 animate-spin" />
              ) : (
                <div className="flex items-center gap-2">
                  Place Order & Pay
                  <ChevronRight className="size-4" />
                </div>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
