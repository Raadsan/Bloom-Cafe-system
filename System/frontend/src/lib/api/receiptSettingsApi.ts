import api from './axios';

export interface ReceiptSettings {
  id: number;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  logoUrl?: string;
  vatNumber?: string;
  footerText?: string;
  updatedAt?: string;
}

export interface UpdateReceiptSettingsPayload {
  name?: string;
  address?: string;
  phone?: string;
  email?: string;
  logoUrl?: string;
  vatNumber?: string;
  footerText?: string;
}

export const receiptSettingsApi = {
  getSettings: async (): Promise<ReceiptSettings> => {
    const { data } = await api.get<{ success: boolean; data: ReceiptSettings }>('/receipt-settings');
    return data.data;
  },

  updateSettings: async (payload: UpdateReceiptSettingsPayload): Promise<ReceiptSettings> => {
    const { data } = await api.patch<{ success: boolean; data: ReceiptSettings }>('/receipt-settings', payload);
    return data.data;
  }
};
