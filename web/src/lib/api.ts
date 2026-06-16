import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  },
);

// Auth
export const authApi = {
  register: (data: { email: string; username: string; password: string; name: string }) =>
    api.post('/auth/register', data),
  login: (data: { emailOrUsername: string; password: string }) =>
    api.post('/auth/login', data),
  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token: string, password: string) =>
    api.post('/auth/reset-password', { token, password }),
};

// Ads
export const adsApi = {
  list: (params?: Record<string, string>) => api.get('/ads', { params }),
  getById: (id: number) => api.get(`/ads/${id}`),
  create: (data: unknown) => api.post('/ads', data),
  update: (id: number, data: unknown) => api.put(`/ads/${id}`, data),
  delete: (id: number) => api.delete(`/ads/${id}`),
  toggleWishlist: (id: number) => api.post(`/ads/${id}/wishlist`),
};

// Users
export const usersApi = {
  getMe: () => api.get('/users/me'),
  updateMe: (data: unknown) => api.put('/users/me', data),
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.put('/users/me/password', data),
  getProfile: (id: number) => api.get(`/users/${id}`),
  getNotifications: () => api.get('/users/me/notifications'),
  markNotificationsRead: () => api.post('/users/me/notifications/read'),
  getMessages: () => api.get('/users/me/messages'),
  sendMessage: (data: { toUserId: number; message: string; adId?: number }) =>
    api.post('/users/me/messages', data),
  getWishlist: () => api.get('/users/me/wishlist'),
  getMyAds: () => api.get('/users/me/ads'),
};

// Admin
export const adminApi = {
  getStats: () => api.get('/admin/stats'),
  listUsers: (params?: Record<string, string>) => api.get('/admin/users', { params }),
  updateUser: (id: number, data: unknown) => api.put(`/admin/users/${id}`, data),
  deleteUser: (id: number) => api.delete(`/admin/users/${id}`),
  listAds: (params?: Record<string, string>) => api.get('/admin/ads', { params }),
  listPayments: () => api.get('/admin/payments'),
  listHelpDesk: () => api.get('/admin/helpdesk'),
};

// Lookup data
export const lookupApi = {
  categories: () => api.get('/categories'),
  regions: () => api.get('/regions'),
  provinces: (regioneId?: number) => api.get('/provinces', { params: regioneId ? { regioneId } : {} }),
  products: () => api.get('/payments/products'),
};
