'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Scale } from 'lucide-react';
import { adminApi } from '@/lib/api';
import { Dispute } from '@/types';
import { DisputeView } from '@/components/orders/DisputeSection';
import clsx from 'clsx';

const STATUSES = [
  { value: 'open', label: 'Aperte' },
  { value: 'under_review', label: 'In valutazione' },
  { value: 'resolved_buyer', label: 'Pro compratore' },
  { value: 'resolved_seller', label: 'Pro venditore' },
  { value: 'closed', label: 'Chiuse' },
  { value: '', label: 'Tutte' },
];

export default function AdminDisputesPage() {
  const [status, setStatus] = useState('open');
  const [refundMessage, setRefundMessage] = useState('');
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-disputes', status],
    queryFn: () => adminApi.listDisputes(status || undefined).then((r) => r.data as Dispute[]),
  });

  const moderate = useMutation({
    mutationFn: ({ id, nextStatus, adminDecision }: { id: number; nextStatus: string; adminDecision: string }) =>
      adminApi.updateDispute(id, { status: nextStatus, adminDecision: adminDecision || undefined }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['admin-disputes'] });
      // Esito del rimborso Stripe automatico (solo su risoluzioni pro-compratore
      // di ordini pagati con carta)
      const refund = res.data?.refund as { refunded: boolean; reason?: string } | null;
      if (refund) {
        setRefundMessage(
          refund.refunded
            ? 'Rimborso Stripe eseguito: il compratore riceverà l\'accredito in 5-10 giorni lavorativi.'
            : `Rimborso Stripe NON eseguito: ${refund.reason ?? 'errore sconosciuto'}. Riconcilia manualmente da /admin/ordini.`,
        );
      } else {
        setRefundMessage('');
      }
    },
  });

  return (
    <div className="p-8">
      <div className="admin-breadcrumb mb-4">
        <Link href="/admin">Dashboard</Link> / Dispute ordini
      </div>
      <div className="flex items-center gap-2 mb-6">
        <Scale className="w-5 h-5 text-brand" />
        <h1>Dispute ordini</h1>
      </div>

      {refundMessage && (
        <p className={`mb-4 rounded-lg border px-3 py-2 text-sm ${refundMessage.includes('NON') ? 'border-red-200 bg-red-50 text-red-700' : 'border-green-200 bg-green-50 text-green-700'}`}>
          {refundMessage}
        </p>
      )}

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
        <div className="card p-12 text-center text-gray-500">Nessuna contestazione in questo vassoio.</div>
      ) : (
        <div className="space-y-4">
          {data.map((dispute) => (
            <div key={dispute.id} className="card p-5 space-y-3">
              <div className="text-sm text-gray-600">
                Ordine{' '}
                <span className="font-medium">#{dispute.order.id}</span> ·{' '}
                <Link href={`/annunci/${dispute.order.ad.id}`} className="text-brand hover:underline">
                  {dispute.order.ad.name}
                </Link>{' '}
                · Compratore{' '}
                <Link href={`/utenti/${dispute.order.user.id}`} className="font-medium hover:text-brand">
                  @{dispute.order.user.username}
                </Link>{' '}
                · Venditore{' '}
                <Link href={`/utenti/${dispute.order.ad.user.id}`} className="font-medium hover:text-brand">
                  @{dispute.order.ad.user.username}
                </Link>{' '}
                · Totale €{parseFloat(dispute.order.totalAmount).toLocaleString('it-IT', { minimumFractionDigits: 2 })}
              </div>
              <DisputeView
                dispute={dispute}
                onChanged={() => queryClient.invalidateQueries({ queryKey: ['admin-disputes'] })}
                canModerate
                onModerate={(nextStatus, adminDecision) =>
                  moderate.mutate({ id: dispute.id, nextStatus, adminDecision })
                }
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
