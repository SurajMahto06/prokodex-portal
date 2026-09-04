import { api } from "@/lib/axios";
import { API_ENDPOINTS } from "@/config/endpoints";

export interface SyllabusItem {
  period: string;
  topic: string;
  description?: string;
}

export interface Program {
  id: string;
  title: string;
  description: string;
  duration: string;
  iconName: string;
  highlights: string[];
  syllabus: SyllabusItem[];
  isPublished: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProgramInput {
  title: string;
  description: string;
  duration: string;
  iconName: string;
  highlights: string[];
  syllabus: SyllabusItem[];
  isPublished: boolean;
  order: number;
}

export const programsService = {
  async getPrograms(publishedOnly = false): Promise<Program[]> {
    const response = await api.get(API_ENDPOINTS.PROGRAMS.ROOT, {
      params: { publishedOnly: publishedOnly ? 'true' : 'false' },
    });
    return response.data;
  },

  async getProgramById(id: string): Promise<Program> {
    const response = await api.get(API_ENDPOINTS.PROGRAMS.BY_ID(id));
    return response.data;
  },

  async createProgram(data: ProgramInput): Promise<Program> {
    const response = await api.post(API_ENDPOINTS.PROGRAMS.ROOT, data);
    return response.data.program;
  },

  async updateProgram(id: string, data: Partial<ProgramInput>): Promise<Program> {
    const response = await api.put(API_ENDPOINTS.PROGRAMS.BY_ID(id), data);
    return response.data.program;
  },

  async deleteProgram(id: string): Promise<void> {
    await api.delete(API_ENDPOINTS.PROGRAMS.BY_ID(id));
  },
};
