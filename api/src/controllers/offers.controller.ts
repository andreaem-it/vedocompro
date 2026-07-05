import { Response, NextFunction } from 'express';
import { Prisma, AdOffer } from '@prisma/client';
import { AuthenticatedRequest } from '../types';
import { AppError } from '../middleware/error.middleware';
import { prisma } from '../lib/prisma';
import { NotificationType } from '../constants/notifications';
import { OfferStatus, OFFER_VALIDITY_DAYS } from '../constants/offers';
import { mailService } from '../services/mail.service';

// Email best-effort: mai bloccare la risposta API per un errore SMTP
async function emailOfferEvent(userId: number, subject: string, message: string, adTitle: string): Promise<void> {
  if (!mailService.isConfigured()) return;
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
  if (!user) return;
  await mailService.sendOfferNotification(user.email, subject, message, adTitle).catch(() => {});
}

// Un'offerta pending/countered oltre la scadenza va trattata come expired ovunque:
// il controllo è lazy (alla lettura/risposta) per non dipendere da un cron dedicato.
function isExpired(offer: AdOffer): boolean {
  return (
    (offer.status === OfferStatus.PENDING || offer.status === OfferStatus.COUNTERED) &&
    offer.expiresAt < new Date()
  );
}

async function markExpired(offerId: number): Promise<void> {
  await prisma.adOffer.update({ where: { id: offerId }, data: { status: OfferStatus.EXPIRED } });
}

const OFFER_INCLUDE = {
  ad: { select: { id: true, name: true, price: true, published: true, sold: true } },
  buyer: { select: { id: true, username: true } },
  seller: { select: { id: true, username: true } },
} as const;

