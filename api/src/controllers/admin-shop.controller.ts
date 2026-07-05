import { Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { AuthenticatedRequest } from '../types';
import { AppError } from '../middleware/error.middleware';
import { storageService } from '../services/storage.service';
import { generateS3Key } from '../middleware/upload.middleware';
import { prisma } from '../lib/prisma';

const PRODUCT_SELECT = {
  id: true,
  name: true,
  price: true,
  video: true,
  pics: true,
  isActive: true,
  inStock: true,
  description: true,
  createdAt: true,
  updatedAt: true,
  categories: { select: { id: true, name: true, fatherId: true } },
  shipmentServices: {
    select: { id: true, serviceName: true, basePrice: true, expectedDelivery: true, serviceLogo: true, isActive: true },
  },
} satisfies Prisma.ShopProductSelect;

function parseIdList(value: unknown): number[] {
  if (value === undefined || value === null) return [];
  const raw = Array.isArray(value) ? value : String(value).split(',');
  return raw
    .map((v) => parseInt(String(v), 10))
    .filter((n) => !Number.isNaN(n));
}

export const adminShopController = {
  // ---- Categories ----
  async listCategories(_req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const categories = await prisma.shopCategory.findMany({
        orderBy: { name: 'asc' },
        include: { father: { select: { id: true, name: true } }, _count: { select: { products: true, children: true } } },
      });
      res.json(categories);
    } catch (err) {
      next(err);
    }
  },

  async getCategoryById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const category = await prisma.shopCategory.findUnique({
        where: { id: parseInt(req.params.id, 10) },
        include: { father: { select: { id: true, name: true } }, children: { select: { id: true, name: true } } },
      });
      if (!category) throw new AppError(404, 'Categoria non trovata');
      res.json(category);
    } catch (err) {
      next(err);
    }
  },

  async createCategory(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { name, fatherId } = req.body;
      if (!name) throw new AppError(400, 'Nome categoria richiesto');

      const category = await prisma.shopCategory.create({
        data: {
          name,
          fatherId: fatherId ? parseInt(fatherId, 10) : null,
        },
      });
      res.status(201).json(category);
    } catch (err) {
      next(err);
    }
  },

  async updateCategory(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id, 10);
      const existing = await prisma.shopCategory.findUnique({ where: { id } });
      if (!existing) throw new AppError(404, 'Categoria non trovata');

      const { name, fatherId } = req.body;
      if (fatherId !== undefined && parseInt(fatherId, 10) === id) {
        throw new AppError(400, 'Una categoria non può essere genitore di se stessa');
      }

      const category = await prisma.shopCategory.update({
        where: { id },
        data: {
          ...(name !== undefined ? { name } : {}),
          ...(fatherId !== undefined ? { fatherId: fatherId ? parseInt(fatherId, 10) : null } : {}),
        },
      });
      res.json(category);
    } catch (err) {
      next(err);
    }
  },

  async deleteCategory(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id, 10);
      const existing = await prisma.shopCategory.findUnique({ where: { id } });
      if (!existing) throw new AppError(404, 'Categoria non trovata');

      await prisma.shopCategory.delete({ where: { id } });
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  },

  // ---- Products ----
  async listProducts(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const page = Math.max(1, parseInt((req.query.page as string) ?? '1', 10));
      const limit = Math.min(100, Math.max(1, parseInt((req.query.limit as string) ?? '20', 10)));
      const skip = (page - 1) * limit;

      const [products, total] = await Promise.all([
        prisma.shopProduct.findMany({
          select: PRODUCT_SELECT,
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        prisma.shopProduct.count(),
      ]);

      res.json({ products, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
    } catch (err) {
      next(err);
    }
  },

  async getProductById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const product = await prisma.shopProduct.findUnique({
        where: { id: parseInt(req.params.id, 10) },
        select: PRODUCT_SELECT,
      });
      if (!product) throw new AppError(404, 'Prodotto non trovato');
      res.json(product);
    } catch (err) {
      next(err);
    }
  },

  async createProduct(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { name, price, video, description, isActive, inStock, categoryIds, shipmentServiceIds } = req.body;
      if (!name || price === undefined || !description) {
        throw new AppError(400, 'Nome, prezzo e descrizione sono obbligatori');
      }

      const files = (req.files as Express.Multer.File[] | undefined) ?? [];
      const pics = await Promise.all(
        files.map(async (file) => {
          const key = generateS3Key(file.originalname, 'shop-products');
          return storageService.upload(key, file.buffer, file.mimetype);
        }),
      );

      const product = await prisma.shopProduct.create({
        data: {
          name,
          price: new Prisma.Decimal(price),
          video: video || null,
          pics,
          isActive: isActive === undefined ? true : isActive === 'true' || isActive === true,
          inStock: inStock !== undefined && inStock !== '' ? parseInt(inStock, 10) : null,
          description,
          categories: { connect: parseIdList(categoryIds).map((id) => ({ id })) },
          shipmentServices: { connect: parseIdList(shipmentServiceIds).map((id) => ({ id })) },
        },
        select: PRODUCT_SELECT,
      });

      res.status(201).json(product);
    } catch (err) {
      next(err);
    }
  },

  async updateProduct(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id, 10);
      const existing = await prisma.shopProduct.findUnique({ where: { id } });
      if (!existing) throw new AppError(404, 'Prodotto non trovato');

      const { name, price, video, description, isActive, inStock, categoryIds, shipmentServiceIds, existingPics } = req.body;

      const files = (req.files as Express.Multer.File[] | undefined) ?? [];
      const newPics = await Promise.all(
        files.map(async (file) => {
          const key = generateS3Key(file.originalname, 'shop-products');
          return storageService.upload(key, file.buffer, file.mimetype);
        }),
      );

      const keptPics = existingPics !== undefined
        ? (Array.isArray(existingPics) ? existingPics : String(existingPics).split(',').filter(Boolean))
        : existing.pics;

      const data: Prisma.ShopProductUpdateInput = {
        ...(name !== undefined ? { name } : {}),
        ...(price !== undefined ? { price: new Prisma.Decimal(price) } : {}),
        ...(video !== undefined ? { video: video || null } : {}),
        ...(description !== undefined ? { description } : {}),
        ...(isActive !== undefined ? { isActive: isActive === 'true' || isActive === true } : {}),
        ...(inStock !== undefined ? { inStock: inStock !== '' ? parseInt(inStock, 10) : null } : {}),
        pics: [...keptPics, ...newPics],
      };

      if (categoryIds !== undefined) {
        data.categories = { set: parseIdList(categoryIds).map((cid) => ({ id: cid })) };
      }
      if (shipmentServiceIds !== undefined) {
        data.shipmentServices = { set: parseIdList(shipmentServiceIds).map((sid) => ({ id: sid })) };
      }

      const product = await prisma.shopProduct.update({
        where: { id },
        data,
        select: PRODUCT_SELECT,
      });

      res.json(product);
    } catch (err) {
      next(err);
    }
  },

  async deleteProduct(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id, 10);
      const existing = await prisma.shopProduct.findUnique({ where: { id } });
      if (!existing) throw new AppError(404, 'Prodotto non trovato');

      await prisma.shopProduct.delete({ where: { id } });
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  },

  // ---- Shipments ----
  async listShipments(_req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const shipments = await prisma.shopShipment.findMany({ orderBy: { serviceName: 'asc' } });
      res.json(shipments);
    } catch (err) {
      next(err);
    }
  },

  async getShipmentById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const shipment = await prisma.shopShipment.findUnique({ where: { id: parseInt(req.params.id, 10) } });
      if (!shipment) throw new AppError(404, 'Metodo di spedizione non trovato');
      res.json(shipment);
    } catch (err) {
      next(err);
    }
  },

  async createShipment(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { serviceName, basePrice, expectedDelivery, serviceLogo, isActive } = req.body;
      if (!serviceName || basePrice === undefined || !expectedDelivery) {
        throw new AppError(400, 'Nome servizio, prezzo base e tempi di consegna sono obbligatori');
      }

      const shipment = await prisma.shopShipment.create({
        data: {
          serviceName,
          basePrice: new Prisma.Decimal(basePrice),
          expectedDelivery,
          serviceLogo: serviceLogo || null,
          isActive: isActive === undefined ? true : isActive === 'true' || isActive === true,
        },
      });
      res.status(201).json(shipment);
    } catch (err) {
      next(err);
    }
  },

  async updateShipment(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id, 10);
      const existing = await prisma.shopShipment.findUnique({ where: { id } });
      if (!existing) throw new AppError(404, 'Metodo di spedizione non trovato');

      const { serviceName, basePrice, expectedDelivery, serviceLogo, isActive } = req.body;

      const shipment = await prisma.shopShipment.update({
        where: { id },
        data: {
          ...(serviceName !== undefined ? { serviceName } : {}),
          ...(basePrice !== undefined ? { basePrice: new Prisma.Decimal(basePrice) } : {}),
          ...(expectedDelivery !== undefined ? { expectedDelivery } : {}),
          ...(serviceLogo !== undefined ? { serviceLogo: serviceLogo || null } : {}),
          ...(isActive !== undefined ? { isActive: isActive === 'true' || isActive === true } : {}),
        },
      });
      res.json(shipment);
    } catch (err) {
      next(err);
    }
  },

  async deleteShipment(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id, 10);
      const existing = await prisma.shopShipment.findUnique({ where: { id } });
      if (!existing) throw new AppError(404, 'Metodo di spedizione non trovato');

      await prisma.shopShipment.delete({ where: { id } });
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  },
};
