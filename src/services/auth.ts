import { User } from "@/types";
import { api } from "@/lib/axios";
import { API_ENDPOINTS } from "@/config/endpoints";
import axios from "axios";

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthError";
  }
}

export const authService = {


  async login(email: string, password: string): Promise<User> {
    if (!email || !password) {
      throw new AuthError("Email and password are required.");
    }

    try {
      const response = await api.post(API_ENDPOINTS.AUTH.LOGIN, { email, password });
      const data = response.data;

      // Convert role to lower case to match dashboard's expected types if necessary
      const user = data.user;
      user.role = user.role.toLowerCase();
      user.enrolledCourseIds = user.enrolledCourses?.map((c: any) => c.id) || [];
      user.assignedCourseIds = user.assignedCourses?.map((c: any) => c.id) || [];
      user.completedTopicIds = user.completedTopics?.map((c: any) => c.id) || [];
      user.menteeIds = user.mentees?.map((m: any) => m.id) || [];

      return user;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new AuthError(error.response.data.message || "Invalid email or password");
      }
      throw new AuthError("Unable to connect to server");
    }
  },

  async getMe(): Promise<User | null> {
    try {
      const response = await api.get(API_ENDPOINTS.AUTH.ME);
      const user = response.data.user;
      user.role = user.role.toLowerCase();
      user.enrolledCourseIds = user.enrolledCourses?.map((c: any) => c.id) || [];
      user.assignedCourseIds = user.assignedCourses?.map((c: any) => c.id) || [];
      user.completedTopicIds = user.completedTopics?.map((c: any) => c.id) || [];
      user.menteeIds = user.mentees?.map((m: any) => m.id) || [];
      
      return user;
    } catch (error) {
      // 401 is expected when not logged in with HttpOnly cookies
      return null;
    }
  },

  async completeTopic(topicId: string): Promise<{ message: string, progressPercentage: number }> {
    const response = await api.post(API_ENDPOINTS.AUTH.COMPLETE_TOPIC, { topicId });
    return response.data;
  },

  async logout() {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    }
  }
};
