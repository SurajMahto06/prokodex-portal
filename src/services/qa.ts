import { api } from "@/lib/axios";
import { MentorshipQA, QAReply } from "@/types";

export const qaService = {
  getQAThreads: async (page?: number, per_page?: number): Promise<any> => {
    const response = await api.get('/qa', { params: { page, per_page } });
    return response.data;
  },

  createQAThread: async (data: { courseId: string; question: string; imageUrls?: string[] }): Promise<MentorshipQA> => {
    const response = await api.post('/qa', data);
    return response.data;
  },

  addReply: async (threadId: string, data: { content: string; imageUrls?: string[] }): Promise<QAReply> => {
    const response = await api.post(`/qa/${threadId}/reply`, data);
    return response.data;
  },

  updateStatus: async (threadId: string, status: 'pending' | 'answered'): Promise<MentorshipQA> => {
    const response = await api.patch(`/qa/${threadId}/status`, { status });
    return response.data;
  },

  deleteQAThread: async (threadId: string): Promise<any> => {
    const response = await api.delete(`/qa/${threadId}`);
    return response.data;
  }
};
