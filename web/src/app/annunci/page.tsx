'use client';

import { useQuery } from '@tanstack/react-query';
import { useSearchParams, useRouter } from 'next/navigation';
import { adsApi, lookupApi } from '@/lib/api';
import { AdListResponse, Category } from '@/types';
import AdCard from '@/components/ads/AdCard';
import SaveSearchButton from '@/components/ads/SaveSearchButton';
import CategoryFieldFilters from '@/components/ads/CategoryFieldFilters';
import { SlidersHorizontal, ChevronLeft, ChevronRight, Star, LocateFixed, X } from 'lucide-react';
import { Suspense, useState } from 'react';

type Region = { id: number; nome: string };
type Province = { id: number; nome: string; siglaAutomobilistica: string };
type Comune = { id: number; comune: string };

function AdsList() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState('');

  const params: Record<string, string> = {};
  searchParams.forEach((v, k) => { params[k] = v; });
  const ffPairs = searchParams.getAll('ff');

  const { data, isLoading } = useQuery({
    queryKey: ['ads', searchParams.toString()],
    queryFn: () => adsApi.list(new URLSearchParams(searchParams.toString())).then((r) => r.data as AdListResponse),
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => lookupApi.categories().then((r) => r.data as Category[]),
  });

  const { data: regioni } = useQuery({
    queryKey: ['regions'],
    queryFn: () => lookupApi.regions().then((r) => r.data as Region[]),
  });

  const selectedRegion = regioni?.find((r) => r.nome === params.region);
  const { data: province } = useQuery({
    queryKey: ['provinces', selectedRegion?.id],
    queryFn: () => lookupApi.provinces(selectedRegion?.id).then((r) => r.data as Province[]),
    enabled: !!selectedRegion,
  });
  const selectedProvince = province?.find((p) => p.nome === params.provincia);
  const { data: comuni } = useQuery({
    queryKey: ['comuni', selectedProvince?.id],
    queryFn: () => lookupApi.comuni(selectedProvince?.id).then((r) => r.data as Comune[]),
    enabled: !!selectedProvince,
  });

  const setParam = (key: string, value: string | null) => {
    const next = new URLSearchParams(searchParams.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    // I filtri campo appartengono alla categoria: cambiandola vanno azzerati
    if (key === 'category') next.delete('ff');
    if (key === 'region') {
      next.delete('provincia');
      next.delete('location');
    }
    if (key === 'provincia') next.delete('location');
    next.delete('page');
    router.push(`/annunci?${next.toString()}`);
  };

  const useMyPosition = () => {
    if (!navigator.geolocation) {
      setGeoError('Geolocalizzazione non disponibile su questo browser.');
      return;
    }
    setGeoLoading(true);
    setGeoError('');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const next = new URLSearchParams(searchParams.toString());
        next.set('nearLat', position.coords.latitude.toFixed(6));
        next.set('nearLng', position.coords.longitude.toFixed(6));
        if (!next.get('radiusKm')) next.set('radiusKm', '25');
        next.set('sort', 'distance');
        next.delete('page');
        setGeoLoading(false);
        router.push(`/annunci?${next.toString()}`);
      },
      () => {
        setGeoLoading(false);
        setGeoError('Non riesco a leggere la posizione. Controlla i permessi del browser.');
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 },
    );
  };

  const clearMyPosition = () => {
    const next = new URLSearchParams(searchParams.toString());
    next.delete('nearLat');
    next.delete('nearLng');
    next.delete('radiusKm');
    if (next.get('sort') === 'distance') next.set('sort', 'recent');
    next.delete('page');
    router.push(`/annunci?${next.toString()}`);
  };

  const setFieldFilter = (fieldName: string, value: string | null) => {
    const next = new URLSearchParams(searchParams.toString());
    const kept = next.getAll('ff').filter((p) => !p.startsWith(`${fieldName}:`));
    next.delete('ff');
    kept.forEach((p) => next.append('ff', p));
    if (value) next.append('ff', `${fieldName}:${value}`);
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
            <option value="relevance">Più rilevanti</option>
            {params.nearLat && params.nearLng && <option value="distance">Più vicini</option>}
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
                <label className="label">Categoria</label>
                <select
                  value={params.category ?? ''}
                  onChange={(e) => setParam('category', e.target.value || null)}
                  className="input text-sm"
                >
                  <option value="">Tutte le categorie</option>
                  {categories?.map((cat) => (
                    <optgroup key={cat.id} label={cat.name}>
                      <option value={String(cat.id)}>{cat.name} (tutte)</option>
                      {cat.children?.map((child) => (
                        <option key={child.id} value={String(child.id)}>
                          {'  '}{child.name}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Regione</label>
                <select
                  value={params.region ?? ''}
                  onChange={(e) => setParam('region', e.target.value || null)}
                  className="input text-sm"
                >
                  <option value="">Tutta Italia</option>
                  {regioni?.map((r) => (
                    <option key={r.id} value={r.nome}>{r.nome}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Provincia</label>
                <select
                  value={params.provincia ?? ''}
                  onChange={(e) => setParam('provincia', e.target.value || null)}
                  className="input text-sm"
                  disabled={!selectedRegion}
                >
                  <option value="">{selectedRegion ? 'Tutte le province' : 'Scegli prima la regione'}</option>
                  {province?.map((p) => (
                    <option key={p.id} value={p.nome}>{p.nome}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Comune</label>
                <select
                  value={params.location ?? ''}
                  onChange={(e) => setParam('location', e.target.value || null)}
                  className="input text-sm"
                  disabled={!selectedProvince}
                >
                  <option value="">{selectedProvince ? 'Tutti i comuni' : 'Scegli prima la provincia'}</option>
                  {comuni?.map((c) => (
                    <option key={c.id} value={c.comune}>{c.comune}</option>
                  ))}
                </select>
              </div>
              <div className="border-t pt-4">
                <label className="label">Distanza</label>
                {params.nearLat && params.nearLng ? (
                  <div className="space-y-2">
                    <select
                      value={params.radiusKm ?? '25'}
                      onChange={(e) => setParam('radiusKm', e.target.value)}
                      className="input text-sm"
                    >
                      <option value="10">Entro 10 km</option>
                      <option value="25">Entro 25 km</option>
                      <option value="50">Entro 50 km</option>
                      <option value="100">Entro 100 km</option>
                      <option value="300">Entro 300 km</option>
                    </select>
                    <button type="button" onClick={clearMyPosition} className="btn-secondary w-full justify-center text-sm">
                      <X className="w-4 h-4" /> Rimuovi posizione
                    </button>
                  </div>
                ) : (
                  <button type="button" onClick={useMyPosition} disabled={geoLoading} className="btn-secondary w-full justify-center text-sm">
                    <LocateFixed className="w-4 h-4" /> {geoLoading ? 'Localizzazione...' : 'Vicino a me'}
                  </button>
                )}
                {geoError && <p className="text-xs text-red-600 mt-1">{geoError}</p>}
              </div>
              <CategoryFieldFilters
                categoryId={params.category}
                activePairs={ffPairs}
                onChange={setFieldFilter}
              />
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

              <SaveSearchButton params={params} />
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
          ) : !data?.ads.length && !data?.showcase?.length ? (
            <div className="text-center py-20 text-gray-500">
              <p className="text-xl mb-2">Nessun annuncio trovato</p>
              <p className="text-sm">Prova a modificare i filtri di ricerca.</p>
            </div>
          ) : (
            <>
              {data.showcase && data.showcase.length > 0 && (
                <div className="mb-8">
                  <h2 className="flex items-center gap-2 text-base font-semibold mb-3">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" /> In vetrina
                  </h2>
                  <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4 mb-6 pb-6 border-b">
                    {data.showcase.map((ad) => <AdCard key={ad.id} ad={ad} />)}
                  </div>
                </div>
              )}

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
