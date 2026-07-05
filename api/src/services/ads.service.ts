import { Prisma } from '@prisma/client';
import { AdFilters } from '../types';
import { AppError } from '../middleware/error.middleware';
import { NotificationType } from '../constants/notifications';
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
  availableQuantity: true,
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
  canBeOrdered: true,
  shippingAvailable: true,
  shippingCost: true,
  shippingNotes: true,
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

type AdListItem = Prisma.AdGetPayload<{ select: typeof AD_SELECT }> & { distanceKm?: number };

function parseCoordinatePair(value?: string | null): { lat: number; lng: number } | null {
  if (!value) return null;
  const [latRaw, lngRaw] = value.split(',').map((part) => Number(part.trim()));
  if (!Number.isFinite(latRaw) || !Number.isFinite(lngRaw)) return null;
  if (Math.abs(latRaw) > 90 || Math.abs(lngRaw) > 180) return null;
  return { lat: latRaw, lng: lngRaw };
}

function parseOrigin(filters: AdFilters): { lat: number; lng: number } | null {
  const lat = Number(filters.nearLat);
  const lng = Number(filters.nearLng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  return { lat, lng };
}

function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const toRad = (n: number) => (n * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function withDistance(ad: Prisma.AdGetPayload<{ select: typeof AD_SELECT }>, origin: { lat: number; lng: number }): AdListItem | null {
  const coords = parseCoordinatePair(ad.mapCoords);
  if (!coords) return null;
  return { ...ad, distanceKm: Math.round(distanceKm(origin, coords) * 10) / 10 };
}

function sortAdsInMemory(ads: AdListItem[], sort: AdFilters['sort']) {
  return [...ads].sort((a, b) => {
    if (sort === 'distance') return (a.distanceKm ?? Number.MAX_SAFE_INTEGER) - (b.distanceKm ?? Number.MAX_SAFE_INTEGER);
    if (sort === 'price_asc') return Number(a.price) - Number(b.price);
    if (sort === 'price_desc') return Number(b.price) - Number(a.price);
    if (sort === 'views') return b.views - a.views;
    if (sort === 'relevance') return b.objLevel - a.objLevel || b.views - a.views || b.creationTime.getTime() - a.creationTime.getTime();
    return b.creationTime.getTime() - a.creationTime.getTime();
  });
}

export const adsService = {
  async list(filters: AdFilters, userId?: number) {
    const page = Math.max(1, parseInt(filters.page ?? '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(filters.limit ?? '20', 10)));
    const skip = (page - 1) * limit;

    const where: Prisma.AdWhereInput = { published: 1 };

    if (filters.category) where.categoryId = parseInt(filters.category, 10);
    if (filters.region) where.region = { contains: filters.region, mode: 'insensitive' };
    if (filters.provincia) where.provincia = { contains: filters.provincia, mode: 'insensitive' };
    if (filters.location) where.location = { contains: filters.location, mode: 'insensitive' };
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
    // Filtri categoria-specifici: coppie "Campo:Valore", tutte richieste (AND)
    if (filters.ff) {
      const pairs = (Array.isArray(filters.ff) ? filters.ff : [filters.ff])
        .map((p) => String(p).trim())
        .filter((p) => p.includes(':'));
      if (pairs.length > 0) {
        where.fieldPairs = { hasEvery: pairs };
      }
    }

    const origin = parseOrigin(filters);
    const radiusKm = Math.min(300, Math.max(1, Number(filters.radiusKm ?? 25)));
    const hasDistanceFilter = !!origin && Number.isFinite(radiusKm);

    const sortMap: Record<string, Prisma.AdOrderByWithRelationInput | Prisma.AdOrderByWithRelationInput[]> = {
      recent: { creationTime: 'desc' },
      price_asc: { price: 'asc' },
      price_desc: { price: 'desc' },
      views: { views: 'desc' },
      relevance: [{ objLevel: 'desc' }, { views: 'desc' }, { creationTime: 'desc' }],
    };
    const orderBy = sortMap[filters.sort ?? 'recent'] ?? { creationTime: 'desc' };

    if (hasDistanceFilter && origin) {
      const geoWhere: Prisma.AdWhereInput = { ...where, hasMap: true, mapCoords: { not: null } };
      const candidates = await prisma.ad.findMany({
        where: geoWhere,
        select: AD_SELECT,
        orderBy: [{ objLevel: 'desc' }, { creationTime: 'desc' }],
        take: 1000,
      });
      const nearby = candidates
        .map((ad) => withDistance(ad, origin))
        .filter((ad): ad is AdListItem => !!ad && ad.distanceKm! <= radiusKm);
      const showcase = page === 1
        ? sortAdsInMemory(nearby.filter((ad) => ad.showcase === 1), filters.sort).slice(0, 8)
        : [];
      const normal = sortAdsInMemory(
        showcase.length > 0 ? nearby.filter((ad) => !showcase.some((item) => item.id === ad.id)) : nearby,
        filters.sort,
      );
      const ads = normal.slice(skip, skip + limit);

      let wishlistIds: number[] = [];
      if (userId) {
        const wishlists = await prisma.wishlist.findMany({
          where: { userId, adId: { in: [...showcase.map((a) => a.id), ...ads.map((a) => a.id)] } },
          select: { adId: true },
        });
        wishlistIds = wishlists.map((w) => w.adId);
      }

      return {
        showcase: showcase.map((ad) => ({ ...ad, isWishlisted: wishlistIds.includes(ad.id) })),
        ads: ads.map((ad) => ({ ...ad, isWishlisted: wishlistIds.includes(ad.id) })),
        pagination: { page, limit, total: normal.length, pages: Math.ceil(normal.length / limit) },
        geo: { origin, radiusKm },
      };
    }

    // "Vetrina" (annunci con promo attiva): sezione separata mostrata solo in pagina 1,
    // ordinata per livello promo (gold prima) e poi più recenti — replica la separazione
    // showcase/normali di SearchController.php legacy, esclusa dai risultati normali sotto
    // per non duplicare lo stesso annuncio due volte nella pagina.
    const showcase = page === 1
      ? await prisma.ad.findMany({
          where: { ...where, showcase: 1 },
          select: AD_SELECT,
          orderBy: [{ objLevel: 'desc' }, { creationTime: 'desc' }],
          take: 8,
        })
      : [];

    const normalWhere: Prisma.AdWhereInput = showcase.length > 0
      ? { ...where, id: { notIn: showcase.map((a) => a.id) } }
      : where;

    const [ads, total] = await Promise.all([
      prisma.ad.findMany({ where: normalWhere, select: AD_SELECT, orderBy, skip, take: limit }),
      prisma.ad.count({ where: normalWhere }),
    ]);

    let wishlistIds: number[] = [];
    if (userId) {
      const wishlists = await prisma.wishlist.findMany({
        where: { userId, adId: { in: [...showcase.map((a) => a.id), ...ads.map((a) => a.id)] } },
        select: { adId: true },
      });
      wishlistIds = wishlists.map((w) => w.adId);
    }

    return {
      showcase: showcase.map((ad) => ({ ...ad, isWishlisted: wishlistIds.includes(ad.id) })),
      ads: ads.map((ad) => ({ ...ad, isWishlisted: wishlistIds.includes(ad.id) })),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  },

  async findById(id: number, userId?: number, isAdmin = false) {
    const ad = await prisma.ad.findUnique({
      where: { id },
      select: {
        ...AD_SELECT,
        // Il telefono va mostrato solo nel dettaglio annuncio (bottone "Chiama"), non nelle
        // liste/ricerca: per questo non è nel AD_SELECT condiviso, solo qui.
        user: {
          select: {
            id: true, username: true, name: true, pic: true, isCompany: true, phone: true,
            companyLogo: true, companyWebsite: true, points: true, city: true, address: true,
          },
        },
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
    if (ad.published === 0 && ad.user.id !== userId && !isAdmin) throw new AppError(404, 'Annuncio non trovato');

    await prisma.ad.update({ where: { id }, data: { views: { increment: 1 } } });
    if (ad.user.isCompany && ad.user.id !== userId) {
      await prisma.businessStat.create({
        data: { userId: ad.user.id, adId: id, type: 1 },
      }).catch(() => {});
    }

    let isWishlisted = false;
    if (userId) {
      const w = await prisma.wishlist.findUnique({ where: { userId_adId: { userId, adId: id } } });
      isWishlisted = !!w;
    }

    // % di feedback positivi sul venditore, mostrato accanto al nome (replica feedPercent legacy)
    const [positiveFeedback, totalFeedback] = await Promise.all([
      prisma.feedback.count({ where: { userId: ad.user.id, positive: 1 } }),
      prisma.feedback.count({ where: { userId: ad.user.id } }),
    ]);
    const feedPercent = totalFeedback > 0 ? Math.round((positiveFeedback / totalFeedback) * 100) : null;

    // Annunci simili nella stessa categoria, per il carosello in fondo alla pagina
    const similar = await prisma.ad.findMany({
      where: { categoryId: ad.category.id, published: 1, id: { not: id } },
      select: { id: true, name: true, price: true, photos: { select: { url: true }, orderBy: { order: 'asc' }, take: 1 } },
      orderBy: { creationTime: 'desc' },
      take: 6,
    });

    return { ...ad, isWishlisted, feedPercent, similar };
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

    // Buy/Sell rappresentano transazioni reali: a differenza di foto/video/recensioni/
    // wishlist (cancellati a cascata) non vanno mai persi silenziosamente, quindi qui
    // blocchiamo con un errore chiaro invece di lasciare che la FK constraint fallisca.
    const [hasBuys, hasSells] = await Promise.all([
      prisma.buy.count({ where: { adId: id } }),
      prisma.sell.count({ where: { adId: id } }),
    ]);
    if (hasBuys > 0 || hasSells > 0) {
      throw new AppError(400, 'Non puoi eliminare un annuncio con acquisti/vendite registrati');
    }

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

  // Equivalente di app:update-ad-promotions (legacy): azzera le promo scadute e
  // disattiva objLevel/showcase se nessun livello è più attivo.
  async expirePromotions() {
    const now = new Date();
    const expired = await prisma.ad.findMany({
      where: {
        OR: [
          { goldPromotionEndDate: { lt: now } },
          { silverPromotionEndDate: { lt: now } },
          { bronzePromotionEndDate: { lt: now } },
        ],
      },
      select: { id: true, userId: true, goldPromotionEndDate: true, silverPromotionEndDate: true, bronzePromotionEndDate: true },
    });

    let count = 0;
    for (const ad of expired) {
      const goldActive = !!ad.goldPromotionEndDate && ad.goldPromotionEndDate > now;
      const silverActive = !!ad.silverPromotionEndDate && ad.silverPromotionEndDate > now;
      const bronzeActive = !!ad.bronzePromotionEndDate && ad.bronzePromotionEndDate > now;

      await prisma.ad.update({
        where: { id: ad.id },
        data: {
          goldPromotionEndDate: goldActive ? ad.goldPromotionEndDate : null,
          silverPromotionEndDate: silverActive ? ad.silverPromotionEndDate : null,
          bronzePromotionEndDate: bronzeActive ? ad.bronzePromotionEndDate : null,
          objLevel: goldActive ? 3 : silverActive ? 2 : bronzeActive ? 1 : 0,
          showcase: goldActive || silverActive || bronzeActive ? 1 : 0,
        },
      });
      await prisma.notification.create({
        data: { userId: ad.userId, type: NotificationType.PROMOTION_EXPIRED, object: ad.id },
      });
      count++;
    }

    return { checked: expired.length, updated: count };
  },
};
