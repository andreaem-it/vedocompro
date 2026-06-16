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
  uploadPhotos: (id: number, formData: FormData) => api.post(`/ads/${id}/photos`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  deletePhoto: (id: number, photoId: number) => api.delete(`/ads/${id}/photos/${photoId}`),
  promoteAd: (id: number, level: string) => api.post(`/ads/${id}/promote`, { level }),
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
  getMyFeedback: () => api.get('/users/me/feedback'),
  uploadAvatar: (formData: FormData) => api.post('/users/me/avatar', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
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
  toggleAdPublished: (id: number, published: number) => api.put(`/admin/ads/${id}`, { published }),
  listVideos: (params?: Record<string, string>) => api.get('/admin/videos', { params }),
  approveVideo: (id: number) => api.put(`/admin/videos/${id}`, { accepted: 1 }),
  rejectVideo: (id: number) => api.put(`/admin/videos/${id}`, { accepted: 0 }),
  listReviews: (params?: Record<string, string>) => api.get('/admin/reviews', { params }),
  approveReview: (id: number) => api.put(`/admin/reviews/${id}`, { isPublished: true }),
  rejectReview: (id: number) => api.put(`/admin/reviews/${id}`, { isPublished: false }),
  replyHelpdesk: (id: number, message: string) => api.post(`/admin/helpdesk/${id}/reply`, { message }),
};

// Lookup data
export const lookupApi = {
  categories: () => api.get('/categories'),
  regions: () => api.get('/regions'),
  provinces: (regioneId?: number) => api.get('/provinces', { params: regioneId ? { regioneId } : {} }),
  products: () => api.get('/payments/products'),
};

// Feedback
export const feedbackApi = {
  giveFeedback: (userId: number, data: { vote: number; description: string; positive: number }) =>
    api.post(`/users/${userId}/feedback`, data),
};

// Helpdesk
export const helpdeskApi = {
  getMyTickets: () => api.get('/users/me/helpdesk'),
  createTicket: (data: { type: number; title: string; message: string }) =>
    api.post('/users/me/helpdesk', data),
  replyToTicket: (id: number, message: string) =>
    api.post(`/users/me/helpdesk/${id}/reply`, { message }),
};

// Payments
export const paymentsApi = {
  getProducts: () => api.get('/payments/products'),
  getMyPayments: () => api.get('/payments/my'),
  applyCoupon: (code: string) => api.post('/payments/coupon', { code }),
};
