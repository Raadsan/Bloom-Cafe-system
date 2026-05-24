import api from './axios';

export interface Customer {
  id: number;
  fullName: string;
  phone: string;
  email?: string;
  createdAt: string;
  updatedAt: string;
  totalOrders?: number;
  lastOrderDate?: string | null;
}

export interface CreateCustomerPayload {
  fullName: string;
  phone: string;
  email?: string;
}

export const customerApi = {
  getAllCustomers: async (): Promise<Customer[]> => {
    const res = await api.get('/customers/all');
    return res.data.data || [];
  },

  getCustomerById: async (id: number): Promise<Customer> => {
    const res = await api.get(`/customers/${id}`);
    return res.data.data;
  },

  createCustomer: async (payload: CreateCustomerPayload): Promise<Customer> => {
    const res = await api.post('/customers', payload);
    return res.data.data;
  },

  updateCustomer: async (id: number, payload: Partial<CreateCustomerPayload>): Promise<Customer> => {
    const res = await api.put(`/customers/${id}`, payload);
    return res.data.data;
  },

  deleteCustomer: async (id: number): Promise<void> => {
    await api.delete(`/customers/${id}`);
  },
};
