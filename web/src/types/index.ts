export interface User {
  id: number;
  email: string;
  username: string;
  name: string;
  realname: string;
  phone: string;
  phoneVerified: boolean;
  phoneVerifiedAt: string | null;
  city: string;
  address: string;
  pic: string | null;
  isCompany: number | null;
  companyLogo: string | null;
  companyWebsite: string | null;
  paymentMethods?: string[];
  paymentInstructions?: string | null;
  paymentPaypalEmail?: string | null;
  paymentIban?: string | null;
  paymentAccountHolder?: string | null;
  creditsGold: number;
  creditsSilver: number;
  creditsBronze: number;
  points: number;
  dateJoin: string;
  businessEnd: string | null;
  isAdmin: boolean;
  isActive?: boolean;
  trustStats?: UserTrustStats;
}

export interface UserTrustStats {
  score: number;
  level: 'base' | 'buono' | 'affidabile' | 'eccellente';
  positivePercent: number | null;
  feedbackTotal: number;
  verifiedFeedback: number;
  completedSales: number;
  accountAgeDays: number;
  resolvedReports: number;
  badges: string[];
}

export interface BusinessRequest {
  id: number;
  userId: number;
  requestDate: string;
  paid: boolean;
  status: number;
  reviewedAt: string | null;
  reviewedBy: number | null;
  adminNotes: string | null;
  package: number;
  opt1: boolean;
  opt2: boolean;
  legalName: string;
  vatNumber: string;
  contactName: string;
  contactSurname: string;
  contactPhone: string;
  contactEmail: string;
  user?: {
    id: number;
    username: string;
    email: string;
    isCompany: number | null;
    businessEnd: string | null;
  };
}

export interface BusinessRequestListResponse {
  requests: BusinessRequest[];
  pagination: Pagination;
}

export interface BusinessDashboardResponse {
  businessEnd: string | null;
  latestRequest: BusinessRequest | null;
  stats: {
    ads: number;
    views: number;
    callClicks: number;
    messageClicks: number;
  };
  recentAds: Array<{
    id: number;
    name: string;
    published: number;
    views: number;
    callClicks: number;
    messageClicks: number;
    creationTime: string;
  }>;
  monthly: Array<{ month: string; views: number; calls: number; messages: number }>;
}

export interface Category {
  id: number;
  name: string;
  children: Category[];
}

export interface Photo {
  id: number;
  url: string;
  order: number;
}

export interface Feedback {
  id: number;
  vote: number;
  description: string;
  positive: number;
  datetime: string;
  orderId?: number | null;
  fromUser: { id: number; username: string; pic: string | null };
  order?: { id: number; ad: { id: number; name: string } } | null;
}

export interface HelpDeskTicket {
  id: number;
  type: number;
  title: string;
  message: string;
  // 0=aperto, 1=chiuso, 2=assegnato (3 stati come il legacy, non un booleano)
  closed: number;
  assignedTo?: number | null;
  timest: string;
  replies?: HelpDeskReply[];
}

export interface HelpDeskReply {
  id: number;
  message: string;
  timest: string;
  isReply: boolean;
}

export interface Ad {
  id: number;
  name: string;
  price: string;
  description: string;
  region: string;
  location: string;
  provincia: string;
  views: number;
  objCondition: string;
  objLevel: number;
  showcase: number;
  sold: number;
  availableQuantity: number;
  published: number;
  video: string | null;
  hasMap: boolean;
  mapCoords: string | null;
  distanceKm?: number;
  hasReviews: boolean;
  isHotel: boolean;
  services: string[];
  rooms: string[];
  tags: string[];
  canBeOrdered: boolean;
  shippingAvailable: boolean;
  shippingCost: string | null;
  shippingNotes: string | null;
  fields?: string[];
  vals?: string[];
  callClicks: number;
  messageClicks: number;
  goldPromotionEndDate: string | null;
  silverPromotionEndDate: string | null;
  bronzePromotionEndDate: string | null;
  creationTime: string;
  updateTime: string;
  category: { id: number; name: string };
  user: {
    id: number; username: string; name: string; pic: string | null; isCompany: number | null;
    phone?: string; phoneVerified?: boolean; companyLogo?: string | null; companyWebsite?: string | null; points?: number; city?: string; address?: string;
  };
  isWishlisted?: boolean;
  reviews?: Review[];
  videos?: Video[];
  photos?: Photo[];
  _count?: { wishlists: number; reviews: number };
  feedPercent?: number | null;
  similar?: { id: number; name: string; price: string; photos: { url: string }[] }[];
}

export interface Review {
  id: number;
  rating: number;
  comment: string;
  datetime: string;
  user: { id: number; username: string; pic: string | null };
}

export interface Video {
  id: number;
  filename: string;
}

export interface Message {
  id: number;
  message: string;
  isRead: number;
  datetime: string;
  fromUser: { id: number; username: string; pic: string | null };
  toUser: { id: number; username: string; pic: string | null };
  ad: { id: number; name: string } | null;
}

