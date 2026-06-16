import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { AppError } from '../middleware/error.middleware';
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

  async updateAd(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id, 10);
      const { published, sold, objLevel } = req.body;
      const data: Record<string, unknown> = {};
      if (published !== undefined) data.published = published;
      if (sold !== undefined) data.sold = sold;
      if (objLevel !== undefined) data.objLevel = objLevel;
      const ad = await prisma.ad.update({ where: { id }, data });
      res.json(ad);
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

  async listVideos(_req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const videos = await prisma.video.findMany({
        where: { accepted: 0 },
        include: {
          ad: { select: { id: true, name: true } },
          user: { select: { id: true, username: true } },
        },
        orderBy: { id: 'desc' },
      });
      res.json(videos);
    } catch (err) {
      next(err);
    }
  },

  async updateVideo(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id, 10);
      const { accepted } = req.body;
      if (accepted !== 0 && accepted !== 1) throw new AppError(400, 'Valore accepted non valido (0 o 1)');

      const video = await prisma.video.findUnique({ where: { id }, include: { ad: { select: { userId: true } } } });
      if (!video) throw new AppError(404, 'Video non trovato');

      const updatedVideo = await prisma.video.update({ where: { id }, data: { accepted } });

      if (accepted === 1) {
        // Publish ad and notify owner (type 3)
        await prisma.ad.update({ where: { id: video.adId }, data: { published: 1 } });
        await prisma.notification.create({ data: { userId: video.ad.userId, type: 3, object: video.id } });
      } else {
        // Notify owner of rejection (type 4)
        await prisma.notification.create({ data: { userId: video.ad.userId, type: 4, object: video.id } });
      }

      res.json(updatedVideo);
    } catch (err) {
      next(err);
    }
  },

  async listReviews(_req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const reviews = await prisma.review.findMany({
        where: { isPublished: false },
        include: {
          ad: { select: { id: true, name: true } },
          user: { select: { id: true, username: true } },
        },
        orderBy: { datetime: 'desc' },
      });
      res.json(reviews);
    } catch (err) {
      next(err);
    }
  },

  async updateReview(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id, 10);
      const { isPublished } = req.body;

      const review = await prisma.review.findUnique({ where: { id } });
      if (!review) throw new AppError(404, 'Recensione non trovata');

      const updatedReview = await prisma.review.update({ where: { id }, data: { isPublished } });

      if (isPublished) {
        await prisma.ad.update({ where: { id: review.adId }, data: { hasReviews: true } });
      }

      res.json(updatedReview);
    } catch (err) {
      next(err);
    }
  },

  async updateHelpDesk(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id, 10);
      const { closed, assignedTo } = req.body;

      const ticket = await prisma.helpDesk.findUnique({ where: { id } });
      if (!ticket) throw new AppError(404, 'Ticket non trovato');

      const data: { closed?: boolean; assignedTo?: number | null } = {};
      if (closed !== undefined) data.closed = closed;
      if (assignedTo !== undefined) data.assignedTo = assignedTo;

      const updatedTicket = await prisma.helpDesk.update({ where: { id }, data });
      res.json(updatedTicket);
    } catch (err) {
      next(err);
    }
  },

  async replyHelpDesk(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const ticketId = parseInt(req.params.id, 10);
      const ticket = await prisma.helpDesk.findUnique({ where: { id: ticketId } });
      if (!ticket) throw new AppError(404, 'Ticket non trovato');

      const { message } = req.body;
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

      // Notify ticket owner (type 6)
      await prisma.notification.create({ data: { userId: ticket.userId, type: 6, object: reply.id } });

      res.status(201).json(reply);
    } catch (err) {
      next(err);
    }
  },
};
