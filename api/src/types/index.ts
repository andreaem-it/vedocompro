import { Request } from 'express';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    email: string;
    username: string;
    isAdmin: boolean;
  };
}

export interface PaginationQuery {
  page?: string;
  limit?: string;
}

export interface AdFilters {
  category?: string;
  region?: string;
  provincia?: string;
  minPrice?: string;
  maxPrice?: string;
  condition?: string;
  q?: string;
  page?: string;
  limit?: string;
  sort?: 'recent' | 'price_asc' | 'price_desc' | 'views';
}

export interface JwtPayload {
  sub: number;
  email: string;
  username: string;
  isAdmin: boolean;
  iat?: number;
  exp?: number;
}

export type NotificationType =
  | 'new_message'
  | 'new_review'
  | 'ad_sold'
  | 'order_shipped'
  | 'order_received'
  | 'feedback_received';
