import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { prisma } from '../lib/prisma';

export const adminController = {
  async getStats(_req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const [users, ads, messages, payments] = await Promise.all([
        prisma.user.count(),
        prisma.ad.count(),
        prisma.message.count(),
        prisma.payment.aggregate({ _sum: { price: true }, _count: true }),
      ]);

      const recentUsers = await prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { id: true, username: true, email: true, createdAt: true, isAdmin: true },
      });

      const recentAds = await prisma.ad.findMany({
        orderBy: { creationTime: 'desc' },
        take: 5,
        select: { id: true, name: true, price: true, published: true, creationTime: true, user: { select: { username: true } } },
      });

      res.json({
        stats: {
          users,
          ads,
          messages,
          totalRevenue: payments._sum.price ?? 0,
          totalPayments: payments._count,
        },
        recentUsers,
        recentAds,
      });
    } catch (err) {
      next(err);
    }
  },

  async listUsers(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const page = Math.max(1, parseInt((req.query.page as string) ?? '1', 10));
      const limit = Math.min(100, parseInt((req.query.limit as string) ?? '50', 10));
      const q = req.query.q as string | undefined;

      const where = q
        ? { OR: [{ email: { contains: q, mode: 'insensitive' as const } }, { username: { contains: q, mode: 'insensitive' as const } }] }
        : {};

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          select: { id: true, email: true, username: true, name: true, isAdmin: true, isActive: true, createdAt: true, creditsGold: true, creditsSilver: true, creditsBronze: true, businessEnd: true },
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
        }),
        prisma.user.count({ where }),
      ]);

      res.json({ users, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
    } catch (err) {
      next(err);
    }
  },

  async updateUser(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id, 10);
      const { password, ...data } = req.body;
      const user = await prisma.user.update({
        where: { id },
        data,
        select: { id: true, email: true, username: true, isAdmin: true, isActive: true },
      });
      res.json(user);
    } catch (err) {
      next(err);
    }
  },

  async deleteUser(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      await prisma.user.delete({ where: { id: parseInt(req.params.id, 10) } });
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  },

  async listAds(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const page = Math.max(1, parseInt((req.query.page as string) ?? '1', 10));
      const limit = Math.min(100, parseInt((req.query.limit as string) ?? '50', 10));
      const published = req.query.published !== undefined ? parseInt(req.query.published as string, 10) : undefined;

      const where = published !== undefined ? { published } : {};

      const [ads, total] = await Promise.all([
        prisma.ad.findMany({
          where,
          select: { id: true, name: true, price: true, published: true, sold: true, creationTime: true, user: { select: { id: true, username: true } }, category: { select: { name: true } } },
          orderBy: { creationTime: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
        }),
        prisma.ad.count({ where }),
      ]);

      res.json({ ads, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
    } catch (err) {
      next(err);
    }
  },

  async listHelpDesk(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tickets = await prisma.helpDesk.findMany({
        where: { isReply: false },
        include: { user: { select: { id: true, username: true, email: true } } },
        orderBy: { timest: 'desc' },
      });
      res.json(tickets);
    } catch (err) {
      next(err);
    }
  },

  async listPayments(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const payments = await prisma.payment.findMany({
        include: {
          user: { select: { id: true, username: true, email: true } },
          product: { select: { name: true, price: true } },
        },
        orderBy: { timestamp: 'desc' },
        take: 100,
      });
      res.json(payments);
    } catch (err) {
      next(err);
    }
  },
};
