import api from './axios';

export type OrderStatus = 'pending' | 'preparing' | 'ready' | 'served' | 'paid' | 'cancelled' | 'held' | 'completed';

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
  taxAmount: number;
  subTotal: number;
  notes?: string;
  customerName?: string;
  customerPhone?: string;
  orderitem: OrderItem[];
  table?: { id: number; number: number };
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateOrderPayload {
  tableId?: number;
  type?: string;
  customerName?: string;
  customerPhone?: string;
  notes?: string;
  status?: string;
  items: { menuItemId: number; quantity: number }[];
}

export const orderApi = {
  createOrder: async (payload: CreateOrderPayload): Promise<Order> => {
    const res = await api.post('/orders', payload);
    return res.data.data;
  },

  getAllOrders: async (params?: { status?: string; onlyMine?: boolean }): Promise<Order[]> => {
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    if (params?.onlyMine) query.set('onlyMine', 'true');
    const res = await api.get(`/orders/all?${query.toString()}`);
    return res.data.data || [];
  },

  getOrdersByTable: async (tableId: number): Promise<Order[]> => {
    const res = await api.get(`/orders/table/${tableId}`);
    return res.data.data || [];
  },

  getOrderById: async (id: number): Promise<Order> => {
    const res = await api.get(`/orders/${id}`);
    return res.data.data;
  },

  updateOrder: async (id: number, payload: CreateOrderPayload): Promise<Order> => {
    const res = await api.put(`/orders/${id}`, payload);
    return res.data.data;
  },

  updateStatus: async (id: number, status: OrderStatus): Promise<Order> => {
    const res = await api.patch(`/orders/${id}/status`, { status });
    return res.data.data;
  },

  deleteOrder: async (id: number): Promise<void> => {
    await api.delete(`/orders/${id}`);
  }
};
