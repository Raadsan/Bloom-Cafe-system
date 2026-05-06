// ─────────────────────────────────────────────────────────────────
//  notificationApi.ts
//  GET    /api/notifications                            (admin, manager)
//  GET    /api/notifications/kitchen                    (kitchen)
//  GET    /api/notifications/waiter                     (waiter)
//  PATCH  /api/notifications/:id/read                   (authenticated)
//  GET    /api/notifications/customer/:customerId        (PUBLIC)
//  GET    /api/notifications/customer/order/:orderId     (PUBLIC)
//  PATCH  /api/notifications/customer/:id/read-all      (PUBLIC)
//  GET    /api/notifications/customer/:id/unread-count  (PUBLIC)
// ─────────────────────────────────────────────────────────────────

import api from './axios';

export interface Notification {
  id: number;
  title: string;
  message: string;
  isRead: boolean;
  role?: string;
  orderId?: number;
  createdAt?: string;
}

export const notificationApi = {
  // ── Staff (protected) ─────────────────────────────────────────
  getAllNotifications: async (): Promise<Notification[]> => {
    const { data } = await api.get<{ success: boolean; data: Notification[] }>('/notifications');
    return data.data;
  },

  getKitchenNotifications: async (): Promise<Notification[]> => {
    const { data } = await api.get<{ success: boolean; data: Notification[] }>('/notifications/kitchen');
    return data.data;
  },

  getWaiterNotifications: async (): Promise<Notification[]> => {
    const { data } = await api.get<{ success: boolean; data: Notification[] }>('/notifications/waiter');
    return data.data;
  },

  markNotificationRead: async (id: number): Promise<Notification> => {
    const { data } = await api.patch<{ success: boolean; data: Notification }>(`/notifications/${id}/read`);
    return data.data;
  },

  // ── Customer (PUBLIC) ─────────────────────────────────────────
  getCustomerNotifications: async (customerId: number): Promise<Notification[]> => {
    const { data } = await api.get<{ success: boolean; data: Notification[] }>(`/notifications/customer/${customerId}`);
    return data.data;
  },

  getOrderByNotification: async (orderId: number): Promise<Notification[]> => {
    const { data } = await api.get<{ success: boolean; data: Notification[] }>(`/notifications/customer/order/${orderId}`);
    return data.data;
  },

  markAllCustomerRead: async (customerId: number): Promise<void> => {
    await api.patch(`/notifications/customer/${customerId}/read-all`);
  },

  getUnreadCount: async (customerId: number): Promise<number> => {
    const { data } = await api.get<{ success: boolean; count: number }>(`/notifications/customer/${customerId}/unread-count`);
    return data.count;
  }
};
