import api from './axios';

export interface Notification {
  id: number;
  title: string;
  message: string;
  isRead: boolean;
  role?: string;
  orderId?: number;
  customerId?: number;
  userId?: number | null;
  createdAt?: string;
}

const NOTIF_TTL_MS = 30 * 1000;
let notifCache: { data: Notification[]; at: number } | null = null;
let notifInflight: Promise<Notification[]> | null = null;

export const notificationApi = {
  getAllNotifications: async (): Promise<Notification[]> => {
    const res = await api.get('/notifications');
    return res.data.data || [];
  },

  getMyNotifications: async (forceRefresh = false): Promise<Notification[]> => {
    const now = Date.now();
    if (!forceRefresh && notifCache && now - notifCache.at < NOTIF_TTL_MS) {
      return notifCache.data;
    }

    if (notifInflight && !forceRefresh) return notifInflight;

    notifInflight = api
      .get('/notifications/me')
      .then((res) => {
        const data: Notification[] = res.data.data || [];
        notifCache = { data, at: Date.now() };
        notifInflight = null;
        return data;
      })
      .catch((err) => {
        notifInflight = null;
        throw err;
      });

    return notifInflight;
  },

  clearNotificationCache: () => {
    notifCache = null;
  },

  getKitchenNotifications: async (): Promise<Notification[]> => {
    const res = await api.get('/notifications/kitchen');
    return res.data.data || [];
  },

  getWaiterNotifications: async (): Promise<Notification[]> => {
    const res = await api.get('/notifications/waiter');
    return res.data.data || [];
  },

  markNotificationRead: async (id: number): Promise<Notification> => {
    const res = await api.patch(`/notifications/${id}/read`);
    notificationApi.clearNotificationCache();
    return res.data.data;
  },

  getCustomerNotifications: async (customerId: number): Promise<Notification[]> => {
    const res = await api.get(`/notifications/customer/${customerId}`);
    return res.data.data || [];
  },

  getOrderByNotification: async (orderId: number): Promise<Notification[]> => {
    const res = await api.get(`/notifications/customer/order/${orderId}`);
    return res.data.data || [];
  },

  markAllCustomerRead: async (customerId: number): Promise<void> => {
    await api.patch(`/notifications/customer/${customerId}/read-all`);
  },

  getUnreadCount: async (customerId: number): Promise<number> => {
    const res = await api.get(`/notifications/customer/${customerId}/unread-count`);
    return res.data.unread || 0;
  },
};
