export const OfferStatus = {
  PENDING: 'pending',
  COUNTERED: 'countered',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
  WITHDRAWN: 'withdrawn',
  EXPIRED: 'expired',
} as const;

export type OfferStatusValue = (typeof OfferStatus)[keyof typeof OfferStatus];

// Giorni di validità di un'offerta prima della scadenza automatica.
export const OFFER_VALIDITY_DAYS = 7;

// Massimo numero di offerte attive (pending/countered) per compratore sullo stesso annuncio.
export const MAX_ACTIVE_OFFERS_PER_AD = 1;

export const DisputeStatus = {
  OPEN: 'open',
  UNDER_REVIEW: 'under_review',
  RESOLVED_BUYER: 'resolved_buyer',
  RESOLVED_SELLER: 'resolved_seller',
  CLOSED: 'closed',
} as const;

export type DisputeStatusValue = (typeof DisputeStatus)[keyof typeof DisputeStatus];
