'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Sparkles } from 'lucide-react';
import { adsApi } from '@/lib/api';
import { AdListResponse } from '@/types';
import AdCard from '@/components/ads/AdCard';

export default function FeaturedAdsSection() {
  const { data, isLoading } = useQuery({
    queryKey: ['home-ads'],
    queryFn: () => adsApi.list({ limit: '8', sort: 'recent' }).then((r) => r.data as AdListResponse),
  });

  const showcase = data?.showcase ?? [];
  const recent = data?.ads ?? [];
  const primaryAds = showcase.length > 0 ? showcase.slice(0, 4) : recent.slice(0, 4);
  const secondaryAds = recent.filter((ad) => !primaryAds.some((item) => item.id === ad.id)).slice(0, 4);

  return (
    <section className="px-4 py-10">
      <div className="max-w-7xl mx-auto">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold">Annunci da scoprire</h2>
            <p className="text-sm text-gray-500">Oggetti, servizi e occasioni pubblicati dalla community.</p>
          </div>
          <Link href="/annunci" className="btn-secondary text-sm whitespace-nowrap">
            Vedi tutti <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="rounded-lg border border-gray-200 bg-white">
                <div className="h-44 animate-pulse rounded-t-lg bg-gray-100" />
                <div className="space-y-2 p-4">
                  <div className="h-4 w-3/4 animate-pulse rounded bg-gray-100" />
                  <div className="h-4 w-1/2 animate-pulse rounded bg-gray-100" />
                </div>
              </div>
            ))}
          </div>
        ) : primaryAds.length > 0 ? (
          <>
            {showcase.length > 0 && (
              <div className="mb-3 inline-flex items-center gap-2 rounded-md bg-yellow-50 px-3 py-1.5 text-sm font-medium text-yellow-800">
                <Sparkles className="w-4 h-4" /> In vetrina
              </div>
            )}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {primaryAds.map((ad) => <AdCard key={ad.id} ad={ad} />)}
            </div>
            {secondaryAds.length > 0 && (
              <div className="mt-8">
                <div className="mb-4 flex items-center justify-between gap-4">
                  <h3 className="text-lg font-semibold">Appena pubblicati</h3>
                  <Link href="/annunci?sort=recent" className="text-sm font-medium text-brand hover:underline">Nuovi annunci</Link>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {secondaryAds.map((ad) => <AdCard key={ad.id} ad={ad} />)}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="rounded-lg border border-dashed border-gray-300 bg-white px-4 py-12 text-center">
            <p className="font-medium text-gray-700">Non ci sono ancora annunci visibili.</p>
            <p className="mt-1 text-sm text-gray-500">La home si riempira automaticamente appena gli utenti pubblicano.</p>
            <Link href="/annunci/nuovo" className="btn-primary mt-4">Pubblica il primo annuncio</Link>
          </div>
        )}
      </div>
    </section>
  );
}
