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
};
