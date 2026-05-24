import api from './axios';

export const reportApi = {
  getDashboardSummary: async (params?: any): Promise<any> => {
    const query = new URLSearchParams();
    if (params?.startDate) query.set('startDate', params.startDate);
    if (params?.endDate) query.set('endDate', params.endDate);
    if (params?.from) query.set('from', params.from);
    if (params?.to) query.set('to', params.to);
    if (params?.date) query.set('date', params.date);
    if (params?.month) query.set('month', params.month);
    const res = await api.get(`/reports/summary?${query.toString()}`);
    return res.data;
  },

  getRevenueReport: async (params?: { from?: string; to?: string }): Promise<any> => {
    const query = new URLSearchParams();
    if (params?.from) query.set('from', params.from);
    if (params?.to) query.set('to', params.to);
    const res = await api.get(`/reports/revenue?${query.toString()}`);
    return res.data;
  },

  getTopSellingItems: async (params?: { limit?: number; from?: string; to?: string; date?: string; month?: string }): Promise<any> => {
    const query = new URLSearchParams();
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.from) query.set('from', params.from);
    if (params?.to) query.set('to', params.to);
    if (params?.date) query.set('date', params.date);
    if (params?.month) query.set('month', params.month);
    const res = await api.get(`/reports/top-items?${query.toString()}`);
    return res.data;
  },

  getTablePerformanceReport: async (params?: any): Promise<any> => {
    const query = new URLSearchParams();
    if (params?.from) query.set('from', params.from);
    if (params?.to) query.set('to', params.to);
    const res = await api.get(`/reports/table-performance?${query.toString()}`);
    return res.data;
  },

  getDailyReport: async (params?: { date?: string }): Promise<any> => {
    const query = new URLSearchParams();
    if (params?.date) query.set('date', params.date);
    const res = await api.get(`/reports/daily?${query.toString()}`);
    return res.data;
  },

  getMonthlyReport: async (params?: { month?: string }): Promise<any> => {
    const query = new URLSearchParams();
    if (params?.month) query.set('month', params.month);
    const res = await api.get(`/reports/monthly?${query.toString()}`);
    return res.data;
  },

  getStaffPerformanceReport: async (): Promise<any> => {
    const res = await api.get('/reports/staff-performance');
    return res.data;
  },

  getFinanceReport: async (params?: { startDate?: string; endDate?: string }): Promise<any> => {
    const query = new URLSearchParams();
    if (params?.startDate) query.set('startDate', params.startDate);
    if (params?.endDate) query.set('endDate', params.endDate);
    const res = await api.get(`/reports/finance?${query.toString()}`);
    return res.data;
  },

  getOrdersReport: async (params?: { startDate?: string; endDate?: string }): Promise<any> => {
    const query = new URLSearchParams();
    if (params?.startDate) query.set('startDate', params.startDate);
    if (params?.endDate) query.set('endDate', params.endDate);
    const res = await api.get(`/reports/orders?${query.toString()}`);
    return res.data;
  },

  getClientsReport: async (params?: { startDate?: string; endDate?: string }): Promise<any> => {
    const query = new URLSearchParams();
    if (params?.startDate) query.set('startDate', params.startDate);
    if (params?.endDate) query.set('endDate', params.endDate);
    const res = await api.get(`/reports/clients?${query.toString()}`);
    return res.data;
  },

  clearCache: (_key?: string) => {
    // No-op — backend is source of truth
  },
};
