'use client';

import { useQuery } from '@tanstack/react-query';
import { useSearchParams, useRouter } from 'next/navigation';
import { adsApi } from '@/lib/api';
import { AdListResponse } from '@/types';
import AdCard from '@/components/ads/AdCard';
import { SlidersHorizontal, ChevronLeft, ChevronRight } from 'lucide-react';
import { Suspense } from 'react';

function AdsList() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const params: Record<string, string> = {};
  searchParams.forEach((v, k) => { params[k] = v; });

  const { data, isLoading } = useQuery({
    queryKey: ['ads', params],
    queryFn: () => adsApi.list(params).then((r) => r.data as AdListResponse),
  });

  const setParam = (key: string, value: string | null) => {
    const next = new URLSearchParams(searchParams.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete('page');
    router.push(`/annunci?${next.toString()}`);
  };

  const setPage = (page: number) => {
    const next = new URLSearchParams(searchParams.toString());
    next.set('page', String(page));
    router.push(`/annunci?${next.toString()}`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">
          Annunci
          {data && <span className="text-gray-500 text-lg font-normal ml-2">({data.pagination.total.toLocaleString('it-IT')})</span>}
        </h1>

        <div className="flex items-center gap-3">
          <select
            value={params.sort ?? 'recent'}
            onChange={(e) => setParam('sort', e.target.value)}
            className="input w-auto text-sm"
          >
            <option value="recent">Più recenti</option>
            <option value="price_asc">Prezzo: crescente</option>
            <option value="price_desc">Prezzo: decrescente</option>
            <option value="views">Più visti</option>
          </select>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Filters sidebar */}
        <aside className="hidden lg:block w-64 flex-shrink-0">
          <div className="card p-4 sticky top-20">
            <h3 className="font-semibold flex items-center gap-2 mb-4">
              <SlidersHorizontal className="w-4 h-4" /> Filtri
            </h3>

            <div className="space-y-4">
              <div>
                <label className="label">Prezzo min (€)</label>
                <input
                  type="number"
                  placeholder="0"
                  defaultValue={params.minPrice}
                  onBlur={(e) => setParam('minPrice', e.target.value || null)}
                  className="input text-sm"
                />
              </div>
              <div>
                <label className="label">Prezzo max (€)</label>
                <input
                  type="number"
                  placeholder="Nessun limite"
                  defaultValue={params.maxPrice}
                  onBlur={(e) => setParam('maxPrice', e.target.value || null)}
                  className="input text-sm"
                />
              </div>
              <div>
                <label className="label">Condizione</label>
                <select
                  value={params.condition ?? ''}
                  onChange={(e) => setParam('condition', e.target.value || null)}
                  className="input text-sm"
                >
                  <option value="">Tutte</option>
                  <option value="new">Nuovo</option>
                  <option value="like_new">Come nuovo</option>
                  <option value="good">Buono</option>
                  <option value="acceptable">Accettabile</option>
                  <option value="for_parts">Per ricambi</option>
                </select>
              </div>
            </div>
          </div>
        </aside>

        {/* Grid */}
        <div className="flex-1">
          {isLoading ? (
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="card animate-pulse">
                  <div className="h-48 bg-gray-200 rounded-t-xl" />
                  <div className="p-4 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                    <div className="h-4 bg-gray-200 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : !data?.ads.length ? (
            <div className="text-center py-20 text-gray-500">
              <p className="text-xl mb-2">Nessun annuncio trovato</p>
              <p className="text-sm">Prova a modificare i filtri di ricerca.</p>
            </div>
          ) : (
            <>
              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {data.ads.map((ad) => <AdCard key={ad.id} ad={ad} />)}
              </div>

              {/* Pagination */}
              {data.pagination.pages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8">
                  <button
                    onClick={() => setPage(data.pagination.page - 1)}
                    disabled={data.pagination.page === 1}
                    className="btn-secondary p-2 disabled:opacity-40"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-sm text-gray-600">
                    Pagina {data.pagination.page} di {data.pagination.pages}
                  </span>
                  <button
                    onClick={() => setPage(data.pagination.page + 1)}
                    disabled={data.pagination.page === data.pagination.pages}
                    className="btn-secondary p-2 disabled:opacity-40"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AnnunciPage() {
  return (
    <Suspense>
      <AdsList />
    </Suspense>
  );
}
