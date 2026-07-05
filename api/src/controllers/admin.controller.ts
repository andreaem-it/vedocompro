import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { AppError } from '../middleware/error.middleware';
import { mailService } from '../services/mail.service';
import { NotificationType } from '../constants/notifications';
import { AdminActionType } from '../constants/adminActions';
import { logAdminAction } from '../services/auditLog.service';
import { businessEndForPackage } from './business.controller';
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

  // KPI marketplace su finestra temporale: periodo corrente + precedente per i delta
  async getKpi(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const days = Math.min(365, Math.max(1, parseInt((req.query.days as string) ?? '30', 10)));
      const now = new Date();
      const currentStart = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
      const previousStart = new Date(currentStart.getTime() - days * 24 * 60 * 60 * 1000);

      const buildPeriod = async (from: Date, to: Date) => {
        const [newUsers, newAds, ordersCreated, ordersCompleted, gmv, promoPayments, messages, offers] =
          await Promise.all([
            prisma.user.count({ where: { createdAt: { gte: from, lt: to } } }),
            prisma.ad.count({ where: { creationTime: { gte: from, lt: to }, published: 1 } }),
            prisma.adOrder.count({ where: { orderDate: { gte: from, lt: to } } }),
            prisma.adOrder.count({ where: { completedAt: { gte: from, lt: to } } }),
            prisma.adOrder.aggregate({
              where: { completedAt: { gte: from, lt: to } },
              _sum: { totalAmount: true },
            }),
            prisma.payment.aggregate({
              where: { timestamp: { gte: from, lt: to } },
              _sum: { price: true },
              _count: true,
            }),
            prisma.message.count({ where: { datetime: { gte: from, lt: to } } }),
            prisma.adOffer.count({ where: { createdAt: { gte: from, lt: to } } }),
          ]);

        return {
          newUsers,
          newAds,
          ordersCreated,
          ordersCompleted,
          gmv: gmv._sum.totalAmount ?? 0,
          promoRevenue: promoPayments._sum.price ?? 0,
          promoCount: promoPayments._count,
          messages,
          offers,
          orderConversionPercent:
            ordersCreated > 0 ? Math.round((ordersCompleted / ordersCreated) * 1000) / 10 : null,
        };
      };

      const [current, previous] = await Promise.all([
        buildPeriod(currentStart, now),
        buildPeriod(previousStart, currentStart),
      ]);

      res.json({ days, current, previous });
    } catch (err) {
      next(err);
    }
  },

  async getSystemInfo(_req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const db = await prisma.$queryRaw<Array<{ version: string }>>`SELECT version()`;
      res.json({
        app: {
          nodeEnv: process.env.NODE_ENV ?? 'development',
          nodeVersion: process.version,
          platform: process.platform,
          uptimeSeconds: Math.round(process.uptime()),
        },
        upload: {
          jsonLimit: '10mb',
          imageMaxSize: '10MB',
          videoMaxSize: '200MB',
        },
        services: {
          database: db[0]?.version ?? 'connected',
          mailConfigured: !!process.env.MAIL_HOST && !!process.env.MAIL_FROM,
          storageConfigured: !!process.env.AWS_S3_BUCKET,
          recaptchaConfigured: !!process.env.RECAPTCHA_SECRET,
          cronProtected: !!process.env.CRON_SECRET,
        },
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
          select: { id: true, email: true, username: true, name: true, phoneVerified: true, phoneVerifiedAt: true, isAdmin: true, isActive: true, createdAt: true, creditsGold: true, creditsSilver: true, creditsBronze: true, businessEnd: true },
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

  async getUser(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id, 10);
      const user = await prisma.user.findUnique({
        where: { id },
        select: {
          id: true, email: true, username: true, name: true, realname: true,
          phone: true, phoneVerified: true, phoneVerifiedAt: true,
          address: true, city: true, cap: true, pic: true, points: true,
          creditsGold: true, creditsSilver: true, creditsBronze: true,
          isCompany: true, companyLogo: true, companyWebsite: true, businessEnd: true,
          isActive: true, isAdmin: true, dateJoin: true, createdAt: true,
          _count: { select: { ads: true, adOrders: true, reportsReceived: true, helpDeskTickets: true } },
        },
      });
      if (!user) throw new AppError(404, 'Utente non trovato');
      res.json(user);
    } catch (err) {
      next(err);
    }
  },

  async updateUser(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id, 10);

      // Whitelist esplicita: il body non va mai passato grezzo a Prisma (un campo
      // sconosciuto o una relazione farebbero fallire l'update, e non tutti i campi
      // hanno senso editabili da admin — es. password, token, codici di verifica).
      const b = req.body;
      const data: Record<string, unknown> = {};
      if (b.name !== undefined) data.name = String(b.name);
      if (b.realname !== undefined) data.realname = String(b.realname);
      if (b.email !== undefined) data.email = String(b.email).trim().toLowerCase();
      if (b.username !== undefined) data.username = String(b.username).trim();
      if (b.phone !== undefined) data.phone = String(b.phone);
      if (b.address !== undefined) data.address = String(b.address);
      if (b.city !== undefined) data.city = String(b.city);
      if (b.cap !== undefined) data.cap = String(b.cap);
      if (b.isActive !== undefined) data.isActive = b.isActive === true;
      if (b.isAdmin !== undefined) data.isAdmin = b.isAdmin === true;
      if (b.phoneVerified !== undefined) data.phoneVerified = b.phoneVerified === true;
      if (b.isCompany !== undefined) data.isCompany = b.isCompany ? 1 : null;
      if (b.businessEnd !== undefined) data.businessEnd = b.businessEnd ? new Date(b.businessEnd) : null;
      if (b.creditsGold !== undefined) data.creditsGold = Math.max(0, parseInt(b.creditsGold, 10) || 0);
      if (b.creditsSilver !== undefined) data.creditsSilver = Math.max(0, parseInt(b.creditsSilver, 10) || 0);
      if (b.creditsBronze !== undefined) data.creditsBronze = Math.max(0, parseInt(b.creditsBronze, 10) || 0);
      if (b.points !== undefined) data.points = parseInt(b.points, 10) || 0;
      if (Object.keys(data).length === 0) throw new AppError(400, 'Nessun campo da aggiornare');

      const existing = await prisma.user.findUnique({ where: { id }, select: { isActive: true } });
      if (!existing) throw new AppError(404, 'Utente non trovato');

      const user = await prisma.user.update({
        where: { id },
        data,
        select: { id: true, email: true, username: true, phoneVerified: true, isAdmin: true, isActive: true },
      });

      if (data.isActive !== undefined && data.isActive !== existing.isActive) {
        await logAdminAction(req.user!.id, data.isActive ? AdminActionType.USER_ACTIVATE : AdminActionType.USER_DEACTIVATE);
      }

      res.json(user);
    } catch (err) {
      // Violazione unique su email/username → messaggio leggibile invece di un 500
      if ((err as { code?: string }).code === 'P2002') {
        next(new AppError(400, 'Email o username già in uso da un altro utente'));
        return;
      }
      next(err);
    }
  },

  async deleteUser(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      await prisma.user.delete({ where: { id: parseInt(req.params.id, 10) } });
      await logAdminAction(req.user!.id, AdminActionType.USER_DELETE);
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

  async getAd(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id, 10);
      const ad = await prisma.ad.findUnique({
        where: { id },
        include: {
          category: { select: { id: true, name: true } },
          user: { select: { id: true, username: true, email: true } },
          photos: { select: { id: true, url: true, order: true }, orderBy: { order: 'asc' } },
        },
      });
      if (!ad) throw new AppError(404, 'Annuncio non trovato');
      res.json(ad);
    } catch (err) {
      next(err);
    }
  },

  async updateAd(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id, 10);
      const { published, sold, objLevel, name, price, description, categoryId, region, location, provincia, objCondition } = req.body;
      const data: Record<string, unknown> = {};
      if (published !== undefined) data.published = published;
      if (sold !== undefined) data.sold = sold;
      if (objLevel !== undefined) data.objLevel = objLevel;
      if (name !== undefined) data.name = name;
      if (price !== undefined) data.price = price;
      if (description !== undefined) data.description = description;
      if (categoryId !== undefined) data.categoryId = categoryId;
      if (region !== undefined) data.region = region;
      if (location !== undefined) data.location = location;
      if (provincia !== undefined) data.provincia = provincia;
      if (objCondition !== undefined) data.objCondition = objCondition;

      const existing = await prisma.ad.findUnique({
        where: { id },
        include: { user: { select: { id: true, email: true } } },
      });
      if (!existing) throw new AppError(404, 'Annuncio non trovato');

      const ad = await prisma.ad.update({ where: { id }, data });

      // Notifica/email all'utente su approvazione o rifiuto in moderazione (admin_ad_activate/deactivate legacy)
      if (published !== undefined && published !== existing.published) {
        if (published === 1) {
          await prisma.notification.create({ data: { userId: existing.user.id, type: NotificationType.AD_APPROVED, object: id } });
          await mailService.sendAdApproved(existing.user.email, existing.name, id).catch(() => {});
          await logAdminAction(req.user!.id, AdminActionType.AD_ACTIVATE);
        } else {
          await prisma.notification.create({ data: { userId: existing.user.id, type: NotificationType.AD_REJECTED, object: id } });
          await mailService.sendAdRejected(existing.user.email, existing.name).catch(() => {});
          await logAdminAction(req.user!.id, AdminActionType.AD_REJECT);
        }
      }

      res.json(ad);
    } catch (err) {
      next(err);
    }
  },

  async listHelpDesk(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      // 3 vassoi come il legacy (admin_helpdesk/{show}): aperti (0, default) / chiusi (1) / assegnati (2)
      const status = req.query.status !== undefined ? parseInt(req.query.status as string, 10) : 0;
      const tickets = await prisma.helpDesk.findMany({
        where: { isReply: false, closed: status },
        include: { user: { select: { id: true, username: true, email: true } } },
        orderBy: { timest: 'desc' },
      });

      const ticketsWithReplies = await Promise.all(
        tickets.map(async (ticket) => {
          const replies = await prisma.helpDesk.findMany({
            where: { isReply: true, parentM: ticket.id },
            include: { user: { select: { id: true, username: true, email: true, isAdmin: true } } },
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

  async listPaymentWebhookLogs(_req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const logs = await prisma.paymentWebhookLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 50,
      });
      res.json(logs);
    } catch (err) {
      next(err);
    }
  },

  async listReports(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const status = (req.query.status as string | undefined) ?? 'open';
      const where = status === 'all' ? {} : { status };
      const reports = await prisma.report.findMany({
        where,
        include: {
          reporter: { select: { id: true, username: true, email: true } },
          targetUser: { select: { id: true, username: true, email: true, isActive: true } },
          targetAd: { select: { id: true, name: true, published: true } },
          reviewedByUser: { select: { id: true, username: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 200,
      });
      res.json(reports);
    } catch (err) {
      next(err);
    }
  },

  async updateReport(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id, 10);
      const status = String(req.body.status ?? '').trim();
      const adminNotes = String(req.body.adminNotes ?? '').trim();
      if (!['open', 'reviewing', 'resolved', 'dismissed'].includes(status)) {
        throw new AppError(400, 'Stato segnalazione non valido');
      }

      const existing = await prisma.report.findUnique({ where: { id } });
      if (!existing) throw new AppError(404, 'Segnalazione non trovata');

      const report = await prisma.report.update({
        where: { id },
        data: {
          status,
          adminNotes: adminNotes || null,
          reviewedAt: ['resolved', 'dismissed'].includes(status) ? new Date() : null,
          reviewedBy: ['resolved', 'dismissed'].includes(status) ? req.user!.id : null,
        },
      });

      if (status === 'resolved') await logAdminAction(req.user!.id, AdminActionType.REPORT_RESOLVE);
      if (status === 'dismissed') await logAdminAction(req.user!.id, AdminActionType.REPORT_DISMISS);

      res.json(report);
    } catch (err) {
      next(err);
    }
  },

  async listBusinessRequests(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const page = Math.max(1, parseInt((req.query.page as string) ?? '1', 10));
      const limit = Math.min(100, parseInt((req.query.limit as string) ?? '50', 10));
      const status = req.query.status !== undefined ? parseInt(req.query.status as string, 10) : undefined;
      const where = status !== undefined ? { status } : {};

      const [requests, total] = await Promise.all([
        prisma.businessRequest.findMany({
          where,
          include: {
            user: { select: { id: true, username: true, email: true, isCompany: true, businessEnd: true } },
          },
          orderBy: { requestDate: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
        }),
        prisma.businessRequest.count({ where }),
      ]);

      res.json({ requests, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
    } catch (err) {
      next(err);
    }
  },

  async updateBusinessRequest(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id, 10);
      const { status, adminNotes } = req.body as { status?: number; adminNotes?: string };
      if (status !== 1 && status !== 2) {
        throw new AppError(400, 'Stato non valido (1=approvata, 2=rifiutata)');
      }

      const request = await prisma.businessRequest.findUnique({
        where: { id },
        include: { user: { select: { id: true, email: true, businessEnd: true } } },
      });
      if (!request) throw new AppError(404, 'Richiesta Business non trovata');
      if (request.status !== 0) throw new AppError(400, 'Richiesta già revisionata');

      const updated = await prisma.$transaction(async (tx) => {
        const reviewed = await tx.businessRequest.update({
          where: { id },
          data: {
            status,
            paid: status === 1,
            reviewedAt: new Date(),
            reviewedBy: req.user!.id,
            adminNotes: adminNotes?.trim() || null,
          },
          include: { user: { select: { id: true, username: true, email: true, isCompany: true, businessEnd: true } } },
        });

        if (status === 1) {
          const base = request.user.businessEnd && request.user.businessEnd > new Date()
            ? request.user.businessEnd
            : new Date();
          await tx.user.update({
            where: { id: request.userId },
            data: { isCompany: 1, businessEnd: businessEndForPackage(request.package, base) },
          });
          await tx.notification.create({
            data: { userId: request.userId, type: NotificationType.BUSINESS_APPROVED, object: request.id },
          });
        } else {
          await tx.notification.create({
            data: { userId: request.userId, type: NotificationType.BUSINESS_REJECTED, object: request.id },
          });
        }

        return reviewed;
      });

      await logAdminAction(
        req.user!.id,
        status === 1 ? AdminActionType.BUSINESS_APPROVE : AdminActionType.BUSINESS_REJECT,
      );

      res.json(updated);
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
        await prisma.ad.update({ where: { id: video.adId }, data: { published: 1 } });
        await prisma.notification.create({ data: { userId: video.ad.userId, type: NotificationType.AD_APPROVED, object: video.id } });
        await logAdminAction(req.user!.id, AdminActionType.VIDEO_ACCEPT);
      } else {
        await prisma.notification.create({ data: { userId: video.ad.userId, type: NotificationType.AD_REJECTED, object: video.id } });
        await logAdminAction(req.user!.id, AdminActionType.VIDEO_REJECT);
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
        await logAdminAction(req.user!.id, AdminActionType.REVIEW_PUBLISH);
      } else {
        await logAdminAction(req.user!.id, AdminActionType.REVIEW_REJECT);
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
      if (closed !== undefined && ![0, 1, 2].includes(closed)) {
        throw new AppError(400, 'Stato non valido (0=aperto, 1=chiuso, 2=assegnato)');
      }

      const ticket = await prisma.helpDesk.findUnique({ where: { id } });
      if (!ticket) throw new AppError(404, 'Ticket non trovato');
      if (ticket.isReply) throw new AppError(400, 'Operazione consentita solo sul ticket principale');

      const data: { closed?: number; assignedTo?: number | null } = {};
      if (closed !== undefined) data.closed = closed;
      if (assignedTo !== undefined) data.assignedTo = assignedTo;
      if (closed === 2 && assignedTo === undefined) data.assignedTo = req.user!.id;
      if (closed === 0 && assignedTo === undefined) data.assignedTo = null;

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
      if (ticket.isReply) throw new AppError(400, 'Operazione consentita solo sul ticket principale');
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

      await prisma.notification.create({ data: { userId: ticket.userId, type: NotificationType.HELPDESK_REPLY, object: reply.id } });

      res.status(201).json(reply);
    } catch (err) {
      next(err);
    }
  },

  async listActions(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const page = Math.max(1, parseInt((req.query.page as string) ?? '1', 10));
      const limit = Math.min(100, parseInt((req.query.limit as string) ?? '50', 10));

      const [actions, total] = await Promise.all([
        prisma.adminAction.findMany({
          include: { user: { select: { id: true, username: true } } },
          orderBy: { linedate: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
        }),
        prisma.adminAction.count(),
      ]);

      res.json({ actions, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
    } catch (err) {
      next(err);
    }
  },
};
