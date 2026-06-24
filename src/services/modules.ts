import { api } from "@/lib/axios";
import { API_ENDPOINTS } from "@/config/endpoints";

export interface CourseModule {
  id: string;
  courseId: string;
  title: string;
  order: number;
}

export const modulesService = {
  async createModule(data: { courseId: string; title: string; order: number }): Promise<CourseModule> {
    const response = await api.post(API_ENDPOINTS.MODULES.ROOT, data);
    return response.data.module;
  },

  async updateModule(id: string, data: { title?: string; order?: number }): Promise<CourseModule> {
    const response = await api.put(API_ENDPOINTS.MODULES.BY_ID(id), data);
    return response.data.module;
  },

  async deleteModule(id: string): Promise<void> {
    await api.delete(API_ENDPOINTS.MODULES.BY_ID(id));
  }
};
