import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { AppError } from '../middleware/error.middleware';
import { adsService } from '../services/ads.service';
import { storageService } from '../services/storage.service';
import { generateS3Key } from '../middleware/upload.middleware';
import { hashPassword, verifyPassword } from '../utils/password';
import { assertCanSendMessage } from '../services/antispam.service';
import { mailService } from '../services/mail.service';
import { NotificationType } from '../constants/notifications';
import { DeliveryMethod, OrderStatus, PaymentStatus } from '../constants/orders';
import { config } from '../config';
import { prisma } from '../lib/prisma';

const SAFE_USER = {
  id: true,
  email: true,
  username: true,
  name: true,
  realname: true,
  phone: true,
  phoneVerified: true,
  phoneVerifiedAt: true,
  city: true,
  address: true,
  pic: true,
  isCompany: true,
  companyLogo: true,
  companyWebsite: true,
  creditsGold: true,
  creditsSilver: true,
  creditsBronze: true,
  points: true,
  dateJoin: true,
  businessEnd: true,
  isActive: true,
  isAdmin: true,
} as const;

const ACCOUNT_USER = {
  ...SAFE_USER,
  paymentMethods: true,
  paymentInstructions: true,
  paymentPaypalEmail: true,
  paymentIban: true,
  paymentAccountHolder: true,
} as const;

const BUYER_ORDER_INCLUDE = {
  ad: {
    select: {
      id: true,
      name: true,
      price: true,
      user: {
        select: {
          id: true,
          username: true,
          paymentMethods: true,
          paymentInstructions: true,
          paymentPaypalEmail: true,
          paymentIban: true,
          paymentAccountHolder: true,
        },
      },
    },
  },
  dispute: { select: { id: true, status: true } },
} as const;

const SELLER_ORDER_INCLUDE = {
  ad: { select: { id: true, name: true, price: true } },
  user: { select: { id: true, username: true, email: true, phone: true } },
  dispute: { select: { id: true, status: true } },
} as const;

function orderStatusEmail(status: number, deliveryMethod?: string) {
  if (status === OrderStatus.ACCEPTED) {
    return { subject: 'Ordine accettato', message: 'Il venditore ha accettato il tuo ordine.' };
  }
  if (status === OrderStatus.REJECTED) {
    return { subject: 'Ordine rifiutato', message: 'Il venditore ha rifiutato il tuo ordine.' };
  }
  if (status === OrderStatus.SHIPPED) {
    return deliveryMethod === DeliveryMethod.SHIPPING
      ? { subject: 'Ordine spedito', message: 'Il venditore ha segnato il tuo ordine come spedito.' }
      : { subject: 'Ordine pronto per il ritiro', message: 'Il venditore ha indicato che il tuo ordine è pronto per il ritiro.' };
  }
  if (status === OrderStatus.COMPLETED) {
    return { subject: 'Ordine completato', message: 'Il compratore ha confermato il completamento dell\'ordine.' };
  }
  if (status === OrderStatus.CANCELLED) {
    return { subject: 'Ordine annullato', message: 'Il compratore ha annullato la richiesta d\'ordine.' };
  }
  return { subject: 'Aggiornamento ordine', message: 'Lo stato dell\'ordine è stato aggiornato.' };
}

async function buildTrustStats(userId: number, dateJoin: Date) {
  const [feedbackTotal, positiveFeedback, verifiedFeedback, completedSales, resolvedReports, lostDisputes] = await Promise.all([
    prisma.feedback.count({ where: { userId } }),
    prisma.feedback.count({ where: { userId, positive: 1 } }),
    prisma.feedback.count({ where: { userId, orderId: { not: null } } }),
    prisma.adOrder.count({ where: { status: OrderStatus.COMPLETED, ad: { userId } } }),
    prisma.report.count({
      where: {
        status: 'resolved',
        OR: [
          { targetUserId: userId },
          { targetAd: { userId } },
        ],
      },
    }),
    // Dispute perse come venditore: risolte dall'admin a favore del compratore
    prisma.dispute.count({
      where: { status: 'resolved_buyer', order: { ad: { userId } } },
    }),
  ]);

  const positivePercent = feedbackTotal > 0 ? Math.round((positiveFeedback / feedbackTotal) * 100) : null;
  const accountAgeDays = Math.max(0, Math.floor((Date.now() - dateJoin.getTime()) / (1000 * 60 * 60 * 24)));

  let score = 50;
  if (positivePercent !== null) score += Math.round((positivePercent / 100) * 30);
  score += Math.min(15, verifiedFeedback * 3);
  score += Math.min(15, completedSales * 2);
  score += Math.min(5, Math.floor(accountAgeDays / 180));
  score -= Math.min(35, resolvedReports * 12);
  score -= Math.min(30, lostDisputes * 15);
  score = Math.max(0, Math.min(100, score));

  let level: 'base' | 'buono' | 'affidabile' | 'eccellente' = 'base';
  if (score >= 85) level = 'eccellente';
  else if (score >= 70) level = 'affidabile';
  else if (score >= 55) level = 'buono';

  const badges: string[] = [];
  if (verifiedFeedback > 0) badges.push('Feedback verificati');
  if (completedSales >= 5) badges.push('Vendite concluse');
  if (accountAgeDays >= 365) badges.push('Utente storico');
  if (resolvedReports === 0) badges.push('Nessuna segnalazione confermata');

  return {
    score,
    level,
    positivePercent,
    feedbackTotal,
    verifiedFeedback,
    completedSales,
    accountAgeDays,
    resolvedReports,
    lostDisputes,
    badges,
  };
}

