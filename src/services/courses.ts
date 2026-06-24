import { api } from "@/lib/axios";
import { API_ENDPOINTS } from "@/config/endpoints";

export interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  createdAt: string;
  updatedAt: string;
  totalTopics: number;
  _count?: {
    modules: number;
    students: number;
  };
}

export const coursesService = {
  async getCourses(): Promise<Course[]> {
    const response = await api.get(API_ENDPOINTS.COURSES.ROOT);
    return response.data;
  },

  async getCourseById(id: string): Promise<any> {
    const response = await api.get(API_ENDPOINTS.COURSES.BY_ID(id));
    return response.data;
  },

  async createCourse(courseData: { title: string; description: string; thumbnailFile?: File | null }): Promise<Course> {
    const formData = new FormData();
    formData.append('title', courseData.title);
    formData.append('description', courseData.description);
    if (courseData.thumbnailFile) {
      formData.append('thumbnail', courseData.thumbnailFile);
    }

    const response = await api.post(API_ENDPOINTS.COURSES.ROOT, formData, {
      headers: { "Content-Type": "multipart/form-data" }
    });
    return response.data.course;
  },

  async updateCourse(id: string, courseData: { title?: string; description?: string; thumbnailFile?: File | null }): Promise<Course> {
    const formData = new FormData();
    if (courseData.title) formData.append('title', courseData.title);
    if (courseData.description) formData.append('description', courseData.description);
    if (courseData.thumbnailFile) {
      formData.append('thumbnail', courseData.thumbnailFile);
    }

    const response = await api.put(API_ENDPOINTS.COURSES.BY_ID(id), formData, {
      headers: { "Content-Type": "multipart/form-data" }
    });
    return response.data.course;
  },

  async deleteCourse(id: string): Promise<void> {
    await api.delete(API_ENDPOINTS.COURSES.BY_ID(id));
  }
};