export interface Notification {
  id: number;
  type: number;
  object: number | null;
  readed: boolean;
  date: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface AdListResponse {
  showcase?: Ad[];
  ads: Ad[];
  pagination: Pagination;
}

export interface PromotionPackage {
  id: number | null;
  key: string;
  name: string;
  level: number;
  creditType: 'bronze' | 'silver' | 'gold';
  creditCost: number;
  durationDays: number;
  priceEur: string;
  autoRenewAvailable: boolean;
  isActive?: boolean;
  sortOrder: number;
}

export interface Product {
  id: number;
  name: string;
  creditsGold: number;
  creditsSilver: number;
  creditsBronze: number;
  price: string;
}

export interface AdOrder {
  id: number;
  qty: number;
  status: number;
  paymentStatus: string;
  fulfillmentStatus: string;
  paymentProvider: string | null;
  paymentIntentId: string | null;
  currency: string;
  unitPrice: string;
  shippingAmount: string;
  platformFee: string;
  totalAmount: string;
  deliveryMethod: 'meetup' | 'shipping';
  buyerName: string | null;
  buyerPhone: string | null;
  shippingAddress: string | null;
  shippingCity: string | null;
  shippingPostalCode: string | null;
  shippingProvince: string | null;
  buyerNotes: string | null;
  sellerNotes: string | null;
  trackingCode: string | null;
  acceptedAt: string | null;
  shippedAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  orderDate: string;
  ad: {
    id: number;
    name: string;
    price: string;
    user?: {
      id: number;
      username: string;
      paymentMethods?: string[];
      paymentInstructions?: string | null;
      paymentPaypalEmail?: string | null;
      paymentIban?: string | null;
      paymentAccountHolder?: string | null;
    };
  };
  user?: { id: number; username: string; email: string; phone?: string };
  dispute?: { id: number; status: string } | null;
  paymentReconciliations?: Array<{
    id: number;
    previousStatus: string;
    newStatus: string;
    provider: string | null;
    paymentIntentId: string | null;
    note: string | null;
    createdAt: string;
    adminUser: { id: number; username: string };
  }>;
}

export interface AdOffer {
  id: number;
  adId: number;
  buyerId: number;
  sellerId: number;
  amount: string;
  counterAmount: string | null;
  message: string | null;
  sellerMessage: string | null;
  status: 'pending' | 'countered' | 'accepted' | 'rejected' | 'withdrawn' | 'expired';
  orderId: number | null;
  expiresAt: string;
  respondedAt: string | null;
  createdAt: string;
  ad: { id: number; name: string; price: string; published: number; sold: number };
  buyer: { id: number; username: string };
  seller: { id: number; username: string };
}

export interface CategoryField {
  id: number;
  name: string;
  type: 'select' | 'text' | 'number';
  options: string[];
  filterable: boolean;
  required: boolean;
  sortOrder?: number;
}

export interface SavedSearch {
  id: number;
  name: string;
  q: string | null;
  categoryId: number | null;
  region: string | null;
  provincia: string | null;
  condition: string | null;
  minPrice: string | null;
  maxPrice: string | null;
  frequency: 'instant' | 'daily' | 'off';
  lastNotifiedAt: string | null;
  createdAt: string;
}

export interface DisputeMessage {
  id: number;
  disputeId: number;
  userId: number;
  message: string;
  isAdmin: boolean;
  createdAt: string;
  user: { id: number; username: string };
  attachments?: Array<{
    id: number;
    url: string;
    fileName: string;
    mimeType: string;
    size: number;
    createdAt: string;
  }>;
}

export interface Dispute {
  id: number;
  orderId: number;
  openedById: number;
  reason: string;
  description: string;
  status: 'open' | 'under_review' | 'resolved_buyer' | 'resolved_seller' | 'closed';
  adminDecision: string | null;
  resolvedBy: number | null;
  resolvedAt: string | null;
  createdAt: string;
  order: {
    id: number;
    status: number;
    totalAmount: string;
    orderDate: string;
    userId: number;
    user: { id: number; username: string };
    ad: { id: number; name: string; userId: number; user: { id: number; username: string } };
  };
  openedBy: { id: number; username: string };
  messages: DisputeMessage[];
}

export interface BuySell {
  id: number;
  fromUid: number;
  toUid: number;
  adId: number;
  status: number;
  verified: number;
  shipped: number;
  paid: number;
  feedout: number;
  feedin: number;
  type: number;
  ad: { id: number; name: string; price: string; trackingCode?: string | null };
}

// ---- Shop module ----

export interface ShopCategory {
  id: number;
  name: string;
  fatherId: number | null;
  father?: { id: number; name: string } | null;
  children?: ShopCategory[];
  _count?: { products: number; children: number };
}

export interface ShopShipment {
  id: number;
  serviceName: string;
  basePrice: string;
  expectedDelivery: string;
  serviceLogo: string | null;
  isActive: boolean;
}

export interface ShopProduct {
  id: number;
  name: string;
  price: string;
  video: string | null;
  pics: string[];
  isActive: boolean;
  inStock: number | null;
  description: string;
  createdAt: string;
  updatedAt: string;
  categories: { id: number; name: string; fatherId: number | null }[];
  shipmentServices: ShopShipment[];
}

export interface ShopProductListResponse {
  products: ShopProduct[];
  pagination: Pagination;
}

// ---- Ads category admin (tree) ----

export interface AdCategory {
  id: number;
  name: string;
  parentId: number | null;
  parent?: { id: number; name: string } | null;
  children?: AdCategory[];
  _count?: { ads: number; children?: number };
}

// ---- Coupons (admin) ----

export interface Coupon {
  id: number;
  code: string;
  value: number;
  valid: number;
  assigned: string;
}

export interface CouponListResponse {
  coupons: Coupon[];
  pagination: Pagination;
}

// ---- Mail templates (admin) ----

export interface AdminDefaultMail {
  id: number;
  title: string;
  message: string;
  type: number;
}

// ---- Suggestions (admin) ----

export interface Suggest {
  id: number;
  name: string;
  mail: string;
  type: string;
  message: string;
  date: string;
}

export interface SuggestListResponse {
  suggests: Suggest[];
  pagination: Pagination;
}

// ---- Admin actions audit log ----

export interface AdminActionLog {
  id: number;
  type: number;
  linedate: string;
  user: { id: number; username: string };
}

export interface AdminActionListResponse {
  actions: AdminActionLog[];
  pagination: Pagination;
}
