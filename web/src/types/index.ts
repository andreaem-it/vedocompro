export interface User {
  id: number;
  email: string;
  username: string;
  name: string;
  realname: string;
  phone: string;
  city: string;
  address: string;
  pic: string | null;
  isCompany: number | null;
  companyLogo: string | null;
  companyWebsite: string | null;
  creditsGold: number;
  creditsSilver: number;
  creditsBronze: number;
  points: number;
  dateJoin: string;
  businessEnd: string | null;
  isAdmin: boolean;
}

export interface Category {
  id: number;
  name: string;
  children: Category[];
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
  published: number;
  video: string | null;
  hasMap: boolean;
  mapCoords: string | null;
  hasReviews: boolean;
  isHotel: boolean;
  services: string[];
  rooms: string[];
  tags: string[];
  callClicks: number;
  messageClicks: number;
  goldPromotionEndDate: string | null;
  silverPromotionEndDate: string | null;
  bronzePromotionEndDate: string | null;
  creationTime: string;
  updateTime: string;
  category: { id: number; name: string };
  user: { id: number; username: string; name: string; pic: string | null; isCompany: number | null };
  isWishlisted?: boolean;
  reviews?: Review[];
  videos?: Video[];
  _count?: { wishlists: number; reviews: number };
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
  ads: Ad[];
  pagination: Pagination;
}

export interface Product {
  id: number;
  name: string;
  creditsGold: number;
  creditsSilver: number;
  creditsBronze: number;
  price: string;
}
