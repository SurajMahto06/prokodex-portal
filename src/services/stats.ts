import { api } from "@/lib/axios";
import { API_ENDPOINTS } from "@/config/endpoints";

export interface DashboardStats {
  totalUsers: number;
  totalCourses: number;
  totalAssignments: number;
  pendingQA: number;
}

export const statsService = {
  async getStats(): Promise<DashboardStats> {
    const response = await api.get(API_ENDPOINTS.STATS.ROOT);
    return response.data;
  },
};
