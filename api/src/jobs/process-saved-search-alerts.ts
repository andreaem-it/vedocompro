import { Prisma, SavedSearch } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { NotificationType } from '../constants/notifications';
import { mailService } from '../services/mail.service';
import { config } from '../config';

// Batch limitato per giro: il job gira su Vercel serverless (timeout 60s su Hobby),
// il cron orario riprende le ricerche rimanenti al giro successivo grazie a lastCheckedAt.
const BATCH_SIZE = 100;
const DAY_MS = 24 * 60 * 60 * 1000;

function buildWhere(search: SavedSearch): Prisma.AdWhereInput {
  // Stessa semantica dei filtri di adsService.list: i risultati dell'alert devono
  // combaciare con quello che l'utente vedrebbe rilanciando la ricerca.
  const where: Prisma.AdWhereInput = {
    published: 1,
    creationTime: { gt: search.lastCheckedAt },
  };
  if (search.categoryId) where.categoryId = search.categoryId;
  if (search.region) where.region = { contains: search.region, mode: 'insensitive' };
  if (search.provincia) where.provincia = { contains: search.provincia, mode: 'insensitive' };
  if (search.condition) where.objCondition = search.condition;
  if (search.minPrice || search.maxPrice) {
    where.price = {};
    if (search.minPrice) where.price.gte = search.minPrice;
    if (search.maxPrice) where.price.lte = search.maxPrice;
  }
  if (search.q) {
    where.OR = [
      { name: { contains: search.q, mode: 'insensitive' } },
      { description: { contains: search.q, mode: 'insensitive' } },
      { tags: { has: search.q } },
    ];
  }
  return where;
}

function buildSearchUrl(search: SavedSearch) {
  const params = new URLSearchParams();
  if (search.q) params.set('q', search.q);
  if (search.categoryId) params.set('category', String(search.categoryId));
  if (search.region) params.set('region', search.region);
  if (search.provincia) params.set('provincia', search.provincia);
  if (search.condition) params.set('condition', search.condition);
  if (search.minPrice) params.set('minPrice', String(search.minPrice));
  if (search.maxPrice) params.set('maxPrice', String(search.maxPrice));
  const query = params.toString();
  return `${config.appUrl}/annunci${query ? `?${query}` : ''}`;
}

export async function processSavedSearchAlerts() {
  const now = new Date();

  // Le ricerche "daily" vanno controllate solo se l'ultima notifica è più vecchia di 24h;
  // le "instant" a ogni giro; le "off" mai.
  const searches = await prisma.savedSearch.findMany({
    where: {
      frequency: { in: ['instant', 'daily'] },
      // Ordina per lastCheckedAt così le più arretrate hanno priorità nel batch
    },
    include: { user: { select: { email: true, username: true } } },
    orderBy: { lastCheckedAt: 'asc' },
    take: BATCH_SIZE,
  });

  let notified = 0;
  let emailed = 0;
  let checked = 0;

  for (const search of searches) {
    if (
      search.frequency === 'daily' &&
      search.lastNotifiedAt &&
      now.getTime() - search.lastNotifiedAt.getTime() < DAY_MS
    ) {
      continue;
    }
    checked += 1;

    const where = buildWhere(search);
    const [matches, topAds] = await Promise.all([
      prisma.ad.count({ where }),
      prisma.ad.findMany({
        where,
        select: { id: true, name: true, price: true, location: true, region: true },
        orderBy: { creationTime: 'desc' },
        take: 5,
      }),
    ]);

    if (matches > 0) {
      await prisma.notification.create({
        data: { userId: search.userId, type: NotificationType.SAVED_SEARCH_MATCH, object: search.id },
      });
      notified += 1;
      if (mailService.isConfigured()) {
        await mailService.sendSavedSearchAlert(
          search.user.email,
          search.user.username,
          search.name,
          matches,
          buildSearchUrl(search),
          topAds,
        ).then(() => {
          emailed += 1;
        }).catch(() => {});
      }
      await prisma.savedSearch.update({
        where: { id: search.id },
        data: { lastNotifiedAt: now, lastCheckedAt: now },
      });
    } else {
      await prisma.savedSearch.update({
        where: { id: search.id },
        data: { lastCheckedAt: now },
      });
    }
  }

  return { total: searches.length, checked, notified, emailed };
}
