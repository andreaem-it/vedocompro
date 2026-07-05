import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { AppError } from '../middleware/error.middleware';
import { prisma } from '../lib/prisma';

export const adminSuggestsController = {
  async listSuggests(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const page = Math.max(1, parseInt((req.query.page as string) ?? '1', 10));
      const limit = Math.min(100, Math.max(1, parseInt((req.query.limit as string) ?? '20', 10)));
      const skip = (page - 1) * limit;

      const [suggests, total] = await Promise.all([
        prisma.suggest.findMany({
          orderBy: { date: 'desc' },
          skip,
          take: limit,
        }),
        prisma.suggest.count(),
      ]);

      res.json({ suggests, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
    } catch (err) {
      next(err);
    }
  },

  async deleteSuggest(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id, 10);
      const existing = await prisma.suggest.findUnique({ where: { id } });
      if (!existing) throw new AppError(404, 'Suggerimento non trovato');

      await prisma.suggest.delete({ where: { id } });
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  },
};
