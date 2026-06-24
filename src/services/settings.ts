import { api } from '@/lib/axios';

const API_URL = '/settings';

export const settingsService = {
  getSettings: async () => {
    const response = await api.get(API_URL);
    return response.data;
  },

  updateSettings: async (settingsData: any) => {
    const response = await api.put(API_URL, settingsData);
    return response.data;
  },
};
