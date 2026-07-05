import { Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { AuthenticatedRequest } from '../types';
import { AppError } from '../middleware/error.middleware';
import { prisma } from '../lib/prisma';

const PROMOTION_LEVELS = {
  bronze: { level: 1, field: 'bronzePromotionEndDate' as const },
  silver: { level: 2, field: 'silverPromotionEndDate' as const },
  gold: { level: 3, field: 'goldPromotionEndDate' as const },
};

function promotionLevel(ad: {
  goldPromotionEndDate: Date | null;
  silverPromotionEndDate: Date | null;
  bronzePromotionEndDate: Date | null;
}, now: Date) {
  if (ad.goldPromotionEndDate && ad.goldPromotionEndDate >= now) return 'gold';
  if (ad.silverPromotionEndDate && ad.silverPromotionEndDate >= now) return 'silver';
  if (ad.bronzePromotionEndDate && ad.bronzePromotionEndDate >= now) return 'bronze';
  return 'none';
}

function earliestActiveExpiry(ad: {
  goldPromotionEndDate: Date | null;
  silverPromotionEndDate: Date | null;
  bronzePromotionEndDate: Date | null;
}, now: Date) {
  return [ad.goldPromotionEndDate, ad.silverPromotionEndDate, ad.bronzePromotionEndDate]
    .filter((date): date is Date => !!date && date >= now)
    .sort((a, b) => a.getTime() - b.getTime())[0] ?? null;
}

function packagePayload(body: Record<string, unknown>) {
  const key = String(body.key ?? '').trim().toLowerCase();
  const name = String(body.name ?? '').trim();
  const level = Number(body.level);
  const creditType = String(body.creditType ?? '').trim().toLowerCase();
  const creditCost = Number(body.creditCost ?? 1);
  const durationDays = Number(body.durationDays);
  const priceEur = new Prisma.Decimal(String(body.priceEur ?? '0').replace(',', '.'));
  const sortOrder = Number(body.sortOrder ?? 0);

  if (!/^[a-z0-9_-]{2,40}$/.test(key)) throw new AppError(400, 'Chiave pacchetto non valida');
  if (!name) throw new AppError(400, 'Nome pacchetto richiesto');
  if (![1, 2, 3].includes(level)) throw new AppError(400, 'Livello non valido');
  if (!['bronze', 'silver', 'gold'].includes(creditType)) throw new AppError(400, 'Tipo credito non valido');
  if (!Number.isInteger(creditCost) || creditCost < 1 || creditCost > 100) throw new AppError(400, 'Costo crediti non valido');
  if (!Number.isInteger(durationDays) || durationDays < 1 || durationDays > 365) throw new AppError(400, 'Durata non valida');
  if (priceEur.lt(0)) throw new AppError(400, 'Prezzo EUR non valido');
  if (!Number.isInteger(sortOrder)) throw new AppError(400, 'Ordinamento non valido');

  return {
    key,
    name,
    level,
    creditType,
    creditCost,
    durationDays,
    priceEur,
    autoRenewAvailable: Boolean(body.autoRenewAvailable),
    isActive: body.isActive === undefined ? true : Boolean(body.isActive),
    sortOrder,
  };
}

function serializePackage(pkg: {
  id: number;
  key: string;
  name: string;
  level: number;
  creditType: string;
  creditCost: number;
  durationDays: number;
  priceEur: Prisma.Decimal;
  autoRenewAvailable: boolean;
  isActive: boolean;
  sortOrder: number;
}) {
  return { ...pkg, priceEur: pkg.priceEur.toString() };
}

export const adminPromotionsController = {
  async overview(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const now = new Date();
      const soon = new Date(now.getTime() + 72 * 60 * 60 * 1000);
      const page = Math.max(1, parseInt((req.query.page as string) ?? '1', 10));
      const limit = Math.min(100, Math.max(1, parseInt((req.query.limit as string) ?? '30', 10)));
      const status = (req.query.status as string | undefined) ?? 'active';

      const activeWhere = {
        OR: [
          { goldPromotionEndDate: { gte: now } },
          { silverPromotionEndDate: { gte: now } },
          { bronzePromotionEndDate: { gte: now } },
        ],
      };
      const expiredWhere = {
        showcase: 0,
        OR: [
          { goldPromotionEndDate: { lt: now } },
          { silverPromotionEndDate: { lt: now } },
          { bronzePromotionEndDate: { lt: now } },
        ],
      };
      const where = status === 'expired' ? expiredWhere : activeWhere;

      const last30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const [activeTotal, goldActive, silverActive, bronzeActive, expiringSoon, rows, total, activationAgg, activationByPackage] = await Promise.all([
        prisma.ad.count({ where: activeWhere }),
        prisma.ad.count({ where: { goldPromotionEndDate: { gte: now } } }),
        prisma.ad.count({ where: { silverPromotionEndDate: { gte: now }, goldPromotionEndDate: null } }),
        prisma.ad.count({ where: { bronzePromotionEndDate: { gte: now }, goldPromotionEndDate: null, silverPromotionEndDate: null } }),
        prisma.ad.count({
          where: {
            OR: [
              { goldPromotionEndDate: { gte: now, lte: soon } },
              { silverPromotionEndDate: { gte: now, lte: soon } },
              { bronzePromotionEndDate: { gte: now, lte: soon } },
            ],
          },
        }),
        prisma.ad.findMany({
          where,
          orderBy: status === 'expired'
            ? [{ updateTime: 'desc' }]
            : [{ objLevel: 'desc' }, { creationTime: 'desc' }],
          skip: (page - 1) * limit,
          take: limit,
          select: {
            id: true,
            name: true,
            price: true,
            objLevel: true,
            showcase: true,
            views: true,
            callClicks: true,
            messageClicks: true,
            creationTime: true,
            updateTime: true,
            goldPromotionEndDate: true,
            silverPromotionEndDate: true,
            bronzePromotionEndDate: true,
            user: { select: { id: true, username: true, email: true } },
            category: { select: { name: true } },
            _count: { select: { wishlists: true, orders: true, offers: true } },
          },
        }),
        prisma.ad.count({ where }),
        prisma.promotionActivation.aggregate({
          where: { createdAt: { gte: last30 } },
          _sum: { priceEur: true, creditsSpent: true },
          _count: { id: true },
        }),
        prisma.promotionActivation.groupBy({
          by: ['packageKey', 'packageName'],
          where: { createdAt: { gte: last30 } },
          _sum: { priceEur: true, creditsSpent: true },
          _count: { id: true },
          orderBy: { _count: { id: 'desc' } },
          take: 10,
        }),
      ]);

      const ads = rows.map((ad) => ({
        ...ad,
        price: ad.price.toString(),
        currentLevel: promotionLevel(ad, now),
        activeUntil: earliestActiveExpiry(ad, now),
        contacts: ad.callClicks + ad.messageClicks,
      }));

      res.json({
        stats: {
          activeTotal,
          goldActive,
          silverActive,
          bronzeActive,
          expiringSoon,
          levels: PROMOTION_LEVELS,
          last30: {
            activations: activationAgg._count.id,
            revenueEur: activationAgg._sum.priceEur?.toString() ?? '0',
            creditsSpent: activationAgg._sum.creditsSpent ?? 0,
            byPackage: activationByPackage.map((row) => ({
              packageKey: row.packageKey,
              packageName: row.packageName,
              activations: row._count.id,
              revenueEur: row._sum.priceEur?.toString() ?? '0',
              creditsSpent: row._sum.creditsSpent ?? 0,
            })),
          },
        },
        ads,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      });
    } catch (err) {
      next(err);
    }
  },

  async listPackages(_req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const packages = await prisma.promotionPackage.findMany({
        orderBy: [{ sortOrder: 'asc' }, { level: 'asc' }],
      });
      res.json(packages.map(serializePackage));
    } catch (err) {
      next(err);
    }
  },

  async createPackage(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const data = packagePayload(req.body);
      const created = await prisma.promotionPackage.create({ data });
      res.status(201).json(serializePackage(created));
    } catch (err) {
      next(err);
    }
  },

  async updatePackage(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id, 10);
      const data = packagePayload(req.body);
      const updated = await prisma.promotionPackage.update({ where: { id }, data });
      res.json(serializePackage(updated));
    } catch (err) {
      next(err);
    }
  },

  async deletePackage(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id, 10);
      const activations = await prisma.promotionActivation.count({ where: { packageId: id } });
      if (activations > 0) {
        const disabled = await prisma.promotionPackage.update({ where: { id }, data: { isActive: false } });
        res.json({ disabled: true, package: serializePackage(disabled) });
        return;
      }
      await prisma.promotionPackage.delete({ where: { id } });
      res.json({ deleted: true });
    } catch (err) {
      next(err);
    }
  },
};
