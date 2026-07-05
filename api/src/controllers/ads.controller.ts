import { Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { body, validationResult } from 'express-validator';
import { adsService } from '../services/ads.service';
import { AuthenticatedRequest } from '../types';
import { AppError } from '../middleware/error.middleware';
import { storageService } from '../services/storage.service';
import { generateS3Key } from '../middleware/upload.middleware';
import { mailService } from '../services/mail.service';
import { NotificationType } from '../constants/notifications';
import { DeliveryMethod, OrderStatus, PaymentStatus } from '../constants/orders';
import { OfferStatus } from '../constants/offers';
import { AdminActionType } from '../constants/adminActions';
import { logAdminAction } from '../services/auditLog.service';
import { resolveAdFields } from '../services/ad-fields.service';
import { prisma } from '../lib/prisma';

// Campi che un utente (non admin) può modificare in fase di editing di un annuncio esistente.
// `published`/`objLevel`/`showcase`/le date di promozione restano sotto controllo esclusivo
// di admin e degli endpoint dedicati (moderazione, promozione) per evitare bypass.
const USER_EDITABLE_FIELDS = [
  'name', 'categoryId', 'price', 'description', 'region', 'location', 'provincia',
  'objCondition', 'option1', 'option2', 'option3', 'option4', 'option5', 'canBeOrdered',
  'shippingAvailable', 'shippingCost', 'shippingNotes', 'availableQuantity',
] as const;

type PromotionPackageLike = {
  id?: number | null;
  key: string;
  name: string;
  level: number;
  creditType: string;
  creditCost: number;
  durationDays: number;
  priceEur: Prisma.Decimal;
  autoRenewAvailable: boolean;
  sortOrder: number;
  isActive?: boolean;
};

const DEFAULT_PROMOTION_PACKAGES: PromotionPackageLike[] = [
  {
    key: 'bronze',
    name: 'Bronze',
    level: 1,
    creditType: 'bronze',
    creditCost: 1,
    durationDays: 1,
    priceEur: new Prisma.Decimal(0),
    autoRenewAvailable: false,
    sortOrder: 10,
  },
  {
    key: 'silver',
    name: 'Silver',
    level: 2,
    creditType: 'silver',
    creditCost: 1,
    durationDays: 3,
    priceEur: new Prisma.Decimal(0),
    autoRenewAvailable: false,
    sortOrder: 20,
  },
  {
    key: 'gold',
    name: 'Gold',
    level: 3,
    creditType: 'gold',
    creditCost: 1,
    durationDays: 7,
    priceEur: new Prisma.Decimal(0),
    autoRenewAvailable: false,
    sortOrder: 30,
  },
];

function promotionFieldForLevel(level: number) {
  if (level === 3) return 'goldPromotionEndDate' as const;
  if (level === 2) return 'silverPromotionEndDate' as const;
  return 'bronzePromotionEndDate' as const;
}

function creditFieldForType(creditType: string) {
  if (creditType === 'gold') return 'creditsGold' as const;
  if (creditType === 'silver') return 'creditsSilver' as const;
  return 'creditsBronze' as const;
}

function publicPromotionPackage(pkg: PromotionPackageLike) {
  return {
    id: pkg.id ?? null,
    key: pkg.key,
    name: pkg.name,
    level: pkg.level,
    creditType: pkg.creditType,
    creditCost: pkg.creditCost,
    durationDays: pkg.durationDays,
    priceEur: pkg.priceEur.toString(),
    autoRenewAvailable: pkg.autoRenewAvailable,
    sortOrder: pkg.sortOrder,
  };
}

function normalizeAvailableQuantity(value: unknown, isBusiness: boolean) {
  if (!isBusiness) return 1;
  const quantity = Number(value ?? 1);
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 9999) {
    throw new AppError(400, 'Quantità disponibile non valida');
  }
  return quantity;
}

async function getActivePromotionPackages() {
  const packages = await prisma.promotionPackage.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: 'asc' }, { level: 'asc' }],
  });
  return packages.length > 0 ? packages : [...DEFAULT_PROMOTION_PACKAGES];
}

