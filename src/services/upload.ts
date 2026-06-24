import { api } from "@/lib/axios";
import { API_ENDPOINTS } from "@/config/endpoints";

export const uploadService = {
  async uploadFile(file: File): Promise<{ url: string }> {
    const formData = new FormData();
    formData.append("file", file);

    const response = await api.post(API_ENDPOINTS.UPLOAD.ROOT, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return response.data;
  }
};
