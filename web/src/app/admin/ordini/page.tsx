'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi, api } from '@/lib/api';
import { AdOrder } from '@/types';
import { AlertTriangle, CreditCard, History, PackageCheck, Scale, TrendingUp } from 'lucide-react';

const ORDER_STATUS_LABELS: Record<number, string> = {
  0: 'In attesa',
  1: 'Accettato',
  2: 'Rifiutato',
  3: 'Spedito / pronto',
  4: 'Completato',
  5: 'Annullato',
};

const PAYMENT_LABELS: Record<string, string> = {
  unpaid: 'Non avviato',
  pending: 'In verifica',
  paid: 'Pagato',
  refunded: 'Rimborsato',
};

type AdminOrdersResponse = {
  orders: AdOrder[];
  stats: {
    total: number;
    openDisputes: number;
    completedGmv: string;
    byStatus: Record<string, number>;
    byPaymentStatus: Record<string, number>;
  };
  pagination: { page: number; pages: number; total: number };
};

function formatMoney(value: string | number | null | undefined) {
  return `€${parseFloat(String(value ?? '0')).toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function AdminOrdersPage() {
  const [status, setStatus] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');
  const [disputed, setDisputed] = useState(false);
  const [page, setPage] = useState(1);
  const [editingOrderId, setEditingOrderId] = useState<number | null>(null);
  const [paymentForm, setPaymentForm] = useState({ paymentStatus: 'pending', provider: '', paymentIntentId: '', note: '' });
  const [paymentError, setPaymentError] = useState('');
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-orders', status, paymentStatus, disputed, page],
    queryFn: () => api.get<AdminOrdersResponse>('/admin/orders', {
      params: {
        page: String(page),
        ...(status ? { status } : {}),
        ...(paymentStatus ? { paymentStatus } : {}),
        ...(disputed ? { disputed: 'true' } : {}),
      },
    }).then((r) => r.data),
  });

  const reconcilePayment = useMutation({
    mutationFn: (id: number) => adminApi.reconcileOrderPayment(id, paymentForm),
    onSuccess: () => {
      setEditingOrderId(null);
      setPaymentError('');
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { error?: string } } };
      setPaymentError(e.response?.data?.error ?? 'Riconciliazione non riuscita');
    },
  });

  const startPaymentEdit = (order: AdOrder) => {
    setEditingOrderId(order.id);
    setPaymentForm({
      paymentStatus: order.paymentStatus,
      provider: order.paymentProvider ?? '',
      paymentIntentId: order.paymentIntentId ?? '',
      note: '',
    });
    setPaymentError('');
  };

  const stats = data?.stats;

  return (
    <div className="p-8">
      <div className="flex items-center gap-3 mb-6">
        <PackageCheck className="w-6 h-6 text-brand" />
        <div>
          <h1>Ordini marketplace</h1>
          <p className="text-sm text-gray-500">Coda operativa per monitorare ordini, pagamenti e dispute.</p>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <div className="admin-small-box bg-brand">
          <div className="p-4 flex items-start justify-between">
            <div>
              <p className="text-3xl font-bold">{stats?.total ?? '-'}</p>
              <p className="text-sm text-white/90">Ordini filtrati</p>
            </div>
            <PackageCheck className="w-10 h-10 text-white/30" />
          </div>
        </div>
        <div className="admin-small-box bg-green-500">
          <div className="p-4 flex items-start justify-between">
            <div>
              <p className="text-3xl font-bold">{formatMoney(stats?.completedGmv ?? 0)}</p>
              <p className="text-sm text-white/90">GMV completato</p>
            </div>
            <TrendingUp className="w-10 h-10 text-white/30" />
          </div>
        </div>
        <div className="admin-small-box bg-yellow-500">
          <div className="p-4 flex items-start justify-between">
            <div>
              <p className="text-3xl font-bold">{stats?.byPaymentStatus?.pending ?? 0}</p>
              <p className="text-sm text-white/90">Pagamenti in verifica</p>
            </div>
            <CreditCard className="w-10 h-10 text-white/30" />
          </div>
        </div>
        <div className="admin-small-box bg-red-500">
          <div className="p-4 flex items-start justify-between">
            <div>
              <p className="text-3xl font-bold">{stats?.openDisputes ?? '-'}</p>
              <p className="text-sm text-white/90">Dispute aperte</p>
            </div>
            <Scale className="w-10 h-10 text-white/30" />
          </div>
        </div>
      </div>

      <div className="card p-4 mb-4">
        <div className="grid md:grid-cols-[180px_200px_auto] gap-3">
          <select
            className="input"
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          >
            <option value="">Tutti gli stati</option>
            {Object.entries(ORDER_STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          <select
            className="input"
            value={paymentStatus}
            onChange={(e) => { setPaymentStatus(e.target.value); setPage(1); }}
          >
            <option value="">Tutti i pagamenti</option>
            {Object.entries(PAYMENT_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={disputed}
              onChange={(e) => { setDisputed(e.target.checked); setPage(1); }}
            />
            Solo contestati
          </label>
        </div>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="px-4 py-3">Ordine</th>
              <th className="px-4 py-3">Annuncio</th>
              <th className="px-4 py-3">Parti</th>
              <th className="px-4 py-3">Importi</th>
              <th className="px-4 py-3">Stati</th>
              <th className="px-4 py-3">Data</th>
              <th className="px-4 py-3">Pagamento</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">Caricamento...</td></tr>
            ) : !data?.orders.length ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">Nessun ordine trovato.</td></tr>
            ) : (
              data.orders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">#{order.id}</td>
                  <td className="px-4 py-3">
                    <Link href={`/annunci/${order.ad.id}`} className="font-medium hover:text-brand">{order.ad.name}</Link>
                    <p className="text-xs text-gray-500">{order.deliveryMethod === 'shipping' ? 'Spedizione' : 'Ritiro'} · qty {order.qty}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p><span className="text-gray-500">Buyer:</span> <Link href={`/admin/utenti/${order.user?.id}`} className="hover:text-brand">@{order.user?.username}</Link></p>
                    <p><span className="text-gray-500">Seller:</span> <Link href={`/admin/utenti/${order.ad.user?.id}`} className="hover:text-brand">@{order.ad.user?.username}</Link></p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium">{formatMoney(order.totalAmount)}</p>
                    <p className="text-xs text-gray-500">Sped. {formatMoney(order.shippingAmount)} · fee {formatMoney(order.platformFee)}</p>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      <span className="badge bg-gray-100 text-gray-700">{ORDER_STATUS_LABELS[order.status] ?? order.status}</span>
                      <span className="badge bg-blue-50 text-blue-700">{PAYMENT_LABELS[order.paymentStatus] ?? order.paymentStatus}</span>
                      {order.dispute && (
                        <Link href="/admin/dispute" className="badge bg-red-50 text-red-700 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Disputa
                        </Link>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{new Date(order.orderDate).toLocaleString('it-IT')}</td>
                  <td className="px-4 py-3">
                    <button type="button" onClick={() => startPaymentEdit(order)} className="btn-secondary text-xs">
                      Riconcilia
                    </button>
                    {order.paymentProvider && (
                      <p className="mt-1 text-xs text-gray-500">{order.paymentProvider}{order.paymentIntentId ? ` · ${order.paymentIntentId}` : ''}</p>
                    )}
                    {order.paymentReconciliations && order.paymentReconciliations.length > 0 && (
                      <p className="mt-2 flex items-center gap-1 text-xs text-gray-500">
                        <History className="w-3 h-3" /> Ultimo: {order.paymentReconciliations[0].newStatus} da @{order.paymentReconciliations[0].adminUser.username}
                      </p>
                    )}
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

      {editingOrderId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-lg bg-white p-5 shadow-xl">
            <h2 className="mb-4 text-lg font-semibold">Riconcilia pagamento ordine #{editingOrderId}</h2>
            <div className="grid gap-3">
              <div>
                <label className="label">Stato pagamento</label>
                <select
                  value={paymentForm.paymentStatus}
                  onChange={(e) => setPaymentForm({ ...paymentForm, paymentStatus: e.target.value })}
                  className="input"
                >
                  {Object.entries(PAYMENT_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Provider</label>
                <input
                  value={paymentForm.provider}
                  onChange={(e) => setPaymentForm({ ...paymentForm, provider: e.target.value })}
                  className="input"
                  placeholder="es. paypal, stripe, bonifico"
                />
              </div>
              <div>
                <label className="label">Riferimento pagamento</label>
                <input
                  value={paymentForm.paymentIntentId}
                  onChange={(e) => setPaymentForm({ ...paymentForm, paymentIntentId: e.target.value })}
                  className="input"
                  placeholder="ID transazione o CRO"
                />
              </div>
              <div>
                <label className="label">Nota interna</label>
                <textarea
                  value={paymentForm.note}
                  onChange={(e) => setPaymentForm({ ...paymentForm, note: e.target.value })}
                  className="input"
                  rows={3}
                  placeholder="Motivo, fonte del controllo, eventuale riferimento..."
                />
              </div>
              {paymentError && <p className="text-sm text-red-600">{paymentError}</p>}
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setEditingOrderId(null)} className="btn-secondary text-sm">Annulla</button>
              <button
                type="button"
                onClick={() => reconcilePayment.mutate(editingOrderId)}
                disabled={reconcilePayment.isPending}
                className="btn-primary text-sm"
              >
                {reconcilePayment.isPending ? 'Salvataggio...' : 'Salva riconciliazione'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
