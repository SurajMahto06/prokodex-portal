import { api } from "@/lib/axios";
import { User } from "@/types";
import { API_ENDPOINTS } from "@/config/endpoints";

export interface PaginatedUsers {
  data: User[];
  total: number;
  page: number;
  totalPages: number;
  per_page: number;
}

export const usersService = {
  async getMyMentees(): Promise<User[]> {
    const response = await api.get(API_ENDPOINTS.ME.MENTEES);
    return response.data.mentees.map((m: any) => ({
      ...m,
      enrolledCourseIds: m.enrolledCourses?.map((c: any) => c.id) || []
    }));
  },

  async getMyMentors(): Promise<any[]> {
    const response = await api.get(API_ENDPOINTS.ME.MENTORS);
    return response.data.mentors;
  },

  async getMyCourses(): Promise<any> {
    const response = await api.get(API_ENDPOINTS.ME.COURSES);
    return response.data;
  },

  async getUsers(params?: { role?: string; status?: string; search?: string; page?: number; per_page?: number; paginate?: string | boolean }): Promise<PaginatedUsers> {
    const response = await api.get(API_ENDPOINTS.USERS.ROOT, { params });
    const formattedData = response.data.data.map((user: any) => ({
      ...user,
      role: user.role.toLowerCase(),
      enrolledCourseIds: user.enrolledCourses?.map((c: any) => c.id) || [],
      assignedCourseIds: user.assignedCourses?.map((c: any) => c.id) || []
    }));
    return {
      ...response.data,
      data: formattedData
    };
  },

  async getUserById(id: string): Promise<User> {
    const response = await api.get(API_ENDPOINTS.USERS.BY_ID(id));
    const user = response.data;
    return {
      ...user,
      role: user.role.toLowerCase(),
      enrolledCourseIds: user.enrolledCourses?.map((c: any) => c.id) || [],
      assignedCourseIds: user.assignedCourses?.map((c: any) => c.id) || []
    };
  },

  async createUser(userData: any): Promise<User> {
    const response = await api.post(API_ENDPOINTS.USERS.ROOT, userData);
    const user = response.data.user;
    return {
      ...user,
      role: user.role.toLowerCase(),
      enrolledCourseIds: user.enrolledCourses?.map((c: any) => c.id) || [],
      assignedCourseIds: user.assignedCourses?.map((c: any) => c.id) || []
    };
  },

  async updateUser(id: string, userData: any): Promise<User> {
    const response = await api.put(API_ENDPOINTS.USERS.BY_ID(id), userData);
    const user = response.data.user;
    return {
      ...user,
      role: user.role.toLowerCase(),
      enrolledCourseIds: user.enrolledCourses?.map((c: any) => c.id) || [],
      assignedCourseIds: user.assignedCourses?.map((c: any) => c.id) || []
    };
  },

  async deleteUser(userId: string): Promise<void> {
    await api.delete(API_ENDPOINTS.USERS.BY_ID(userId));
  }
};
