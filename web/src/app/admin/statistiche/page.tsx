'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { BarChart3, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import clsx from 'clsx';

interface KpiPeriod {
  newUsers: number;
  newAds: number;
  ordersCreated: number;
  ordersCompleted: number;
  gmv: string | number;
  promoRevenue: string | number;
  promoCount: number;
  messages: number;
  offers: number;
  orderConversionPercent: number | null;
}

interface KpiResponse {
  days: number;
  current: KpiPeriod;
  previous: KpiPeriod;
}

const PERIODS = [
  { days: 7, label: '7 giorni' },
  { days: 30, label: '30 giorni' },
  { days: 90, label: '90 giorni' },
  { days: 365, label: '12 mesi' },
];

function formatMoney(value: string | number) {
  return `€${parseFloat(String(value)).toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function Delta({ current, previous }: { current: number; previous: number }) {
  if (previous === 0 && current === 0) return <span className="text-xs text-gray-400 flex items-center gap-0.5"><Minus className="w-3 h-3" /> stabile</span>;
  if (previous === 0) return <span className="text-xs text-green-600 flex items-center gap-0.5"><TrendingUp className="w-3 h-3" /> nuovo</span>;
  const pct = Math.round(((current - previous) / previous) * 100);
  if (pct === 0) return <span className="text-xs text-gray-400 flex items-center gap-0.5"><Minus className="w-3 h-3" /> stabile</span>;
  const positive = pct > 0;
  return (
    <span className={clsx('text-xs flex items-center gap-0.5', positive ? 'text-green-600' : 'text-red-500')}>
      {positive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
      {positive ? '+' : ''}{pct}% vs periodo prec.
    </span>
  );
}

export default function AdminStatsPage() {
  const [days, setDays] = useState(30);

  const { data: totals } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => adminApi.getStats().then((r) => r.data),
  });

  const { data: kpi } = useQuery({
    queryKey: ['admin-kpi', days],
    queryFn: () => adminApi.getKpi(days).then((r) => r.data as KpiResponse),
  });

  const stats = totals?.stats;
  const c = kpi?.current;
  const p = kpi?.previous;

  const kpiCards = c && p ? [
    { label: 'Nuovi utenti', value: c.newUsers.toLocaleString('it-IT'), delta: <Delta current={c.newUsers} previous={p.newUsers} /> },
    { label: 'Annunci pubblicati', value: c.newAds.toLocaleString('it-IT'), delta: <Delta current={c.newAds} previous={p.newAds} /> },
    { label: 'Ordini creati', value: c.ordersCreated.toLocaleString('it-IT'), delta: <Delta current={c.ordersCreated} previous={p.ordersCreated} /> },
    { label: 'Ordini completati', value: c.ordersCompleted.toLocaleString('it-IT'), delta: <Delta current={c.ordersCompleted} previous={p.ordersCompleted} /> },
    { label: 'GMV (valore ordini completati)', value: formatMoney(c.gmv), delta: <Delta current={parseFloat(String(c.gmv))} previous={parseFloat(String(p.gmv))} /> },
    { label: 'Ricavi promozioni', value: formatMoney(c.promoRevenue), delta: <Delta current={parseFloat(String(c.promoRevenue))} previous={parseFloat(String(p.promoRevenue))} /> },
    { label: 'Messaggi scambiati', value: c.messages.toLocaleString('it-IT'), delta: <Delta current={c.messages} previous={p.messages} /> },
    { label: 'Offerte inviate', value: c.offers.toLocaleString('it-IT'), delta: <Delta current={c.offers} previous={p.offers} /> },
  ] : [];

  return (
    <div className="p-8">
      <h1 className="flex items-center gap-2 mb-6"><BarChart3 className="w-6 h-6 text-brand" /> Statistiche piattaforma</h1>

      {/* KPI periodo */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold">KPI marketplace</h2>
        <div className="flex gap-1">
          {PERIODS.map((per) => (
            <button
              key={per.days}
              onClick={() => setDays(per.days)}
              className={clsx(
                'px-3 py-1.5 text-xs font-medium rounded-lg transition-colors',
                days === per.days ? 'bg-brand text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
              )}
            >
              {per.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        {kpiCards.length === 0 ? (
          Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="card p-5 animate-pulse"><div className="h-14 bg-gray-100 rounded" /></div>
          ))
        ) : (
          kpiCards.map((card) => (
            <div key={card.label} className="card p-5">
              <p className="text-sm text-gray-500 mb-1">{card.label}</p>
              <p className="text-2xl font-bold">{card.value}</p>
              {card.delta}
            </div>
          ))
        )}
      </div>

      {c && (
        <div className="card p-5 mb-8">
          <p className="text-sm text-gray-500 mb-1">Conversione ordini (completati / creati)</p>
          <p className="text-2xl font-bold text-brand">
            {c.orderConversionPercent !== null ? `${c.orderConversionPercent}%` : '—'}
          </p>
        </div>
      )}

      {/* Totali storici */}
      <h2 className="text-base font-semibold mb-4">Totali storici</h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-5">
          <p className="text-sm text-gray-500 mb-1">Utenti registrati</p>
          <p className="text-3xl font-bold">{stats?.users?.toLocaleString('it-IT') ?? '–'}</p>
        </div>
        <div className="card p-5">
          <p className="text-sm text-gray-500 mb-1">Annunci totali</p>
          <p className="text-3xl font-bold">{stats?.ads?.toLocaleString('it-IT') ?? '–'}</p>
        </div>
        <div className="card p-5">
          <p className="text-sm text-gray-500 mb-1">Messaggi scambiati</p>
          <p className="text-3xl font-bold">{stats?.messages?.toLocaleString('it-IT') ?? '–'}</p>
        </div>
        <div className="card p-5">
          <p className="text-sm text-gray-500 mb-1">Transazioni promozioni</p>
          <p className="text-3xl font-bold">{stats?.totalPayments?.toLocaleString('it-IT') ?? '–'}</p>
        </div>
      </div>

      <div className="card p-5 mt-4">
        <p className="text-sm text-gray-500 mb-1">Revenue promozioni complessiva</p>
        <p className="text-3xl font-bold text-brand">€{parseFloat(stats?.totalRevenue ?? '0').toLocaleString('it-IT')}</p>
      </div>
    </div>
  );
}
