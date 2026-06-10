import api from './axios';

export interface SystemSettings {
  id: number;
  systemName: string;
  systemTagline?: string | null;
  systemLogoUrl?: string | null;
  updatedAt?: string;
}

export interface UpdateSystemSettingsPayload {
  systemName?: string;
  systemTagline?: string;
  systemLogoUrl?: string | null;
}

export const systemSettingsApi = {
  getSettings: async (): Promise<SystemSettings> => {
    const res = await api.get('/system-settings');
    return res.data.data;
  },

  updateSettings: async (payload: UpdateSystemSettingsPayload): Promise<SystemSettings> => {
    const res = await api.patch('/system-settings', payload);
    return res.data.data;
  },
};
