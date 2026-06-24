import { api } from "@/lib/axios";
import { API_ENDPOINTS } from "@/config/endpoints";

export interface Certificate {
  id: string;
  certificateId: string;
  issueDate: string;
  studentId: string;
  courseId: string;
  student?: {
    id: string;
    name: string;
    email: string;
  };
  course?: {
    id: string;
    title: string;
  };
}

export interface PaginatedCertificates {
  data: Certificate[];
  total: number;
  page: number;
  totalPages: number;
  per_page: number;
}

export const certificatesService = {
  async getCertificates(params?: { page?: number; per_page?: number; search?: string; paginate?: string | boolean }): Promise<PaginatedCertificates> {
    const response = await api.get(API_ENDPOINTS.CERTIFICATES.ROOT, { params });
    return response.data;
  },

  async verifyCertificate(certificateId: string): Promise<Certificate> {
    const response = await api.get(API_ENDPOINTS.CERTIFICATES.VERIFY(certificateId));
    return response.data;
  },

  async issueCertificate(data: { studentId: string; courseId: string; dateOfIssue: string; startDate?: string; endDate?: string }): Promise<Certificate> {
    const response = await api.post(API_ENDPOINTS.CERTIFICATES.ISSUE, data);
    return response.data;
  },

  async revokeCertificate(id: string): Promise<void> {
    await api.delete(API_ENDPOINTS.CERTIFICATES.BY_ID(id));
  }
};