export const offersController = {
  // POST /ads/:id/offers — il compratore propone un prezzo
  async create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const adId = parseInt(req.params.id, 10);
      const ad = await prisma.ad.findUnique({ where: { id: adId } });
      if (!ad || ad.published !== 1) throw new AppError(404, 'Annuncio non trovato');
      if (ad.sold === 1) throw new AppError(400, 'Annuncio già venduto');
      if (ad.userId === req.user!.id) throw new AppError(400, 'Non puoi fare offerte sul tuo annuncio');

      const amount = new Prisma.Decimal(String(req.body.amount ?? ''));
      if (amount.lte(0)) throw new AppError(400, 'Importo offerta non valido');
      if (amount.gte(new Prisma.Decimal(ad.price))) {
        throw new AppError(400, "L'offerta deve essere inferiore al prezzo richiesto — per il prezzo pieno usa Ordina o Contatta");
      }

      const active = await prisma.adOffer.findFirst({
        where: {
          adId,
          buyerId: req.user!.id,
          status: { in: [OfferStatus.PENDING, OfferStatus.COUNTERED] },
          expiresAt: { gt: new Date() },
        },
      });
      if (active) throw new AppError(400, 'Hai già un\'offerta attiva su questo annuncio');

      const message = String(req.body.message ?? '').trim();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + OFFER_VALIDITY_DAYS);

      const offer = await prisma.adOffer.create({
        data: {
          adId,
          buyerId: req.user!.id,
          sellerId: ad.userId,
          amount,
          message: message || null,
          status: OfferStatus.PENDING,
          expiresAt,
        },
        include: OFFER_INCLUDE,
      });

      await prisma.notification.create({
        data: { userId: ad.userId, type: NotificationType.OFFER_RECEIVED, object: offer.id },
      });
      await emailOfferEvent(
        ad.userId,
        'Hai ricevuto una nuova offerta',
        `Un utente ti ha proposto €${amount.toFixed(2)} per il tuo annuncio. Puoi accettare, rifiutare o fare una controproposta.`,
        ad.name,
      );

      res.status(201).json(offer);
    } catch (err) {
      next(err);
    }
  },

  // GET /users/me/offers?role=made|received
  async listMine(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const role = req.query.role === 'received' ? 'received' : 'made';
      const where =
        role === 'received' ? { sellerId: req.user!.id } : { buyerId: req.user!.id };

      const offers = await prisma.adOffer.findMany({
        where,
        include: OFFER_INCLUDE,
        orderBy: { id: 'desc' },
      });

      // Lazy expiry: normalizza in DB e in risposta le offerte scadute
      const expired = offers.filter(isExpired);
      if (expired.length > 0) {
        await prisma.adOffer.updateMany({
          where: { id: { in: expired.map((o) => o.id) } },
          data: { status: OfferStatus.EXPIRED },
        });
      }
      const expiredIds = new Set(expired.map((o) => o.id));
      res.json(
        offers.map((o) => (expiredIds.has(o.id) ? { ...o, status: OfferStatus.EXPIRED } : o)),
      );
    } catch (err) {
      next(err);
    }
  },

  // PUT /users/me/offers/:id — { action: accept|reject|counter|withdraw, counterAmount?, sellerMessage? }
  async respond(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id, 10);
      const offer = await prisma.adOffer.findUnique({ where: { id }, include: { ad: true } });
      if (!offer) throw new AppError(404, 'Offerta non trovata');

      const isSeller = offer.sellerId === req.user!.id;
      const isBuyer = offer.buyerId === req.user!.id;
      if (!isSeller && !isBuyer) throw new AppError(403, 'Non autorizzato');

      if (isExpired(offer)) {
        await markExpired(offer.id);
        throw new AppError(400, 'Offerta scaduta');
      }

      const action = String(req.body.action ?? '');
      const now = new Date();
      let data: Prisma.AdOfferUpdateInput;
      let notifyUserId: number;
      let notifyType: number;

      if (isSeller) {
        if (offer.status !== OfferStatus.PENDING) {
          throw new AppError(400, 'Puoi rispondere solo a un\'offerta in attesa');
        }
        if (action === 'accept') {
          data = { status: OfferStatus.ACCEPTED, respondedAt: now };
        } else if (action === 'reject') {
          data = { status: OfferStatus.REJECTED, respondedAt: now };
        } else if (action === 'counter') {
          const counterAmount = new Prisma.Decimal(String(req.body.counterAmount ?? ''));
          if (counterAmount.lte(offer.amount)) {
            throw new AppError(400, 'La controproposta deve essere superiore all\'offerta ricevuta');
          }
          if (counterAmount.gt(new Prisma.Decimal(offer.ad.price))) {
            throw new AppError(400, 'La controproposta non può superare il prezzo richiesto');
          }
          data = { status: OfferStatus.COUNTERED, counterAmount, respondedAt: now };
        } else {
          throw new AppError(400, 'Azione non valida');
        }
        if (req.body.sellerMessage !== undefined) {
          data.sellerMessage = String(req.body.sellerMessage ?? '').trim() || null;
        }
        notifyUserId = offer.buyerId;
        notifyType = NotificationType.OFFER_UPDATE;
      } else {
        // buyer
        if (action === 'withdraw') {
          if (offer.status !== OfferStatus.PENDING && offer.status !== OfferStatus.COUNTERED) {
            throw new AppError(400, 'Puoi ritirare solo un\'offerta ancora aperta');
          }
          data = { status: OfferStatus.WITHDRAWN, respondedAt: now };
        } else if (action === 'accept') {
          if (offer.status !== OfferStatus.COUNTERED) {
            throw new AppError(400, 'Puoi accettare solo una controproposta del venditore');
          }
          data = { status: OfferStatus.ACCEPTED, respondedAt: now };
        } else if (action === 'reject') {
          if (offer.status !== OfferStatus.COUNTERED) {
            throw new AppError(400, 'Puoi rifiutare solo una controproposta del venditore');
          }
          data = { status: OfferStatus.REJECTED, respondedAt: now };
        } else {
          throw new AppError(400, 'Azione non valida');
        }
        notifyUserId = offer.sellerId;
        notifyType = NotificationType.OFFER_UPDATE;
      }

      const updated = await prisma.adOffer.update({ where: { id }, data, include: OFFER_INCLUDE });
      await prisma.notification.create({
        data: { userId: notifyUserId, type: notifyType, object: offer.id },
      });

      // Email alla controparte, testo per evento
      const EMAIL_BY_ACTION: Record<string, { subject: string; message: string } | undefined> = isSeller
        ? {
            accept: {
              subject: 'La tua offerta è stata accettata!',
              message: `Il venditore ha accettato la tua offerta di €${offer.amount.toFixed(2)}. Completa l'ordine dalla pagina delle tue offerte per bloccare l'acquisto.`,
            },
            reject: {
              subject: 'La tua offerta non è stata accettata',
              message: 'Il venditore ha rifiutato la tua offerta. Puoi fare una nuova proposta o contattarlo via messaggio.',
            },
            counter: {
              subject: 'Hai ricevuto una controproposta',
              message: `Il venditore ti propone €${String(req.body.counterAmount ?? '')}. Accetta o rifiuta dalla pagina delle tue offerte.`,
            },
          }
        : {
            accept: {
              subject: 'Controproposta accettata',
              message: `Il compratore ha accettato la tua controproposta di €${offer.counterAmount?.toFixed(2) ?? ''}. Riceverai l'ordine quando completerà il checkout.`,
            },
            reject: {
              subject: 'Controproposta rifiutata',
              message: 'Il compratore ha rifiutato la tua controproposta.',
            },
            withdraw: {
              subject: 'Offerta ritirata',
              message: 'Il compratore ha ritirato la sua offerta sul tuo annuncio.',
            },
          };
      const emailContent = EMAIL_BY_ACTION[action];
      if (emailContent) {
        await emailOfferEvent(notifyUserId, emailContent.subject, emailContent.message, offer.ad.name);
      }

      res.json(updated);
    } catch (err) {
      next(err);
    }
  },
};

// Importo finale concordato di un'offerta accettata (controproposta se presente).
export function agreedAmount(offer: Pick<AdOffer, 'amount' | 'counterAmount'>): Prisma.Decimal {
  return offer.counterAmount ?? offer.amount;
}
