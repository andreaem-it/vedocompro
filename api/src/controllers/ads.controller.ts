import { Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { adsService } from '../services/ads.service';
import { AuthenticatedRequest } from '../types';

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
};
