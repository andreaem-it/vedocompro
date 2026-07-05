'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { BarChart3, Eye, FileText, Phone, MessageSquare, Plus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { businessApi } from '@/lib/api';
import { BusinessDashboardResponse } from '@/types';

export default function BusinessDashboardPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && (!user || !user.isCompany)) router.replace('/business');
  }, [user, isLoading, router]);

  const { data } = useQuery({
    queryKey: ['business-dashboard'],
    queryFn: () => businessApi.dashboard().then((r) => r.data as BusinessDashboardResponse),
    enabled: !!user?.isCompany,
  });

  if (!user?.isCompany) return null;

  const cards = [
    { label: 'Annunci', value: data?.stats.ads ?? 0, icon: FileText },
    { label: 'Visualizzazioni', value: data?.stats.views ?? 0, icon: Eye },
    { label: 'Click telefono', value: data?.stats.callClicks ?? 0, icon: Phone },
    { label: 'Click messaggi', value: data?.stats.messageClicks ?? 0, icon: MessageSquare },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 sm:px-6">
      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="flex items-center gap-2"><BarChart3 className="w-6 h-6 text-brand" /> Dashboard Business</h1>
          <p className="text-sm text-gray-500">
            Scadenza pacchetto: {data?.businessEnd ? new Date(data.businessEnd).toLocaleDateString('it-IT') : 'non impostata'}
          </p>
        </div>
        <Link href="/annunci/nuovo" className="btn-primary">
          <Plus className="w-4 h-4" /> Nuovo annuncio
        </Link>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map(({ label, value, icon: Icon }) => (
          <div key={label} className="card p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{label}</p>
                <p className="text-3xl font-bold">{value.toLocaleString('it-IT')}</p>
              </div>
              <Icon className="w-9 h-9 text-brand/40" />
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card p-5">
          <h2 className="text-lg font-semibold mb-4">Ultimi 12 mesi</h2>
          <div className="space-y-3">
            {data?.monthly.map((row) => {
              const total = row.views + row.calls + row.messages;
              return (
                <div key={row.month}>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{row.month}</span>
                    <span className="text-gray-500">{total} interazioni</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-brand" style={{ width: `${Math.min(100, total * 4)}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b">
            <h2 className="text-lg font-semibold">Annunci recenti</h2>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-gray-500">
              <tr>
                <th className="px-4 py-3">Annuncio</th>
                <th className="px-4 py-3">Visite</th>
                <th className="px-4 py-3">Contatti</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {!data?.recentAds.length ? (
                <tr><td colSpan={3} className="px-4 py-8 text-center text-gray-400">Nessun annuncio pubblicato.</td></tr>
              ) : data.recentAds.map((ad) => (
                <tr key={ad.id}>
                  <td className="px-4 py-3">
                    <Link href={`/annunci/${ad.id}`} className="font-medium hover:text-brand">{ad.name}</Link>
                    <p className="text-xs text-gray-400">{ad.published === 1 ? 'Pubblicato' : 'In moderazione'}</p>
                  </td>
                  <td className="px-4 py-3">{ad.views}</td>
                  <td className="px-4 py-3">{ad.callClicks + ad.messageClicks}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
