import { Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { AuthenticatedRequest } from '../types';
import { AppError } from '../middleware/error.middleware';
import { prisma } from '../lib/prisma';

const BUSINESS_PACKAGE_MONTHS: Record<number, number> = {
  1: 1,
  2: 12,
};

function parsePackage(value: unknown): number {
  const pkg = parseInt(String(value), 10);
  if (!BUSINESS_PACKAGE_MONTHS[pkg]) {
    throw new AppError(400, 'Pacchetto Business non valido');
  }
  return pkg;
}

function requireText(value: unknown, field: string): string {
  const text = String(value ?? '').trim();
  if (!text) throw new AppError(400, `${field} richiesto`);
  return text;
}

export const businessController = {
  async getMe(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const latestRequest = await prisma.businessRequest.findFirst({
        where: { userId: req.user!.id },
        orderBy: { requestDate: 'desc' },
      });
      res.json({ latestRequest });
    } catch (err) {
      next(err);
    }
  },

  async createRequest(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const existingPending = await prisma.businessRequest.findFirst({
        where: { userId: req.user!.id, status: 0 },
      });
      if (existingPending) {
        throw new AppError(409, 'Hai già una richiesta Business in attesa di verifica');
      }

      const pkg = parsePackage(req.body.package);
      const request = await prisma.businessRequest.create({
        data: {
          userId: req.user!.id,
          package: pkg,
          opt1: !!req.body.opt1,
          opt2: !!req.body.opt2,
          opt3: !!req.body.opt3,
          opt4: !!req.body.opt4,
          opt5: !!req.body.opt5,
          opt6: !!req.body.opt6,
          opt7: !!req.body.opt7,
          opt8: !!req.body.opt8,
          opt9: !!req.body.opt9,
          opt10: !!req.body.opt10,
          legalName: requireText(req.body.legalName, 'Ragione sociale'),
          vatNumber: requireText(req.body.vatNumber, 'Partita IVA'),
          contactName: requireText(req.body.contactName, 'Nome contatto'),
          contactSurname: requireText(req.body.contactSurname, 'Cognome contatto'),
          contactPhone: requireText(req.body.contactPhone, 'Telefono contatto'),
          contactEmail: requireText(req.body.contactEmail, 'Email contatto'),
        },
      });

      res.status(201).json(request);
    } catch (err) {
      next(err);
    }
  },

  async dashboard(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user!.id },
        select: { id: true, isCompany: true, businessEnd: true },
      });
      if (!user?.isCompany) throw new AppError(403, 'Dashboard riservata agli account Business');

      const since = new Date();
      since.setMonth(since.getMonth() - 11);
      since.setDate(1);
      since.setHours(0, 0, 0, 0);

      const [ads, totals, recentStats, latestRequest] = await Promise.all([
        prisma.ad.findMany({
          where: { userId: req.user!.id },
          select: {
            id: true,
            name: true,
            published: true,
            views: true,
            callClicks: true,
            messageClicks: true,
            creationTime: true,
          },
          orderBy: { creationTime: 'desc' },
          take: 10,
        }),
        prisma.ad.aggregate({
          where: { userId: req.user!.id },
          _count: { id: true },
          _sum: { views: true, callClicks: true, messageClicks: true },
        }),
        prisma.businessStat.findMany({
          where: { userId: req.user!.id, datetime: { gte: since } },
          select: { datetime: true, type: true },
        }),
        prisma.businessRequest.findFirst({
          where: { userId: req.user!.id },
          orderBy: { requestDate: 'desc' },
        }),
      ]);

      const monthly = new Map<string, { month: string; views: number; calls: number; messages: number }>();
      for (let i = 11; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const month = date.toISOString().slice(0, 7);
        monthly.set(month, { month, views: 0, calls: 0, messages: 0 });
      }

      for (const stat of recentStats) {
        const month = stat.datetime.toISOString().slice(0, 7);
        const row = monthly.get(month);
        if (!row) continue;
        if (stat.type === 1) row.views++;
        if (stat.type === 2) row.calls++;
        if (stat.type === 3) row.messages++;
      }

      res.json({
        businessEnd: user.businessEnd,
        latestRequest,
        stats: {
          ads: totals._count.id,
          views: totals._sum.views ?? 0,
          callClicks: totals._sum.callClicks ?? 0,
          messageClicks: totals._sum.messageClicks ?? 0,
        },
        recentAds: ads,
        monthly: Array.from(monthly.values()),
      });
    } catch (err) {
      next(err);
    }
  },
};

export function businessEndForPackage(pkg: number, from = new Date()): Date {
  const months = BUSINESS_PACKAGE_MONTHS[pkg];
  if (!months) throw new AppError(400, 'Pacchetto Business non valido');
  const end = new Date(from);
  end.setMonth(end.getMonth() + months);
  return end;
}

export function businessPackagePrice(pkg: number): Prisma.Decimal {
  return new Prisma.Decimal(pkg === 2 ? '199.99' : '19.99');
}
