import { api } from "@/lib/axios";

export interface DBNotification {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  type: string;
  targetRole?: string | null;
  createdAt: string;
  userId?: string | null;
}

export const notificationService = {
  getNotifications: async (excludeDismissed?: boolean): Promise<DBNotification[]> => {
    const response = await api.get('/notifications', { params: { excludeDismissed } });
    return response.data;
  },

  markAsRead: async (id: string): Promise<DBNotification> => {
    const response = await api.patch(`/notifications/${id}/read`);
    return response.data;
  },

  markAllAsRead: async (): Promise<{ message: string }> => {
    const response = await api.patch('/notifications/read-all');
    return response.data;
  },

  deleteNotification: async (id: string): Promise<{ message: string }> => {
    const response = await api.delete(`/notifications/${id}`);
    return response.data;
  },

  clearAllNotifications: async (): Promise<{ message: string }> => {
    const response = await api.delete('/notifications/clear-all');
    return response.data;
  }
};
