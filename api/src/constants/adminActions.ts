/**
 * Tipi di azione admin centralizzati (AdminAction.type), per l'audit log. Numerazione
 * indipendente dal legacy (che ne aveva 12, alcuni dead/ridondanti) — qui solo le azioni
 * sensibili realmente loggate nel nuovo stack.
 */
export const AdminActionType = {
  USER_ACTIVATE: 1,
  USER_DEACTIVATE: 2,
  USER_DELETE: 3,
  AD_ACTIVATE: 4,
  AD_REJECT: 5,
  AD_DELETE: 6,
  VIDEO_ACCEPT: 7,
  VIDEO_REJECT: 8,
  REVIEW_PUBLISH: 9,
  REVIEW_REJECT: 10,
  IMPERSONATE: 11,
  BUSINESS_APPROVE: 12,
  BUSINESS_REJECT: 13,
  REPORT_RESOLVE: 14,
  REPORT_DISMISS: 15,
  DISPUTE_RESOLVE: 16,
  CRM_NOTE_CREATE: 17,
  CRM_NOTE_RESOLVE: 18,
  ORDER_PAYMENT_RECONCILE: 19,
} as const;
