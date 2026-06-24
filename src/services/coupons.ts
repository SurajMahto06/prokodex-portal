import { api } from '@/lib/axios';
import { API_ENDPOINTS } from '@/config/endpoints';
import { Coupon } from '@/types';

export const couponsService = {
  getCoupons: async (): Promise<Coupon[]> => {
    const response = await api.get('/coupons');
    return response.data;
  },

  createCoupon: async (data: Partial<Coupon>): Promise<Coupon> => {
    const response = await api.post('/coupons', data);
    return response.data;
  },

  updateCoupon: async (id: string, data: Partial<Coupon>): Promise<Coupon> => {
    const response = await api.put(`/coupons/${id}`, data);
    return response.data;
  },

  deleteCoupon: async (id: string): Promise<void> => {
    await api.delete(`/coupons/${id}`);
  }
};
