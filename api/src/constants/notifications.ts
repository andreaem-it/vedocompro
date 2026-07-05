/**
 * Tipi di notifica centralizzati. La numerazione NON corrisponde a quella del legacy
 * Symfony (rinumerata durante la migrazione, vedi MIGRATION_BACKLOG.md) — usare sempre
 * queste costanti invece di magic number sparsi nei controller.
 */
export const NotificationType = {
  NEW_MESSAGE: 1,
  NEW_REVIEW: 2,
  AD_APPROVED: 3,
  AD_REJECTED: 4,
  FEEDBACK_RECEIVED: 5,
  HELPDESK_REPLY: 6,
  VIDEO_PENDING_REVIEW: 10,
  AD_PENDING_REVIEW: 11,
  HELPDESK_USER_REPLY: 12,
  ORDER_UPDATE: 13,
  SELL_UPDATE: 14,
  PROMOTION_EXPIRED: 15,
  FEEDBACK_REQUEST: 16,
  BUSINESS_APPROVED: 17,
  BUSINESS_REJECTED: 18,
  REPORT_CREATED: 19,
  OFFER_RECEIVED: 20,
  OFFER_UPDATE: 21,
  DISPUTE_OPENED: 22,
  DISPUTE_UPDATE: 23,
  SAVED_SEARCH_MATCH: 24,
} as const;

export type NotificationTypeValue = (typeof NotificationType)[keyof typeof NotificationType];
