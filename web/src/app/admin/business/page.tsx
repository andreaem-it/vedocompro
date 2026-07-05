'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Building2, CheckCircle2, XCircle } from 'lucide-react';
import { adminApi } from '@/lib/api';
import { BusinessRequestListResponse } from '@/types';

const STATUS = [
  { value: '0', label: 'In attesa' },
  { value: '1', label: 'Approvate' },
  { value: '2', label: 'Rifiutate' },
  { value: '', label: 'Tutte' },
];

const PACKAGE_LABEL: Record<number, string> = {
  1: 'Mensile',
  2: 'Annuale',
};

export default function AdminBusinessPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('0');
  const [notes, setNotes] = useState<Record<number, string>>({});

  const { data, isLoading } = useQuery({
    queryKey: ['admin-business-requests', page, status],
    queryFn: () => adminApi.listBusinessRequests({ page: String(page), ...(status ? { status } : {}) }).then((r) => r.data as BusinessRequestListResponse),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin-business-requests'] });

  const updateMutation = useMutation({
    mutationFn: ({ id, nextStatus }: { id: number; nextStatus: number }) =>
      adminApi.updateBusinessRequest(id, { status: nextStatus, adminNotes: notes[id] }),
    onSuccess: invalidate,
  });

  return (
    <div className="p-8">
      <div className="flex items-center justify-between gap-4 mb-6">
        <h1 className="flex items-center gap-2"><Building2 className="w-6 h-6 text-brand" /> Richieste Business</h1>
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="input max-w-48">
          {STATUS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
        </select>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="px-4 py-3">Azienda</th>
              <th className="px-4 py-3">Contatto</th>
              <th className="px-4 py-3">Pacchetto</th>
              <th className="px-4 py-3">Extra</th>
              <th className="px-4 py-3">Data</th>
              <th className="px-4 py-3">Azioni</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">Caricamento...</td></tr>
            ) : !data?.requests.length ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">Nessuna richiesta Business</td></tr>
            ) : data.requests.map((request) => (
              <tr key={request.id} className="align-top hover:bg-gray-50">
                <td className="px-4 py-3">
                  <p className="font-medium">{request.legalName}</p>
                  <p className="text-gray-500">P.IVA {request.vatNumber}</p>
                  <p className="text-gray-400">@{request.user?.username}</p>
                </td>
                <td className="px-4 py-3">
                  <p>{request.contactName} {request.contactSurname}</p>
                  <p className="text-gray-500">{request.contactEmail}</p>
                  <p className="text-gray-500">{request.contactPhone}</p>
                </td>
                <td className="px-4 py-3">{PACKAGE_LABEL[request.package] ?? request.package}</td>
                <td className="px-4 py-3">
                  <div className="space-y-1 text-gray-500">
                    {request.opt1 && <p>Montaggio video</p>}
                    {request.opt2 && <p>Riprese con drone</p>}
                    {!request.opt1 && !request.opt2 && <p>—</p>}
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">{new Date(request.requestDate).toLocaleDateString('it-IT')}</td>
                <td className="px-4 py-3 min-w-56">
                  {request.status === 0 ? (
                    <div className="space-y-2">
                      <textarea
                        value={notes[request.id] ?? ''}
                        onChange={(e) => setNotes((current) => ({ ...current, [request.id]: e.target.value }))}
                        className="input min-h-16 text-xs"
                        placeholder="Note interne o motivazione rifiuto"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => updateMutation.mutate({ id: request.id, nextStatus: 1 })}
                          className="btn-primary text-xs"
                          disabled={updateMutation.isPending}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> Approva
                        </button>
                        <button
                          onClick={() => updateMutation.mutate({ id: request.id, nextStatus: 2 })}
                          className="btn-secondary text-xs"
                          disabled={updateMutation.isPending}
                        >
                          <XCircle className="w-3.5 h-3.5" /> Rifiuta
                        </button>
                      </div>
                    </div>
                  ) : (
                    <span className={request.status === 1 ? 'badge bg-green-100 text-green-700' : 'badge bg-red-100 text-red-700'}>
                      {request.status === 1 ? 'Approvata' : 'Rifiutata'}
                    </span>
                  )}
                </td>
              </tr>
            ))}
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