async function resolvePromotionPackage(key: string): Promise<PromotionPackageLike | null> {
  const packageKey = key.trim().toLowerCase();
  const dbPackage = await prisma.promotionPackage.findUnique({ where: { key: packageKey } });
  if (dbPackage) return dbPackage.isActive ? dbPackage : null;
  return DEFAULT_PROMOTION_PACKAGES.find((pkg) => pkg.key === packageKey) ?? null;
}

export const createAdValidation = [
  body('name').isLength({ min: 3, max: 100 }),
  body('price').isDecimal({ decimal_digits: '0,2' }),
  body('description').isLength({ min: 10 }),
  body('categoryId').isInt({ min: 1 }),
  body('region').notEmpty(),
  body('location').notEmpty(),
  body('provincia').notEmpty(),
  body('objCondition').isIn(['new', 'like_new', 'good', 'acceptable', 'for_parts']),
  body('published').optional().isInt({ min: 0, max: 1 }),
  body('canBeOrdered').optional().isBoolean(),
  body('availableQuantity').optional().isInt({ min: 1, max: 9999 }),
  body('fields').optional().isArray(),
  body('vals').optional().isArray(),
];

export const adsController = {
  async promotionPackages(_req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const packages = await getActivePromotionPackages();
      res.json(packages.map(publicPromotionPackage));
    } catch (err) {
      next(err);
    }
  },

  async list(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await adsService.list(req.query as any, req.user?.id);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  async getById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const ad = await adsService.findById(parseInt(req.params.id, 10), req.user?.id, req.user?.isAdmin);
      res.json(ad);
    } catch (err) {
      next(err);
    }
  },

  async create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }
    try {
      const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
      if (!user) throw new AppError(404, 'Utente non trovato');

      // Solo gli account Business possono scegliere la pubblicazione immediata (saltando
      // la moderazione) e aggiungere campi custom — replica AdsBusinessType vs AdsUserType.
      const isBusiness = !!user.isCompany;
      const { published, fields, vals, canBeOrdered, shippingAvailable, shippingCost, shippingNotes, availableQuantity, ...rest } = req.body;

      // Campi categoria-specifici (configurati da admin, per tutti) + custom (solo business)
      const resolvedFields = await resolveAdFields(parseInt(rest.categoryId, 10), fields, vals, isBusiness);

      const ad = await adsService.create({
        ...rest,
        userId: user.id,
        published: isBusiness && published === 1 ? 1 : 0,
        fields: resolvedFields.fields,
        vals: resolvedFields.vals,
        fieldPairs: resolvedFields.fieldPairs,
        // L'ordine diretto è aperto a tutti i venditori (marketplace utente-utente):
        // nel legacy era solo Business, ma `update` lo permetteva già a chiunque via
        // USER_EDITABLE_FIELDS — questa era un'incoerenza, non una regola.
        canBeOrdered: canBeOrdered === true,
        availableQuantity: normalizeAvailableQuantity(availableQuantity, isBusiness),
        sold: 0,
        // La spedizione è una scelta del venditore disponibile per tutti, non solo Business.
        shippingAvailable: shippingAvailable === true,
        shippingCost: shippingAvailable === true && shippingCost ? shippingCost : null,
        shippingNotes: shippingAvailable === true ? (shippingNotes ?? null) : null,
      });

      if (ad.published === 0) {
        const admins = await prisma.user.findMany({ where: { isAdmin: true }, select: { id: true, email: true } });
        await Promise.all(
          admins.map((admin) =>
            prisma.notification.create({ data: { userId: admin.id, type: NotificationType.AD_PENDING_REVIEW, object: ad.id } }),
          ),
        );
        await Promise.all(
          admins.map((admin) => mailService.sendAdPendingReview(admin.email, ad.name, ad.id).catch(() => {})),
        );
      }

      res.status(201).json(ad);
    } catch (err) {
      next(err);
    }
  },

  async update(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const isAdmin = !!req.user!.isAdmin;
      const data = isAdmin
        ? { ...req.body }
        : Object.fromEntries(
            Object.entries(req.body).filter(([key]) => (USER_EDITABLE_FIELDS as readonly string[]).includes(key)),
          );

      // Aggiornamento campi categoria-specifici: valida contro la config e
      // rigenera fieldPairs (mai accettato direttamente dal client)
      if (Array.isArray(req.body.fields) && Array.isArray(req.body.vals)) {
        const adId = parseInt(req.params.id, 10);
        const existing = await prisma.ad.findUnique({
          where: { id: adId },
          select: { categoryId: true, user: { select: { isCompany: true } } },
        });
        if (existing) {
          const categoryId = data.categoryId ? parseInt(String(data.categoryId), 10) : existing.categoryId;
          const resolved = await resolveAdFields(categoryId, req.body.fields, req.body.vals, !!existing.user.isCompany);
          data.fields = resolved.fields;
          data.vals = resolved.vals;
          data.fieldPairs = resolved.fieldPairs;
        }
      } else {
        delete data.fieldPairs;
      }

      if (data.availableQuantity !== undefined) {
        const adId = parseInt(req.params.id, 10);
        const existing = await prisma.ad.findUnique({
          where: { id: adId },
          select: { user: { select: { isCompany: true } } },
        });
        const availableQuantity = normalizeAvailableQuantity(data.availableQuantity, !!existing?.user.isCompany);
        data.availableQuantity = availableQuantity;
        data.sold = availableQuantity > 0 ? 0 : 1;
      }

      const ad = await adsService.update(parseInt(req.params.id, 10), req.user!.id, data, isAdmin);
      res.json(ad);
    } catch (err) {
      next(err);
    }
  },

  async delete(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      await adsService.delete(parseInt(req.params.id, 10), req.user!.id, req.user!.isAdmin);
      if (req.user!.isAdmin) {
        await logAdminAction(req.user!.id, AdminActionType.AD_DELETE);
      }
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  },

  async toggleWishlist(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await adsService.toggleWishlist(req.user!.id, parseInt(req.params.id, 10));
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  async listPhotos(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const adId = parseInt(req.params.id, 10);
      const ad = await prisma.ad.findUnique({ where: { id: adId } });
      if (!ad) throw new AppError(404, 'Annuncio non trovato');
      const photos = await prisma.photo.findMany({
        where: { adId },
        orderBy: { order: 'asc' },
      });
      res.json(photos);
    } catch (err) {
      next(err);
    }
  },

  async uploadPhotos(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const adId = parseInt(req.params.id, 10);
      const ad = await prisma.ad.findUnique({
        where: { id: adId },
        include: { user: { select: { email: true } } },
      });
      if (!ad) throw new AppError(404, 'Annuncio non trovato');
      if (!req.user!.isAdmin && ad.userId !== req.user!.id) throw new AppError(403, 'Non autorizzato');

      const files = req.files as Express.Multer.File[] | undefined;
      if (!files || files.length === 0) throw new AppError(400, 'Nessun file caricato');

      const existingCount = await prisma.photo.count({ where: { adId } });
      const photos = await Promise.all(
        files.map(async (file, idx) => {
          const key = generateS3Key(file.originalname, 'photos');
          const url = await storageService.upload(key, file.buffer, file.mimetype);
          return prisma.photo.create({
            data: { adId, url, order: existingCount + idx },
          });
        }),
      );
      res.status(201).json(photos);
    } catch (err) {
      next(err);
    }
  },

  async deletePhoto(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const adId = parseInt(req.params.id, 10);
      const photoId = parseInt(req.params.photoId, 10);
      const ad = await prisma.ad.findUnique({ where: { id: adId } });
      if (!ad) throw new AppError(404, 'Annuncio non trovato');
      if (!req.user!.isAdmin && ad.userId !== req.user!.id) throw new AppError(403, 'Non autorizzato');

      const photo = await prisma.photo.findUnique({ where: { id: photoId } });
      if (!photo || photo.adId !== adId) throw new AppError(404, 'Foto non trovata');

      await prisma.photo.delete({ where: { id: photoId } });
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  },

  async uploadVideo(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const adId = parseInt(req.params.id, 10);
      const ad = await prisma.ad.findUnique({ where: { id: adId } });
      if (!ad) throw new AppError(404, 'Annuncio non trovato');
      if (!req.user!.isAdmin && ad.userId !== req.user!.id) throw new AppError(403, 'Non autorizzato');

      if (!req.file) throw new AppError(400, 'File video richiesto');
      const key = generateS3Key(req.file.originalname, 'videos');
      const url = await storageService.upload(key, req.file.buffer, req.file.mimetype);

      const video = await prisma.video.create({
        data: { adId, userId: req.user!.id, filename: url, accepted: 0, uploaded: false },
      });

      // Notify all admins (type 10)
      const admins = await prisma.user.findMany({ where: { isAdmin: true }, select: { id: true } });
      await Promise.all(
        admins.map((admin) =>
          prisma.notification.create({ data: { userId: admin.id, type: NotificationType.VIDEO_PENDING_REVIEW, object: video.id } }),
        ),
      );

      res.status(201).json(video);
    } catch (err) {
      next(err);
    }
  },

  async trackClick(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const adId = parseInt(req.params.id, 10);
      const { type } = req.body;
      if (type !== 'call' && type !== 'message') {
        throw new AppError(400, 'Tipo click non valido (call o message)');
      }

      const ad = await prisma.ad.findUnique({
        where: { id: adId },
        include: { user: { select: { isCompany: true } } },
      });
      if (!ad) throw new AppError(404, 'Annuncio non trovato');

      const data = type === 'call'
        ? { callClicks: { increment: 1 } }
        : { messageClicks: { increment: 1 } };

      await prisma.ad.update({ where: { id: adId }, data });
      if (ad.user.isCompany) {
        await prisma.businessStat.create({
          data: { userId: ad.userId, adId, type: type === 'call' ? 2 : 3 },
        }).catch(() => {});
      }
      res.json({ tracked: true });
    } catch (err) {
      next(err);
    }
  },

  async promoteAd(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const adId = parseInt(req.params.id, 10);
      const ad = await prisma.ad.findUnique({ where: { id: adId } });
      if (!ad) throw new AppError(404, 'Annuncio non trovato');
      if (ad.userId !== req.user!.id) throw new AppError(403, 'Non autorizzato');

      const packageKey = String(req.body.packageKey ?? req.body.level ?? '').trim().toLowerCase();
      const promotionPackage = await resolvePromotionPackage(packageKey);
      if (!promotionPackage) throw new AppError(400, 'Pacchetto promozione non valido o non attivo');

      const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
      if (!user) throw new AppError(404, 'Utente non trovato');

      const objLevel = promotionPackage.level;
      if (![1, 2, 3].includes(objLevel)) throw new AppError(400, 'Livello pacchetto non valido');
      const creditField = creditFieldForType(promotionPackage.creditType);
      const promotionEndField = promotionFieldForLevel(objLevel);
      const userCredits = user[creditField];
      if (userCredits < promotionPackage.creditCost) {
        throw new AppError(400, `Crediti ${promotionPackage.creditType} insufficienti`);
      }

      const currentEndDate: Date | null = ad[promotionEndField];
      const base = currentEndDate && currentEndDate > new Date() ? currentEndDate : new Date();
      const endDate = new Date(base);
      endDate.setDate(endDate.getDate() + promotionPackage.durationDays);

      const updatedAd = await prisma.$transaction(async (tx) => {
        await tx.user.update({
          where: { id: req.user!.id },
          data: { [creditField]: { decrement: promotionPackage.creditCost } },
        });
        const promoted = await tx.ad.update({
          where: { id: adId },
          data: { objLevel, showcase: 1, [promotionEndField]: endDate },
        });
        await tx.promotionActivation.create({
          data: {
            packageId: promotionPackage.id ?? null,
            packageKey: promotionPackage.key,
            packageName: promotionPackage.name,
            adId,
            userId: req.user!.id,
            level: objLevel,
            creditType: promotionPackage.creditType,
            creditsSpent: promotionPackage.creditCost,
            priceEur: promotionPackage.priceEur,
            startedAt: base,
            endedAt: endDate,
            autoRenew: false,
          },
        });
        return promoted;
      });

      res.json(updatedAd);
    } catch (err) {
      next(err);
    }
  },

  async createOrder(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const adId = parseInt(req.params.id, 10);
      const ad = await prisma.ad.findUnique({
        where: { id: adId },
        include: { user: { select: { email: true, isCompany: true } } },
      });
      if (!ad) throw new AppError(404, 'Annuncio non trovato');
      if (ad.userId === req.user!.id) throw new AppError(400, 'Non puoi ordinare il tuo stesso annuncio');
      if (ad.sold === 1 || ad.availableQuantity < 1) throw new AppError(400, 'Annuncio già venduto o non disponibile');

      // Ordine da offerta accettata: prezzo congelato all'importo concordato e ordine
      // consentito anche su annunci senza canBeOrdered (il venditore, accettando
      // l'offerta, ha acconsentito alla vendita).
      let acceptedOffer: { id: number; amount: Prisma.Decimal; counterAmount: Prisma.Decimal | null } | null = null;
      if (req.body.offerId !== undefined) {
        const offerId = parseInt(req.body.offerId, 10);
        const offer = await prisma.adOffer.findUnique({ where: { id: offerId } });
        if (
          !offer ||
          offer.adId !== adId ||
          offer.buyerId !== req.user!.id ||
          offer.status !== OfferStatus.ACCEPTED ||
          offer.orderId !== null
        ) {
          throw new AppError(400, 'Offerta non valida o già utilizzata');
        }
        acceptedOffer = offer;
      } else if (!ad.canBeOrdered) {
        throw new AppError(400, 'Questo annuncio non può essere ordinato direttamente');
      }

      // Con un'offerta accettata la quantità è sempre 1 (il prezzo concordato è per l'oggetto).
      const qty = acceptedOffer ? 1 : parseInt(req.body.qty, 10) || 1;
      if (qty < 1) throw new AppError(400, 'Quantità non valida');
      if (!ad.user.isCompany && qty !== 1) throw new AppError(400, 'Gli annunci privati sono disponibili in un solo pezzo');
      if (qty > ad.availableQuantity) throw new AppError(400, 'Quantità non disponibile');

      const deliveryMethod = req.body.deliveryMethod === DeliveryMethod.SHIPPING ? DeliveryMethod.SHIPPING : DeliveryMethod.MEETUP;
      if (deliveryMethod === DeliveryMethod.SHIPPING && !ad.shippingAvailable) {
        throw new AppError(400, 'Questo annuncio non prevede spedizione');
      }

      const buyerName = String(req.body.buyerName ?? '').trim();
      const buyerPhone = String(req.body.buyerPhone ?? '').trim();
      const shippingAddress = String(req.body.shippingAddress ?? '').trim();
      const shippingCity = String(req.body.shippingCity ?? '').trim();
      const shippingPostalCode = String(req.body.shippingPostalCode ?? '').trim();
      const shippingProvince = String(req.body.shippingProvince ?? '').trim();
      const buyerNotes = String(req.body.buyerNotes ?? '').trim();

      if (deliveryMethod === DeliveryMethod.SHIPPING) {
        if (!buyerName || !buyerPhone || !shippingAddress || !shippingCity || !shippingPostalCode || !shippingProvince) {
          throw new AppError(400, 'Dati di spedizione incompleti');
        }
      }

      const unitPrice = acceptedOffer
        ? new Prisma.Decimal(acceptedOffer.counterAmount ?? acceptedOffer.amount)
        : new Prisma.Decimal(ad.price);
      const shippingAmount =
        deliveryMethod === DeliveryMethod.SHIPPING && ad.shippingCost
          ? new Prisma.Decimal(ad.shippingCost)
          : new Prisma.Decimal(0);
      const totalAmount = unitPrice.mul(qty).plus(shippingAmount);

      const order = await prisma.$transaction(async (tx) => {
        const reserved = await tx.ad.updateMany({
          where: { id: adId, sold: 0, availableQuantity: { gte: qty } },
          data: { availableQuantity: { decrement: qty } },
        });
        if (reserved.count !== 1) throw new AppError(400, 'Quantità non disponibile');

        const stock = await tx.ad.findUnique({
          where: { id: adId },
          select: { availableQuantity: true },
        });
        if (!stock || stock.availableQuantity <= 0) {
          await tx.ad.update({ where: { id: adId }, data: { sold: 1, availableQuantity: 0 } });
        }

        const createdOrder = await tx.adOrder.create({
          data: {
            adId,
            userId: req.user!.id,
            qty,
            status: OrderStatus.PENDING,
            paymentStatus: PaymentStatus.UNPAID,
            fulfillmentStatus: 'pending',
            currency: 'EUR',
            unitPrice,
            shippingAmount,
            totalAmount,
            deliveryMethod,
            buyerName: buyerName || null,
            buyerPhone: buyerPhone || null,
            shippingAddress: deliveryMethod === DeliveryMethod.SHIPPING ? shippingAddress : null,
            shippingCity: deliveryMethod === DeliveryMethod.SHIPPING ? shippingCity : null,
            shippingPostalCode: deliveryMethod === DeliveryMethod.SHIPPING ? shippingPostalCode : null,
            shippingProvince: deliveryMethod === DeliveryMethod.SHIPPING ? shippingProvince : null,
            buyerNotes: buyerNotes || null,
          },
          include: { ad: { select: { id: true, name: true, price: true, shippingAvailable: true, shippingCost: true } } },
        });

        if (acceptedOffer) {
          await tx.adOffer.update({ where: { id: acceptedOffer.id }, data: { orderId: createdOrder.id } });
        }

        return createdOrder;
      });

      // Notifica al venditore (type 13)
      await prisma.notification.create({ data: { userId: ad.userId, type: NotificationType.ORDER_UPDATE, object: order.id } });
      await mailService.sendMarketplaceOrderUpdate(
        ad.user.email,
        'Nuovo ordine ricevuto',
        ad.name,
        'Hai ricevuto una nuova richiesta d\'ordine.',
        order.id,
      ).catch(() => {});

      res.status(201).json(order);
    } catch (err) {
      next(err);
    }
  },

  async reportAd(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const adId = parseInt(req.params.id, 10);
      const ad = await prisma.ad.findUnique({ where: { id: adId }, select: { id: true, userId: true } });
      if (!ad) throw new AppError(404, 'Annuncio non trovato');
      if (ad.userId === req.user!.id) throw new AppError(400, 'Non puoi segnalare il tuo annuncio');

      const reason = String(req.body.reason ?? '').trim();
      const details = String(req.body.details ?? '').trim();
      if (!reason) throw new AppError(400, 'Motivo segnalazione richiesto');

      const report = await prisma.report.create({
        data: {
          reporterId: req.user!.id,
          targetAdId: ad.id,
          targetUserId: ad.userId,
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

  async submitReview(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const adId = parseInt(req.params.id, 10);
      const ad = await prisma.ad.findUnique({ where: { id: adId } });
      if (!ad) throw new AppError(404, 'Annuncio non trovato');

      const { rating, comment } = req.body;
      if (!rating || rating < 1 || rating > 5) throw new AppError(400, 'Rating deve essere tra 1 e 5');
      if (!comment) throw new AppError(400, 'Commento richiesto');

      const review = await prisma.review.create({
        data: {
          adId,
          userId: req.user!.id,
          rating: parseFloat(rating),
          comment,
          isPublished: false,
        },
      });

      // Notify ad owner (type 2)
      await prisma.notification.create({
        data: { userId: ad.userId, type: NotificationType.NEW_REVIEW, object: review.id },
      });

      res.status(201).json(review);
    } catch (err) {
      next(err);
    }
  },
};
