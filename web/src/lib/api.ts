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
  register: (data: { email: string; username: string; password: string; name: string; recaptchaToken?: string }) =>
    api.post('/auth/register', data),
  login: (data: { emailOrUsername: string; password: string }) =>
    api.post('/auth/login', data),
  forgotPassword: (email: string, recaptchaToken?: string) => api.post('/auth/forgot-password', { email, recaptchaToken }),
  resetPassword: (token: string, password: string) =>
    api.post('/auth/reset-password', { token, password }),
  verifyEmail: (code: string) => api.get(`/auth/verify/${code}`),
};

// Ads
export const adsApi = {
  // URLSearchParams per query con chiavi ripetibili (es. ?ff=Marca:Bosch&ff=Colore:Rosso)
  list: (params?: Record<string, string> | URLSearchParams) => api.get('/ads', { params }),
  getById: (id: number) => api.get(`/ads/${id}`),
  create: (data: unknown) => api.post('/ads', data),
  update: (id: number, data: unknown) => api.put(`/ads/${id}`, data),
  delete: (id: number) => api.delete(`/ads/${id}`),
  toggleWishlist: (id: number) => api.post(`/ads/${id}/wishlist`),
  uploadPhotos: (id: number, formData: FormData) => api.post(`/ads/${id}/photos`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  deletePhoto: (id: number, photoId: number) => api.delete(`/ads/${id}/photos/${photoId}`),
  uploadVideo: (id: number, formData: FormData) => api.post(`/ads/${id}/videos`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  promotionPackages: () => api.get('/ads/promotion-packages'),
  promoteAd: (id: number, packageKey: string) => api.post(`/ads/${id}/promote`, { packageKey }),
  createOrder: (id: number, data: {
    qty: number;
    deliveryMethod: 'meetup' | 'shipping';
    buyerName?: string;
    buyerPhone?: string;
    shippingAddress?: string;
    shippingCity?: string;
    shippingPostalCode?: string;
    shippingProvince?: string;
    buyerNotes?: string;
    offerId?: number;
  }) => api.post(`/ads/${id}/order`, data),
};

// Offers (trattativa prezzo su annuncio)
export const offersApi = {
  create: (adId: number, data: { amount: string; message?: string }) =>
    api.post(`/ads/${adId}/offers`, data),
  listMine: (role: 'made' | 'received') => api.get('/users/me/offers', { params: { role } }),
  respond: (
    id: number,
    data: { action: 'accept' | 'reject' | 'counter' | 'withdraw'; counterAmount?: string; sellerMessage?: string },
  ) => api.put(`/users/me/offers/${id}`, data),
};

// Seller stats (dashboard venditore per tutti)
export const sellerStatsApi = {
  getMyStats: () => api.get('/users/me/seller-stats'),
};

// Saved searches (ricerche salvate + alert)
export const savedSearchesApi = {
  list: () => api.get('/users/me/saved-searches'),
  create: (data: {
    name?: string; q?: string; categoryId?: string; region?: string; provincia?: string;
    condition?: string; minPrice?: string; maxPrice?: string; frequency?: 'instant' | 'daily' | 'off';
  }) => api.post('/users/me/saved-searches', data),
  update: (id: number, data: { frequency?: 'instant' | 'daily' | 'off'; name?: string }) =>
    api.put(`/users/me/saved-searches/${id}`, data),
  remove: (id: number) => api.delete(`/users/me/saved-searches/${id}`),
};

// Stripe (checkout ordini marketplace con carta)
export const stripeApi = {
  getConfig: () => api.get('/payments/stripe/config'),
  createCheckout: (orderId: number) => api.post('/payments/stripe/checkout', { orderId }),
  confirm: (sessionId: string) => api.get('/payments/stripe/confirm', { params: { session_id: sessionId } }),
};

// Disputes (contestazioni ordine)
export const disputesApi = {
  open: (orderId: number, data: { reason: string; description: string }) =>
    api.post(`/users/me/orders/${orderId}/dispute`, data),
  getByOrder: (orderId: number) => api.get(`/users/me/orders/${orderId}/dispute`),
  addMessage: (disputeId: number, message: string, attachments?: File[]) => {
    if (!attachments?.length) return api.post(`/users/me/disputes/${disputeId}/messages`, { message });
    const formData = new FormData();
    formData.append('message', message);
    attachments.forEach((file) => formData.append('attachments', file));
    return api.post(`/users/me/disputes/${disputeId}/messages`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
};

// Users
export const usersApi = {
  getMe: () => api.get('/users/me'),
  updateMe: (data: unknown) => api.put('/users/me', data),
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.put('/users/me/password', data),
  requestPhoneVerification: () => api.post('/users/me/phone/verification'),
  verifyPhone: (code: string) => api.post('/users/me/phone/verify', { code }),
  getProfile: (id: number) => api.get(`/users/${id}`),
  getNotifications: () => api.get('/users/me/notifications'),
  markNotificationsRead: () => api.post('/users/me/notifications/read'),
  openNotification: (id: number) => api.post(`/users/me/notifications/${id}/open`),
  getMessages: () => api.get('/users/me/messages'),
  sendMessage: (data: { toUserId: number; message: string; adId?: number }) =>
    api.post('/users/me/messages', data),
  getWishlist: () => api.get('/users/me/wishlist'),
  getMyAds: () => api.get('/users/me/ads'),
  getMyFeedback: () => api.get('/users/me/feedback'),
  uploadAvatar: (formData: FormData) => api.post('/users/me/avatar', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getBuys: () => api.get('/users/me/buys'),
  getSells: () => api.get('/users/me/sells'),
  updateSell: (id: number, data: { shipped?: boolean; paid?: boolean; trackingCode?: string }) =>
    api.put(`/users/me/sells/${id}`, data),
  getMyOrders: () => api.get('/users/me/orders'),
  getReceivedOrders: () => api.get('/users/me/orders/received'),
  submitOrderPayment: (id: number, data: { provider: string; paymentIntentId?: string; note?: string }) =>
    api.post(`/users/me/orders/${id}/payment`, data),
  updateOrderStatus: (id: number, data: { status: number; trackingCode?: string; sellerNotes?: string }) =>
    api.put(`/users/me/orders/${id}`, data),
};

// Admin
export const adminApi = {
  getStats: () => api.get('/admin/stats'),
  getKpi: (days?: number) => api.get('/admin/kpi', { params: days ? { days } : {} }),
  getSystemInfo: () => api.get('/admin/system'),
  listUsers: (params?: Record<string, string>) => api.get('/admin/users', { params }),
  getUser: (id: number) => api.get(`/admin/users/${id}`),
  updateUser: (id: number, data: unknown) => api.put(`/admin/users/${id}`, data),
  deleteUser: (id: number) => api.delete(`/admin/users/${id}`),
  listAds: (params?: Record<string, string>) => api.get('/admin/ads', { params }),
  getAd: (id: number) => api.get(`/admin/ads/${id}`),
  updateAd: (id: number, data: unknown) => api.put(`/admin/ads/${id}`, data),
  listPayments: () => api.get('/admin/payments'),
  dryRunImport: (entity: 'users' | 'ads' | 'payments', csv: string) =>
    api.post(`/admin/import/${entity}/dry-run`, { csv }),
  listReports: (status?: string) => api.get('/admin/reports', { params: status ? { status } : {} }),
  updateReport: (id: number, data: { status: string; adminNotes?: string }) => api.put(`/admin/reports/${id}`, data),
  listDisputes: (status?: string) => api.get('/admin/disputes', { params: status ? { status } : {} }),
  updateDispute: (id: number, data: { status: string; adminDecision?: string }) => api.put(`/admin/disputes/${id}`, data),
  replyDispute: (id: number, message: string) => api.post(`/admin/disputes/${id}/messages`, { message }),
  listPromotionPackages: () => api.get('/admin/promotions/packages'),
  createPromotionPackage: (data: unknown) => api.post('/admin/promotions/packages', data),
  updatePromotionPackage: (id: number, data: unknown) => api.put(`/admin/promotions/packages/${id}`, data),
  deletePromotionPackage: (id: number) => api.delete(`/admin/promotions/packages/${id}`),
  listBusinessRequests: (params?: Record<string, string>) => api.get('/admin/business-requests', { params }),
  updateBusinessRequest: (id: number, data: { status: number; adminNotes?: string }) =>
    api.put(`/admin/business-requests/${id}`, data),
  listHelpDesk: (status?: number) => api.get('/admin/helpdesk', { params: status !== undefined ? { status } : {} }),
  updateHelpDesk: (id: number, data: { closed?: number; assignedTo?: number | null }) => api.put(`/admin/helpdesk/${id}`, data),
  toggleAdPublished: (id: number, published: number) => api.put(`/admin/ads/${id}`, { published }),
  listVideos: (params?: Record<string, string>) => api.get('/admin/videos', { params }),
  approveVideo: (id: number) => api.put(`/admin/videos/${id}`, { accepted: 1 }),
  rejectVideo: (id: number) => api.put(`/admin/videos/${id}`, { accepted: 0 }),
  listReviews: (params?: Record<string, string>) => api.get('/admin/reviews', { params }),
  approveReview: (id: number) => api.put(`/admin/reviews/${id}`, { isPublished: true }),
  rejectReview: (id: number) => api.put(`/admin/reviews/${id}`, { isPublished: false }),
  replyHelpdesk: (id: number, message: string) => api.post(`/admin/helpdesk/${id}/reply`, { message }),
  listActions: (params?: Record<string, string>) => api.get('/admin/actions', { params }),
  reconcileOrderPayment: (id: number, data: { paymentStatus: string; provider?: string; paymentIntentId?: string; note?: string }) =>
    api.put(`/admin/orders/${id}/payment`, data),
};

// Business
export const businessApi = {
  getMe: () => api.get('/business/me'),
  createRequest: (data: {
    package: number;
    opt1?: boolean;
    opt2?: boolean;
    legalName: string;
    vatNumber: string;
    contactName: string;
    contactSurname: string;
    contactPhone: string;
    contactEmail: string;
  }) => api.post('/business/requests', data),
  dashboard: () => api.get('/business/dashboard'),
};

// Lookup data
export const lookupApi = {
  categories: () => api.get('/categories'),
  categoryFields: (categoryId: number) => api.get(`/categories/${categoryId}/fields`),
  regions: () => api.get('/regions'),
  provinces: (regioneId?: number) => api.get('/provinces', { params: regioneId ? { regioneId } : {} }),
  comuni: (provinceId?: number) => api.get('/comuni', { params: provinceId ? { provinceId } : {} }),
  products: () => api.get('/payments/products'),
};

// Feedback
export const feedbackApi = {
  getEligibleOrders: (userId: number) => api.get(`/users/${userId}/feedback-orders`),
  giveFeedback: (userId: number, data: { orderId: number; vote: number; description: string; positive: number }) =>
    api.post(`/users/${userId}/feedback`, data),
};

// Reports
export const reportsApi = {
  reportAd: (adId: number, data: { reason: string; details?: string }) => api.post(`/ads/${adId}/report`, data),
  reportUser: (userId: number, data: { reason: string; details?: string }) => api.post(`/users/${userId}/report`, data),
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

// Shop (public catalog)
export const shopApi = {
  getCategories: () => api.get('/shop/categories'),
  listProducts: (params?: Record<string, string>) => api.get('/shop/products', { params }),
  getProductById: (id: number) => api.get(`/shop/products/${id}`),
};

// Shop admin
export const adminShopApi = {
  // Categories
  listCategories: () => api.get('/admin/shop/categories'),
  getCategory: (id: number) => api.get(`/admin/shop/categories/${id}`),
  createCategory: (data: { name: string; fatherId?: number | null }) =>
    api.post('/admin/shop/categories', data),
  updateCategory: (id: number, data: { name?: string; fatherId?: number | null }) =>
    api.put(`/admin/shop/categories/${id}`, data),
  deleteCategory: (id: number) => api.delete(`/admin/shop/categories/${id}`),

  // Products
  listProducts: (params?: Record<string, string>) => api.get('/admin/shop/products', { params }),
  getProduct: (id: number) => api.get(`/admin/shop/products/${id}`),
  createProduct: (formData: FormData) =>
    api.post('/admin/shop/products', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  updateProduct: (id: number, formData: FormData) =>
    api.put(`/admin/shop/products/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  deleteProduct: (id: number) => api.delete(`/admin/shop/products/${id}`),

  // Shipments
  listShipments: () => api.get('/admin/shop/shipments'),
  getShipment: (id: number) => api.get(`/admin/shop/shipments/${id}`),
  createShipment: (data: { serviceName: string; basePrice: string; expectedDelivery: string; serviceLogo?: string; isActive?: boolean }) =>
    api.post('/admin/shop/shipments', data),
  updateShipment: (id: number, data: { serviceName?: string; basePrice?: string; expectedDelivery?: string; serviceLogo?: string; isActive?: boolean }) =>
    api.put(`/admin/shop/shipments/${id}`, data),
  deleteShipment: (id: number) => api.delete(`/admin/shop/shipments/${id}`),
};

// Ads categories admin (tree)
export const adminCategoriesApi = {
  list: () => api.get('/admin/categories'),
  getById: (id: number) => api.get(`/admin/categories/${id}`),
  create: (data: { name: string; parentId?: number | null }) =>
    api.post('/admin/categories', data),
  update: (id: number, data: { name?: string; parentId?: number | null }) =>
    api.put(`/admin/categories/${id}`, data),
  remove: (id: number) => api.delete(`/admin/categories/${id}`),
  // Campi categoria-specifici (AdvancedField)
  listFields: (categoryId: number) => api.get(`/admin/categories/${categoryId}/fields`),
  createField: (categoryId: number, data: { name: string; type?: string; options?: string[]; filterable?: boolean; required?: boolean }) =>
    api.post(`/admin/categories/${categoryId}/fields`, data),
  updateField: (fieldId: number, data: { name?: string; type?: string; options?: string[]; filterable?: boolean; required?: boolean; sortOrder?: number }) =>
    api.put(`/admin/categories/fields/${fieldId}`, data),
  deleteField: (fieldId: number) => api.delete(`/admin/categories/fields/${fieldId}`),
};

// Coupons (admin)
export const adminCouponsApi = {
  listCoupons: (params?: Record<string, string>) => api.get('/admin/coupons', { params }),
  generateCoupon: (data: { value: number; assigned?: string }) => api.post('/admin/coupons/generate', data),
  deleteCoupon: (id: number) => api.delete(`/admin/coupons/${id}`),
};

// Admin mail templates (AdminDefaultMail)
export const adminMailApi = {
  list: () => api.get('/admin/mail-templates'),
  getById: (id: number) => api.get(`/admin/mail-templates/${id}`),
  create: (data: { title: string; message: string; type: number }) =>
    api.post('/admin/mail-templates', data),
  update: (id: number, data: { title?: string; message?: string; type?: number }) =>
    api.put(`/admin/mail-templates/${id}`, data),
  delete: (id: number) => api.delete(`/admin/mail-templates/${id}`),
  send: (data: {
    mode: 'email' | 'internal';
    userIds: number[];
    templateId?: number | null;
    subject?: string;
    message?: string;
    from?: string;
  }) => api.post('/admin/mail-templates/send', data),
};

// Suggestions (admin)
export const adminSuggestsApi = {
  listSuggests: (params?: Record<string, string>) => api.get('/admin/suggests', { params }),
  deleteSuggest: (id: number) => api.delete(`/admin/suggests/${id}`),
};
