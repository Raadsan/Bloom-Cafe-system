import api from './axios';

export interface Notification {
  id: number;
  title: string;
  message: string;
  isRead: boolean;
  role?: string;
  orderId?: number;
  customerId?: number;
  createdAt?: string;
}

export const notificationApi = {
  getAllNotifications: async (): Promise<Notification[]> => {
    const res = await api.get('/notifications');
    return res.data.data || [];
  },

  getKitchenNotifications: async (): Promise<Notification[]> => {
    const res = await api.get('/notifications?role=kitchen');
    return res.data.data || [];
  },

  getWaiterNotifications: async (): Promise<Notification[]> => {
    const res = await api.get('/notifications?role=waiter');
    return res.data.data || [];
  },

  markNotificationRead: async (id: number): Promise<Notification> => {
    const res = await api.patch(`/notifications/${id}/read`);
    return res.data.data;
  },

  getCustomerNotifications: async (customerId: number): Promise<Notification[]> => {
    const res = await api.get(`/notifications/customer/${customerId}`);
    return res.data.data || [];
  },

  getOrderByNotification: async (orderId: number): Promise<Notification[]> => {
    const res = await api.get(`/notifications/order/${orderId}`);
    return res.data.data || [];
  },

  markAllCustomerRead: async (customerId: number): Promise<void> => {
    await api.patch(`/notifications/customer/${customerId}/read-all`);
  },

  getUnreadCount: async (customerId: number): Promise<number> => {
    const res = await api.get(`/notifications/customer/${customerId}/unread-count`);
    return res.data.count || 0;
  }
};
