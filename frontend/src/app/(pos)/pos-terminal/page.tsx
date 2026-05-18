"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  Utensils,
  Search,
  Plus,
  Minus,
  ShoppingCart,
  CreditCard,
  Loader2,
  CheckCircle2,
  Smartphone,
  Banknote,
  X,
  RefreshCw,
  LayoutGrid,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  User,
  HelpCircle,
  Printer,
  Pause,
  Calculator,
  Maximize,
  History,
  RotateCw,
  CircleDollarSign,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { categoryApi, Category } from "@/lib/api/categoryApi";
import { menuItemApi, MenuItem } from "@/lib/api/menuItemApi";
import { tableApi, Table } from "@/lib/api/tableApi";
import { orderApi } from "@/lib/api/orderApi";
import { paymentApi, PaymentMethod } from "@/lib/api/paymentApi";
import { customerApi, Customer } from "@/lib/api/customerApi";
import { receiptSettingsApi, ReceiptSettings } from "@/lib/api/receiptSettingsApi";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
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

export default function PosTerminalPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<MenuItem[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | number>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  const [cart, setCart] = useState<CartItem[]>([]);

  useEffect(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('pos-cart') : null;
    if (saved) {
      try { setCart(JSON.parse(saved)); } catch (e) { console.error(e); }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('pos-cart', JSON.stringify(cart));
    window.dispatchEvent(new CustomEvent('cart-updated', { detail: cart.reduce((sum, i) => sum + i.quantity, 0) }));
  }, [cart]);



  const [selectedTable, setSelectedTable] = useState<number | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<number | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [discount, setDiscount] = useState(0);
  const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false);
  const [tempDiscount, setTempDiscount] = useState("0");
  const [discountType, setDiscountType] = useState<"percentage" | "fixed">("percentage");
  const [isRecentOrdersOpen, setIsRecentOrdersOpen] = useState(false);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [receiptSettings, setReceiptSettings] = useState<ReceiptSettings | null>(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(24);

  const { showToast } = useToast();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [cats, items, tbls, custs, sett] = await Promise.all([
        categoryApi.getAllCategories(),
        menuItemApi.getAllMenuItems(),
        tableApi.getAllTables(),
        customerApi.getAllCustomers(),
        receiptSettingsApi.getSettings(),
      ]);
      setCategories(cats);
      setProducts(items);
      setTables(tbls.filter((t) => t.status === "active"));
      setCustomers(custs);
      setReceiptSettings(sett);
    } catch (error) {
      showToast("Failed to load POS data", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesCategory =
        selectedCategory === "All" || Number(p.categoryId) === Number(selectedCategory);
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('cart-updated', { detail: cart.reduce((sum, i) => sum + i.quantity, 0) }));
  }, [cart]);

  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredProducts.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredProducts, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  const handleHoldOrder = async () => {
    if (cart.length === 0) return;
    setIsProcessing(true);
    try {
      await orderApi.createOrder({
        tableId: selectedTable || undefined,
        type: "eating",
        status: "held",
        items: cart.map(i => ({ menuItemId: i.id, quantity: i.quantity })),
        notes: "Held Order"
      });
      showToast("Order held successfully", "success");
      setCart([]);
      setSelectedTable(null);
    } catch (error) {
      showToast("Failed to hold order", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const resumeOrder = async (order: any) => {
    const resumedCart = order.orderitem.map((oi: any) => ({
      ...oi.menuitem,
      quantity: oi.quantity
    }));
    setCart(resumedCart);
    setSelectedTable(order.tableId);
    setSelectedCustomer(order.customerId);
    setIsRecentOrdersOpen(false);

    // Delete the held order from DB once resumed
    try {
      await orderApi.deleteOrder(order.id);
      showToast("Order resumed and draft removed", "success");
    } catch (error) {
      console.error("Failed to delete held order", error);
    }
  };

  useEffect(() => {
    const handleOpenHeld = () => fetchRecentOrders();
    window.addEventListener('open-held-orders', handleOpenHeld);
    return () => window.removeEventListener('open-held-orders', handleOpenHeld);
  }, []);

  const handlePrint = () => {
    if (cart.length === 0) {
      showToast("Cart is empty", "error");
      return;
    }
    window.print();
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else if (document.exitFullscreen) {
      document.exitFullscreen();
    }
  };

  const openCalculator = () => {
    window.open('https://www.google.com/search?q=calculator', 'calculator', 'width=400,height=500');
  };

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('held-updated', { detail: recentOrders.length }));
  }, [recentOrders]);

  const fetchRecentOrders = async () => {
    try {
      const orders = await orderApi.getAllOrders({ status: 'held', onlyMine: true });
      setRecentOrders(orders);
      setIsRecentOrdersOpen(true);
    } catch (error) {
      showToast("Failed to fetch recent orders", "error");
    }
  };

  const addToCart = (product: MenuItem) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing)
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: number) => {
    setCart((prev) => prev.filter((item) => item.id !== productId));
  };

  const updateQuantity = (productId: number, delta: number) => {
    setCart((prev) =>
      prev.map((item) =>
        item.id === productId
          ? { ...item, quantity: Math.max(1, item.quantity + delta) }
          : item
      )
    );
  };

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const taxAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity * (item.tax || 0) / 100), 0);
  const total = Math.max(0, subtotal + taxAmount - discount);

  const handleCheckout = async () => {
    if (!selectedTable) { showToast("Please select a table first", "error"); return; }
    if (cart.length === 0) { showToast("Your cart is empty", "error"); return; }
    try {
      setIsProcessing(true);
      const order = await orderApi.createOrder({
        tableId: selectedTable,
        items: cart.map((item) => ({ menuItemId: Number(item.id), quantity: item.quantity })),
      });
      await paymentApi.createPayment({ orderId: order.id.toString(), amount: total, method: paymentMethod });
      showToast("Order placed and paid successfully!", "success");
      setCart([]);
      setDiscount(0);
      setSelectedTable(null);
      setIsCheckoutOpen(false);
    } catch (error) {
      showToast("Payment failed. Please try again.", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex h-full bg-[#f8f9fc]">

      {/* ───────── LEFT PANEL ───────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Category Strip */}
        <div className="bg-white border-b border-gray-100 px-6 py-2 flex items-center justify-between shrink-0 z-20 shadow-sm">
          <div className="flex items-center gap-3 overflow-x-auto scrollbar-hide flex-1 pl-2">
            {/* Category buttons logic remains same... */}
            {/* All Button */}
            <button
              onClick={() => setSelectedCategory("All")}
              className={cn(
                "flex flex-col items-center justify-center gap-1 rounded-lg border transition-all shrink-0 w-20 h-20 relative bg-white shadow-sm",
                selectedCategory === "All"
                  ? "border-[#605DFF] ring-2 ring-blue-50 shadow-md z-10"
                  : "border-gray-100 hover:border-blue-100 hover:shadow-md"
              )}
            >
              <div className="absolute -top-1 -right-1 bg-[#605DFF] text-white text-[9px] font-black h-5 w-5 min-w-[20px] px-1 flex items-center justify-center rounded-full shadow-lg border-2 border-white z-10">
                {products.length}
              </div>
              <div className="flex flex-col items-center justify-center gap-0.5">
                <LayoutGrid className={cn("size-6", selectedCategory === "All" ? "text-[#605DFF]" : "text-gray-400")} strokeWidth={1.5} />
                <span className={cn("text-[9px] font-bold leading-tight text-center", selectedCategory === "All" ? "text-[#605DFF]" : "text-gray-500")}>
                  All<br />Categ...
                </span>
              </div>
            </button>

            {categories.map((cat) => {
              const count = products.filter((p) => Number(p.categoryId) === cat.id).length;
              const isActive = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={cn(
                    "flex flex-col items-center justify-center gap-1 rounded-lg border transition-all shrink-0 w-20 h-20 relative bg-white shadow-sm",
                    isActive
                      ? "border-[#605DFF] ring-2 ring-blue-50 shadow-md z-10"
                      : "border-gray-100 hover:border-blue-100 hover:shadow-md"
                  )}
                >
                  <div className="absolute -top-1 -right-1 bg-[#605DFF] text-white text-[9px] font-black h-5 w-5 min-w-[20px] px-1 flex items-center justify-center rounded-full shadow-lg border-2 border-white z-10">
                    {count}
                  </div>
                  <div className="w-12 h-12 flex items-center justify-center">
                    {cat.imageUrl ? (
                      <img src={cat.imageUrl} alt={cat.name} className="max-w-full max-h-full object-contain rounded" />
                    ) : (
                      <Utensils className={cn("size-6", isActive ? "text-[#605DFF]" : "text-gray-300")} />
                    )}
                  </div>
                  <span className={cn("text-[9px] font-bold truncate w-full text-center px-1 leading-tight", isActive ? "text-[#605DFF]" : "text-gray-600")}>
                    {cat.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Products Section */}
        <div className="flex-1 overflow-hidden flex flex-col bg-white">
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Toolbar */}
            <div className="px-6 py-4 flex items-center justify-between border-b border-gray-50 shrink-0">
              <h2 className="text-xl font-bold text-gray-800 tracking-tight">Products</h2>
              <div className="flex items-center gap-2">
                <div className="relative group">
                  <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-[#605DFF] transition-colors" />
                  <input
                    type="text"
                    placeholder="Search Product"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-10 pl-9 pr-4 text-[12px] bg-white border border-gray-100 rounded-lg outline-none focus:border-[#605DFF] w-100 transition-all shadow-sm"
                  />
                </div>
                {/* <Button
                  variant="outline"
                  onClick={fetchData}
                  className="h-9 gap-1.5 border-blue-100 bg-white hover:bg-blue-50 text-[#605DFF] text-[11px] font-bold px-4 shadow-sm transition-all"
                >
                  <RefreshCw className="size-3.5" /> Refresh
                </Button> */}

                {/* <div className="flex items-center bg-white border border-gray-100 rounded-lg h-9 px-3 shadow-sm hover:border-gray-200 cursor-pointer transition-all">
                  <span className="text-[11px] text-gray-500 font-bold mr-3">24 per page</span>
                  <ChevronDown className="size-3.5 text-gray-400" />
                </div> */}

                <Button variant="outline" className="h-9 w-9 p-0 border-gray-100 bg-white shadow-sm hover:bg-gray-50 group">
                  <ChevronDown className="size-4 text-gray-400 rotate-180 group-hover:text-[#605DFF] transition-all" />
                </Button>
              </div>
            </div>

            {/* Grid */}
            <div className="flex-1 overflow-y-auto p-6">
              {loading ? (
                <div className="grid grid-cols-6 gap-3">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <div key={i} className="bg-white rounded-2xl h-32 animate-pulse border border-gray-100" />
                  ))}
                </div>
              ) : paginatedProducts.length > 0 ? (
                <div className="grid grid-cols-6 gap-6">
                  {paginatedProducts.map((product) => (
                    <button
                      key={product.id}
                      onClick={() => addToCart(product)}
                      className="bg-white rounded-lg border border-gray-100 hover:border-[#605DFF] transition-all text-left flex flex-col overflow-hidden group active:scale-95 shadow-sm h-36"
                    >
                      {/* Top: Price Badge (Tight) */}
                      <div className="p-1.5 shrink-0">
                        <span className="bg-emerald-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-md shadow-sm">
                          ${product.price.toFixed(2)}
                        </span>
                      </div>

                      {/* Middle: Image Container (Compacted) */}
                      <div className="h-18 w-full flex items-center justify-center bg-gray-50/20 shrink-0 overflow-hidden -mt-1">
                        {product.imageUrl ? (
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
                            <Utensils className="size-5" />
                          </div>
                        )}
                      </div>

                      {/* Bottom: Info Area (Flush) */}
                      <div className="flex-1 px-3 pt-0.5 pb-1.5 flex flex-col justify-start bg-white border-t border-gray-50">
                        <p className="text-[11px] font-black text-gray-800 line-clamp-2 leading-tight">
                          {product.name}
                        </p>
                        <div className="flex items-center justify-between mt-0.5">
                          <span className="text-[8px] font-bold text-gray-400 uppercase tracking-wider">
                            {categories.find((c) => c.id === product.categoryId)?.name || 'Food'}
                          </span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-gray-300 py-20">
                  <Search className="size-12 mb-3" />
                  <p className="text-sm font-bold text-gray-400">No products found</p>
                </div>
              )}
            </div>
          </div>

          {/* Pagination Footer (Full Width within Product Section) */}
          <div className="bg-white border-t border-gray-100 px-6 py-4 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <LayoutGrid className="size-4 text-gray-400" />
              <span className="text-[11px] text-gray-500 font-medium">
                Showing <span className="text-gray-800 font-bold">{(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, filteredProducts.length)}</span> of <span className="text-gray-800 font-bold">{filteredProducts.length}</span> items
              </span>
            </div>

            <div className="flex items-center gap-6">
              <span className="text-[11px] text-gray-500 font-medium">
                Page <span className="text-gray-800 font-bold">{currentPage}</span> of <span className="text-gray-800 font-bold">{totalPages || 1}</span>
              </span>

              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 rounded bg-gray-50 border-gray-200 hover:bg-gray-100"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="size-4 text-gray-400" />
                </Button>

                {Array.from({ length: totalPages || 1 }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i + 1)}
                    className={cn(
                      "h-8 w-8 rounded text-[11px] font-bold transition-all",
                      currentPage === i + 1
                        ? "bg-[#605DFF] text-white shadow-md shadow-blue-200"
                        : "bg-gray-50 text-gray-500 hover:bg-gray-100"
                    )}
                  >
                    {i + 1}
                  </button>
                ))}

                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 rounded bg-gray-50 border-gray-200 hover:bg-gray-100"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages || totalPages === 0}
                >
                  <ChevronRight className="size-4 text-gray-400" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ───────── RIGHT PANEL: CART ───────── */}
      <div className="w-[520px] shrink-0 bg-white border-l border-gray-200 flex flex-col h-full">

        {/* Cart Container (No Padding/Radius) */}
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Cart Header */}
          <div className="px-6 py-5 border-b border-gray-100 bg-white">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 rounded-xl">
                  <ShoppingCart className="size-5 text-[#605DFF]" />
                </div>
                <div>
                  <p className="text-[14px] font-black text-gray-800">Point Of Sale Cart</p>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">New Transaction</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-black text-gray-500">Items</span>
                  <span className="bg-gray-100 text-gray-800 text-[11px] font-black px-2 py-0.5 rounded-full">{cart.length}</span>
                </div>
                <button
                  onClick={() => { setCart([]); setDiscount(0); }}
                  className="flex items-center gap-1 text-[11px] font-black text-red-400 hover:text-red-500 transition-colors"
                >
                  <X className="size-3.5" /> <span className="underline underline-offset-2">Clear all</span>
                </button>
              </div>
            </div>

            {/* Customer & Table Selector Card */}
            <div className="space-y-3">
              <div className="relative group">
                <User className="size-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#605DFF]" />
                <select
                  value={selectedCustomer || ""}
                  onChange={(e) => setSelectedCustomer(Number(e.target.value) || null)}
                  className="w-full h-11 pl-10 pr-12 text-[12px] font-bold bg-white border border-gray-200 rounded-xl outline-none focus:border-[#605DFF] focus:ring-4 focus:ring-blue-50 appearance-none shadow-sm transition-all"
                >
                  <option value="">Select Customer</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>{c.fullName}</option>
                  ))}
                </select>
                {selectedCustomer && (
                  <button
                    onClick={() => setSelectedCustomer(null)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[11px] font-black text-red-400 hover:text-red-500"
                  >
                    Clear
                  </button>
                )}
              </div>

              {tables.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {tables.map((table) => (
                    <button
                      key={table.id}
                      onClick={() => setSelectedTable(selectedTable === table.id ? null : table.id)}
                      className={cn(
                        "h-8 px-4 rounded-xl text-[10px] font-black border transition-all",
                        selectedTable === table.id
                          ? "bg-[#605DFF] border-[#605DFF] text-white shadow-md shadow-blue-200"
                          : "bg-white border-gray-200 text-gray-500 hover:border-blue-300"
                      )}
                    >
                      T-{table.number}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Cart Items Area */}
          <div className="flex-1 overflow-y-auto bg-white p-4 space-y-3">
            {cart.length > 0 ? (
              cart.map((item) => (
                <div key={item.id} className="flex gap-3 group">
                  <div className="size-14 rounded-xl overflow-hidden shrink-0 bg-gray-50 border border-gray-100 flex items-center justify-center transition-all group-hover:border-blue-200 shadow-sm">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} className="w-full h-full object-cover" alt={item.name} />
                    ) : (
                      <Utensils className="size-6 text-gray-200" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-[12px] font-black text-gray-800 line-clamp-1">{item.name}</p>
                      <button onClick={() => removeFromCart(item.id)} className="text-gray-200 hover:text-red-400 transition-colors shrink-0">
                        <X className="size-3.5" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between mt-1.5">
                      <div className="flex items-center gap-1.5 p-0.5 bg-gray-50 rounded-lg border border-gray-100">
                        <button
                          onClick={() => updateQuantity(item.id, -1)}
                          className="size-6 flex items-center justify-center text-gray-400 hover:text-[#605DFF] hover:bg-blue-50 rounded-md transition-all"
                        >
                          <Minus className="size-3" />
                        </button>
                        <span className="text-[11px] font-black text-gray-800 w-5 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, 1)}
                          className="size-6 flex items-center justify-center text-gray-400 hover:text-[#605DFF] hover:bg-blue-50 rounded-md transition-all"
                        >
                          <Plus className="size-3" />
                        </button>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-bold text-gray-400 leading-none mb-0.5">${item.price.toFixed(2)}</p>
                        <p className="text-[13px] font-black text-gray-900 leading-none">${(item.price * item.quantity).toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-gray-200">
                <ShoppingCart className="size-16 mb-4 stroke-1" />
                <p className="text-[13px] font-black text-gray-300">No Products Selected</p>
              </div>
            )}
          </div>

          {/* Totals Section Style (From Image 1) */}
          <div className="bg-gray-50/50 p-6 space-y-4 border-t border-gray-50">
            <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm space-y-2.5">
              <div className="flex justify-between items-center text-[12px] text-gray-400 font-bold">
                <span>Line Total</span>
                <span className="tabular-nums">${subtotal.toFixed(4)}</span>
              </div>
              <div className="flex justify-between items-center text-[12px] text-gray-400 font-bold">
                <span className="flex items-center gap-1.5">Tax / VAT <HelpCircle className="size-3 text-blue-400" /></span>
                <span className="tabular-nums">${taxAmount.toFixed(2)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between items-center text-[12px] text-red-500 font-black">
                  <span>Discount</span>
                  <span className="tabular-nums">-${discount.toFixed(2)}</span>
                </div>
              )}
              <div className="pt-2.5 flex justify-between items-center">
                <span className="text-[14px] font-black text-[#003B73]">Net Total</span>
                <span className="text-[20px] font-black text-[#003B73] tabular-nums">${total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons Row (From Image 1) */}
        <div className="px-6 pb-6 pt-0 bg-white">
          <div className="grid grid-cols-4 gap-2.5">
            <button
              onClick={() => setIsDiscountModalOpen(true)}
              className="h-11 rounded-lg bg-white border border-gray-300 hover:border-[#003B73] text-[#003B73] font-black text-[11px] shadow-sm transition-all flex items-center justify-center gap-2 group"
            >
              <span className="text-[13px]">%</span>
              Discount
            </button>
            <button
              onClick={handlePrint}
              className="h-11 rounded-lg bg-white border border-[#fb923c]/40 hover:border-[#fb923c] text-[#fb923c] font-black text-[11px] shadow-sm transition-all flex items-center justify-center gap-2 group"
            >
              <Printer className="size-4" />
              Print
            </button>
            <button
              onClick={handleHoldOrder}
              disabled={isProcessing}
              className="h-11 rounded-lg bg-[#605DFF] hover:bg-[#4F46E5] text-white font-black text-[11px] shadow-lg shadow-blue-100 transition-all flex items-center justify-center gap-2 group"
            >
              {isProcessing ? <Loader2 className="size-4 animate-spin" /> : <Pause className="size-4" />}
              Hold
            </button>
            <button
              onClick={() => setIsCheckoutOpen(true)}
              disabled={cart.length === 0}
              className="h-11 rounded-lg bg-[#10b981] hover:bg-[#059669] disabled:opacity-40 disabled:grayscale text-white font-black text-[11px] shadow-lg shadow-emerald-100 transition-all flex items-center justify-center gap-2 group"
            >
              <CheckCircle2 className="size-4" />
              Checkout
            </button>
          </div>
        </div>
      </div>

      {/* Checkout Modal */}
      <Dialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
        <DialogContent className="sm:max-w-[420px] bg-white p-6 rounded-2xl shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-gray-800">Complete Payment</DialogTitle>
          </DialogHeader>

          <div className="space-y-5 my-2">
            {/* Payment Method */}
            <div className="space-y-2">
              <label className="text-[11px] font-black text-gray-500 uppercase tracking-widest">Payment Method</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "cash", name: "Cash", icon: Banknote },
                  { id: "card", name: "Card", icon: CreditCard },
                  { id: "online", name: "Online", icon: Smartphone },
                ].map((method) => (
                  <button
                    key={method.id}
                    onClick={() => setPaymentMethod(method.id as PaymentMethod)}
                    className={cn(
                      "flex flex-col items-center justify-center gap-1.5 h-16 rounded-xl border-2 transition-all",
                      paymentMethod === method.id
                        ? "bg-emerald-50 border-emerald-500 text-emerald-600"
                        : "bg-white border-gray-200 text-gray-400 hover:border-emerald-300"
                    )}
                  >
                    <method.icon className="size-5" />
                    <span className="text-[10px] font-black">{method.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Amount */}
            <div className="bg-gray-50 rounded-xl p-4 flex items-center justify-between border border-gray-100">
              <span className="text-sm font-bold text-gray-500">Total to Pay</span>
              <span className="text-2xl font-black text-gray-900">${total.toFixed(2)}</span>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsCheckoutOpen(false)} className="flex-1 h-11 rounded-xl">
              Cancel
            </Button>
            <Button
              onClick={handleCheckout}
              disabled={isProcessing}
              className="flex-1 h-11 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold border-none"
            >
              {isProcessing ? <Loader2 className="size-4 animate-spin" /> : "✓ Complete Payment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Discount Modal */}
      <Dialog open={isDiscountModalOpen} onOpenChange={setIsDiscountModalOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Apply Discount</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="flex bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setDiscountType("percentage")}
                className={cn(
                  "flex-1 py-2 text-xs font-bold rounded-md transition-all",
                  discountType === "percentage" ? "bg-white shadow-sm text-[#605DFF]" : "text-gray-500"
                )}
              >
                Percentage (%)
              </button>
              <button
                onClick={() => setDiscountType("fixed")}
                className={cn(
                  "flex-1 py-2 text-xs font-bold rounded-md transition-all",
                  discountType === "fixed" ? "bg-white shadow-sm text-[#605DFF]" : "text-gray-500"
                )}
              >
                Fixed Amount ($)
              </button>
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-gray-400 uppercase">Value</label>
              <input
                type="number"
                value={tempDiscount}
                onChange={(e) => setTempDiscount(e.target.value)}
                className="w-full h-12 bg-gray-50 border border-gray-100 rounded-xl px-4 text-sm font-bold focus:ring-2 focus:ring-[#605DFF]/20 focus:border-[#605DFF] outline-none"
                placeholder="0.00"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDiscountModalOpen(false)}>Cancel</Button>
            <Button
              onClick={() => {
                setDiscount(parseFloat(tempDiscount) || 0);
                setIsDiscountModalOpen(false);
              }}
              className="bg-[#605DFF] hover:bg-[#4F46E5]"
            >
              Apply Discount
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Printable Receipt (Hidden) */}
      <div id="printable-receipt" className="hidden print:block font-mono text-[10px] p-4 bg-white">
        <div className="text-center mb-4 space-y-1">
          {receiptSettings?.logoUrl && (
            <div className="flex justify-center mb-2">
              <img src={receiptSettings.logoUrl} alt="Logo" className="max-h-12 w-auto" />
            </div>
          )}
          <h2 className="text-sm font-bold uppercase">{receiptSettings?.name || "RESTAURANT NAME"}</h2>
          <div className="text-[9px] text-gray-500">
            {receiptSettings?.address && <p>{receiptSettings.address}</p>}
            {(() => {
              try {
                const phones = receiptSettings?.phone ? JSON.parse(receiptSettings.phone) : [];
                return Array.isArray(phones) ? phones.map((p: any, i: number) => (
                  <p key={i}>{p.provider && <span className="font-bold">{p.provider}: </span>}{p.number}</p>
                )) : null;
              } catch (e) {
                return receiptSettings?.phone ? <p>Tel: {receiptSettings.phone}</p> : null;
              }
            })()}
            {receiptSettings?.vatNumber && <p className="font-bold">VAT: {receiptSettings.vatNumber}</p>}
          </div>
        </div>
        <div className="border-b border-dashed mb-2 pb-2">
          <p>Date: {new Date().toLocaleString()}</p>
          <p>Cashier: {typeof window !== 'undefined' ? localStorage.getItem('user-name') || 'Admin' : 'Admin'}</p>
          <p>Table: {tables.find(t => t.id === selectedTable)?.number || 'Walk-in'}</p>
        </div>
        <div className="mb-2">
          {cart.map(item => (
            <div key={item.id} className="flex justify-between py-0.5">
              <span>{item.quantity}x {item.name}</span>
              <span>${(item.quantity * item.price).toFixed(2)}</span>
            </div>
          ))}
        </div>
        <div className="border-t border-dashed pt-2 space-y-1">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Tax / VAT:</span>
            <span>${taxAmount.toFixed(2)}</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-red-500">
              <span>Discount:</span>
              <span>-${discountType === 'percentage' ? ((subtotal * discount) / 100).toFixed(2) : discount.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-sm pt-2 border-t border-dashed mt-2">
            <span>TOTAL:</span>
            <span>${total.toFixed(2)}</span>
          </div>
        </div>
        <div className="text-center mt-6 space-y-1">
          <p className="italic text-[9px]">{receiptSettings?.footerText || "Thank you for your visit! Please come again"}</p>
          {receiptSettings?.email && <p className="text-[9px] font-bold">{receiptSettings.email}</p>}
        </div>
      </div>
      {/* Recent/Held Orders Modal */}
      <Dialog open={isRecentOrdersOpen} onOpenChange={setIsRecentOrdersOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Recent & Held Orders</DialogTitle>
          </DialogHeader>
          <div className="max-h-[400px] overflow-y-auto space-y-2 py-4">
            {recentOrders.length === 0 ? (
              <p className="text-center text-gray-400 py-10">No orders found</p>
            ) : (
              recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-[#605DFF] transition-all cursor-pointer group"
                  onClick={() => resumeOrder(order)}
                >
                  <div className="flex items-center gap-4">
                    <div className="size-10 bg-white rounded-lg flex items-center justify-center border border-gray-100 group-hover:bg-blue-50 transition-colors">
                      <History className="size-5 text-[#605DFF]" />
                    </div>
                    <div>
                      <p className="text-sm font-black text-gray-800">Order #{order.id}</p>
                      <p className="text-[10px] text-gray-400 font-bold uppercase">
                        Table: {order.table?.number || 'Walk-in'} • {order.orderitem.length} Items
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-[#605DFF]">${order.total.toFixed(2)}</p>
                    <p className="text-[10px] text-gray-400 font-bold">{new Date(order.createdAt).toLocaleTimeString()}</p>
                  </div>
                </div>
              ))
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRecentOrdersOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
