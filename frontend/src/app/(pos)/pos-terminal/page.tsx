"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Utensils,
  ShoppingBag,
  Truck,
  Search,
  Plus,
  Minus,
  Loader2,
  CheckCircle2,
  Smartphone,
  Wallet,
  X,
  LayoutGrid,
  List,
  Pencil,
  ChevronRight,
  ChevronDown,
  Printer,
  Percent,
  Copy,
  History,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { categoryApi, Category } from "@/lib/api/categoryApi";
import { menuItemApi, MenuItem, parseMenuItemOptions } from "@/lib/api/menuItemApi";
import { tableApi, Table } from "@/lib/api/tableApi";
import { roomApi, Room } from "@/lib/api/roomApi";
import { orderApi } from "@/lib/api/orderApi";
import api from "@/lib/api/axios";
import { paymentApi, PaymentMethod } from "@/lib/api/paymentApi";
import { customerApi, Customer } from "@/lib/api/customerApi";
import { receiptSettingsApi, ReceiptSettings } from "@/lib/api/receiptSettingsApi";
import { ReceiptHeader } from "@/components/receipt/ReceiptBody";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { btnCreatePage } from "@/lib/dashboard-ui";
import PosCustomerProfileCard from "@/components/pos/PosCustomerProfileCard";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

type ViewMode = "grid" | "list";
type PosOrderType = "takeaway" | "delivery";

const POS_ORDER_TYPES: {
  id: PosOrderType;
  label: string;
  icon: typeof ShoppingBag;
}[] = [
  { id: "takeaway", label: "Takeaway", icon: ShoppingBag },
  { id: "delivery", label: "Delivery", icon: Truck },
];

type TakeawayTiming = "now" | "later";

interface PosOrderMeta {
  orderType: PosOrderType;
  takeawayTiming: TakeawayTiming;
  pickupDate: string;
  pickupTime: string;
  deliveryStreet: string;
  deliveryDistrict: string;
  customerPhone: string;
}

function normalizePhone(value: string) {
  return value.replace(/\D/g, "");
}

function findCustomerByPhone(phone: string, customers: Customer[]) {
  const digits = normalizePhone(phone);
  if (digits.length < 6) return null;
  return (
    customers.find(c => {
      const stored = normalizePhone(c.phone);
      return (
        stored === digits ||
        stored.endsWith(digits) ||
        digits.endsWith(stored)
      );
    }) ?? null
  );
}

type PosPaymentMethod = Extract<PaymentMethod, "evc_plus" | "edahab" | "premier_wallet">;

const POS_PAYMENT_METHODS: {
  id: PosPaymentMethod;
  name: string;
  icon: typeof Smartphone;
  providerName: string;
}[] = [
  { id: "evc_plus", name: "EVC Plus", icon: Smartphone, providerName: "EVC Plus" },
  { id: "edahab", name: "eDahab", icon: Smartphone, providerName: "eDahab" },
  { id: "premier_wallet", name: "Premier Wallet", icon: Wallet, providerName: "Premier Wallet" },
];

const formInputClass =
  "w-full px-4 py-3 bg-white border border-zinc-200 rounded-lg outline-none focus:border-primary/30 focus:ring-4 focus:ring-primary/5 transition-all text-sm font-medium";

function getTableRoomId(table: Table): number | null {
  const id = table.roomId ?? table.room?.id;
  return id != null ? Number(id) : null;
}

interface ProductOpts {
  variant?: string;
}

interface CartLine {
  key: string;
  id: number;
  name: string;
  price: number;
  tax: number;
  quantity: number;
  imageUrl?: string;
  categoryName?: string;
  variant?: string;
  lineNote?: string;
}

function cartLineKey(id: number, variant?: string): string {
  return `${id}-${variant || "default"}`;
}

function normalizeCartLine(raw: unknown): CartLine | null {
  if (!raw || typeof raw !== "object") return null;
  const item = raw as Record<string, unknown>;
  const id = Number(item.id ?? item.menuItemId);
  if (!id) return null;
  const variant = item.variant as string | undefined;
  return {
    key: String(item.key || cartLineKey(id, variant)),
    id,
    name: String(item.name || "Item"),
    price: Number(item.price) || 0,
    tax: Number(item.tax) || 0,
    quantity: Number(item.quantity) || 1,
    imageUrl: item.imageUrl as string | undefined,
    categoryName: item.categoryName as string | undefined,
    variant,
    lineNote: item.lineNote as string | undefined,
  };
}

function optionChip(active: boolean) {
  return cn(
    "px-2.5 py-1 rounded-md text-[11px] font-semibold border transition-all",
    active
      ? "bg-zinc-200 border-zinc-300 text-foreground"
      : "bg-white border-border text-muted-foreground hover:border-zinc-300"
  );
}

