import api from './axios';

export interface Customer {
  id: number;
  fullName: string;
  phone: string;
  createdAt: string;
  updatedAt: string;
  totalOrders?: number;
  lastOrderDate?: string | null;
}

export interface CreateCustomerPayload {
  fullName: string;
  phone: string;
}

export const customerApi = {
  getAllCustomers: async (): Promise<Customer[]> => {
    const { data } = await api.get<{ success: boolean; data: Customer[] }>('/customers/all');
    return data.data;
  },

  getCustomerById: async (id: number): Promise<Customer> => {
    const { data } = await api.get<{ success: boolean; data: Customer }>(`/customers/${id}`);
    return data.data;
  },

  createCustomer: async (payload: CreateCustomerPayload): Promise<Customer> => {
    const { data } = await api.post<{ success: boolean; data: Customer }>('/customers', payload);
    return data.data;
  },

  updateCustomer: async (id: number, payload: Partial<CreateCustomerPayload>): Promise<Customer> => {
    const { data } = await api.put<{ success: boolean; data: Customer }>(`/customers/${id}`, payload);
    return data.data;
  },

  deleteCustomer: async (id: number): Promise<void> => {
    await api.delete(`/customers/${id}`);
  },
};
