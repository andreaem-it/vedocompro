import { Prisma } from '@prisma/client';
import { AdFilters } from '../types';
import { AppError } from '../middleware/error.middleware';
import { prisma } from '../lib/prisma';

const AD_SELECT = {
  id: true,
  name: true,
  price: true,
  description: true,
  region: true,
  location: true,
  provincia: true,
  views: true,
  objCondition: true,
  objLevel: true,
  showcase: true,
  sold: true,
  published: true,
  video: true,
  hasMap: true,
  mapCoords: true,
  hasReviews: true,
  isHotel: true,
  services: true,
  rooms: true,
  tags: true,
  fields: true,
  vals: true,
  callClicks: true,
  messageClicks: true,
  goldPromotionEndDate: true,
  silverPromotionEndDate: true,
  bronzePromotionEndDate: true,
  creationTime: true,
  updateTime: true,
  category: { select: { id: true, name: true } },
  user: { select: { id: true, username: true, name: true, pic: true, isCompany: true } },
  photos: { select: { id: true, url: true, order: true }, orderBy: { order: 'asc' } },
} satisfies Prisma.AdSelect;

export const adsService = {
  async list(filters: AdFilters, userId?: number) {
    const page = Math.max(1, parseInt(filters.page ?? '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(filters.limit ?? '20', 10)));
    const skip = (page - 1) * limit;

    const where: Prisma.AdWhereInput = { published: 1 };

    if (filters.category) where.categoryId = parseInt(filters.category, 10);
    if (filters.region) where.region = { contains: filters.region, mode: 'insensitive' };
    if (filters.provincia) where.provincia = { contains: filters.provincia, mode: 'insensitive' };
    if (filters.condition) where.objCondition = filters.condition;
    if (filters.minPrice || filters.maxPrice) {
      where.price = {};
      if (filters.minPrice) where.price.gte = new Prisma.Decimal(filters.minPrice);
      if (filters.maxPrice) where.price.lte = new Prisma.Decimal(filters.maxPrice);
    }
    if (filters.q) {
      where.OR = [
        { name: { contains: filters.q, mode: 'insensitive' } },
        { description: { contains: filters.q, mode: 'insensitive' } },
        { tags: { has: filters.q } },
      ];
    }

    const sortMap: Record<string, Prisma.AdOrderByWithRelationInput> = {
      recent: { creationTime: 'desc' },
      price_asc: { price: 'asc' },
      price_desc: { price: 'desc' },
      views: { views: 'desc' },
    };
    const orderBy = sortMap[filters.sort ?? 'recent'] ?? { creationTime: 'desc' };

    const [ads, total] = await Promise.all([
      prisma.ad.findMany({ where, select: AD_SELECT, orderBy, skip, take: limit }),
      prisma.ad.count({ where }),
    ]);

    let wishlistIds: number[] = [];
    if (userId) {
      const wishlists = await prisma.wishlist.findMany({
        where: { userId, adId: { in: ads.map((a) => a.id) } },
        select: { adId: true },
      });
      wishlistIds = wishlists.map((w) => w.adId);
    }

    return {
      ads: ads.map((ad) => ({ ...ad, isWishlisted: wishlistIds.includes(ad.id) })),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  },

  async findById(id: number, userId?: number) {
    const ad = await prisma.ad.findUnique({
      where: { id },
      select: {
        ...AD_SELECT,
        reviews: {
          where: { isPublished: true },
          select: { id: true, rating: true, comment: true, datetime: true, user: { select: { id: true, username: true, pic: true } } },
        },
        videos: { where: { accepted: 1 }, select: { id: true, filename: true } },
        photos: { select: { id: true, url: true, order: true }, orderBy: { order: 'asc' } },
        _count: { select: { wishlists: true, reviews: true } },
      },
    });
    if (!ad) throw new AppError(404, 'Annuncio non trovato');
    if (ad.published === 0 && ad.user.id !== userId) throw new AppError(404, 'Annuncio non trovato');

    await prisma.ad.update({ where: { id }, data: { views: { increment: 1 } } });

    let isWishlisted = false;
    if (userId) {
      const w = await prisma.wishlist.findUnique({ where: { userId_adId: { userId, adId: id } } });
      isWishlisted = !!w;
    }

    return { ...ad, isWishlisted };
  },

  async create(data: Prisma.AdUncheckedCreateInput) {
    return prisma.ad.create({ data, select: AD_SELECT });
  },

  async update(id: number, userId: number, data: Prisma.AdUncheckedUpdateInput, isAdmin = false) {
    const ad = await prisma.ad.findUnique({ where: { id } });
    if (!ad) throw new AppError(404, 'Annuncio non trovato');
    if (!isAdmin && ad.userId !== userId) throw new AppError(403, 'Non autorizzato');

    return prisma.ad.update({ where: { id }, data, select: AD_SELECT });
  },

  async delete(id: number, userId: number, isAdmin = false) {
    const ad = await prisma.ad.findUnique({ where: { id } });
    if (!ad) throw new AppError(404, 'Annuncio non trovato');
    if (!isAdmin && ad.userId !== userId) throw new AppError(403, 'Non autorizzato');

    await prisma.ad.delete({ where: { id } });
  },

  async toggleWishlist(userId: number, adId: number) {
    const existing = await prisma.wishlist.findUnique({ where: { userId_adId: { userId, adId } } });
    if (existing) {
      await prisma.wishlist.delete({ where: { userId_adId: { userId, adId } } });
      return { wishlisted: false };
    }
    await prisma.wishlist.create({ data: { userId, adId } });
    return { wishlisted: true };
  },

  async getUserAds(userId: number) {
    return prisma.ad.findMany({
      where: { userId },
      select: AD_SELECT,
      orderBy: { creationTime: 'desc' },
    });
  },

  async getWishlistedAds(userId: number) {
    const wishlists = await prisma.wishlist.findMany({
      where: { userId },
      select: { ad: { select: AD_SELECT } },
      orderBy: { id: 'desc' },
    });
    return wishlists.map((w) => ({ ...w.ad, isWishlisted: true }));
  },
};