export default function PosTerminalPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<MenuItem[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<number | "">("");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [receiptSettings, setReceiptSettings] = useState<ReceiptSettings | null>(null);

  const [selectedCategory, setSelectedCategory] = useState<string | number>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [loading, setLoading] = useState(true);

  const [cart, setCart] = useState<CartLine[]>([]);
  const [orderNote, setOrderNote] = useState("");
  const [selectedTable, setSelectedTable] = useState<number | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<number | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [orderType, setOrderType] = useState<PosOrderType>("takeaway");
  const [takeawayTiming, setTakeawayTiming] = useState<TakeawayTiming>("now");
  const [pickupDate, setPickupDate] = useState("");
  const [pickupTime, setPickupTime] = useState("");
  const [deliveryStreet, setDeliveryStreet] = useState("");
  const [deliveryDistrict, setDeliveryDistrict] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PosPaymentMethod>("evc_plus");
  const [paymentPhone, setPaymentPhone] = useState("");
  const [summaryOpen, setSummaryOpen] = useState(true);
  const [heldCount, setHeldCount] = useState(0);
  const [activeHeldOrderId, setActiveHeldOrderId] = useState<number | null>(null);
  const [draftSeq, setDraftSeq] = useState(1);

  const [productOptions, setProductOptions] = useState<Record<number, ProductOpts>>({});
  const [activeProductId, setActiveProductId] = useState<number | null>(null);
  const [editingLineKey, setEditingLineKey] = useState<string | null>(null);

  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isTableDialogOpen, setIsTableDialogOpen] = useState(false);
  const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false);
  const [isRecentOrdersOpen, setIsRecentOrdersOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const [discount, setDiscount] = useState(0);
  const [tempDiscount, setTempDiscount] = useState("0");
  const [discountType, setDiscountType] = useState<"percentage" | "fixed">("percentage");
  const [recentOrders, setRecentOrders] = useState<any[]>([]);

  const { showToast } = useToast();
  const cartSyncReady = useRef(false);
  const phoneLookupTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = localStorage.getItem("pos-cart");
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as unknown[];
        setCart(parsed.map(normalizeCartLine).filter(Boolean) as CartLine[]);
      } catch {
        /* ignore */
      }
    }
    const savedMeta = localStorage.getItem("pos-order-meta");
    if (savedMeta) {
      try {
        const parsed = JSON.parse(savedMeta) as Partial<PosOrderMeta>;
        if (parsed.orderType === "takeaway" || parsed.orderType === "delivery") {
          setOrderType(parsed.orderType);
        }
        if (parsed.takeawayTiming === "now" || parsed.takeawayTiming === "later") {
          setTakeawayTiming(parsed.takeawayTiming);
        }
        if (typeof parsed.pickupDate === "string") setPickupDate(parsed.pickupDate);
        if (typeof parsed.pickupTime === "string") setPickupTime(parsed.pickupTime);
        if (typeof parsed.deliveryStreet === "string") setDeliveryStreet(parsed.deliveryStreet);
        if (typeof parsed.deliveryDistrict === "string") setDeliveryDistrict(parsed.deliveryDistrict);
        if (typeof parsed.customerPhone === "string") setCustomerPhone(parsed.customerPhone);
      } catch {
        /* ignore */
      }
    }
    const savedDiscount = localStorage.getItem("pos-discount");
    if (savedDiscount) {
      try {
        const parsed = JSON.parse(savedDiscount) as {
          discount?: number;
          discountType?: "percentage" | "fixed";
        };
        if (typeof parsed.discount === "number") setDiscount(parsed.discount);
        if (parsed.discountType === "percentage" || parsed.discountType === "fixed") {
          setDiscountType(parsed.discountType);
        }
        setTempDiscount(String(parsed.discount ?? 0));
      } catch {
        /* ignore */
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("pos-cart", JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem(
      "pos-discount",
      JSON.stringify({ discount, discountType })
    );
  }, [discount, discountType]);

  useEffect(() => {
    const meta: PosOrderMeta = {
      orderType,
      takeawayTiming,
      pickupDate,
      pickupTime,
      deliveryStreet,
      deliveryDistrict,
      customerPhone,
    };
    localStorage.setItem("pos-order-meta", JSON.stringify(meta));
  }, [
    orderType,
    takeawayTiming,
    pickupDate,
    pickupTime,
    deliveryStreet,
    deliveryDistrict,
    customerPhone,
  ]);

  useEffect(() => {
    const count = cart.reduce((sum, i) => sum + i.quantity, 0);
    if (!cartSyncReady.current) {
      cartSyncReady.current = true;
      queueMicrotask(() => {
        window.dispatchEvent(new CustomEvent("cart-updated", { detail: count }));
      });
      return;
    }
    window.dispatchEvent(new CustomEvent("cart-updated", { detail: count }));
  }, [cart]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [cats, items, tbls, rms, custs, sett] = await Promise.all([
        categoryApi.getAllCategories(),
        menuItemApi.getAllMenuItems(),
        tableApi.getAllTables(),
        roomApi.getAllRooms(),
        customerApi.getAllCustomers(),
        receiptSettingsApi.getSettings(),
      ]);
      setCategories(cats);
      setProducts(items);
      setTables(tbls.filter(t => t.status === "active"));
      setRooms((rms || []).filter(r => r.isActive));
      setCustomers(custs);
      setReceiptSettings(sett);
    } catch {
      showToast("Failed to load POS data", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const categoryName = useCallback(
    (id: number) => categories.find(c => c.id === id)?.name || "Menu",
    [categories]
  );

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesCategory =
        selectedCategory === "All" || Number(p.categoryId) === Number(selectedCategory);
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  const selectedTableRecord = useMemo(
    () => tables.find(t => t.id === selectedTable) ?? null,
    [tables, selectedTable]
  );

  const selectedRoom = useMemo(
    () => rooms.find(r => r.id === selectedRoomId) ?? null,
    [rooms, selectedRoomId]
  );

  const roomTables = useMemo(() => {
    if (!selectedRoomId) return [];
    const roomId = Number(selectedRoomId);
    return tables
      .filter(t => t.status === "active" && getTableRoomId(t) === roomId)
      .sort((a, b) => a.number - b.number);
  }, [tables, selectedRoomId]);

  const orderLocationLabel = useMemo(() => {
    if (orderType === "takeaway") {
      if (takeawayTiming === "later" && (pickupDate || pickupTime)) {
        if (pickupDate && pickupTime) return `Takeaway · Pickup ${pickupDate} ${pickupTime}`;
        if (pickupDate) return `Takeaway · Pickup ${pickupDate}`;
        return `Takeaway · Pickup ${pickupTime}`;
      }
      return "Takeaway · Now";
    }
    if (deliveryStreet.trim()) {
      return deliveryDistrict.trim()
        ? `Delivery · ${deliveryStreet.trim()}, ${deliveryDistrict.trim()}`
        : `Delivery · ${deliveryStreet.trim()}`;
    }
    return "Delivery — add address";
  }, [orderType, takeawayTiming, pickupDate, pickupTime, deliveryStreet, deliveryDistrict]);

  const orderTypeLabel = orderType === "delivery" ? "Delivery" : "Takeaway";

  const customersByPhone = useMemo(
    () => [...customers].sort((a, b) => a.phone.localeCompare(b.phone)),
    [customers]
  );

  const selectPhoneOptions = useMemo(() => {
    const digits = normalizePhone(customerPhone);
    if (!digits) return customersByPhone;
    return customersByPhone.filter(c => normalizePhone(c.phone).includes(digits));
  }, [customersByPhone, customerPhone]);

  useEffect(() => {
    return () => {
      if (phoneLookupTimer.current) clearTimeout(phoneLookupTimer.current);
    };
  }, []);

  const applyCustomer = (customer: Customer) => {
    setSelectedCustomer(customer.id);
    setCustomerPhone(customer.phone);
    setCustomerName(customer.fullName);
  };

  const lookupCustomerByPhone = async (phone: string) => {
    const trimmed = phone.trim();
    if (!trimmed) return;

    const local = findCustomerByPhone(trimmed, customers);
    if (local) {
      applyCustomer(local);
      return;
    }

    const remote = await customerApi.getCustomerByPhone(trimmed);
    if (remote) applyCustomer(remote);
  };

  const handleSelectCustomerById = (customerId: string) => {
    if (!customerId) {
      setSelectedCustomer(null);
      setCustomerPhone("");
      setCustomerName("");
      return;
    }
    const match = customers.find(c => c.id === Number(customerId));
    if (match) applyCustomer(match);
  };

  const handleCustomerPhoneChange = (value: string) => {
    setCustomerPhone(value);

    if (!value.trim()) {
      setSelectedCustomer(null);
      setCustomerName("");
      return;
    }

    const match = findCustomerByPhone(value, customers);
    if (match) {
      applyCustomer(match);
      return;
    }

    setSelectedCustomer(null);

    if (phoneLookupTimer.current) clearTimeout(phoneLookupTimer.current);
    const digits = normalizePhone(value);
    if (digits.length < 6) return;

    phoneLookupTimer.current = setTimeout(() => {
      void lookupCustomerByPhone(value);
    }, 400);
  };

  const handleCustomerPhoneBlur = () => {
    if (phoneLookupTimer.current) {
      clearTimeout(phoneLookupTimer.current);
      phoneLookupTimer.current = null;
    }
    if (!selectedCustomer && customerPhone.trim()) {
      void lookupCustomerByPhone(customerPhone);
    }
  };

  const handleTakeawayTimingChange = (timing: TakeawayTiming) => {
    setTakeawayTiming(timing);
    if (timing === "now") {
      setPickupDate("");
      setPickupTime("");
    }
  };

  const handleOrderTypeChange = (type: PosOrderType) => {
    setOrderType(type);
    if (type !== "takeaway") {
      setTakeawayTiming("now");
      setPickupDate("");
      setPickupTime("");
    }
    if (type !== "delivery") {
      setDeliveryStreet("");
      setDeliveryDistrict("");
    }
  };

  const draftOrderId = `#${String(draftSeq).padStart(3, "0")}`;

  const addToCart = (product: MenuItem) => {
    if (!product.isAvailable) return;
    const itemOptions = parseMenuItemOptions(product);
    const variant = productOptions[product.id]?.variant;
    if (itemOptions.length > 0 && !variant) {
      showToast("Select an option first", "error");
      return;
    }
    setActiveProductId(product.id);
    const key = cartLineKey(product.id, variant);

    setCart(prev => {
      const existing = prev.find(item => item.key === key);
      if (existing) {
        return prev.map(item =>
          item.key === key ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [
        ...prev,
        {
          key,
          id: product.id,
          name: product.name,
          price: product.price,
          tax: product.tax || 0,
          quantity: 1,
          imageUrl: product.imageUrl,
          categoryName: categoryName(product.categoryId),
          variant,
        },
      ];
    });
  };

  const removeFromCart = (key: string) => {
    setCart(prev => prev.filter(item => item.key !== key));
  };

  const updateQuantity = (key: string, delta: number) => {
    setCart(prev =>
      prev
        .map(item => {
          if (item.key !== key) return item;
          const qty = item.quantity + delta;
          return qty < 1 ? null : { ...item, quantity: qty };
        })
        .filter(Boolean) as CartLine[]
    );
  };

  const isInCart = (productId: number) => cart.some(c => c.id === productId);

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const taxAmount = cart.reduce(
    (sum, item) => sum + (item.price * item.quantity * item.tax) / 100,
    0
  );
  const discountAmount =
    discountType === "percentage" ? (subtotal * discount) / 100 : discount;
  const total = Math.max(0, subtotal + taxAmount - discountAmount);

  const setProductVariant = (productId: number, value: string) => {
    setProductOptions(prev => ({
      ...prev,
      [productId]: {
        variant: prev[productId]?.variant === value ? undefined : value,
      },
    }));
  };

  const formatCartOptions = (item: CartLine) =>
    item.variant ? `Option: ${item.variant}` : "";

  const resetOrderDetails = () => {
    setOrderType("takeaway");
    setSelectedTable(null);
    setSelectedRoomId("");
    setSelectedCustomer(null);
    setCustomerName("");
    setCustomerPhone("");
    setTakeawayTiming("now");
    setPickupDate("");
    setPickupTime("");
    setDeliveryStreet("");
    setDeliveryDistrict("");
  };

  const resetTransaction = () => {
    setCart([]);
    setOrderNote("");
    setDiscount(0);
    setTempDiscount("0");
    setDiscountType("percentage");
    setDraftSeq(s => s + 1);
    setActiveProductId(null);
    setActiveHeldOrderId(null);
  };

  const getDiscountPayload = () =>
    discountAmount > 0
      ? {
          discountAmount: Number(discountAmount.toFixed(2)),
          discountType,
          discountValue: Number(discount.toFixed(2)),
        }
      : {};

  const getCustomerNamePayload = () => {
    const name = customerName.trim();
    if (!name || name === "Walk-in Guest") return undefined;
    return name;
  };

  const buildOrderNotes = (fallback?: string) => {
    const parts: string[] = [];
    if (orderNote.trim()) parts.push(orderNote.trim());
    if (orderType === "takeaway" && takeawayTiming === "later" && (pickupDate || pickupTime)) {
      parts.push(`Pickup: ${[pickupDate, pickupTime].filter(Boolean).join(" ")}`);
    }
    return parts.join(" | ") || fallback;
  };

  const validateOrderDetails = (): boolean => {
    if (orderType === "takeaway" && takeawayTiming === "later" && (!pickupDate || !pickupTime)) {
      showToast("Select pickup date and time", "error");
      setIsTableDialogOpen(true);
      return false;
    }
    if (orderType === "delivery" && !deliveryStreet.trim()) {
      showToast("Enter delivery address", "error");
      setIsTableDialogOpen(true);
      return false;
    }
    if (orderType === "delivery" && !selectedCustomer && !customerPhone.trim()) {
      showToast("Enter customer phone for delivery", "error");
      setIsTableDialogOpen(true);
      return false;
    }
    return true;
  };

  const resolveDeliveryAddressId = async (): Promise<number | undefined> => {
    if (orderType !== "delivery") return undefined;
    const cust = customers.find(c => c.id === selectedCustomer);
    const phone = cust?.phone || customerPhone.trim() || "N/A";
    const res = await api.post("/addresses", {
      customerId: selectedCustomer || undefined,
      name: "Delivery",
      district: deliveryDistrict.trim() || "N/A",
      street: deliveryStreet.trim(),
      phone,
      isDefault: false,
    });
    return res.data.data?.id;
  };

  const buildOrderPayload = async (status?: string) => {
    const cust = customers.find(c => c.id === selectedCustomer);
    const phone = cust?.phone || customerPhone.trim() || undefined;
    const addressId = await resolveDeliveryAddressId();

    return {
      tableId: undefined,
      addressId,
      type: orderType,
      status,
      customerName: getCustomerNamePayload(),
      customerPhone: phone,
      notes: buildOrderNotes(status === "held" ? "Held Order" : undefined),
      items: cart.map(i => ({ menuItemId: i.id, quantity: i.quantity })),
      ...getDiscountPayload(),
    };
  };

  const refreshHeldOrders = async (openModal = false) => {
    const orders = await orderApi.getAllOrders({ status: "held", onlyMine: true });
    setRecentOrders(orders);
    setHeldCount(orders.length);
    if (openModal) setIsRecentOrdersOpen(true);
  };

  const clearLoadedHeldOrders = async (ids: number[], syncList = false) => {
    if (ids.length === 0) return;
    await Promise.allSettled(ids.map(id => orderApi.deleteOrder(id)));
    if (syncList) {
      await refreshHeldOrders(false);
    }
  };

  const saveCurrentOrderAsHeld = async (): Promise<boolean> => {
    if (cart.length === 0) return true;
    if (!validateOrderDetails()) return false;
    const idToDelete = activeHeldOrderId;
    try {
      await orderApi.createOrder(await buildOrderPayload("held"));
      setActiveHeldOrderId(null);
      setHeldCount(c => Math.max(0, c + 1 - (idToDelete ? 1 : 0)));
      if (idToDelete) {
        void clearLoadedHeldOrders([idToDelete]);
      }
      return true;
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Failed to save order";
      showToast(message, "error");
      return false;
    }
  };

  const handleHoldOrder = async () => {
    if (cart.length === 0) return;
    setIsProcessing(true);
    const saved = await saveCurrentOrderAsHeld();
    if (saved) {
      resetTransaction();
      resetOrderDetails();
      showToast("Order saved", "success");
    }
    setIsProcessing(false);
  };

  const fetchRecentOrders = async () => {
    try {
      await refreshHeldOrders(true);
    } catch {
      showToast("Failed to fetch saved orders", "error");
    }
  };

  useEffect(() => {
    refreshHeldOrders(false).catch(() => {});
  }, []);

  useEffect(() => {
    const handleOpenHeld = () => fetchRecentOrders();
    window.addEventListener("open-held-orders", handleOpenHeld);
    return () => window.removeEventListener("open-held-orders", handleOpenHeld);
  }, []);

  const applyHeldOrderMeta = (order: any) => {
    if (order.tableId) {
      setSelectedTable(order.tableId);
      const table = tables.find(t => t.id === order.tableId);
      const roomId = table ? getTableRoomId(table) : null;
      setSelectedRoomId(roomId ?? "");
    } else {
      setSelectedTable(null);
      setSelectedRoomId("");
    }
    const resumedType = (order.orderType || "takeaway") as string;
    setOrderType(resumedType === "delivery" ? "delivery" : "takeaway");
    setSelectedCustomer(order.customerId);
    if (order.customerName) setCustomerName(order.customerName);
    if (order.customerPhone) setCustomerPhone(order.customerPhone);
    if (order.notes && order.notes !== "Held Order") {
      const pickupMatch = order.notes.match(/Pickup:\s*([^|]+)/);
      if (pickupMatch) {
        setTakeawayTiming("later");
        const pickupParts = pickupMatch[1].trim().split(/\s+/);
        if (pickupParts.length >= 2) {
          setPickupDate(pickupParts[0]);
          setPickupTime(pickupParts.slice(1).join(" "));
        } else if (pickupParts.length === 1) {
          setPickupDate(pickupParts[0]);
        }
        setOrderNote(
          order.notes.replace(/\s*\|\s*Pickup:[^|]+/, "").replace(/Pickup:[^|]+/, "").trim()
        );
      } else {
        setTakeawayTiming("now");
        setOrderNote(order.notes);
      }
    }
    if (order.address) {
      setDeliveryStreet(order.address.street || "");
      setDeliveryDistrict(order.address.district || "");
    }
    if (order.discountAmount && order.discountAmount > 0) {
      const type =
        order.discountType === "fixed" || order.discountType === "percentage"
          ? order.discountType
          : "fixed";
      const value = order.discountValue ?? order.discountAmount;
      setDiscountType(type);
      setDiscount(value);
      setTempDiscount(String(value));
    } else {
      setDiscount(0);
      setTempDiscount("0");
      setDiscountType("percentage");
    }
  };

  const resumeOrder = async (order: any) => {
    const incoming: CartLine[] = order.orderitem.map((oi: any) => {
      const m = oi.menuitem;
      return {
        key: cartLineKey(m.id),
        id: m.id,
        name: m.name,
        price: m.price,
        tax: m.tax || 0,
        quantity: oi.quantity,
        imageUrl: m.imageUrl,
      };
    });

    setCart(incoming);
    applyHeldOrderMeta(order);
    setActiveHeldOrderId(order.id);
    setIsRecentOrdersOpen(false);

    try {
      await refreshHeldOrders(false);
      showToast("Order loaded", "success");
    } catch {
      showToast("Order loaded", "success");
    }
  };

  const handlePrint = () => {
    if (cart.length === 0) {
      showToast("Cart is empty", "error");
      return;
    }
    window.print();
  };

  const selectedPaymentMethod = POS_PAYMENT_METHODS.find(m => m.id === paymentMethod)!;

  const handleOpenPayment = () => {
    if (cart.length === 0) {
      showToast("Your cart is empty", "error");
      return;
    }
    if (!validateOrderDetails()) return;
    const cust = customers.find(c => c.id === selectedCustomer);
    setPaymentPhone(cust?.phone || customerPhone || "");
    setPaymentMethod("evc_plus");
    setIsCheckoutOpen(true);
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      showToast("Your cart is empty", "error");
      return;
    }
    if (!paymentPhone.trim()) {
      showToast("Enter the mobile number for payment", "error");
      return;
    }

    try {
      setIsProcessing(true);
      const order = await orderApi.createOrder({
        ...(await buildOrderPayload()),
        customerPhone: paymentPhone.trim(),
      });

      if (paymentMethod === "premier_wallet") {
        await paymentApi.processWaafiPayment(order.id, paymentPhone.trim());
      } else {
        await paymentApi.createPayment({
          orderId: order.id.toString(),
          amount: order.total ?? total,
          method: paymentMethod,
          phone: paymentPhone.trim(),
          providerName: selectedPaymentMethod.providerName,
        });
      }

      showToast("Payment successful!", "success");
      const idToDelete = activeHeldOrderId;
      setActiveHeldOrderId(null);
      setHeldCount(c => Math.max(0, c - (idToDelete ? 1 : 0)));
      if (idToDelete) {
        void clearLoadedHeldOrders([idToDelete]);
      }
      resetTransaction();
      setIsCheckoutOpen(false);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Payment failed. Please try again.";
      showToast(message, "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const copyOrderId = () => {
    navigator.clipboard?.writeText(draftOrderId);
    showToast("Order ID copied", "success");
  };

  const handleNewOrder = async () => {
    const hadItems = cart.length > 0;
    if (hadItems) {
      setIsProcessing(true);
      const saved = await saveCurrentOrderAsHeld();
      setIsProcessing(false);
      if (!saved) return;
    }
    resetTransaction();
    resetOrderDetails();
    setProductOptions({});
    showToast(
      hadItems ? "Order saved — new order started" : "New order started",
      "success"
    );
  };

  return (
    <div className="flex h-full min-h-0 bg-zinc-50">
      {/* ── CATALOG ── */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden p-4 md:p-5">
        <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-hide shrink-0">
          <button
            type="button"
            onClick={() => setSelectedCategory("All")}
            className={cn(
              "shrink-0 px-5 py-2 rounded-full text-sm font-semibold border transition-all",
              selectedCategory === "All"
                ? "bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20"
                : "bg-white/90 text-muted-foreground border-border hover:border-primary/30 hover:text-primary"
            )}
          >
            All Menus
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={cn(
                "shrink-0 px-5 py-2 rounded-full text-sm font-semibold border whitespace-nowrap transition-all",
                selectedCategory === cat.id
                  ? "bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20"
                  : "bg-white/90 text-muted-foreground border-border hover:border-primary/30 hover:text-primary"
              )}
            >
              {cat.name}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3 mb-4 shrink-0">
          <p className="text-sm font-semibold text-muted-foreground shrink-0">
            {filteredProducts.length} Products
          </p>
          <div className="relative flex-1 min-w-[200px] max-w-xl group">
            <Search className="size-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-10 pr-4 bg-white border border-border rounded-xl text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
            />
          </div>
          <div className="flex items-center gap-1 ml-auto">
            {(["grid", "list"] as ViewMode[]).map(mode => (
              <button
                key={mode}
                type="button"
                onClick={() => setViewMode(mode)}
                className={cn(
                  "size-9 rounded-lg border flex items-center justify-center transition-all",
                  viewMode === mode
                    ? "bg-white border-primary/40 text-primary shadow-sm"
                    : "bg-white/80 border-border text-muted-foreground"
                )}
              >
                {mode === "grid" ? <LayoutGrid className="size-4" /> : <List className="size-4" />}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pr-1 pb-2 min-h-0">
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-44 bg-white/70 rounded-2xl animate-pulse border border-border/50" />
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-16">
              <Search className="size-10 mb-3 opacity-30" />
              <p className="text-sm font-medium">No products found</p>
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredProducts.map(product => {
                const opts = productOptions[product.id] || {};
                const itemOptions = parseMenuItemOptions(product);
                const selected = isInCart(product.id) || activeProductId === product.id;
                const outOfStock = !product.isAvailable;
                const hasDiscount =
                  product.costPrice != null && product.costPrice > product.price;
                const discountPct = hasDiscount
                  ? Math.round(
                      ((product.costPrice! - product.price) / product.costPrice!) * 100
                    )
                  : 0;

                return (
                  <div
                    key={product.id}
                    onClick={() => !outOfStock && addToCart(product)}
                    className={cn(
                      "bg-white rounded-2xl border p-4 cursor-pointer transition-all shadow-sm hover:shadow-md",
                      selected
                        ? "border-zinc-300 bg-zinc-100 ring-1 ring-zinc-200"
                        : "border-border/80 hover:border-primary/20",
                      outOfStock && "opacity-55 cursor-not-allowed"
                    )}
                  >
                    <div className="flex gap-3">
                      <div className="size-14 rounded-full overflow-hidden bg-muted shrink-0 border border-border">
                        {product.imageUrl ? (
                          <img src={product.imageUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Utensils className="size-5 text-muted-foreground/40" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] text-muted-foreground font-medium">
                          {categoryName(product.categoryId)}
                        </p>
                        <h3 className="text-sm font-bold text-foreground truncate">{product.name}</h3>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className="text-sm font-bold text-primary">
                            ${product.price.toFixed(2)}
                          </span>
                          {hasDiscount && (
                            <>
                              <span className="text-xs text-muted-foreground line-through">
                                ${product.costPrice!.toFixed(2)}
                              </span>
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-secondary/35 text-primary">
                                -{discountPct}%
                              </span>
                            </>
                          )}
                        </div>
                        <p
                          className={cn(
                            "text-[11px] font-semibold mt-1",
                            outOfStock ? "text-destructive" : "text-emerald-600"
                          )}
                        >
                          {outOfStock ? "Out of Stock" : "Ready Stock"}
                        </p>
                      </div>
                    </div>

                    {!outOfStock && itemOptions.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5" onClick={e => e.stopPropagation()}>
                        {itemOptions.map(opt => (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => setProductVariant(product.id, opt)}
                            className={optionChip(opts.variant === opt)}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {filteredProducts.map(product => (
                <button
                  key={product.id}
                  type="button"
                  disabled={!product.isAvailable}
                  onClick={() => addToCart(product)}
                  className="flex items-center gap-4 bg-white rounded-xl border border-border p-3 text-left hover:border-primary/30 disabled:opacity-50"
                >
                  <div className="size-12 rounded-full overflow-hidden bg-muted shrink-0">
                    {product.imageUrl ? (
                      <img src={product.imageUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Utensils className="size-5 m-3.5 text-muted-foreground/40" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate">{product.name}</p>
                    <p className="text-xs text-muted-foreground">{categoryName(product.categoryId)}</p>
                  </div>
                  <span className="text-sm font-bold text-primary">${product.price.toFixed(2)}</span>
                  <Plus className="size-4 text-primary" />
                </button>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* ── ORDER SIDEBAR ── */}
      <aside className="w-full max-w-[400px] shrink-0 bg-white border-l border-border flex flex-col shadow-[-10px_0_32px_rgba(91,16,23,0.07)]">
        <div className="px-5 py-4 border-b border-border/60">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h1 className="text-lg font-semibold text-[#1e293b] dark:text-white tracking-tight">Order Detail</h1>
              <button
                type="button"
                onClick={copyOrderId}
                className="flex items-center gap-1.5 text-[11px] text-zinc-500 uppercase tracking-wider mt-1 font-medium hover:text-primary"
              >
                Order Id {draftOrderId}
                <Copy className="size-3" />
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleNewOrder}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-border text-foreground hover:bg-muted/50"
              >
                New Order
              </button>
              <button
                type="button"
                onClick={fetchRecentOrders}
                className="relative px-3 py-1.5 rounded-lg text-xs font-semibold border border-border text-muted-foreground hover:bg-muted/40"
              >
                Order Saved
                <span
                  className={cn(
                    "absolute -top-1.5 -right-1.5 min-w-4 h-4 px-0.5 rounded-full text-[9px] font-bold flex items-center justify-center",
                    heldCount > 0
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground border border-border"
                  )}
                >
                  {heldCount}
                </span>
              </button>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsTableDialogOpen(true)}
          className="mx-5 mt-4 block w-[calc(100%-2.5rem)] text-left relative group"
        >
          <PosCustomerProfileCard
            variant="compact"
            customerName={customerName}
            customerPhone={customerPhone}
            selectedCustomer={selectedCustomer}
            selectPhoneOptions={selectPhoneOptions}
            orderTypeLabel={orderTypeLabel}
            locationLabel={orderLocationLabel}
            onNameChange={() => {}}
            onPhoneChange={() => {}}
            onPhoneBlur={() => {}}
            onSelectCustomer={() => {}}
            className="group-hover:border-primary/20 transition-colors"
          />
          <span className="absolute top-4 right-4 size-8 rounded-full bg-white border border-zinc-100 shadow-sm flex items-center justify-center text-zinc-400 group-hover:text-primary">
            <Pencil className="size-3.5" />
          </span>
        </button>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 min-h-0">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-10">
              <div className="size-16 rounded-full bg-muted/40 flex items-center justify-center mb-3">
                <Utensils className="size-7 text-muted-foreground/30" />
              </div>
              <p className="text-sm font-semibold text-muted-foreground">No items yet</p>
              <p className="text-xs text-muted-foreground/70 mt-1">Tap a product to add</p>
            </div>
          ) : (
            cart.map(item => (
              <div
                key={item.key}
                className="relative bg-muted/20 border border-border/60 rounded-xl p-3"
              >
                <button
                  type="button"
                  onClick={() => setEditingLineKey(item.key)}
                  className="absolute top-2.5 right-2.5 text-muted-foreground hover:text-primary"
                >
                  <Pencil className="size-3.5" />
                </button>
                <div className="flex gap-3">
                  <div className="size-11 rounded-full overflow-hidden bg-white border border-border shrink-0">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Utensils className="size-5 m-3 text-muted-foreground/40" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 pr-6">
                    <p className="text-sm font-bold text-foreground leading-tight">{item.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      $ {item.price.toFixed(2)}
                    </p>
                    {formatCartOptions(item) && (
                      <p className="text-[10px] text-muted-foreground mt-1.5 leading-relaxed">
                        {formatCartOptions(item)}
                      </p>
                    )}
                    {item.lineNote && (
                      <p className="text-[10px] text-muted-foreground italic mt-1">{item.lineNote}</p>
                    )}
                    <div className="flex items-center justify-between mt-2.5">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.key, -1)}
                          className="size-7 rounded-md border border-border bg-white text-muted-foreground flex items-center justify-center hover:border-primary hover:text-primary transition-colors"
                        >
                          <Minus className="size-3.5" />
                        </button>
                        <span className="text-sm font-bold min-w-[1.25rem] text-center">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.key, 1)}
                          className="size-7 rounded-md border border-border bg-white text-muted-foreground flex items-center justify-center hover:border-primary hover:text-primary transition-colors"
                        >
                          <Plus className="size-3.5" />
                        </button>
                      </div>
                      <span className="text-sm font-bold text-foreground">
                        $ {(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeFromCart(item.key)}
                  className="absolute bottom-2 right-2 text-muted-foreground/40 hover:text-destructive"
                >
                  <X className="size-3.5" />
                </button>
              </div>
            ))
          )}
        </div>

        {cart.length > 0 && (
          <div className="px-5 pb-2">
            <textarea
              value={orderNote}
              onChange={e => setOrderNote(e.target.value)}
              placeholder="Notes (e.g. 1 item no sugar)"
              rows={2}
              className="w-full px-3 py-2 text-xs bg-muted/30 border border-border rounded-lg outline-none focus:border-primary resize-none"
            />
          </div>
        )}

        <div className="shrink-0 border-t border-border/60 bg-muted/15 p-5 space-y-3">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setIsDiscountModalOpen(true)}
              className="flex-1 h-9 rounded-lg border border-border bg-white text-xs font-semibold text-primary flex items-center justify-center gap-1 hover:bg-primary/5"
            >
              <Percent className="size-3.5" />
              Discount
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="flex-1 h-9 rounded-lg border border-border bg-white text-xs font-semibold text-[#fb923c] flex items-center justify-center gap-1 hover:bg-orange-50"
            >
              <Printer className="size-3.5" />
              Print
            </button>
          </div>

          <button
            type="button"
            onClick={() => setSummaryOpen(o => !o)}
            className="w-full flex items-center justify-between text-sm font-semibold text-muted-foreground"
          >
            Order Summary
            <ChevronDown className={cn("size-4 transition-transform", summaryOpen && "rotate-180")} />
          </button>

          {summaryOpen && (
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Line Total</span>
                <span className="font-semibold text-foreground">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Tax / VAT</span>
                <span className="font-semibold text-foreground">${taxAmount.toFixed(2)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-destructive">
                  <span>Discount</span>
                  <span>-${discountAmount.toFixed(2)}</span>
                </div>
              )}
            </div>
          )}

          <div className="flex items-end justify-between pt-1">
            <span className="text-sm font-semibold text-muted-foreground">Total Bill</span>
            <span className="text-xl font-bold tabular-nums text-primary">
              $ {total.toFixed(2)}
            </span>
          </div>

          <div className="flex gap-3 pt-1">
            <Button
              type="button"
              variant="outline"
              onClick={handleHoldOrder}
              disabled={cart.length === 0 || isProcessing}
              className="flex-1 h-[42px] rounded-md bg-zinc-100 hover:bg-zinc-200 text-foreground border-zinc-300 font-medium text-sm shadow-sm"
            >
              {isProcessing ? <Loader2 className="size-4 animate-spin" /> : "Save Order"}
            </Button>
            <Button
              type="button"
              onClick={handleOpenPayment}
              disabled={cart.length === 0}
              className={cn(btnCreatePage, "flex-1 h-[42px] rounded-md")}
            >
              Payment
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      </aside>

      {/* Customer & order type */}
      <Dialog open={isTableDialogOpen} onOpenChange={setIsTableDialogOpen}>
        <DialogContent className="sm:max-w-[520px] rounded-2xl max-h-[90vh] overflow-y-auto bg-zinc-50 border-zinc-100 p-0 gap-0">
          <DialogHeader className="px-6 pt-6 pb-2">
            <DialogTitle className="text-lg font-bold text-zinc-900">Customer & Order</DialogTitle>
            <DialogDescription className="text-sm text-zinc-500">
              Customer profile and order details
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 px-6 py-2">
            <div>
              <label className="text-xs font-semibold text-zinc-500 uppercase mb-2 block tracking-wide">
                Order type
              </label>
              <div className="grid grid-cols-2 gap-2">
                {POS_ORDER_TYPES.map(type => {
                  const Icon = type.icon;
                  return (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => handleOrderTypeChange(type.id)}
                      className={cn(
                        "flex flex-col items-center justify-center gap-1.5 h-[72px] rounded-xl border-2 text-[11px] font-bold transition-all bg-white",
                        orderType === type.id
                          ? "border-primary bg-primary/5 text-primary shadow-sm"
                          : "border-zinc-100 text-zinc-500 hover:border-primary/30"
                      )}
                    >
                      <Icon className="size-4" />
                      {type.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <PosCustomerProfileCard
              variant="full"
              customerName={customerName}
              customerPhone={customerPhone}
              selectedCustomer={selectedCustomer}
              selectPhoneOptions={selectPhoneOptions}
              orderTypeLabel={orderTypeLabel}
              locationLabel={orderLocationLabel}
              onNameChange={value => {
                setCustomerName(value);
                if (selectedCustomer) setSelectedCustomer(null);
              }}
              onPhoneChange={handleCustomerPhoneChange}
              onPhoneBlur={handleCustomerPhoneBlur}
              onSelectCustomer={handleSelectCustomerById}
              onSave={() => setIsTableDialogOpen(false)}
              onCall={
                customerPhone.trim()
                  ? () => {
                      window.location.href = `tel:${customerPhone.trim()}`;
                    }
                  : undefined
              }
            />

            {orderType === "takeaway" && (
              <div className="border-t border-border/60 pt-4 space-y-3">
                <label className="text-xs font-semibold text-muted-foreground uppercase block">
                  When to pick up
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleTakeawayTimingChange("now")}
                    className={cn(
                      "h-11 rounded-xl border-2 text-sm font-bold transition-all",
                      takeawayTiming === "now"
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border text-muted-foreground hover:border-primary/30"
                    )}
                  >
                    Now
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTakeawayTimingChange("later")}
                    className={cn(
                      "h-11 rounded-xl border-2 text-sm font-bold transition-all",
                      takeawayTiming === "later"
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border text-muted-foreground hover:border-primary/30"
                    )}
                  >
                    Later
                  </button>
                </div>
                {takeawayTiming === "later" && (
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <input
                      type="date"
                      value={pickupDate}
                      onChange={e => setPickupDate(e.target.value)}
                      className="w-full h-11 px-3 border border-border rounded-xl text-sm"
                    />
                    <input
                      type="time"
                      value={pickupTime}
                      onChange={e => setPickupTime(e.target.value)}
                      className="w-full h-11 px-3 border border-border rounded-xl text-sm"
                    />
                  </div>
                )}
              </div>
            )}

            {orderType === "delivery" && (
              <div className="border-t border-border/60 pt-4 space-y-3">
                <label className="text-xs font-semibold text-muted-foreground uppercase block">
                  Delivery place
                </label>
                <input
                  type="text"
                  value={deliveryStreet}
                  onChange={e => setDeliveryStreet(e.target.value)}
                  placeholder="Street address *"
                  className="w-full h-11 px-3 border border-border rounded-xl text-sm"
                />
                <input
                  type="text"
                  value={deliveryDistrict}
                  onChange={e => setDeliveryDistrict(e.target.value)}
                  placeholder="District / area"
                  className="w-full h-11 px-3 border border-border rounded-xl text-sm"
                />
              </div>
            )}
          </div>
          <DialogFooter className="px-6 pb-6 pt-2">
            <Button
              onClick={() => setIsTableDialogOpen(false)}
              className={cn(btnCreatePage, "w-full h-11 rounded-full")}
            >
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Line note edit */}
      <Dialog open={!!editingLineKey} onOpenChange={open => !open && setEditingLineKey(null)}>
        <DialogContent className="sm:max-w-[360px] rounded-2xl">
          <DialogHeader>
            <DialogTitle>Item note</DialogTitle>
          </DialogHeader>
          <textarea
            rows={3}
            value={cart.find(c => c.key === editingLineKey)?.lineNote || ""}
            onChange={e => {
              const val = e.target.value;
              setCart(prev =>
                prev.map(item =>
                  item.key === editingLineKey ? { ...item, lineNote: val } : item
                )
              );
            }}
            placeholder="e.g. no sugar"
            className="w-full px-3 py-2 text-sm border border-border rounded-lg outline-none focus:border-primary resize-none"
          />
          <DialogFooter>
            <Button onClick={() => setEditingLineKey(null)} className={cn(btnCreatePage, "w-full rounded-xl")}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Checkout */}
      <Dialog
        open={isCheckoutOpen}
        onOpenChange={open => {
          if (!open && !isProcessing) setIsCheckoutOpen(false);
        }}
      >
        <DialogContent className="sm:max-w-[480px] bg-white border-zinc-100 p-0 overflow-hidden rounded-2xl">
          <DialogTitle className="sr-only">Payment</DialogTitle>
          <div className="p-6 border-b border-zinc-100">
            <DialogTitle className="text-xl font-bold text-[#1e293b]">Payment</DialogTitle>
            <DialogDescription className="text-sm text-zinc-500 mt-1">
              Choose how the customer pays before the order is sent to the kitchen.
            </DialogDescription>
          </div>

          <div className="p-6 space-y-6">
            <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Amount to pay</p>
                <p className="text-2xl font-black text-primary mt-1">${total.toFixed(2)}</p>
                {taxAmount > 0 && (
                  <p className="text-xs text-zinc-500 mt-1">Includes ${taxAmount.toFixed(2)} tax</p>
                )}
              </div>
              <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Wallet className="size-6 text-primary" />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-bold text-[#1E293B]">Payment method *</label>
              <div className="grid grid-cols-3 gap-2">
                {POS_PAYMENT_METHODS.map(method => {
                  const Icon = method.icon;
                  return (
                    <button
                      key={method.id}
                      type="button"
                      onClick={() => setPaymentMethod(method.id)}
                      className={cn(
                        "flex flex-col items-center justify-center gap-2 h-20 rounded-xl border-2 transition-all",
                        paymentMethod === method.id
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-zinc-200 text-zinc-500 hover:border-primary/30"
                      )}
                    >
                      <Icon className="size-5" />
                      <span className="text-[11px] font-bold">{method.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-[#1E293B]">Mobile number *</label>
              <input
                type="tel"
                value={paymentPhone}
                onChange={e => setPaymentPhone(e.target.value)}
                placeholder="e.g. 61XXXXXXX"
                className={formInputClass}
              />
              <p className="text-xs text-zinc-500">
                {paymentMethod === "premier_wallet"
                  ? "Premier Wallet will send a payment request to this number."
                  : "Enter the number used for this mobile payment."}
              </p>
            </div>
          </div>

          <DialogFooter className="p-6 bg-zinc-50 border-t border-zinc-100 gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsCheckoutOpen(false)}
              className="rounded-lg font-bold px-6 h-11"
              disabled={isProcessing}
            >
              Back
            </Button>
            <Button
              type="button"
              onClick={handleCheckout}
              disabled={isProcessing}
              className="bg-primary !text-white hover:bg-primary/90 hover:!text-white rounded-lg font-bold px-8 h-11 gap-2 disabled:opacity-70"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle2 className="size-4" />
                  Confirm & Pay
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Discount */}
      <Dialog open={isDiscountModalOpen} onOpenChange={setIsDiscountModalOpen}>
        <DialogContent className="sm:max-w-[400px] rounded-2xl">
          <DialogHeader>
            <DialogTitle>Apply Discount</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="flex bg-muted p-1 rounded-lg">
              {(["percentage", "fixed"] as const).map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setDiscountType(t)}
                  className={cn(
                    "flex-1 py-2 text-xs font-bold rounded-md",
                    discountType === t ? "bg-white shadow-sm text-primary" : "text-muted-foreground"
                  )}
                >
                  {t === "percentage" ? "Percentage (%)" : "Fixed ($)"}
                </button>
              ))}
            </div>
            <input
              type="number"
              value={tempDiscount}
              onChange={e => setTempDiscount(e.target.value)}
              className="w-full h-12 border border-border rounded-xl px-4 text-sm font-bold focus:border-primary outline-none"
              placeholder="0"
            />
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsDiscountModalOpen(false)}>Cancel</Button>
            <Button
              onClick={() => {
                setDiscount(parseFloat(tempDiscount) || 0);
                setIsDiscountModalOpen(false);
              }}
              className={cn(btnCreatePage, "rounded-xl")}
            >
              Apply
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Held orders */}
      <Dialog open={isRecentOrdersOpen} onOpenChange={setIsRecentOrdersOpen}>
        <DialogContent className="sm:max-w-[560px] rounded-2xl">
          <DialogHeader>
            <DialogTitle>Saved Orders</DialogTitle>
          </DialogHeader>
          <div className="max-h-[360px] overflow-y-auto space-y-2 py-2">
            {recentOrders.length === 0 ? (
              <p className="text-center text-muted-foreground py-10">No saved orders</p>
            ) : (
              recentOrders.map(order => {
                const isActive = activeHeldOrderId === order.id;
                const typeLabel =
                  order.orderType === "delivery"
                    ? "Delivery"
                    : order.orderType === "takeaway"
                      ? "Takeaway"
                      : "Saved";
                return (
                  <button
                    key={order.id}
                    type="button"
                    onClick={() => resumeOrder(order)}
                    className={cn(
                      "w-full flex items-center justify-between p-4 rounded-xl border text-left transition-colors",
                      isActive
                        ? "bg-primary/10 border-primary/40"
                        : "bg-muted/30 border-border hover:border-primary/30"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <History className="size-5 text-primary" />
                      <div>
                        <p className="text-sm font-bold">Order #{order.id}</p>
                        <p className="text-[10px] text-muted-foreground uppercase">
                          {typeLabel} · {order.orderitem?.length || 0} items
                          {isActive ? " · In cart" : ""}
                        </p>
                      </div>
                    </div>
                    <span className="text-sm font-bold text-primary">${order.total?.toFixed(2)}</span>
                  </button>
                );
              })
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Print receipt */}
      <div id="printable-receipt" className="hidden print:block font-mono text-[10px] p-4 bg-white text-black">
        <div className="mb-3">
          <ReceiptHeader settings={receiptSettings} />
        </div>
        <div className="border-b border-dashed mb-2 pb-2">
          <p>Order: {draftOrderId}</p>
          <p>{orderLocationLabel}</p>
        </div>
        {cart.map(item => (
          <div key={item.key} className="flex justify-between py-0.5">
            <span>{item.quantity}x {item.name}</span>
            <span>${(item.quantity * item.price).toFixed(2)}</span>
          </div>
        ))}
        {discountAmount > 0 && (
          <div className="flex justify-between py-0.5 text-destructive">
            <span>Discount</span>
            <span>-${discountAmount.toFixed(2)}</span>
          </div>
        )}
        <div className="border-t border-dashed pt-2 mt-2 font-bold flex justify-between">
          <span>TOTAL</span>
          <span>${total.toFixed(2)}</span>
        </div>
        {(receiptSettings?.footerText || receiptSettings?.email) && (
          <div className="text-center mt-4 text-[9px] text-zinc-600">
            {receiptSettings?.footerText && <p className="italic">{receiptSettings.footerText}</p>}
            {receiptSettings?.email && <p className="font-bold mt-1">{receiptSettings.email}</p>}
          </div>
        )}
      </div>
    </div>
  );
}
