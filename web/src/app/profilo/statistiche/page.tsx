'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { BarChart3, Eye, Phone, MessageSquare, Package, HandCoins, TrendingUp, Euro } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { sellerStatsApi } from '@/lib/api';

interface SellerStats {
  ads: { total: number; published: number; sold: number };
  engagement: { views: number; callClicks: number; messageClicks: number };
  orders: {
    total: number; pending: number; accepted: number; shipped: number;
    completed: number; cancelled: number; revenue: string | number;
  };
  offers: { total: number; pending: number; accepted: number };
  conversionPercent: number | null;
  topAds: {
    id: number; name: string; price: string; views: number; callClicks: number;
    messageClicks: number; published: number; sold: number; creationTime: string;
    _count: { orders: number; offers: number; wishlists: number };
  }[];
}

function formatMoney(value: string | number) {
  return `€${parseFloat(String(value)).toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function StatisticheVenditorePage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) router.replace('/login');
  }, [user, isLoading, router]);

  const { data: stats } = useQuery({
    queryKey: ['seller-stats'],
    queryFn: () => sellerStatsApi.getMyStats().then((r) => r.data as SellerStats),
    enabled: !!user,
  });

  if (!user) return null;
  if (!stats) return <div className="max-w-5xl mx-auto px-4 py-8 text-gray-400">Caricamento…</div>;

  const cards = [
    { icon: Eye, label: 'Visite totali', value: stats.engagement.views.toLocaleString('it-IT'), tone: 'text-blue-600 bg-blue-50' },
    { icon: Phone, label: 'Click "Chiama"', value: stats.engagement.callClicks.toLocaleString('it-IT'), tone: 'text-green-600 bg-green-50' },
    { icon: MessageSquare, label: 'Click "Messaggio"', value: stats.engagement.messageClicks.toLocaleString('it-IT'), tone: 'text-purple-600 bg-purple-50' },
    { icon: Package, label: 'Ordini completati', value: `${stats.orders.completed}/${stats.orders.total}`, tone: 'text-brand bg-brand/10' },
    { icon: Euro, label: 'Ricavi da ordini', value: formatMoney(stats.orders.revenue), tone: 'text-emerald-600 bg-emerald-50' },
    { icon: HandCoins, label: 'Offerte da gestire', value: String(stats.offers.pending), tone: 'text-amber-600 bg-amber-50' },
    { icon: TrendingUp, label: 'Conversione visite→vendite', value: stats.conversionPercent !== null ? `${stats.conversionPercent}%` : '—', tone: 'text-cyan-600 bg-cyan-50' },
    { icon: BarChart3, label: 'Annunci attivi', value: `${stats.ads.published}/${stats.ads.total}`, tone: 'text-gray-600 bg-gray-100' },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 sm:px-6">
      <div className="flex items-center gap-2 mb-6">
        <BarChart3 className="w-5 h-5 text-brand" />
        <h1>Statistiche vendite</h1>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map((c) => (
          <div key={c.label} className="card p-4">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center mb-2 ${c.tone}`}>
              <c.icon className="w-4.5 h-4.5" />
            </div>
            <p className="text-2xl font-bold">{c.value}</p>
            <p className="text-xs text-gray-500">{c.label}</p>
          </div>
        ))}
      </div>

      {stats.orders.pending > 0 && (
        <div className="card p-4 mb-8 border-amber-200 bg-amber-50 flex items-center justify-between gap-4">
          <p className="text-sm text-amber-800">
            Hai {stats.orders.pending} {stats.orders.pending === 1 ? 'ordine in attesa' : 'ordini in attesa'} di risposta.
          </p>
          <Link href="/profilo/acquisti-vendite" className="btn-primary text-sm whitespace-nowrap">Gestisci</Link>
        </div>
      )}

      <h2 className="text-base font-semibold mb-3">Performance annunci</h2>
      {!stats.topAds.length ? (
        <div className="card p-12 text-center text-gray-500">
          <p className="mb-3">Non hai ancora pubblicato annunci.</p>
          <Link href="/annunci/nuovo" className="btn-primary inline-flex">Pubblica il primo annuncio</Link>
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-gray-500">
              <tr>
                <th className="px-4 py-3">Annuncio</th>
                <th className="px-4 py-3 text-right">Visite</th>
                <th className="px-4 py-3 text-right">Chiamate</th>
                <th className="px-4 py-3 text-right">Messaggi</th>
                <th className="px-4 py-3 text-right">Preferiti</th>
                <th className="px-4 py-3 text-right">Ordini</th>
                <th className="px-4 py-3 text-right">Offerte</th>
                <th className="px-4 py-3">Stato</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {stats.topAds.map((ad) => (
                <tr key={ad.id}>
                  <td className="px-4 py-3">
                    <Link href={`/annunci/${ad.id}`} className="font-medium hover:text-brand">{ad.name}</Link>
                    <p className="text-xs text-gray-500">{formatMoney(ad.price)}</p>
                  </td>
                  <td className="px-4 py-3 text-right">{ad.views.toLocaleString('it-IT')}</td>
                  <td className="px-4 py-3 text-right">{ad.callClicks}</td>
                  <td className="px-4 py-3 text-right">{ad.messageClicks}</td>
                  <td className="px-4 py-3 text-right">{ad._count.wishlists}</td>
                  <td className="px-4 py-3 text-right">{ad._count.orders}</td>
                  <td className="px-4 py-3 text-right">{ad._count.offers}</td>
                  <td className="px-4 py-3">
                    {ad.sold === 1 ? (
                      <span className="badge bg-gray-100 text-gray-600">Venduto</span>
                    ) : ad.published === 1 ? (
                      <span className="badge bg-green-100 text-green-700">Attivo</span>
                    ) : (
                      <span className="badge bg-yellow-100 text-yellow-700">In moderazione</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {user.isCompany ? (
        <p className="text-xs text-gray-400 mt-4">
          Come account Business hai anche la <Link href="/business/dashboard" className="underline">dashboard Business</Link> con l&apos;andamento mensile.
        </p>
      ) : null}
    </div>
  );
}
