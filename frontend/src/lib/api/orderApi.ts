// ─────────────────────────────────────────────────────────────────
//  orderApi.ts
//  POST   /api/orders                  (admin, manager, waiter)
//  GET    /api/orders/all              (admin, manager, kitchen, waiter)
//  GET    /api/orders/table/:tableId   (admin, manager, kitchen, waiter)
//  GET    /api/orders/:id              (admin, manager, kitchen, waiter)
//  PATCH  /api/orders/:id/status       (admin, manager, kitchen, waiter)
//  DELETE /api/orders/:id              (admin, manager)
// ─────────────────────────────────────────────────────────────────

import api from './axios';

export type OrderStatus = 'pending' | 'preparing' | 'ready' | 'served' | 'paid' | 'cancelled';

export interface OrderItem {
  id: number;
  menuItemId: number;
  quantity: number;
  unitPrice: number;
  menuitem?: { id: number; name: string; price: number };
}

export interface Order {
  id: number;
  tableId: number;
  status: OrderStatus;
  total: number;
  notes?: string;
  customerName?: string;
  customerPhone?: string;
  orderitem: OrderItem[];
  table?: { id: number; number: number };
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateOrderPayload {
  tableId: number;
  customerName?: string;
  customerPhone?: string;
  notes?: string;
  items: { menuItemId: number; quantity: number }[];
}

export const orderApi = {
  createOrder: async (payload: CreateOrderPayload): Promise<Order> => {
    const { data } = await api.post<{ success: boolean; data: Order }>('/orders', payload);
    return data.data;
  },

  getAllOrders: async (): Promise<Order[]> => {
    const { data } = await api.get<{ success: boolean; data: Order[] }>('/orders/all');
    return data.data;
  },

  getOrdersByTable: async (tableId: number): Promise<Order[]> => {
    const { data } = await api.get<{ success: boolean; data: Order[] }>(`/orders/table/${tableId}`);
    return data.data;
  },

  getOrderById: async (id: number): Promise<Order> => {
    const { data } = await api.get<{ success: boolean; data: Order }>(`/orders/${id}`);
    return data.data;
  },

  updateOrder: async (id: number, payload: CreateOrderPayload): Promise<Order> => {
    const { data } = await api.put<{ success: boolean; data: Order }>(`/orders/${id}`, payload);
    return data.data;
  },

  updateStatus: async (id: number, status: OrderStatus): Promise<Order> => {
    const { data } = await api.patch<{ success: boolean; data: Order }>(`/orders/${id}/status`, { status });
    return data.data;
  },

  deleteOrder: async (id: number): Promise<void> => {
    await api.delete(`/orders/${id}`);
  }
};
