'use client';

import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';

export default function AdminPaymentsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-payments'],
    queryFn: () => adminApi.listPayments().then((r) => r.data),
  });

  const total = data?.reduce((sum: number, p: any) => sum + parseFloat(p.price), 0) ?? 0;

  return (
    <div className="p-8">
      <h1 className="mb-2">Pagamenti</h1>
      <p className="text-gray-500 mb-6">Totale incassato: <strong className="text-gray-900">€{total.toLocaleString('it-IT')}</strong></p>

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
    </div>
  );
}
