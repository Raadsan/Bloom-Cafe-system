import api from './axios';

export interface Expense {
  id: number;
  title: string;
  amount: number;
  category: string;
  receiver?: string; // Company or Individual
  date: string;
  description?: string;
  paymentMethod?: string;
  createdById?: number;
  createdBy?: { fullName: string };
  createdAt?: string;
}

export const expenseApi = {
  getAllExpenses: async (): Promise<Expense[]> => {
    const { data } = await api.get<{ success: boolean; data: Expense[] }>('/expenses');
    return data.data;
  },

  createExpense: async (payload: Partial<Expense>): Promise<Expense> => {
    const { data } = await api.post<{ success: boolean; data: Expense }>('/expenses', payload);
    return data.data;
  },

  updateExpense: async (id: number, payload: Partial<Expense>): Promise<Expense> => {
    const { data } = await api.put<{ success: boolean; data: Expense }>(`/expenses/${id}`, payload);
    return data.data;
  },

  deleteExpense: async (id: number): Promise<void> => {
    await api.delete(`/expenses/${id}`);
  }
};
