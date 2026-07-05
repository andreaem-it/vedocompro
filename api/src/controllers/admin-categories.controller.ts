import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { AppError } from '../middleware/error.middleware';
import { prisma } from '../lib/prisma';

export const adminCategoriesController = {
  // GET /admin/categories - full tree, parents with populated children + ad counts
  async list(_req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const categories = await prisma.category.findMany({
        where: { parentId: null },
        orderBy: { name: 'asc' },
        include: {
          children: {
            orderBy: { name: 'asc' },
            include: { _count: { select: { ads: true } } },
          },
          _count: { select: { ads: true } },
        },
      });
      res.json(categories);
    } catch (err) {
      next(err);
    }
  },

  async getById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const category = await prisma.category.findUnique({
        where: { id: parseInt(req.params.id, 10) },
        include: {
          parent: { select: { id: true, name: true } },
          children: { select: { id: true, name: true } },
          _count: { select: { ads: true, children: true } },
        },
      });
      if (!category) throw new AppError(404, 'Categoria non trovata');
      res.json(category);
    } catch (err) {
      next(err);
    }
  },

  // POST /admin/categories
  async create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { name, parentId } = req.body;
      if (!name || !String(name).trim()) {
        throw new AppError(400, 'Nome categoria richiesto');
      }

      let parsedParentId: number | null = null;
      if (parentId !== undefined && parentId !== null && parentId !== '') {
        parsedParentId = parseInt(parentId, 10);
        if (Number.isNaN(parsedParentId)) {
          throw new AppError(400, 'parentId non valido');
        }
        const parent = await prisma.category.findUnique({ where: { id: parsedParentId } });
        if (!parent) throw new AppError(400, 'La categoria padre indicata non esiste');
      }

      const category = await prisma.category.create({
        data: {
          name: String(name).trim(),
          parentId: parsedParentId,
        },
      });
      res.status(201).json(category);
    } catch (err) {
      next(err);
    }
  },

  // PUT /admin/categories/:id
  async update(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id, 10);
      const existing = await prisma.category.findUnique({
        where: { id },
        include: { children: { select: { id: true } } },
      });
      if (!existing) throw new AppError(404, 'Categoria non trovata');

      const { name, parentId } = req.body;

      let parsedParentId: number | null | undefined;
      if (parentId !== undefined) {
        if (parentId === null || parentId === '') {
          parsedParentId = null;
        } else {
          parsedParentId = parseInt(parentId, 10);
          if (Number.isNaN(parsedParentId)) {
            throw new AppError(400, 'parentId non valido');
          }

          if (parsedParentId === id) {
            throw new AppError(400, 'Una categoria non può essere genitore di se stessa');
          }

          const isOwnChild = existing.children.some((child) => child.id === parsedParentId);
          if (isOwnChild) {
            throw new AppError(400, 'Una categoria non può avere come padre una propria sotto-categoria');
          }

          const parent = await prisma.category.findUnique({ where: { id: parsedParentId } });
          if (!parent) throw new AppError(400, 'La categoria padre indicata non esiste');
        }
      }

      if (name !== undefined && !String(name).trim()) {
        throw new AppError(400, 'Nome categoria richiesto');
      }

      const category = await prisma.category.update({
        where: { id },
        data: {
          ...(name !== undefined ? { name: String(name).trim() } : {}),
          ...(parsedParentId !== undefined ? { parentId: parsedParentId } : {}),
        },
      });
      res.json(category);
    } catch (err) {
      next(err);
    }
  },

  // DELETE /admin/categories/:id
  async remove(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id, 10);
      const existing = await prisma.category.findUnique({
        where: { id },
        include: { _count: { select: { ads: true, children: true } } },
      });
      if (!existing) throw new AppError(404, 'Categoria non trovata');

      if (existing._count.ads > 0) {
        throw new AppError(
          400,
          `Impossibile eliminare: la categoria ha ${existing._count.ads} annuncio/i collegato/i. Sposta o elimina prima gli annunci.`,
        );
      }
      if (existing._count.children > 0) {
        throw new AppError(
          400,
          `Impossibile eliminare: la categoria ha ${existing._count.children} sotto-categoria/e. Sposta o elimina prima le sotto-categorie.`,
        );
      }

      await prisma.category.delete({ where: { id } });
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  },

  // --- Campi categoria (AdvancedField): configurazione dei filtri categoria-specifici ---

  // GET /admin/categories/:id/fields
  async listFields(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const categoryId = parseInt(req.params.id, 10);
      const fields = await prisma.advancedField.findMany({
        where: { categoryId },
        orderBy: { sortOrder: 'asc' },
      });
      res.json(fields);
    } catch (err) {
      next(err);
    }
  },

  // POST /admin/categories/:id/fields
  async createField(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const categoryId = parseInt(req.params.id, 10);
      const category = await prisma.category.findUnique({ where: { id: categoryId } });
      if (!category) throw new AppError(404, 'Categoria non trovata');

      const name = String(req.body.name ?? '').trim();
      if (!name) throw new AppError(400, 'Nome campo richiesto');
      const type = ['select', 'text', 'number'].includes(req.body.type) ? req.body.type : 'select';
      const options = Array.isArray(req.body.options)
        ? req.body.options.map((o: unknown) => String(o).trim()).filter(Boolean)
        : [];
      if (type === 'select' && options.length === 0) {
        throw new AppError(400, 'Un campo a scelta richiede almeno un\'opzione');
      }

      const duplicate = await prisma.advancedField.findFirst({ where: { categoryId, name } });
      if (duplicate) throw new AppError(400, 'Esiste già un campo con questo nome nella categoria');

      const maxOrder = await prisma.advancedField.aggregate({
        where: { categoryId },
        _max: { sortOrder: true },
      });

      const field = await prisma.advancedField.create({
        data: {
          categoryId,
          name,
          type,
          options,
          filterable: req.body.filterable !== false,
          required: req.body.required === true,
          sortOrder: (maxOrder._max.sortOrder ?? 0) + 1,
        },
      });
      res.status(201).json(field);
    } catch (err) {
      next(err);
    }
  },

  // PUT /admin/categories/fields/:fieldId
  async updateField(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const fieldId = parseInt(req.params.fieldId, 10);
      const existing = await prisma.advancedField.findUnique({ where: { id: fieldId } });
      if (!existing) throw new AppError(404, 'Campo non trovato');

      const data: Record<string, unknown> = {};
      if (req.body.name !== undefined) {
        const name = String(req.body.name).trim();
        if (!name) throw new AppError(400, 'Nome campo richiesto');
        data.name = name;
      }
      if (req.body.type !== undefined) {
        if (!['select', 'text', 'number'].includes(req.body.type)) throw new AppError(400, 'Tipo non valido');
        data.type = req.body.type;
      }
      if (req.body.options !== undefined) {
        data.options = Array.isArray(req.body.options)
          ? req.body.options.map((o: unknown) => String(o).trim()).filter(Boolean)
          : [];
      }
      if (req.body.filterable !== undefined) data.filterable = req.body.filterable === true;
      if (req.body.required !== undefined) data.required = req.body.required === true;
      if (req.body.sortOrder !== undefined) data.sortOrder = parseInt(req.body.sortOrder, 10) || 0;

      const field = await prisma.advancedField.update({ where: { id: fieldId }, data });
      res.json(field);
    } catch (err) {
      next(err);
    }
  },

  // DELETE /admin/categories/fields/:fieldId
  async deleteField(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const fieldId = parseInt(req.params.fieldId, 10);
      const existing = await prisma.advancedField.findUnique({ where: { id: fieldId } });
      if (!existing) throw new AppError(404, 'Campo non trovato');
      await prisma.advancedField.delete({ where: { id: fieldId } });
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  },
};
