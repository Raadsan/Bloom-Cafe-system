// ─────────────────────────────────────────────────────────────────
//  reportApi.ts
//  GET /api/reports/summary            (admin, manager)
//  GET /api/reports/revenue            (admin, manager)
//  GET /api/reports/top-items          (admin, manager)
//  GET /api/reports/table-performance  (admin, manager)
//  GET /api/reports/daily              (admin, manager)
//  GET /api/reports/monthly            (admin, manager)
//  GET /api/reports/staff-performance  (admin, manager)
// ─────────────────────────────────────────────────────────────────

import api from './axios';

export const reportApi = {
  getDashboardSummary: async (): Promise<any> => {
    const { data } = await api.get('/reports/summary');
    return data;
  },

  getRevenueReport: async (params?: { from?: string; to?: string }): Promise<any> => {
    const { data } = await api.get('/reports/revenue', { params });
    return data;
  },

  getTopSellingItems: async (params?: { limit?: number }): Promise<any> => {
    const { data } = await api.get('/reports/top-items', { params });
    return data;
  },

  getTablePerformanceReport: async (): Promise<any> => {
    const { data } = await api.get('/reports/table-performance');
    return data;
  },

  /** Pass ?date=YYYY-MM-DD */
  getDailyReport: async (params?: { date?: string }): Promise<any> => {
    const { data } = await api.get('/reports/daily', { params });
    return data;
  },

  /** Pass ?month=YYYY-MM */
  getMonthlyReport: async (params?: { month?: string }): Promise<any> => {
    const { data } = await api.get('/reports/monthly', { params });
    return data;
  },

  getStaffPerformanceReport: async (): Promise<any> => {
    const { data } = await api.get('/reports/staff-performance');
    return data;
  },
};
