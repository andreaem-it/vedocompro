export const OrderStatus = {
  PENDING: 0,
  ACCEPTED: 1,
  REJECTED: 2,
  SHIPPED: 3,
  COMPLETED: 4,
  CANCELLED: 5,
} as const;

export const PaymentStatus = {
  UNPAID: 'unpaid',
  PENDING: 'pending',
  PAID: 'paid',
  REFUNDED: 'refunded',
} as const;

export const DeliveryMethod = {
  MEETUP: 'meetup',
  SHIPPING: 'shipping',
} as const;

export type OrderStatusValue = (typeof OrderStatus)[keyof typeof OrderStatus];
