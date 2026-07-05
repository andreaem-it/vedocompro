import { Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { AuthenticatedRequest } from '../types';
import { AppError } from '../middleware/error.middleware';
import { prisma } from '../lib/prisma';

const MAX_SAVED_SEARCHES_PER_USER = 20;
const VALID_FREQUENCIES = ['instant', 'daily', 'off'];

export const savedSearchesController = {
  // POST /users/me/saved-searches — salva i filtri di ricerca correnti
  async create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const count = await prisma.savedSearch.count({ where: { userId: req.user!.id } });
      if (count >= MAX_SAVED_SEARCHES_PER_USER) {
        throw new AppError(400, `Puoi salvare al massimo ${MAX_SAVED_SEARCHES_PER_USER} ricerche`);
      }

      const q = String(req.body.q ?? '').trim() || null;
      const categoryId = req.body.categoryId ? parseInt(req.body.categoryId, 10) : null;
      const region = String(req.body.region ?? '').trim() || null;
      const provincia = String(req.body.provincia ?? '').trim() || null;
      const condition = String(req.body.condition ?? '').trim() || null;
      const minPrice = req.body.minPrice ? new Prisma.Decimal(String(req.body.minPrice)) : null;
      const maxPrice = req.body.maxPrice ? new Prisma.Decimal(String(req.body.maxPrice)) : null;

      if (!q && !categoryId && !region && !provincia && !condition && !minPrice && !maxPrice) {
        throw new AppError(400, 'Imposta almeno un filtro prima di salvare la ricerca');
      }

      // Nome autogenerato leggibile se non fornito (es. "bici · Lombardia")
      let name = String(req.body.name ?? '').trim();
      if (!name) {
        const parts: string[] = [];
        if (q) parts.push(q);
        if (categoryId) {
          const cat = await prisma.category.findUnique({ where: { id: categoryId }, select: { name: true } });
          if (cat) parts.push(cat.name);
        }
        if (region) parts.push(region);
        name = parts.join(' · ') || 'Ricerca salvata';
      }

      const frequency = VALID_FREQUENCIES.includes(req.body.frequency) ? req.body.frequency : 'daily';

      const saved = await prisma.savedSearch.create({
        data: { userId: req.user!.id, name, q, categoryId, region, provincia, condition, minPrice, maxPrice, frequency },
      });
      res.status(201).json(saved);
    } catch (err) {
      next(err);
    }
  },

  // GET /users/me/saved-searches
  async list(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const searches = await prisma.savedSearch.findMany({
        where: { userId: req.user!.id },
        orderBy: { id: 'desc' },
      });
      res.json(searches);
    } catch (err) {
      next(err);
    }
  },

  // PUT /users/me/saved-searches/:id — { frequency, name? }
  async update(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id, 10);
      const existing = await prisma.savedSearch.findUnique({ where: { id } });
      if (!existing || existing.userId !== req.user!.id) throw new AppError(404, 'Ricerca non trovata');

      const data: Prisma.SavedSearchUpdateInput = {};
      if (req.body.frequency !== undefined) {
        if (!VALID_FREQUENCIES.includes(req.body.frequency)) throw new AppError(400, 'Frequenza non valida');
        data.frequency = req.body.frequency;
      }
      if (req.body.name !== undefined) {
        const name = String(req.body.name).trim();
        if (!name) throw new AppError(400, 'Nome vuoto');
        data.name = name;
      }

      const updated = await prisma.savedSearch.update({ where: { id }, data });
      res.json(updated);
    } catch (err) {
      next(err);
    }
  },

  // DELETE /users/me/saved-searches/:id
  async remove(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id, 10);
      const existing = await prisma.savedSearch.findUnique({ where: { id } });
      if (!existing || existing.userId !== req.user!.id) throw new AppError(404, 'Ricerca non trovata');
      await prisma.savedSearch.delete({ where: { id } });
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  },
};
