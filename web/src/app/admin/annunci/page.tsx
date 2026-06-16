'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import Link from 'next/link';
import { CheckCircle, XCircle, Eye } from 'lucide-react';
import clsx from 'clsx';

const LEVEL_LABELS: Record<number, string> = { 0: 'Standard', 1: 'Bronze', 2: 'Silver', 3: 'Gold' };
const LEVEL_COLORS: Record<number, string> = {
  0: 'bg-gray-100 text-gray-600',
  1: 'bg-orange-100 text-orange-800',
  2: 'bg-gray-200 text-gray-700',
  3: 'bg-yellow-100 text-yellow-800',
};

export default function AdminAdsPage() {
  const queryClient = useQueryClient();
  const [published, setPublished] = useState<string>('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-ads', published, page],
    queryFn: () => adminApi.listAds({ ...(published !== '' ? { published } : {}), page: String(page) }).then((r) => r.data),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, pub }: { id: number; pub: number }) => adminApi.toggleAdPublished(id, pub),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-ads'] }),
  });

  return (
    <div className="p-8">
      <h1 className="mb-6">Gestione Annunci</h1>

      <div className="flex gap-2 mb-4">
        {[{ label: 'Tutti', value: '' }, { label: 'Pubblicati', value: '1' }, { label: 'Bozze', value: '0' }].map((f) => (
          <button
            key={f.value}
            onClick={() => { setPublished(f.value); setPage(1); }}
            className={published === f.value ? 'btn-primary text-sm' : 'btn-secondary text-sm'}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="px-4 py-3">Titolo</th>
              <th className="px-4 py-3">Categoria</th>
              <th className="px-4 py-3">Venditore</th>
              <th className="px-4 py-3">Prezzo</th>
              <th className="px-4 py-3">Livello</th>
              <th className="px-4 py-3">Stato</th>
              <th className="px-4 py-3">Data</th>
              <th className="px-4 py-3">Azioni</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading ? (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">Caricamento...</td></tr>
            ) : (
              data?.ads?.map((ad: any) => (
                <tr key={ad.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">
                    <Link href={`/annunci/${ad.id}`} className="hover:text-brand">{ad.name}</Link>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{ad.category?.name}</td>
                  <td className="px-4 py-3 text-gray-500">@{ad.user?.username}</td>
                  <td className="px-4 py-3 font-medium">€{parseFloat(ad.price).toLocaleString('it-IT')}</td>
                  <td className="px-4 py-3">
                    <span className={clsx('badge text-xs', LEVEL_COLORS[ad.objLevel ?? 0])}>
                      {LEVEL_LABELS[ad.objLevel ?? 0]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 flex-wrap">
                      {ad.published === 1
                        ? <span className="badge bg-green-100 text-green-700">Pubblicato</span>
                        : <span className="badge bg-gray-100 text-gray-600">Bozza</span>
                      }
                      {ad.sold === 1 && <span className="badge bg-red-100 text-red-700">Venduto</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{new Date(ad.creationTime).toLocaleDateString('it-IT')}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <Link href={`/annunci/${ad.id}`} className="p-1.5 rounded text-gray-400 hover:text-brand hover:bg-brand/10 transition-colors" title="Visualizza">
                        <Eye className="w-4 h-4" />
                      </Link>
                      {ad.published === 0 ? (
                        <button
                          onClick={() => toggleMutation.mutate({ id: ad.id, pub: 1 })}
                          className="p-1.5 rounded text-gray-400 hover:text-green-600 hover:bg-green-50 transition-colors"
                          title="Pubblica"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          onClick={() => toggleMutation.mutate({ id: ad.id, pub: 0 })}
                          className="p-1.5 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                          title="Sospendi"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {data?.pagination && data.pagination.pages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-4 text-sm">
          <button disabled={page === 1} onClick={() => setPage(page - 1)} className="btn-secondary disabled:opacity-40">Precedente</button>
          <span>Pagina {page} di {data.pagination.pages}</span>
          <button disabled={page === data.pagination.pages} onClick={() => setPage(page + 1)} className="btn-secondary disabled:opacity-40">Successiva</button>
        </div>
      )}
    </div>
  );
}
