import { Prisma } from '@prisma/client';
import { AppError } from '../middleware/error.middleware';
import { prisma } from '../lib/prisma';

export interface ShopProductFilters {
  categoryId?: string;
  page?: string;
  limit?: string;
  q?: string;
}

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

export const shopService = {
  async getCategoryTree() {
    const categories = await prisma.shopCategory.findMany({
      orderBy: { name: 'asc' },
    });

    const byId = new Map(categories.map((c) => [c.id, { ...c, children: [] as typeof categories }]));
    const roots: (typeof categories[number] & { children: typeof categories })[] = [];

    for (const cat of byId.values()) {
      if (cat.fatherId && byId.has(cat.fatherId)) {
        byId.get(cat.fatherId)!.children.push(cat);
      } else {
        roots.push(cat);
      }
    }

    return roots;
  },

  async listProducts(filters: ShopProductFilters) {
    const page = Math.max(1, parseInt(filters.page ?? '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(filters.limit ?? '20', 10)));
    const skip = (page - 1) * limit;

    const where: Prisma.ShopProductWhereInput = { isActive: true };

    if (filters.categoryId) {
      where.categories = { some: { id: parseInt(filters.categoryId, 10) } };
    }
    if (filters.q) {
      where.OR = [
        { name: { contains: filters.q, mode: 'insensitive' } },
        { description: { contains: filters.q, mode: 'insensitive' } },
      ];
    }

    const [products, total] = await Promise.all([
      prisma.shopProduct.findMany({
        where,
        select: PRODUCT_SELECT,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.shopProduct.count({ where }),
    ]);

    return {
      products,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  },

  async findProductById(id: number) {
    const product = await prisma.shopProduct.findUnique({
      where: { id },
      select: PRODUCT_SELECT,
    });
    if (!product || !product.isActive) throw new AppError(404, 'Prodotto non trovato');
    return product;
  },
};
