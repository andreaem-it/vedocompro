'use client';

import { useQuery } from '@tanstack/react-query';
import { adminApi, api } from '@/lib/api';
import AdminExportButton from '@/components/admin/AdminExportButton';

type PaymentWebhookLog = {
  id: number;
  provider: string;
  eventId: string | null;
  status: string;
  error: string | null;
  createdAt: string;
  processedAt: string | null;
};

export default function AdminPaymentsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-payments'],
    queryFn: () => adminApi.listPayments().then((r) => r.data),
  });

  const { data: webhookLogs } = useQuery({
    queryKey: ['admin-payment-webhook-logs'],
    queryFn: () => api.get('/admin/payments/webhook-logs').then((r) => r.data as PaymentWebhookLog[]),
  });

  const total = data?.reduce((sum: number, p: any) => sum + parseFloat(p.price), 0) ?? 0;

  return (
    <div className="p-8">
      <div className="flex items-start justify-between gap-3 mb-6">
        <div>
          <h1 className="mb-2">Pagamenti</h1>
          <p className="text-gray-500">Totale incassato: <strong className="text-gray-900">€{total.toLocaleString('it-IT')}</strong></p>
        </div>
        <AdminExportButton
          endpoint="/admin/export/payments"
          filename={`vedocompro-pagamenti-${new Date().toISOString().slice(0, 10)}.csv`}
        />
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="px-4 py-3">Transazione</th>
              <th className="px-4 py-3">Utente</th>
              <th className="px-4 py-3">Prodotto</th>
              <th className="px-4 py-3">Importo</th>
              <th className="px-4 py-3">Stato</th>
              <th className="px-4 py-3">Data</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">Caricamento...</td></tr>
            ) : !data?.length ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">Nessun pagamento registrato.</td></tr>
            ) : (
              data.map((p: any) => (
                <tr key={p.id}>
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{p.paypalTxnId}</td>
                  <td className="px-4 py-3">@{p.user?.username}</td>
                  <td className="px-4 py-3">{p.product?.name}</td>
                  <td className="px-4 py-3 font-medium">{p.paymentCurrency} {parseFloat(p.price).toLocaleString('it-IT')}</td>
                  <td className="px-4 py-3">
                    <span className={p.paymentStatus === 'Completed' ? 'badge bg-green-100 text-green-700' : 'badge bg-yellow-100 text-yellow-700'}>
                      {p.paymentStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{new Date(p.timestamp).toLocaleDateString('it-IT')}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="card mt-6 overflow-hidden">
        <div className="border-b px-4 py-3">
          <h2 className="text-base font-semibold text-gray-900">Log webhook recenti</h2>
          <p className="text-sm text-gray-500">Ultimi eventi IPN PayPal ricevuti dal sistema crediti.</p>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="px-4 py-3">Evento</th>
              <th className="px-4 py-3">Provider</th>
              <th className="px-4 py-3">Stato</th>
              <th className="px-4 py-3">Ricevuto</th>
              <th className="px-4 py-3">Errore</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {!webhookLogs?.length ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">Nessun webhook registrato.</td></tr>
            ) : (
              webhookLogs.map((log) => (
                <tr key={log.id}>
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{log.eventId || `#${log.id}`}</td>
                  <td className="px-4 py-3">{log.provider}</td>
                  <td className="px-4 py-3">
                    <span className={log.status === 'processed' ? 'badge bg-green-100 text-green-700' : log.status === 'error' || log.status.startsWith('invalid') ? 'badge bg-red-100 text-red-700' : 'badge bg-yellow-100 text-yellow-700'}>
                      {log.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{new Date(log.createdAt).toLocaleString('it-IT')}</td>
                  <td className="px-4 py-3 text-gray-500">{log.error || '-'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
