'use client';

import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { BarChart3 } from 'lucide-react';

export default function AdminStatsPage() {
  const { data } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => adminApi.getStats().then((r) => r.data),
  });

  const stats = data?.stats;

  return (
    <div className="p-8">
      <h1 className="flex items-center gap-2 mb-6"><BarChart3 className="w-6 h-6 text-brand" /> Statistiche piattaforma</h1>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-5">
          <p className="text-sm text-gray-500 mb-1">Utenti registrati</p>
          <p className="text-3xl font-bold">{stats?.users?.toLocaleString('it-IT') ?? '–'}</p>
        </div>
        <div className="card p-5">
          <p className="text-sm text-gray-500 mb-1">Annunci pubblicati</p>
          <p className="text-3xl font-bold">{stats?.ads?.toLocaleString('it-IT') ?? '–'}</p>
        </div>
        <div className="card p-5">
          <p className="text-sm text-gray-500 mb-1">Messaggi scambiati</p>
          <p className="text-3xl font-bold">{stats?.messages?.toLocaleString('it-IT') ?? '–'}</p>
        </div>
        <div className="card p-5">
          <p className="text-sm text-gray-500 mb-1">Transazioni totali</p>
          <p className="text-3xl font-bold">{stats?.totalPayments?.toLocaleString('it-IT') ?? '–'}</p>
        </div>
      </div>

      <div className="card p-5 mt-4">
        <p className="text-sm text-gray-500 mb-1">Revenue complessiva</p>
        <p className="text-3xl font-bold text-brand">€{parseFloat(stats?.totalRevenue ?? '0').toLocaleString('it-IT')}</p>
      </div>
    </div>
  );
}
