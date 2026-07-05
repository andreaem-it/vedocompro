'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { BellRing, Search, Trash2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { savedSearchesApi } from '@/lib/api';
import { SavedSearch } from '@/types';

const FREQUENCY_LABELS: Record<SavedSearch['frequency'], string> = {
  instant: 'Appena possibile',
  daily: 'Max una al giorno',
  off: 'In pausa',
};

function searchUrl(s: SavedSearch): string {
  const params = new URLSearchParams();
  if (s.q) params.set('q', s.q);
  if (s.categoryId) params.set('category', String(s.categoryId));
  if (s.region) params.set('region', s.region);
  if (s.provincia) params.set('provincia', s.provincia);
  if (s.condition) params.set('condition', s.condition);
  if (s.minPrice) params.set('minPrice', s.minPrice);
  if (s.maxPrice) params.set('maxPrice', s.maxPrice);
  const qs = params.toString();
  return qs ? `/annunci?${qs}` : '/annunci';
}

function filtersSummary(s: SavedSearch): string {
  const parts: string[] = [];
  if (s.q) parts.push(`"${s.q}"`);
  if (s.region) parts.push(s.region);
  if (s.provincia) parts.push(s.provincia);
  if (s.condition) parts.push(s.condition);
  if (s.minPrice) parts.push(`da €${parseFloat(s.minPrice).toLocaleString('it-IT')}`);
  if (s.maxPrice) parts.push(`fino a €${parseFloat(s.maxPrice).toLocaleString('it-IT')}`);
  return parts.join(' · ') || 'Tutti gli annunci della categoria';
}

export default function RicercheSalvatePage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!isLoading && !user) router.replace('/login');
  }, [user, isLoading, router]);

  const { data: searches } = useQuery({
    queryKey: ['saved-searches'],
    queryFn: () => savedSearchesApi.list().then((r) => r.data as SavedSearch[]),
    enabled: !!user,
  });

  const updateFrequency = useMutation({
    mutationFn: ({ id, frequency }: { id: number; frequency: SavedSearch['frequency'] }) =>
      savedSearchesApi.update(id, { frequency }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['saved-searches'] }),
  });

  const remove = useMutation({
    mutationFn: (id: number) => savedSearchesApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['saved-searches'] }),
  });

  if (!user) return null;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 sm:px-6">
      <h1 className="mb-2">Ricerche salvate</h1>
      <p className="text-sm text-gray-500 mb-6">
        Riceverai una notifica quando vengono pubblicati nuovi annunci compatibili con i tuoi filtri.
      </p>

      {!searches?.length ? (
        <div className="card p-12 text-center text-gray-500">
          <BellRing className="w-10 h-10 mx-auto mb-3 text-gray-300" />
          <p className="mb-3">Non hai ancora salvato nessuna ricerca.</p>
          <Link href="/annunci" className="btn-primary inline-flex">
            <Search className="w-4 h-4" /> Vai alla ricerca
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {searches.map((s) => (
            <div key={s.id} className="card p-4 flex flex-wrap items-center gap-3">
              <div className="flex-1 min-w-48">
                <Link href={searchUrl(s)} className="font-semibold hover:text-brand">{s.name}</Link>
                <p className="text-xs text-gray-500">{filtersSummary(s)}</p>
                {s.lastNotifiedAt && (
                  <p className="text-xs text-gray-400">
                    Ultimo avviso: {new Date(s.lastNotifiedAt).toLocaleString('it-IT')}
                  </p>
                )}
              </div>
              <select
                value={s.frequency}
                onChange={(e) => updateFrequency.mutate({ id: s.id, frequency: e.target.value as SavedSearch['frequency'] })}
                className="input w-auto text-sm py-1.5"
                title="Frequenza notifiche"
              >
                {Object.entries(FREQUENCY_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
              <Link href={searchUrl(s)} className="btn-secondary text-sm py-1.5">
                <Search className="w-3.5 h-3.5" /> Apri
              </Link>
              <button
                onClick={() => remove.mutate(s.id)}
                className="btn-ghost p-1.5 text-red-600"
                title="Elimina ricerca salvata"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
