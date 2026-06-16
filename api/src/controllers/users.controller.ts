import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { AppError } from '../middleware/error.middleware';
import { adsService } from '../services/ads.service';
import { storageService } from '../services/storage.service';
import { generateS3Key } from '../middleware/upload.middleware';
import { hashPassword, verifyPassword } from '../utils/password';
import { prisma } from '../lib/prisma';

const SAFE_USER = {
  id: true,
  email: true,
  username: true,
  name: true,
  realname: true,
  phone: true,
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
  isAdmin: true,
} as const;

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
          id: true, vote: true, description: true, positive: true, datetime: true,
          fromUser: { select: { id: true, username: true, pic: true } },
        },
        orderBy: { datetime: 'desc' },
        take: 10,
      });

      res.json({ ...user, ads, feedbackReceived });
    } catch (err) {
      next(err);
    }
  },

  async getMe(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user!.id },
        select: {
          ...SAFE_USER,
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
      const { password, email, isAdmin, ...allowed } = req.body;
      const user = await prisma.user.update({
        where: { id: req.user!.id },
        data: allowed,
        select: SAFE_USER,
      });
      res.json(user);
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
      const { toUserId, message, adId } = req.body;
      const msg = await prisma.message.create({
        data: { fromUserId: req.user!.id, toUserId, message, adId },
        include: {
          fromUser: { select: { id: true, username: true, pic: true } },
          ad: { select: { id: true, name: true } },
        },
      });

      await prisma.notification.create({
        data: { userId: toUserId, type: 1, object: msg.id },
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
          id: true, vote: true, description: true, positive: true, datetime: true,
          fromUser: { select: { id: true, username: true, pic: true } },
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
      if (!vote || vote < 1 || vote > 5) throw new AppError(400, 'Voto deve essere tra 1 e 5');
      if (positive !== 0 && positive !== 1) throw new AppError(400, 'Positive deve essere 0 o 1');

      const feedback = await prisma.feedback.create({
        data: { userId: recipientId, fromUserId: req.user!.id, vote, description, positive },
      });

      // Notify recipient (type 5)
      await prisma.notification.create({ data: { userId: recipientId, type: 5, object: feedback.id } });

      // Update user points
      const pointsDelta = positive === 1 ? 1 : -1;
      const newPoints = Math.max(0, recipient.points + pointsDelta);
      await prisma.user.update({ where: { id: recipientId }, data: { points: newPoints } });

      res.status(201).json(feedback);
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
      const { type, title, message } = req.body;
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

      const { message } = req.body;
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

      // Notify ticket owner (type 12)
      await prisma.notification.create({ data: { userId: ticket.userId, type: 12, object: reply.id } });

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
        include: { ad: { select: { id: true, name: true, price: true } } },
        orderBy: { id: 'desc' },
      });
      res.json(sells);
    } catch (err) {
      next(err);
    }
  },
};
