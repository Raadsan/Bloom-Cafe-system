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
    const res = await api.get('/receipt-settings');
    return res.data.data;
  },

  updateSettings: async (payload: UpdateReceiptSettingsPayload): Promise<ReceiptSettings> => {
    const res = await api.patch('/receipt-settings', payload);
    return res.data.data;
  }
};
