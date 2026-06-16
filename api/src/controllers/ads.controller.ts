import { Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { adsService } from '../services/ads.service';
import { AuthenticatedRequest } from '../types';
import { AppError } from '../middleware/error.middleware';
import { storageService } from '../services/storage.service';
import { generateS3Key } from '../middleware/upload.middleware';
import { prisma } from '../lib/prisma';

export const createAdValidation = [
  body('name').isLength({ min: 3, max: 100 }),
  body('price').isDecimal({ decimal_digits: '0,2' }),
  body('description').isLength({ min: 10 }),
  body('categoryId').isInt({ min: 1 }),
  body('region').notEmpty(),
  body('location').notEmpty(),
  body('provincia').notEmpty(),
  body('objCondition').isIn(['new', 'like_new', 'good', 'acceptable', 'for_parts']),
];

export const adsController = {
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
      const ad = await adsService.findById(parseInt(req.params.id, 10), req.user?.id);
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
      const ad = await adsService.create({ ...req.body, userId: req.user!.id, published: 1 });
      res.status(201).json(ad);
    } catch (err) {
      next(err);
    }
  },

  async update(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const ad = await adsService.update(
        parseInt(req.params.id, 10),
        req.user!.id,
        req.body,
        req.user!.isAdmin,
      );
      res.json(ad);
    } catch (err) {
      next(err);
    }
  },

  async delete(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      await adsService.delete(parseInt(req.params.id, 10), req.user!.id, req.user!.isAdmin);
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
      const ad = await prisma.ad.findUnique({ where: { id: adId } });
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
          prisma.notification.create({ data: { userId: admin.id, type: 10, object: video.id } }),
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

      const ad = await prisma.ad.findUnique({ where: { id: adId } });
      if (!ad) throw new AppError(404, 'Annuncio non trovato');

      const data = type === 'call'
        ? { callClicks: { increment: 1 } }
        : { messageClicks: { increment: 1 } };

      await prisma.ad.update({ where: { id: adId }, data });
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

      const { level } = req.body;
      if (!['gold', 'silver', 'bronze'].includes(level)) {
        throw new AppError(400, 'Livello promozione non valido (gold, silver, bronze)');
      }

      const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
      if (!user) throw new AppError(404, 'Utente non trovato');

      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 30);

      let objLevel: number;
      let creditField: 'creditsGold' | 'creditsSilver' | 'creditsBronze';
      let promotionEndField: 'goldPromotionEndDate' | 'silverPromotionEndDate' | 'bronzePromotionEndDate';

      if (level === 'gold') {
        objLevel = 3;
        creditField = 'creditsGold';
        promotionEndField = 'goldPromotionEndDate';
        if (user.creditsGold < 1) throw new AppError(400, 'Crediti gold insufficienti');
      } else if (level === 'silver') {
        objLevel = 2;
        creditField = 'creditsSilver';
        promotionEndField = 'silverPromotionEndDate';
        if (user.creditsSilver < 1) throw new AppError(400, 'Crediti silver insufficienti');
      } else {
        objLevel = 1;
        creditField = 'creditsBronze';
        promotionEndField = 'bronzePromotionEndDate';
        if (user.creditsBronze < 1) throw new AppError(400, 'Crediti bronze insufficienti');
      }

      await prisma.user.update({
        where: { id: req.user!.id },
        data: { [creditField]: { decrement: 1 } },
      });

      const updatedAd = await prisma.ad.update({
        where: { id: adId },
        data: { objLevel, [promotionEndField]: endDate },
      });

      res.json(updatedAd);
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
        data: { userId: ad.userId, type: 2, object: review.id },
      });

      res.status(201).json(review);
    } catch (err) {
      next(err);
    }
  },
};
