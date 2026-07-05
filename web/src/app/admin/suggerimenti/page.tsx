'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Trash2, MessageSquareText } from 'lucide-react';
import { adminSuggestsApi } from '@/lib/api';
import { SuggestListResponse } from '@/types';

export default function AdminSuggestsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-suggests', page],
    queryFn: () => adminSuggestsApi.listSuggests({ page: String(page) }).then((r) => r.data as SuggestListResponse),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin-suggests'] });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => adminSuggestsApi.deleteSuggest(id),
    onSuccess: invalidate,
  });

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1>Suggerimenti</h1>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="px-4 py-3">Nome</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Tipo</th>
              <th className="px-4 py-3">Messaggio</th>
              <th className="px-4 py-3">Data</th>
              <th className="px-4 py-3">Azioni</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">Caricamento...</td></tr>
            ) : !data?.suggests.length ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                  <MessageSquareText className="w-6 h-6 mx-auto mb-2 text-gray-300" />
                  Nessun suggerimento
                </td>
              </tr>
            ) : (
              data.suggests.map((suggest) => (
                <tr key={suggest.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{suggest.name}</td>
                  <td className="px-4 py-3 text-gray-500">{suggest.mail}</td>
                  <td className="px-4 py-3">
                    <span className="badge bg-brand/10 text-brand">{suggest.type}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-600 max-w-md whitespace-pre-wrap">{suggest.message}</td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                    {new Date(suggest.date).toLocaleDateString('it-IT')}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => {
                        if (confirm(`Eliminare il suggerimento di "${suggest.name}"?`)) deleteMutation.mutate(suggest.id);
                      }}
                      className="p-1.5 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                      title="Elimina"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {data?.pagination && data.pagination.pages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-4 text-sm">
          <button disabled={page === 1} onClick={() => setPage((p) => p - 1)} className="btn-secondary disabled:opacity-40">Precedente</button>
          <span>Pagina {page} di {data.pagination.pages}</span>
          <button disabled={page === data.pagination.pages} onClick={() => setPage((p) => p + 1)} className="btn-secondary disabled:opacity-40">Successiva</button>
        </div>
      )}
    </div>
  );
}
