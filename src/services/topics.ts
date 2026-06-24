import { api } from "@/lib/axios";
import { API_ENDPOINTS } from "@/config/endpoints";
import axios from "axios";

export interface Topic {
  id: string;
  courseId: string;
  moduleId: string;
  title: string;
  description: string;
  videoUrl?: string;
  pdfUrl?: string;
  mcqs: any[];
  interviewQuestions: any[];
}

/**
 * Upload a file to Cloudinary via our backend, with progress callback.
 */
async function uploadFileWithProgress(
  endpoint: string,
  fieldName: string,
  file: File,
  onProgress: (percent: number) => void
): Promise<string> {
  const formData = new FormData();
  formData.append(fieldName, file);

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

  const response = await axios.post(`${baseURL}${endpoint}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    onUploadProgress: (progressEvent) => {
      if (progressEvent.total) {
        const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onProgress(percent);
      }
    },
  });

  return response.data.url;
}

export const topicsService = {
  async getTopicById(id: string): Promise<any> {
    const response = await api.get(API_ENDPOINTS.TOPICS.BY_ID(id));
    return response.data;
  },

  /**
   * Upload video to Cloudinary with progress tracking
   */
  async uploadVideo(
    file: File,
    onProgress: (percent: number) => void
  ): Promise<string> {
    return uploadFileWithProgress(API_ENDPOINTS.UPLOAD.VIDEO, 'video', file, onProgress);
  },

  /**
   * Upload PDF to Cloudinary with progress tracking
   */
  async uploadPdf(
    file: File,
    onProgress: (percent: number) => void
  ): Promise<string> {
    return uploadFileWithProgress(API_ENDPOINTS.UPLOAD.PDF, 'pdf', file, onProgress);
  },

  async createTopic(data: {
    courseId: string;
    moduleId: string;
    title: string;
    description: string;
    videoUrl?: string;       // Pre-uploaded Cloudinary URL
    pdfUrl?: string;         // Pre-uploaded Cloudinary URL
    cheatsheetUrl?: string;
    videoFile?: File | null;  // Fallback: direct upload
    pdfFile?: File | null;    // Fallback: direct upload
    cheatsheetFile?: File | null;
    mcqs: string;
    interviewQuestions: string;
  }): Promise<Topic> {
    const formData = new FormData();
    formData.append('courseId', data.courseId);
    formData.append('moduleId', data.moduleId);
    formData.append('title', data.title);
    formData.append('description', data.description);

    // Send pre-uploaded URLs if available (instant save)
    if (data.videoUrl) formData.append('videoUrl', data.videoUrl);
    if (data.pdfUrl) formData.append('pdfUrl', data.pdfUrl);
    if (data.cheatsheetUrl) formData.append('cheatsheetUrl', data.cheatsheetUrl);

    // Fallback: send files for server-side upload (slow)
    if (!data.videoUrl && data.videoFile) formData.append('video', data.videoFile);
    if (!data.pdfUrl && data.pdfFile) formData.append('pdf', data.pdfFile);
    if (!data.cheatsheetUrl && data.cheatsheetFile) formData.append('cheatsheet', data.cheatsheetFile);

    formData.append('mcqs', data.mcqs);
    formData.append('interviewQuestions', data.interviewQuestions);

    const response = await api.post(API_ENDPOINTS.TOPICS.ROOT, formData, {
      headers: { "Content-Type": "multipart/form-data" }
    });
    return response.data.topic;
  },

  async updateTopic(id: string, data: {
    title?: string;
    description?: string;
    videoUrl?: string;
    pdfUrl?: string;
    cheatsheetUrl?: string;
    videoFile?: File | null;
    pdfFile?: File | null;
    cheatsheetFile?: File | null;
    mcqs?: string;
    interviewQuestions?: string;
  }): Promise<Topic> {
    const formData = new FormData();
    if (data.title) formData.append('title', data.title);
    if (data.description) formData.append('description', data.description);

    if (data.videoUrl) formData.append('videoUrl', data.videoUrl);
    if (data.pdfUrl) formData.append('pdfUrl', data.pdfUrl);
    if (data.cheatsheetUrl) formData.append('cheatsheetUrl', data.cheatsheetUrl);

    if (!data.videoUrl && data.videoFile) formData.append('video', data.videoFile);
    if (!data.pdfUrl && data.pdfFile) formData.append('pdf', data.pdfFile);
    if (!data.cheatsheetUrl && data.cheatsheetFile) formData.append('cheatsheet', data.cheatsheetFile);

    if (data.mcqs) formData.append('mcqs', data.mcqs);
    if (data.interviewQuestions) formData.append('interviewQuestions', data.interviewQuestions);

    const response = await api.put(API_ENDPOINTS.TOPICS.BY_ID(id), formData, {
      headers: { "Content-Type": "multipart/form-data" }
    });
    return response.data.topic;
  },

  async deleteTopic(id: string): Promise<void> {
    await api.delete(API_ENDPOINTS.TOPICS.BY_ID(id));
  }
};
