import type { MetadataRoute } from 'next';
import { shopEnabled } from '@/config/features';

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.NODE_ENV === 'production' ? 'https://www.vedocompro.it' : 'http://localhost:3000');

const STATIC_ROUTES = [
  '/',
  '/annunci',
  ...(shopEnabled ? ['/shop'] : []),
  '/business',
  '/servizi',
  '/linee-guida',
  '/porta-un-amico',
  '/privacy',
  '/termini',
  '/login',
  '/registrati',
];

// Annunci pubblicati: l'endpoint pubblico /ads filtra già su published=1 e pagina
// con max 50 risultati per pagina (vedi api/src/services/ads.service.ts). Recuperiamo
// alcune pagine ordinate per data più recente per arricchire la sitemap senza
// scaricare l'intero catalogo ad ogni rebuild.
const MAX_PAGES = 10;
const PAGE_LIMIT = 50;

interface SitemapAd {
  id: number;
  updateTime?: string;
  creationTime?: string;
}

async function getPublishedAds(): Promise<SitemapAd[]> {
  const ads: SitemapAd[] = [];
  try {
    for (let page = 1; page <= MAX_PAGES; page++) {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/ads?page=${page}&limit=${PAGE_LIMIT}&sort=recent`,
        { next: { revalidate: 3600 } },
      );
      if (!res.ok) break;
      const data = await res.json();
      const pageAds: SitemapAd[] = data?.ads ?? [];
      ads.push(...pageAds);
      if (pageAds.length < PAGE_LIMIT || page >= (data?.pagination?.pages ?? 1)) break;
    }
  } catch {
    return ads;
  }
  return ads;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((route) => ({
    url: `${SITE_URL}${route}`,
    lastModified: new Date(),
  }));

  const ads = await getPublishedAds();
  const adEntries: MetadataRoute.Sitemap = ads.map((ad) => ({
    url: `${SITE_URL}/annunci/${ad.id}`,
    lastModified: ad.updateTime ? new Date(ad.updateTime) : ad.creationTime ? new Date(ad.creationTime) : undefined,
  }));

  return [...staticEntries, ...adEntries];
}
