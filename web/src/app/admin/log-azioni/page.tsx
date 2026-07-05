'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { AdminActionListResponse } from '@/types';
import { ScrollText, ChevronLeft, ChevronRight } from 'lucide-react';

// Specchio di api/src/constants/adminActions.ts (AdminActionType) — tenere sincronizzato.
const ACTION_LABELS: Record<number, string> = {
  1: 'Ha attivato un utente',
  2: 'Ha disattivato un utente',
  3: 'Ha eliminato un utente',
  4: 'Ha approvato un annuncio',
  5: 'Ha rifiutato un annuncio',
  6: 'Ha eliminato un annuncio',
  7: 'Ha approvato un video',
  8: 'Ha rifiutato un video',
  9: 'Ha pubblicato una recensione',
  10: 'Ha rifiutato una recensione',
  11: 'Ha impersonato un utente',
  12: 'Ha approvato una richiesta Business',
  13: 'Ha rifiutato una richiesta Business',
};

export default function AdminLogAzioniPage() {
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-actions', page],
    queryFn: () => adminApi.listActions({ page: String(page) }).then((r) => r.data as AdminActionListResponse),
  });

  return (
    <div className="p-8">
      <div className="flex items-center gap-2 mb-6">
        <ScrollText className="w-5 h-5 text-brand" />
        <h1>Log azioni admin</h1>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="px-4 py-3">Admin</th>
              <th className="px-4 py-3">Azione</th>
              <th className="px-4 py-3">Data</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading ? (
              <tr><td colSpan={3} className="px-4 py-8 text-center text-gray-400">Caricamento...</td></tr>
            ) : !data?.actions.length ? (
              <tr><td colSpan={3} className="px-4 py-8 text-center text-gray-400">Nessuna azione registrata.</td></tr>
            ) : (
              data.actions.map((action) => (
                <tr key={action.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">@{action.user?.username ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{ACTION_LABELS[action.type] ?? `Azione tipo ${action.type}`}</td>
                  <td className="px-4 py-3 text-gray-500">{new Date(action.linedate).toLocaleString('it-IT')}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {data?.pagination && data.pagination.pages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-4 text-sm">
          <button disabled={page === 1} onClick={() => setPage(page - 1)} className="btn-secondary disabled:opacity-40">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span>Pagina {data.pagination.page} di {data.pagination.pages}</span>
          <button disabled={page === data.pagination.pages} onClick={() => setPage(page + 1)} className="btn-secondary disabled:opacity-40">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
