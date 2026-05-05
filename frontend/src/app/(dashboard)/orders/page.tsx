"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ListOrdered, Filter, Search, Plus, PackageOpen, Trash2, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { orderApi, Order, OrderStatus } from "@/lib/api/orderApi";
import { tableApi, Table as RestaurantTable } from "@/lib/api/tableApi";
import { menuItemApi, MenuItem } from "@/lib/api/menuItemApi";
import { useToast } from "@/components/ui/toast";
import { Eye, X } from "lucide-react";

export default function OrdersPage() {
  const { showToast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  
  // Form states
  const [formTableId, setFormTableId] = useState("");
  const [formCustomerName, setFormCustomerName] = useState("");
  const [formCustomerPhone, setFormCustomerPhone] = useState("");
  const [formItems, setFormItems] = useState<{menuItemId: number, quantity: number}[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ordersData, tablesData, menuItemsData] = await Promise.all([
          orderApi.getAllOrders(),
          tableApi.getAllTables(),
          menuItemApi.getAllMenuItems()
        ]);
        setOrders(ordersData || []);
        setTables(tablesData || []);
        setMenuItems(menuItemsData || []);
      } catch (error) {
        console.error("Failed to fetch data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const openAddModal = () => {
    setFormTableId("");
    setFormCustomerName("");
    setFormCustomerPhone("");
    setFormItems([]);
    setIsAddOpen(true);
  };

  const openEditModal = (order: Order) => {
    setSelectedOrder(order);
    setFormTableId(order.tableId.toString());
    setFormCustomerName(order.customerName || "");
    setFormCustomerPhone(order.customerPhone || "");
    const items = order.orderitem?.map(i => ({ menuItemId: i.menuItemId, quantity: i.quantity })) || [];
    setFormItems(items);
    setIsEditOpen(true);
  };

  const openDeleteModal = (order: Order) => {
    setSelectedOrder(order);
    setIsDeleteOpen(true);
  };

  const openViewModal = (order: Order) => {
    setSelectedOrder(order);
    setIsViewOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedOrder) return;
    try {
      await orderApi.deleteOrder(selectedOrder.id);
      setOrders(orders.filter(o => o.id !== selectedOrder.id));
      setIsDeleteOpen(false);
    } catch (error) {
      console.error("Failed to delete order", error);
    }
  };

  const handleStatusUpdate = async (id: number, status: OrderStatus) => {
    try {
      await orderApi.updateStatus(id, status);
      setOrders(orders.map(o => o.id === id ? { ...o, status } : o));
    } catch (error) {
      console.error("Failed to update status", error);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground uppercase">Orders Management</h1>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-3">Monitor live orders and manage transaction history.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="text-[14.5px] font-bold h-10 rounded-lg bg-white border border-zinc-100 text-[#64748B] hover:bg-zinc-50 hover:text-[#605DFF] transition-all shadow-sm px-4">
            <Filter className="mr-2 size-4" />
            Filter
          </Button>
        </div>
      </div>

      <div className="trezo-card overflow-hidden">
        <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-zinc-50/30">
          <div>
            <h3 className="text-sm font-bold text-foreground">Live Order Feed</h3>
            <p className="text-[12px] font-medium text-muted-foreground mt-1">Real-time status tracking</p>
          </div>
          <div className="flex flex-col md:flex-row items-center gap-3">
            <div className="relative group w-full md:w-72">
              <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-[#605DFF] transition-colors" />
              <input 
                type="text" 
                placeholder="Search orders..." 
                className="w-full pl-10 pr-4 py-2.5 text-[14.5px] font-medium bg-white border border-zinc-100 rounded-lg outline-none focus:border-[#605DFF]/30 focus:ring-4 focus:ring-[#605DFF]/5 transition-all shadow-sm" 
              />
            </div>
            <Button size="sm" onClick={openAddModal} className="w-full md:w-auto text-[14.5px] font-bold h-[42px] rounded-lg bg-[#605DFF] text-white hover:bg-[#4E4BCB] transition-all border-none shadow-md px-6">
              <Plus className="mr-2 size-4" />
              New Order
            </Button>
          </div>
        </div>
        <div className="border-t border-zinc-100">
          <Table>
            <TableHeader className="bg-zinc-50/50">
              <TableRow className="border-zinc-100 hover:bg-transparent">
                <TableHead className="px-6 py-5 text-[11px] font-bold uppercase tracking-widest text-[#64748B]">Order ID</TableHead>
                <TableHead className="px-6 py-5 text-[11px] font-bold uppercase tracking-widest text-[#64748B]">Customer</TableHead>
                <TableHead className="px-6 py-5 text-[11px] font-bold uppercase tracking-widest text-[#64748B]">Items</TableHead>
                <TableHead className="px-6 py-5 text-[11px] font-bold uppercase tracking-widest text-[#64748B]">Total</TableHead>
                <TableHead className="px-6 py-5 text-[11px] font-bold uppercase tracking-widest text-[#64748B] text-center">Status</TableHead>
                <TableHead className="px-6 py-5 text-[11px] font-bold uppercase tracking-widest text-[#64748B]">Time</TableHead>
                <TableHead className="px-6 py-5 text-right text-[11px] font-bold uppercase tracking-widest text-[#64748B] w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i} className="h-12 animate-pulse bg-muted/10">
                    <TableCell colSpan={6} />
                  </TableRow>
                ))
              ) : orders.length > 0 ? (
                orders.map((order) => (
                  <TableRow key={order.id} className="border-zinc-50 hover:bg-zinc-50/30 transition-colors group">
                    <TableCell className="px-6 py-5 text-[13px] font-medium text-[#1E293B]">#{order.id}</TableCell>
                    <TableCell className="px-6 py-5 text-[13px] font-medium text-[#1E293B] uppercase tracking-tight">
                      {order.customerName || "Walk-in Guest"}
                    </TableCell>
                    <TableCell className="px-6 py-5 text-[13px] text-[#64748B] max-w-[200px] truncate">
                      {order.orderitem?.map(i => `${i.quantity}x ${i.menuitem?.name}`).join(", ") || "-"}
                    </TableCell>
                    <TableCell className="px-6 py-5 text-[13px] font-bold text-[#1E293B]">
                      ${order.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="px-6 py-5 text-center">
                      <span className={`px-3 py-1 rounded-md text-[13px] font-medium ${
                        order.status === "paid" ? "bg-emerald-100 text-emerald-700" :
                        order.status === "pending" ? "bg-orange-100 text-orange-700" :
                        order.status === "preparing" ? "bg-blue-100 text-blue-700" :
                        order.status === "ready" ? "bg-green-100 text-green-700" :
                        "bg-rose-100 text-rose-700"
                      }`}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                    </TableCell>
                    <TableCell className="px-6 py-5 text-[#64748B] text-[11px] font-bold uppercase tracking-widest">
                      {order.createdAt ? new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "-"}
                    </TableCell>
                    <TableCell className="px-6 py-5 text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => openViewModal(order)} className="h-8 w-8 p-0 text-[#64748B] hover:text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors">
                          <Eye className="size-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => openEditModal(order)} className="h-8 w-8 p-0 text-[#64748B] hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors">
                          <Edit className="size-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => openDeleteModal(order)} className="h-8 w-8 p-0 text-[#64748B] hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors">
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center justify-center">
                       <PackageOpen className="size-12 text-zinc-200 mb-4" />
                       <p className="text-[#64748B] font-bold uppercase text-[11px] tracking-widest">No orders found in database</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* ADD/EDIT ORDER MODAL */}
      <Dialog open={isAddOpen || isEditOpen} onOpenChange={(open) => { if(!open) { setIsAddOpen(false); setIsEditOpen(false); } }}>
        <DialogContent
          className="sm:max-w-[700px] bg-white border-zinc-100 p-0 overflow-hidden"
        >
          <div className="flex items-center justify-between p-6 border-b border-zinc-100">
            <div className="space-y-1">
              <DialogTitle className="text-xl font-bold">
                {isEditOpen ? "Edit Order" : "New Order"}
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                Enter customer details and select items for this transaction.
              </DialogDescription>
            </div>
          </div>
          
          <div className="p-6 space-y-6 max-h-[65vh] overflow-y-auto pr-2">
            <div className="space-y-2">
              <label className="text-sm font-bold text-[#1E293B]">Select Table *</label>
              <select 
                value={formTableId}
                onChange={(e) => setFormTableId(e.target.value)}
                className="w-full px-4 py-3 border border-zinc-200 rounded-lg text-[15px] focus:outline-none focus:ring-2 focus:ring-[#605DFF]/20"
              >
                <option value="">Choose a table...</option>
                {tables.map(t => (
                  <option key={t.id} value={t.id}>Table {t.number} ({t.capacity} seats)</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-[#1E293B]">Customer Name</label>
                <input 
                  type="text" 
                  value={formCustomerName}
                  onChange={(e) => setFormCustomerName(e.target.value)}
                  className="w-full px-4 py-3 border border-zinc-200 rounded-lg text-[15px] focus:outline-none focus:ring-2 focus:ring-[#605DFF]/20"
                  placeholder="Optional"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-[#1E293B]">Customer Phone</label>
                <input 
                  type="text" 
                  value={formCustomerPhone}
                  onChange={(e) => setFormCustomerPhone(e.target.value)}
                  className="w-full px-4 py-3 border border-zinc-200 rounded-lg text-[15px] focus:outline-none focus:ring-2 focus:ring-[#605DFF]/20"
                  placeholder="Optional"
                />
              </div>
            </div>
            
            <div className="pt-4 border-t border-zinc-100">
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-bold text-[#1E293B]">Order Items</label>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={() => setFormItems([...formItems, { menuItemId: 0, quantity: 1 }])}
                  className="h-8 text-xs font-bold"
                >
                  <Plus className="mr-1 size-3" /> Add Item
                </Button>
              </div>
              
              {formItems.length === 0 ? (
                <div className="text-center py-6 bg-zinc-50 rounded-lg border border-dashed border-zinc-200 text-sm text-zinc-500">
                  No items added yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {formItems.map((item, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <select
                        value={item.menuItemId || ""}
                        onChange={(e) => {
                          const newItems = [...formItems];
                          newItems[index].menuItemId = Number(e.target.value);
                          setFormItems(newItems);
                        }}
                        className="flex-1 px-3 py-3 border border-zinc-200 rounded-lg text-[15px] focus:outline-none"
                      >
                        <option value="">Select Item</option>
                        {menuItems.map(m => (
                          <option key={m.id} value={m.id}>{m.name} - ${m.price}</option>
                        ))}
                      </select>
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => {
                          const newItems = [...formItems];
                          newItems[index].quantity = Number(e.target.value);
                          setFormItems(newItems);
                        }}
                        className="w-24 px-3 py-3 border border-zinc-200 rounded-lg text-[15px] focus:outline-none text-center"
                      />
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-9 w-9 text-rose-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                        onClick={() => setFormItems(formItems.filter((_, i) => i !== index))}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="flex justify-between items-center pt-4 border-t border-zinc-100">
              <span className="text-sm font-bold text-zinc-500 uppercase tracking-widest">Total</span>
              <span className="text-lg font-bold text-[#605DFF]">
                ${formItems.reduce((sum, item) => {
                  const mItem = menuItems.find(m => m.id === item.menuItemId);
                  return sum + (mItem?.price || 0) * item.quantity;
                }, 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
          <DialogFooter className="p-6 border-t border-zinc-100">
            <Button variant="outline" onClick={() => { setIsAddOpen(false); setIsEditOpen(false); }} className="rounded-lg font-bold px-6 py-2.5 h-11">
              Cancel
            </Button>
            <Button 
              className="bg-[#605DFF] hover:bg-[#4E4BCB] text-white rounded-lg font-bold border-none px-8 h-11"
              onClick={async () => {
                if (!formTableId) return showToast("Please select a table", "error");
                if (formItems.length === 0) return showToast("Please add at least one item", "error");
                if (formItems.some(i => !i.menuItemId)) return showToast("Please select a menu item for all rows", "error");
                
                const payload = {
                  tableId: Number(formTableId),
                  customerName: formCustomerName,
                  customerPhone: formCustomerPhone,
                  items: formItems
                };
                
                try {
                  if (isEditOpen && selectedOrder) {
                    await orderApi.updateOrder(selectedOrder.id, payload);
                  } else {
                    await orderApi.createOrder(payload);
                  }
                  
                  // Refresh orders
                  const updatedOrders = await orderApi.getAllOrders();
                  setOrders(updatedOrders || []);
                  
                  showToast(isEditOpen ? "Order updated successfully" : "Order created successfully", "success");
                  setIsAddOpen(false);
                  setIsEditOpen(false);
                } catch (error: any) {
                  console.error("Failed to save order", error);
                  const errorMsg = error.response?.data?.message || error.message || "Failed to save order";
                  showToast(errorMsg, "error");
                }
              }}
            >
              Save Order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteOpen} onOpenChange={(open) => { if(!open) setIsDeleteOpen(false); }}>
        <DialogContent 
          className="sm:max-w-[440px] bg-white border-zinc-100"
        >
          <DialogTitle className="sr-only">Delete Order</DialogTitle>
          <div className="p-6 flex flex-col items-center text-center pt-10">
            <div className="w-16 h-16 rounded-full bg-rose-100 flex items-center justify-center mb-4">
              <Trash2 className="size-8 text-rose-600" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">Delete Order?</h3>
            <p className="text-sm text-muted-foreground">
              Are you sure you want to permanently delete order 
              <span className="font-bold text-foreground ml-1">#{selectedOrder?.id}</span>? 
              This action cannot be undone.
            </p>
          </div>
          <div className="p-4 bg-zinc-50 border-t border-zinc-100 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)} className="rounded-lg font-bold border-zinc-200 px-6 h-11">
              Cancel
            </Button>
            <Button onClick={confirmDelete} className="bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold border-none shadow-sm px-6 h-11">
              Yes, Delete Order
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* VIEW ORDER DETAILS MODAL */}
      <Dialog open={isViewOpen} onOpenChange={(open) => { if(!open) setIsViewOpen(false); }}>
        <DialogContent 
          className="sm:max-w-[540px] bg-white border-zinc-100"
        >
          <DialogTitle className="sr-only">Order Details</DialogTitle>
          {selectedOrder && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl font-bold">Order #{selectedOrder.id}</DialogTitle>
                <DialogDescription>
                  {new Date(selectedOrder.createdAt || Date.now()).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6 pt-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground font-bold tracking-widest text-[11px] uppercase mb-1">Customer</p>
                    <p className="font-medium text-foreground">{selectedOrder.customerName || "Walk-in Guest"}</p>
                    {selectedOrder.customerPhone && <p className="text-muted-foreground">{selectedOrder.customerPhone}</p>}
                  </div>
                  <div>
                    <p className="text-muted-foreground font-bold tracking-widest text-[11px] uppercase mb-1">Location</p>
                    <p className="font-medium text-foreground">Table {selectedOrder.table?.number || selectedOrder.tableId}</p>
                  </div>
                </div>

                <div>
                  <p className="text-muted-foreground font-bold tracking-widest text-[11px] uppercase mb-3 border-b border-zinc-100 pb-2">Order Items</p>
                  <div className="space-y-3 max-h-[30vh] overflow-y-auto pr-2">
                    {selectedOrder.orderitem?.map((item) => (
                      <div key={item.id} className="flex justify-between items-center text-sm">
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-[#605DFF] bg-[#605DFF]/10 px-2 py-0.5 rounded">x{item.quantity}</span>
                          <span className="font-medium text-foreground">{item.menuitem?.name}</span>
                        </div>
                        <span className="font-bold text-foreground">
                          ${(item.quantity * (item.menuitem?.price || item.unitPrice)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-zinc-100 flex justify-between items-center">
                  <span className="text-base font-bold text-foreground uppercase tracking-widest">Total</span>
                  <span className="text-2xl font-bold text-[#605DFF]">
                    ${selectedOrder.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="flex justify-end pt-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setIsViewOpen(false)} 
                    className="rounded-lg font-bold border-zinc-200 px-8 h-11"
                  >
                    Close
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

    </div>
  );
}
