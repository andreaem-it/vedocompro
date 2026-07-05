'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Flag, CheckCircle2, XCircle, Eye } from 'lucide-react';
import { adminApi } from '@/lib/api';
import clsx from 'clsx';

interface Report {
  id: number;
  reason: string;
  details: string | null;
  status: string;
  adminNotes: string | null;
  createdAt: string;
  reviewedAt: string | null;
  reporter: { id: number; username: string; email: string };
  targetUser: { id: number; username: string; email: string; isActive: boolean } | null;
  targetAd: { id: number; name: string; published: number } | null;
  reviewedByUser: { id: number; username: string } | null;
}

const STATUSES = [
  { value: 'open', label: 'Aperte' },
  { value: 'reviewing', label: 'In revisione' },
  { value: 'resolved', label: 'Risolte' },
  { value: 'dismissed', label: 'Archiviate' },
  { value: 'all', label: 'Tutte' },
];

const REASON_LABELS: Record<string, string> = {
  fraud: 'Possibile truffa',
  spam: 'Spam o comportamento molesto',
  prohibited: 'Contenuto vietato',
  wrong_info: 'Informazioni false o fuorvianti',
  other: 'Altro',
};

export default function AdminReportsPage() {
  const [status, setStatus] = useState('open');
  const [notes, setNotes] = useState<Record<number, string>>({});
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-reports', status],
    queryFn: () => adminApi.listReports(status).then((r) => r.data as Report[]),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, nextStatus }: { id: number; nextStatus: string }) =>
      adminApi.updateReport(id, { status: nextStatus, adminNotes: notes[id] }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-reports'] }),
  });

  return (
    <div className="p-8">
      <div className="flex items-center gap-2 mb-6">
        <Flag className="w-5 h-5 text-brand" />
        <h1>Segnalazioni</h1>
      </div>

      <div className="flex gap-2 mb-6 border-b overflow-x-auto">
        {STATUSES.map((item) => (
          <button
            key={item.value}
            onClick={() => setStatus(item.value)}
            className={clsx(
              'px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
              status === item.value ? 'border-brand text-brand' : 'border-transparent text-gray-500 hover:text-gray-700',
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="text-gray-400">Caricamento...</div>
      ) : !data?.length ? (
        <div className="card p-12 text-center text-gray-500">Nessuna segnalazione in questo vassoio.</div>
      ) : (
        <div className="space-y-4">
          {data.map((report) => (
            <div key={report.id} className="card p-5 space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="badge bg-red-50 text-red-700">{REASON_LABELS[report.reason] ?? report.reason}</span>
                    <span className="badge bg-gray-100 text-gray-700">{report.status}</span>
                  </div>
                  <p className="text-sm text-gray-500">
                    Segnalata da{' '}
                    <Link href={`/utenti/${report.reporter.id}`} className="font-medium hover:text-brand">
                      @{report.reporter.username}
                    </Link>{' '}
                    il {new Date(report.createdAt).toLocaleDateString('it-IT')}
                  </p>
                </div>
                {report.reviewedByUser && (
                  <p className="text-xs text-gray-400">
                    Gestita da {report.reviewedByUser.username}
                    {report.reviewedAt ? ` · ${new Date(report.reviewedAt).toLocaleDateString('it-IT')}` : ''}
                  </p>
                )}
              </div>

              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div className="rounded-lg border border-gray-200 p-3">
                  <p className="font-medium text-gray-700 mb-1">Oggetto segnalato</p>
                  {report.targetAd ? (
                    <Link href={`/annunci/${report.targetAd.id}`} className="inline-flex items-center gap-1 text-brand hover:underline">
                      <Eye className="w-4 h-4" /> Annuncio #{report.targetAd.id}: {report.targetAd.name}
                    </Link>
                  ) : report.targetUser ? (
                    <Link href={`/utenti/${report.targetUser.id}`} className="inline-flex items-center gap-1 text-brand hover:underline">
                      <Eye className="w-4 h-4" /> Utente @{report.targetUser.username}
                    </Link>
                  ) : (
                    <span className="text-gray-500">Oggetto non più disponibile</span>
                  )}
                </div>
                <div className="rounded-lg border border-gray-200 p-3">
                  <p className="font-medium text-gray-700 mb-1">Dettagli</p>
                  <p className="text-gray-600 whitespace-pre-wrap">{report.details || 'Nessun dettaglio aggiuntivo.'}</p>
                </div>
              </div>

              <textarea
                value={notes[report.id] ?? report.adminNotes ?? ''}
                onChange={(e) => setNotes((prev) => ({ ...prev, [report.id]: e.target.value }))}
                className="input text-sm min-h-20"
                placeholder="Note interne di moderazione..."
              />

              <div className="flex flex-wrap gap-2">
                {report.status === 'open' && (
                  <button onClick={() => updateMutation.mutate({ id: report.id, nextStatus: 'reviewing' })} className="btn-secondary text-xs">
                    Prendi in carico
                  </button>
                )}
                <button onClick={() => updateMutation.mutate({ id: report.id, nextStatus: 'resolved' })} className="btn-secondary text-xs text-green-700 border-green-200 hover:bg-green-50">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Risolta
                </button>
                <button onClick={() => updateMutation.mutate({ id: report.id, nextStatus: 'dismissed' })} className="btn-secondary text-xs text-gray-600">
                  <XCircle className="w-3.5 h-3.5" /> Archivia
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
