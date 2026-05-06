// ─────────────────────────────────────────────────────────────────
//  paymentApi.ts
//  POST   /api/payments/pay              (PUBLIC)
//  PATCH  /api/payments/pay/:id/confirm  (PUBLIC)
//  POST   /api/payments                  (admin, manager, cashier)
//  GET    /api/payments                  (admin, manager, cashier)
//  GET    /api/payments/order/:orderId   (admin, manager, cashier)
//  GET    /api/payments/:id              (admin, manager, cashier)
//  PATCH  /api/payments/:id/status       (admin, manager)
//  DELETE /api/payments/:id              (admin)
// ─────────────────────────────────────────────────────────────────

import api from './axios';

export type PaymentMethod = 'cash' | 'card' | 'online';
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';

export interface Payment {
  id: string;
  orderId: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  createdAt?: string;
}

export interface CreatePaymentPayload {
  orderId: string;
  amount: number;
  method: PaymentMethod;
}

export const paymentApi = {
  // ── PUBLIC ───────────────────────────────────────────────────
  createPublicPayment: async (payload: CreatePaymentPayload): Promise<Payment> => {
    const { data } = await api.post<Payment>('/payments/pay', payload);
    return data;
  },

  confirmPublicPayment: async (id: string): Promise<Payment> => {
    const { data } = await api.patch<Payment>(`/payments/pay/${id}/confirm`);
    return data;
  },

  // ── Protected ─────────────────────────────────────────────────
  createPayment: async (payload: CreatePaymentPayload): Promise<Payment> => {
    const { data } = await api.post<Payment>('/payments', payload);
    return data;
  },

  getAllPayments: async (): Promise<Payment[]> => {
    const { data } = await api.get<Payment[]>('/payments');
    return data;
  },

  getPaymentByOrderId: async (orderId: string): Promise<Payment> => {
    const { data } = await api.get<Payment>(`/payments/order/${orderId}`);
    return data;
  },

  getPaymentById: async (id: string): Promise<Payment> => {
    const { data } = await api.get<Payment>(`/payments/${id}`);
    return data;
  },

  updatePaymentStatus: async (id: string, status: PaymentStatus): Promise<Payment> => {
    const { data } = await api.patch<Payment>(`/payments/${id}/status`, { status });
    return data;
  },

  deletePayment: async (id: string): Promise<void> => {
    await api.delete(`/payments/${id}`);
  },
};