export const usersController = {
  async getProfile(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id, 10);
      const user = await prisma.user.findUnique({ where: { id }, select: SAFE_USER });
      if (!user) throw new AppError(404, 'Utente non trovato');

      const ads = await adsService.getUserAds(id);
      const feedbackReceived = await prisma.feedback.findMany({
        where: { userId: id },
        select: {
          id: true, vote: true, description: true, positive: true, datetime: true, orderId: true,
          fromUser: { select: { id: true, username: true, pic: true } },
          order: { select: { id: true, ad: { select: { id: true, name: true } } } },
        },
        orderBy: { datetime: 'desc' },
        take: 10,
      });
      const trustStats = await buildTrustStats(id, user.dateJoin);

      res.json({ ...user, ads, feedbackReceived, trustStats });
    } catch (err) {
      next(err);
    }
  },

  async getMe(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user!.id },
        select: {
          ...ACCOUNT_USER,
          wishlists: { select: { ad: { select: { id: true, name: true, price: true } } }, take: 20 },
          _count: { select: { ads: true, wishlists: true, sentMessages: true } },
        },
      });
      if (!user) throw new AppError(404, 'Utente non trovato');
      res.json(user);
    } catch (err) {
      next(err);
    }
  },

  async updateMe(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const currentUser = await prisma.user.findUnique({
        where: { id: req.user!.id },
        select: { isCompany: true, phone: true },
      });
      if (!currentUser) throw new AppError(404, 'Utente non trovato');

      const allowed: {
        name?: string;
        realname?: string;
        phone?: string;
        city?: string;
        address?: string;
        companyLogo?: string | null;
        companyWebsite?: string | null;
        paymentMethods?: string[];
        paymentInstructions?: string | null;
        paymentPaypalEmail?: string | null;
        paymentIban?: string | null;
        paymentAccountHolder?: string | null;
      } = {};
      for (const key of ['name', 'realname', 'phone', 'city', 'address'] as const) {
        if (req.body[key] !== undefined) allowed[key] = req.body[key];
      }
      const paymentMethodOptions = ['bank_transfer', 'paypal', 'cash', 'other'];
      if (Array.isArray(req.body.paymentMethods)) {
        allowed.paymentMethods = req.body.paymentMethods
          .map((method: unknown) => String(method).trim())
          .filter((method: string) => paymentMethodOptions.includes(method));
      }
      if (req.body.paymentInstructions !== undefined) {
        const value = String(req.body.paymentInstructions ?? '').trim();
        if (value.length > 2000) throw new AppError(400, 'Le istruzioni di pagamento sono troppo lunghe');
        allowed.paymentInstructions = value || null;
      }
      if (req.body.paymentPaypalEmail !== undefined) {
        const value = String(req.body.paymentPaypalEmail ?? '').trim();
        if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) throw new AppError(400, 'Email PayPal non valida');
        allowed.paymentPaypalEmail = value || null;
      }
      if (req.body.paymentIban !== undefined) {
        const value = String(req.body.paymentIban ?? '').replace(/\s+/g, '').toUpperCase();
        if (value.length > 34) throw new AppError(400, 'IBAN troppo lungo');
        allowed.paymentIban = value || null;
      }
      if (req.body.paymentAccountHolder !== undefined) {
        const value = String(req.body.paymentAccountHolder ?? '').trim();
        if (value.length > 120) throw new AppError(400, 'Intestatario pagamento troppo lungo');
        allowed.paymentAccountHolder = value || null;
      }
      if (currentUser.isCompany) {
        if (req.body.companyLogo !== undefined) allowed.companyLogo = req.body.companyLogo || null;
        if (req.body.companyWebsite !== undefined) allowed.companyWebsite = req.body.companyWebsite || null;
      }

      const data: typeof allowed & {
        phoneVerified?: boolean;
        phoneVerifiedAt?: null;
        phoneVerificationCode?: null;
        phoneVerificationExpiry?: null;
      } = { ...allowed };

      if (allowed.phone !== undefined && allowed.phone !== currentUser.phone) {
        data.phoneVerified = false;
        data.phoneVerifiedAt = null;
        data.phoneVerificationCode = null;
        data.phoneVerificationExpiry = null;
      }

      const user = await prisma.user.update({
        where: { id: req.user!.id },
        data,
        select: ACCOUNT_USER,
      });
      res.json(user);
    } catch (err) {
      next(err);
    }
  },

  async requestPhoneVerification(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user!.id },
        select: { phone: true, phoneVerified: true },
      });
      if (!user) throw new AppError(404, 'Utente non trovato');

      const phone = user.phone?.trim();
      if (!phone || phone === '-') {
        throw new AppError(400, 'Inserisci un numero di telefono prima di richiedere la verifica.');
      }
      if (user.phoneVerified) {
        res.json({ message: 'Telefono già verificato.', alreadyVerified: true });
        return;
      }
      if (!config.features.phoneVerificationDevMode) {
        throw new AppError(503, 'Verifica telefono non ancora collegata al provider SMS in produzione.');
      }

      const code = String(Math.floor(100000 + Math.random() * 900000));
      const expiry = new Date(Date.now() + 10 * 60 * 1000);

      await prisma.user.update({
        where: { id: req.user!.id },
        data: { phoneVerificationCode: code, phoneVerificationExpiry: expiry },
      });

      res.json({
        message: 'Codice di verifica generato.',
        expiresAt: expiry,
        ...(config.features.phoneVerificationDevMode ? { devCode: code } : {}),
      });
    } catch (err) {
      next(err);
    }
  },

  async verifyPhone(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const code = String(req.body.code ?? '').trim();
      if (!/^\d{6}$/.test(code)) throw new AppError(400, 'Inserisci il codice a 6 cifre.');

      const user = await prisma.user.findUnique({
        where: { id: req.user!.id },
        select: { phoneVerificationCode: true, phoneVerificationExpiry: true },
      });
      if (!user) throw new AppError(404, 'Utente non trovato');
      if (!user.phoneVerificationCode || !user.phoneVerificationExpiry) {
        throw new AppError(400, 'Richiedi prima un nuovo codice di verifica.');
      }
      if (user.phoneVerificationExpiry.getTime() < Date.now()) {
        throw new AppError(400, 'Codice scaduto. Richiedine uno nuovo.');
      }
      if (user.phoneVerificationCode !== code) {
        throw new AppError(400, 'Codice non valido.');
      }

      const updated = await prisma.user.update({
        where: { id: req.user!.id },
        data: {
          phoneVerified: true,
          phoneVerifiedAt: new Date(),
          phoneVerificationCode: null,
          phoneVerificationExpiry: null,
        },
        select: SAFE_USER,
      });

      res.json({ message: 'Telefono verificato.', user: updated });
    } catch (err) {
      next(err);
    }
  },

  async changePassword(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { currentPassword, newPassword } = req.body;
      const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
      if (!user) throw new AppError(404, 'Utente non trovato');

      const valid = await verifyPassword(currentPassword, user.password);
      if (!valid) throw new AppError(401, 'Password attuale non corretta');

      const hashed = await hashPassword(newPassword);
      await prisma.user.update({ where: { id: req.user!.id }, data: { password: hashed } });
      res.json({ message: 'Password aggiornata.' });
    } catch (err) {
      next(err);
    }
  },

  async uploadAvatar(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.file) throw new AppError(400, 'File richiesto');
      const key = generateS3Key(req.file.originalname, 'avatars');
      const url = await storageService.upload(key, req.file.buffer, req.file.mimetype);
      await prisma.user.update({ where: { id: req.user!.id }, data: { pic: url } });
      res.json({ pic: url });
    } catch (err) {
      next(err);
    }
  },

  async getNotifications(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const notifications = await prisma.notification.findMany({
        where: { userId: req.user!.id },
        orderBy: { date: 'desc' },
        take: 50,
      });
      const unread = await prisma.notification.count({ where: { userId: req.user!.id, readed: false } });
      res.json({ notifications, unread });
    } catch (err) {
      next(err);
    }
  },

  async markNotificationsRead(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      await prisma.notification.updateMany({ where: { userId: req.user!.id }, data: { readed: true } });
      res.json({ message: 'Notifiche segnate come lette.' });
    } catch (err) {
      next(err);
    }
  },

  async openNotification(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id, 10);
      const notification = await prisma.notification.findFirst({
        where: { id, userId: req.user!.id },
      });
      if (!notification) throw new AppError(404, 'Notifica non trovata');

      if (!notification.readed) {
        await prisma.notification.update({ where: { id }, data: { readed: true } });
      }

      let href = '/notifiche';
      if (notification.type === NotificationType.NEW_MESSAGE && notification.object) {
        const message = await prisma.message.findUnique({ where: { id: notification.object } });
        if (message) {
          const otherUserId = message.fromUserId === req.user!.id ? message.toUserId : message.fromUserId;
          href = `/messaggi?to=${otherUserId}${message.adId ? `&ad=${message.adId}` : ''}`;
        } else {
          href = '/messaggi';
        }
      } else if ([NotificationType.AD_APPROVED, NotificationType.AD_REJECTED, NotificationType.PROMOTION_EXPIRED].includes(notification.type as any) && notification.object) {
        href = `/annunci/${notification.object}`;
      } else if ([NotificationType.HELPDESK_REPLY, NotificationType.HELPDESK_USER_REPLY].includes(notification.type as any)) {
        href = '/profilo/helpdesk';
      } else if ([NotificationType.ORDER_UPDATE, NotificationType.SELL_UPDATE].includes(notification.type as any)) {
        href = '/profilo/acquisti-vendite';
      } else if ([NotificationType.FEEDBACK_RECEIVED, NotificationType.FEEDBACK_REQUEST].includes(notification.type as any)) {
        href = notification.object ? `/utenti/${notification.object}` : '/profilo/feedback';
      } else if ([NotificationType.VIDEO_PENDING_REVIEW, NotificationType.AD_PENDING_REVIEW].includes(notification.type as any)) {
        href = req.user!.isAdmin ? '/admin/annunci' : '/notifiche';
      } else if ([NotificationType.BUSINESS_APPROVED, NotificationType.BUSINESS_REJECTED].includes(notification.type as any)) {
        href = '/business';
      } else if (notification.type === NotificationType.REPORT_CREATED) {
        href = req.user!.isAdmin ? '/admin/segnalazioni' : '/notifiche';
      } else if ([NotificationType.OFFER_RECEIVED, NotificationType.OFFER_UPDATE].includes(notification.type as any)) {
        href = '/profilo/offerte';
      } else if ([NotificationType.DISPUTE_OPENED, NotificationType.DISPUTE_UPDATE].includes(notification.type as any)) {
        href = req.user!.isAdmin ? '/admin/dispute' : '/profilo/acquisti-vendite';
      } else if (notification.type === NotificationType.SAVED_SEARCH_MATCH && notification.object) {
        // Riporta l'utente alla ricerca con gli stessi filtri salvati
        const search = await prisma.savedSearch.findUnique({ where: { id: notification.object } });
        if (search) {
          const params = new URLSearchParams();
          if (search.q) params.set('q', search.q);
          if (search.categoryId) params.set('category', String(search.categoryId));
          if (search.region) params.set('region', search.region);
          if (search.provincia) params.set('provincia', search.provincia);
          if (search.condition) params.set('condition', search.condition);
          if (search.minPrice) params.set('minPrice', String(search.minPrice));
          if (search.maxPrice) params.set('maxPrice', String(search.maxPrice));
          const qs = params.toString();
          href = qs ? `/annunci?${qs}` : '/annunci';
        } else {
          href = '/profilo/ricerche-salvate';
        }
      }

      res.json({ href });
    } catch (err) {
      next(err);
    }
  },

  async getMessages(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const messages = await prisma.message.findMany({
        where: { OR: [{ fromUserId: userId }, { toUserId: userId }] },
        include: {
          fromUser: { select: { id: true, username: true, pic: true } },
          toUser: { select: { id: true, username: true, pic: true } },
          ad: { select: { id: true, name: true } },
        },
        orderBy: { datetime: 'desc' },
      });
      res.json(messages);
    } catch (err) {
      next(err);
    }
  },

  async sendMessage(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const toUserId = parseInt(req.body.toUserId, 10);
      const adId = req.body.adId ? parseInt(req.body.adId, 10) : null;
      const message = String(req.body.message ?? '').trim();
      if (!toUserId || !message) throw new AppError(400, 'Destinatario e messaggio richiesti');
      if (toUserId === req.user!.id) throw new AppError(400, 'Non puoi inviare messaggi a te stesso');

      const recipient = await prisma.user.findUnique({ where: { id: toUserId }, select: { id: true } });
      if (!recipient) throw new AppError(404, 'Destinatario non trovato');

      await assertCanSendMessage(req.user!.id, toUserId, message);

      const msg = await prisma.message.create({
        data: { fromUserId: req.user!.id, toUserId, message, adId },
        include: {
          fromUser: { select: { id: true, username: true, pic: true } },
          ad: { select: { id: true, name: true } },
        },
      });

      await prisma.notification.create({
        data: { userId: toUserId, type: NotificationType.NEW_MESSAGE, object: msg.id },
      });

      res.status(201).json(msg);
    } catch (err) {
      next(err);
    }
  },

  async getMyAds(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const ads = await adsService.getUserAds(req.user!.id);
      res.json(ads);
    } catch (err) {
      next(err);
    }
  },

  async getWishlist(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const ads = await adsService.getWishlistedAds(req.user!.id);
      res.json(ads);
    } catch (err) {
      next(err);
    }
  },

  async markMessageRead(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id, 10);
      const msg = await prisma.message.findUnique({ where: { id } });
      if (!msg) throw new AppError(404, 'Messaggio non trovato');
      if (msg.toUserId !== req.user!.id) throw new AppError(403, 'Non autorizzato');

      await prisma.message.update({ where: { id }, data: { isRead: 1 } });
      res.json({ message: 'Messaggio segnato come letto.' });
    } catch (err) {
      next(err);
    }
  },

  async bulkMarkRead(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { ids } = req.body as { ids: number[] };
      if (!Array.isArray(ids) || ids.length === 0) throw new AppError(400, 'IDs richiesti');
      await prisma.message.updateMany({
        where: { id: { in: ids }, toUserId: req.user!.id },
        data: { isRead: 1 },
      });
      res.json({ updated: true });
    } catch (err) {
      next(err);
    }
  },

  async bulkMarkUnread(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { ids } = req.body as { ids: number[] };
      if (!Array.isArray(ids) || ids.length === 0) throw new AppError(400, 'IDs richiesti');
      await prisma.message.updateMany({
        where: { id: { in: ids }, toUserId: req.user!.id },
        data: { isRead: 0 },
      });
      res.json({ updated: true });
    } catch (err) {
      next(err);
    }
  },

  async deleteMessage(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id, 10);
      const msg = await prisma.message.findUnique({ where: { id } });
      if (!msg) throw new AppError(404, 'Messaggio non trovato');
      if (msg.fromUserId !== req.user!.id && msg.toUserId !== req.user!.id) {
        throw new AppError(403, 'Non autorizzato');
      }
      await prisma.message.delete({ where: { id } });
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  },

  async getFeedback(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const feedback = await prisma.feedback.findMany({
        where: { userId: req.user!.id },
        select: {
          id: true, vote: true, description: true, positive: true, datetime: true, orderId: true,
          fromUser: { select: { id: true, username: true, pic: true } },
          order: { select: { id: true, ad: { select: { id: true, name: true } } } },
        },
        orderBy: { datetime: 'desc' },
      });
      res.json(feedback);
    } catch (err) {
      next(err);
    }
  },

  async giveFeedback(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const recipientId = parseInt(req.params.id, 10);
      if (recipientId === req.user!.id) throw new AppError(400, 'Non puoi lasciare feedback a te stesso');

      const recipient = await prisma.user.findUnique({ where: { id: recipientId } });
      if (!recipient) throw new AppError(404, 'Utente non trovato');

      const { vote, description, positive } = req.body;
      const orderId = parseInt(req.body.orderId, 10);
      if (!vote || vote < 1 || vote > 5) throw new AppError(400, 'Voto deve essere tra 1 e 5');
      if (positive !== 0 && positive !== 1) throw new AppError(400, 'Positive deve essere 0 o 1');
      if (!orderId) throw new AppError(400, 'Serve un ordine completato per lasciare feedback');

      const order = await prisma.adOrder.findFirst({
        where: {
          id: orderId,
          userId: req.user!.id,
          status: OrderStatus.COMPLETED,
          ad: { userId: recipientId },
        },
        include: { feedback: true },
      });
      if (!order) throw new AppError(403, 'Puoi lasciare feedback solo dopo un ordine completato');
      if (order.feedback) throw new AppError(400, 'Feedback già lasciato per questo ordine');

      const feedback = await prisma.feedback.create({
        data: {
          userId: recipientId,
          fromUserId: req.user!.id,
          orderId: order.id,
          vote,
          description: String(description ?? '').trim(),
          positive,
        },
      });

      // Notify recipient (type 5)
      await prisma.notification.create({ data: { userId: recipientId, type: NotificationType.FEEDBACK_RECEIVED, object: feedback.id } });

      // Update user points
      const pointsDelta = positive === 1 ? 1 : -1;
      const newPoints = Math.max(0, recipient.points + pointsDelta);
      await prisma.user.update({ where: { id: recipientId }, data: { points: newPoints } });

      res.status(201).json(feedback);
    } catch (err) {
      next(err);
    }
  },

  async reportUser(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const targetUserId = parseInt(req.params.id, 10);
      if (targetUserId === req.user!.id) throw new AppError(400, 'Non puoi segnalare te stesso');

      const target = await prisma.user.findUnique({ where: { id: targetUserId }, select: { id: true } });
      if (!target) throw new AppError(404, 'Utente non trovato');

      const reason = String(req.body.reason ?? '').trim();
      const details = String(req.body.details ?? '').trim();
      if (!reason) throw new AppError(400, 'Motivo segnalazione richiesto');

      const report = await prisma.report.create({
        data: {
          reporterId: req.user!.id,
          targetUserId,
          reason,
          details: details || null,
        },
      });

      const admins = await prisma.user.findMany({ where: { isAdmin: true }, select: { id: true } });
      await Promise.all(
        admins.map((admin) =>
          prisma.notification.create({ data: { userId: admin.id, type: NotificationType.REPORT_CREATED, object: report.id } }),
        ),
      );

      res.status(201).json(report);
    } catch (err) {
      next(err);
    }
  },

  async getFeedbackEligibleOrders(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const recipientId = parseInt(req.params.id, 10);
      if (recipientId === req.user!.id) {
        res.json([]);
        return;
      }

      const orders = await prisma.adOrder.findMany({
        where: {
          userId: req.user!.id,
          status: OrderStatus.COMPLETED,
          ad: { userId: recipientId },
          feedback: null,
        },
        select: {
          id: true,
          orderDate: true,
          completedAt: true,
          totalAmount: true,
          ad: { select: { id: true, name: true } },
        },
        orderBy: { completedAt: 'desc' },
      });

      res.json(orders);
    } catch (err) {
      next(err);
    }
  },

  async getHelpDesk(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tickets = await prisma.helpDesk.findMany({
        where: { userId: req.user!.id, isReply: false },
        orderBy: { timest: 'desc' },
      });

      // Include replies for each ticket
      const ticketsWithReplies = await Promise.all(
        tickets.map(async (ticket) => {
          const replies = await prisma.helpDesk.findMany({
            where: { isReply: true, parentM: ticket.id },
            orderBy: { timest: 'asc' },
          });
          return { ...ticket, replies };
        }),
      );

      res.json(ticketsWithReplies);
    } catch (err) {
      next(err);
    }
  },

  async createHelpDesk(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const type = Number(req.body.type);
      const title = String(req.body.title ?? '').trim();
      const message = String(req.body.message ?? '').trim();
      if (!Number.isInteger(type) || type < 1 || type > 5) {
        throw new AppError(400, 'Tipo ticket non valido');
      }
      if (!title || !message) {
        throw new AppError(400, 'Titolo e messaggio sono richiesti');
      }

      const ticket = await prisma.helpDesk.create({
        data: { userId: req.user!.id, type, title, message },
      });
      res.status(201).json(ticket);
    } catch (err) {
      next(err);
    }
  },

  async replyHelpDesk(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const ticketId = parseInt(req.params.id, 10);
      const ticket = await prisma.helpDesk.findUnique({ where: { id: ticketId } });
      if (!ticket) throw new AppError(404, 'Ticket non trovato');
      if (ticket.isReply || ticket.userId !== req.user!.id) throw new AppError(404, 'Ticket non trovato');
      if (ticket.closed === 1) throw new AppError(400, 'Il ticket è chiuso');

      const message = String(req.body.message ?? '').trim();
      if (!message) throw new AppError(400, 'Messaggio richiesto');
      const reply = await prisma.helpDesk.create({
        data: {
          userId: req.user!.id,
          type: ticket.type,
          title: ticket.title,
          message,
          isReply: true,
          replyTo: ticketId,
          parentM: ticketId,
        },
      });

      // Bug corretto: notificava il mittente stesso (ticket.userId === chi sta rispondendo,
      // è il proprietario del ticket). Va avvisato lo staff: l'admin assegnato se presente,
      // altrimenti tutti gli admin (stesso pattern di sendAdPendingReview).
      if (ticket.assignedTo) {
        await prisma.notification.create({ data: { userId: ticket.assignedTo, type: NotificationType.HELPDESK_USER_REPLY, object: reply.id } });
      } else {
        const admins = await prisma.user.findMany({ where: { isAdmin: true }, select: { id: true } });
        await Promise.all(
          admins.map((admin) =>
            prisma.notification.create({ data: { userId: admin.id, type: NotificationType.HELPDESK_USER_REPLY, object: reply.id } }),
          ),
        );
      }

      res.status(201).json(reply);
    } catch (err) {
      next(err);
    }
  },

  async getBuys(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const buys = await prisma.buy.findMany({
        where: { fromUid: req.user!.id },
        include: { ad: { select: { id: true, name: true, price: true } } },
        orderBy: { id: 'desc' },
      });
      res.json(buys);
    } catch (err) {
      next(err);
    }
  },

  async getSells(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const sells = await prisma.sell.findMany({
        where: { fromUid: req.user!.id },
        include: { ad: { select: { id: true, name: true, price: true, trackingCode: true } } },
        orderBy: { id: 'desc' },
      });
      res.json(sells);
    } catch (err) {
      next(err);
    }
  },

  // Solo il venditore (Sell.fromUid) può aggiornare il proprio checklist di vendita —
  // il legacy non aveva alcun controllo di autorizzazione qui (setAsShipped/setReceivedPayment).
  async updateSell(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id, 10);
      const sell = await prisma.sell.findUnique({ where: { id } });
      if (!sell) throw new AppError(404, 'Vendita non trovata');
      if (sell.fromUid !== req.user!.id) throw new AppError(403, 'Non autorizzato');

      const { shipped, paid, trackingCode } = req.body;
      const data: { shipped?: number; paid?: number } = {};
      if (shipped !== undefined) data.shipped = shipped ? 1 : 0;
      if (paid !== undefined) data.paid = paid ? 1 : 0;

      const updatedSell = await prisma.sell.update({ where: { id }, data });

      if (trackingCode !== undefined) {
        await prisma.ad.update({ where: { id: sell.adId }, data: { trackingCode } });
      }

      // Notifica all'acquirente quando lo stato cambia
      if (shipped !== undefined || paid !== undefined || trackingCode !== undefined) {
        await prisma.notification.create({ data: { userId: sell.toUid, type: NotificationType.SELL_UPDATE, object: sell.adId } });
      }

      // Transazione completata (pagato + spedito): invita l'acquirente a lasciare un
      // feedback al venditore — solo al momento della transizione, non ad ogni aggiornamento.
      const wasComplete = sell.paid === 1 && sell.shipped === 1;
      const isNowComplete = updatedSell.paid === 1 && updatedSell.shipped === 1;
      if (!wasComplete && isNowComplete) {
        await prisma.notification.create({ data: { userId: sell.toUid, type: NotificationType.FEEDBACK_REQUEST, object: sell.fromUid } });
      }

      res.json(updatedSell);
    } catch (err) {
      next(err);
    }
  },

  async getMyOrders(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const orders = await prisma.adOrder.findMany({
        where: { userId: req.user!.id },
        include: BUYER_ORDER_INCLUDE,
        orderBy: { id: 'desc' },
      });
      res.json(orders);
    } catch (err) {
      next(err);
    }
  },

  async getReceivedOrders(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const orders = await prisma.adOrder.findMany({
        where: { ad: { userId: req.user!.id } },
        include: SELLER_ORDER_INCLUDE,
        orderBy: { id: 'desc' },
      });
      res.json(orders);
    } catch (err) {
      next(err);
    }
  },

  async submitOrderPayment(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id, 10);
      const order = await prisma.adOrder.findUnique({
        where: { id },
        include: { ad: { select: { userId: true, name: true, user: { select: { email: true } } } } },
      });
      if (!order) throw new AppError(404, 'Ordine non trovato');
      if (order.userId !== req.user!.id) throw new AppError(403, 'Non autorizzato');
      if (order.status === OrderStatus.REJECTED || order.status === OrderStatus.CANCELLED) {
        throw new AppError(400, 'Non puoi dichiarare un pagamento su un ordine chiuso');
      }
      if (order.paymentStatus === PaymentStatus.PAID) {
        throw new AppError(400, 'Questo ordine risulta già pagato');
      }

      const provider = String(req.body.provider ?? '').trim();
      const paymentIntentId = String(req.body.paymentIntentId ?? '').trim();
      const note = String(req.body.note ?? '').trim();

      if (!provider || provider.length > 80) {
        throw new AppError(400, 'Indica un metodo di pagamento valido');
      }
      if (paymentIntentId.length > 160) {
        throw new AppError(400, 'Il riferimento pagamento è troppo lungo');
      }
      if (note.length > 1000) {
        throw new AppError(400, 'La nota pagamento è troppo lunga');
      }

      const existingNotes = order.buyerNotes?.trim();
      const paymentNote = note ? `Nota pagamento: ${note}` : '';
      const buyerNotes = paymentNote
        ? [existingNotes, paymentNote].filter(Boolean).join('\n\n')
        : order.buyerNotes;

      const updated = await prisma.adOrder.update({
        where: { id },
        data: {
          paymentStatus: PaymentStatus.PENDING,
          paymentProvider: provider,
          paymentIntentId: paymentIntentId || null,
          buyerNotes,
        },
        include: BUYER_ORDER_INCLUDE,
      });

      await prisma.notification.create({
        data: { userId: order.ad.userId, type: NotificationType.ORDER_UPDATE, object: order.id },
      });
      await mailService.sendMarketplacePaymentSubmitted(
        order.ad.user.email,
        order.ad.name,
        order.id,
        provider,
        paymentIntentId || null,
      ).catch(() => {});

      res.json(updated);
    } catch (err) {
      next(err);
    }
  },

  async updateOrderStatus(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id, 10);
      const order = await prisma.adOrder.findUnique({
        where: { id },
        include: {
          ad: { include: { user: { select: { email: true } } } },
          user: { select: { email: true } },
        },
      });
      if (!order) throw new AppError(404, 'Ordine non trovato');

      const { status } = req.body;
      if (![OrderStatus.ACCEPTED, OrderStatus.REJECTED, OrderStatus.SHIPPED, OrderStatus.COMPLETED, OrderStatus.CANCELLED].includes(status)) {
        throw new AppError(400, 'Status non valido');
      }

      const isSeller = order.ad.userId === req.user!.id;
      const isBuyer = order.userId === req.user!.id;
      if (!isSeller && !isBuyer) throw new AppError(403, 'Non autorizzato');

      const data: {
        status?: number;
        fulfillmentStatus?: string;
        trackingCode?: string | null;
        sellerNotes?: string | null;
        acceptedAt?: Date;
        shippedAt?: Date;
        completedAt?: Date;
        cancelledAt?: Date;
      } = {};
      const now = new Date();

      if (isSeller) {
        if (status === OrderStatus.ACCEPTED) {
          if (order.status !== OrderStatus.PENDING && order.status !== OrderStatus.ACCEPTED) throw new AppError(400, 'Transizione ordine non valida');
          data.status = OrderStatus.ACCEPTED;
          data.fulfillmentStatus = 'accepted';
          data.acceptedAt = order.acceptedAt ?? now;
        } else if (status === OrderStatus.REJECTED) {
          if (order.status !== OrderStatus.PENDING && order.status !== OrderStatus.ACCEPTED) throw new AppError(400, 'Transizione ordine non valida');
          data.status = OrderStatus.REJECTED;
          data.fulfillmentStatus = 'rejected';
          data.cancelledAt = order.cancelledAt ?? now;
        } else if (status === OrderStatus.SHIPPED) {
          if (order.status !== OrderStatus.ACCEPTED && order.status !== OrderStatus.SHIPPED) throw new AppError(400, 'Accetta l\'ordine prima di segnarlo come spedito');
          data.status = OrderStatus.SHIPPED;
          data.fulfillmentStatus = order.deliveryMethod === DeliveryMethod.SHIPPING ? 'shipped' : 'ready_for_pickup';
          data.shippedAt = order.shippedAt ?? now;
          if (req.body.trackingCode !== undefined) data.trackingCode = String(req.body.trackingCode ?? '').trim() || null;
        } else {
          throw new AppError(403, 'Solo il compratore può completare o annullare questo ordine');
        }
        if (req.body.sellerNotes !== undefined) data.sellerNotes = String(req.body.sellerNotes ?? '').trim() || null;
      } else if (isBuyer) {
        if (status === OrderStatus.COMPLETED) {
          if (order.status !== OrderStatus.SHIPPED) throw new AppError(400, 'Puoi completare solo un ordine spedito o pronto al ritiro');
          data.status = OrderStatus.COMPLETED;
          data.fulfillmentStatus = 'completed';
          data.completedAt = order.completedAt ?? now;
        } else if (status === OrderStatus.CANCELLED) {
          if (order.status !== OrderStatus.PENDING) throw new AppError(400, 'Puoi annullare solo un ordine ancora in attesa');
          data.status = OrderStatus.CANCELLED;
          data.fulfillmentStatus = 'cancelled';
          data.cancelledAt = order.cancelledAt ?? now;
        } else {
          throw new AppError(403, 'Solo il venditore può aggiornare questo stato');
        }
      }

      const updated = await prisma.adOrder.update({ where: { id }, data });
      const notifyUserId = isSeller ? order.userId : order.ad.userId;
      await prisma.notification.create({ data: { userId: notifyUserId, type: NotificationType.ORDER_UPDATE, object: order.id } });
      const emailTarget = isSeller ? order.user.email : order.ad.user.email;
      const copy = orderStatusEmail(status, order.deliveryMethod);
      await mailService.sendMarketplaceOrderUpdate(
        emailTarget,
        copy.subject,
        order.ad.name,
        copy.message,
        order.id,
      ).catch(() => {});

      res.json(updated);
    } catch (err) {
      next(err);
    }
  },
};
