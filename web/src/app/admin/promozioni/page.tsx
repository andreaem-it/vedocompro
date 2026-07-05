'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi, api } from '@/lib/api';
import { AlertTriangle, BarChart3, Eye, Megaphone, MessageCircle, Phone, Plus, Star, Trash2 } from 'lucide-react';
import { PromotionPackage } from '@/types';
import clsx from 'clsx';

const LEVEL_LABELS: Record<string, string> = {
  gold: 'Gold',
  silver: 'Silver',
  bronze: 'Bronze',
  none: 'Scaduta',
};

const LEVEL_CLASSES: Record<string, string> = {
  gold: 'bg-yellow-100 text-yellow-800',
  silver: 'bg-gray-200 text-gray-700',
  bronze: 'bg-orange-100 text-orange-800',
  none: 'bg-gray-100 text-gray-600',
};

type PromotionAd = {
  id: number;
  name: string;
  price: string;
  views: number;
  callClicks: number;
  messageClicks: number;
  contacts: number;
  currentLevel: string;
  activeUntil: string | null;
  creationTime: string;
  updateTime: string;
  category: { name: string };
  user: { id: number; username: string; email: string };
  _count: { wishlists: number; orders: number; offers: number };
};

type PromotionResponse = {
  stats: {
    activeTotal: number;
    goldActive: number;
    silverActive: number;
    bronzeActive: number;
    expiringSoon: number;
    last30: {
      activations: number;
      revenueEur: string;
      creditsSpent: number;
      byPackage: Array<{
        packageKey: string;
        packageName: string;
        activations: number;
        revenueEur: string;
        creditsSpent: number;
      }>;
    };
  };
  ads: PromotionAd[];
  pagination: { page: number; pages: number; total: number };
};

const EMPTY_PACKAGE = {
  key: '',
  name: '',
  level: 1,
  creditType: 'bronze',
  creditCost: 1,
  durationDays: 1,
  priceEur: '0',
  autoRenewAvailable: false,
  isActive: true,
  sortOrder: 10,
};

type PromotionPackageForm = typeof EMPTY_PACKAGE & { id?: number | null };

export default function AdminPromotionsPage() {
  const [status, setStatus] = useState<'active' | 'expired'>('active');
  const [page, setPage] = useState(1);
  const [tab, setTab] = useState<'report' | 'packages'>('report');
  const [editing, setEditing] = useState<PromotionPackageForm>(EMPTY_PACKAGE);
  const [formError, setFormError] = useState('');
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-promotions', status, page],
    queryFn: () => api.get<PromotionResponse>('/admin/promotions', { params: { status, page: String(page) } }).then((r) => r.data),
  });

  const { data: packages } = useQuery({
    queryKey: ['admin-promotion-packages'],
    queryFn: () => adminApi.listPromotionPackages().then((r) => r.data as PromotionPackage[]),
  });

  const savePackage = useMutation({
    mutationFn: () => editing.id
      ? adminApi.updatePromotionPackage(editing.id, editing)
      : adminApi.createPromotionPackage(editing),
    onSuccess: () => {
      setEditing(EMPTY_PACKAGE);
      setFormError('');
      queryClient.invalidateQueries({ queryKey: ['admin-promotion-packages'] });
      queryClient.invalidateQueries({ queryKey: ['promotion-packages'] });
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { error?: string } } };
      setFormError(e.response?.data?.error ?? 'Salvataggio non riuscito');
    },
  });

  const deletePackage = useMutation({
    mutationFn: (id: number) => adminApi.deletePromotionPackage(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-promotion-packages'] });
      queryClient.invalidateQueries({ queryKey: ['promotion-packages'] });
    },
  });

  const stats = data?.stats;

  return (
    <div className="p-8">
      <div className="flex items-center gap-3 mb-6">
        <Megaphone className="w-6 h-6 text-brand" />
        <div>
          <h1>Promozioni annunci</h1>
          <p className="text-sm text-gray-500">Controllo operativo su livelli, scadenze e performance.</p>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 xl:grid-cols-5 gap-4 mb-6">
        <div className="admin-small-box bg-brand">
          <div className="p-4 flex items-start justify-between">
            <div>
              <p className="text-3xl font-bold">{stats?.activeTotal ?? '-'}</p>
              <p className="text-sm text-white/90">Attive</p>
            </div>
            <Megaphone className="w-10 h-10 text-white/30" />
          </div>
        </div>
        <div className="admin-small-box bg-yellow-500">
          <div className="p-4 flex items-start justify-between">
            <div>
              <p className="text-3xl font-bold">{stats?.goldActive ?? '-'}</p>
              <p className="text-sm text-white/90">Gold</p>
            </div>
            <Star className="w-10 h-10 text-white/30" />
          </div>
        </div>
        <div className="admin-small-box bg-gray-500">
          <div className="p-4">
            <p className="text-3xl font-bold">{stats?.silverActive ?? '-'}</p>
            <p className="text-sm text-white/90">Silver</p>
          </div>
        </div>
        <div className="admin-small-box bg-orange-500">
          <div className="p-4">
            <p className="text-3xl font-bold">{stats?.bronzeActive ?? '-'}</p>
            <p className="text-sm text-white/90">Bronze</p>
          </div>
        </div>
        <div className="admin-small-box bg-red-500">
          <div className="p-4 flex items-start justify-between">
            <div>
              <p className="text-3xl font-bold">{stats?.expiringSoon ?? '-'}</p>
              <p className="text-sm text-white/90">In scadenza 72h</p>
            </div>
            <AlertTriangle className="w-10 h-10 text-white/30" />
          </div>
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        <div className="card p-4">
          <p className="text-xs uppercase text-gray-500 font-semibold">Attivazioni 30 giorni</p>
          <p className="text-2xl font-bold text-gray-900">{stats?.last30.activations ?? '-'}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs uppercase text-gray-500 font-semibold">Ricavo campagne 30 giorni</p>
          <p className="text-2xl font-bold text-gray-900">€{Number(stats?.last30.revenueEur ?? 0).toLocaleString('it-IT', { minimumFractionDigits: 2 })}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs uppercase text-gray-500 font-semibold">Crediti spesi 30 giorni</p>
          <p className="text-2xl font-bold text-gray-900">{stats?.last30.creditsSpent ?? '-'}</p>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        {[
          { label: 'Report', value: 'report' as const },
          { label: 'Pacchetti', value: 'packages' as const },
        ].map((item) => (
          <button key={item.value} onClick={() => setTab(item.value)} className={tab === item.value ? 'btn-primary text-sm' : 'btn-secondary text-sm'}>
            {item.label}
          </button>
        ))}
      </div>

      {tab === 'packages' ? (
        <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
          <div className="card p-5 space-y-4">
            <h2 className="text-lg font-semibold">{editing.id ? 'Modifica pacchetto' : 'Nuovo pacchetto'}</h2>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Chiave</label>
                <input value={editing.key} onChange={(e) => setEditing({ ...editing, key: e.target.value })} className="input text-sm" placeholder="gold_30" />
              </div>
              <div>
                <label className="label">Nome</label>
                <input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} className="input text-sm" placeholder="Gold 30 giorni" />
              </div>
              <div>
                <label className="label">Livello</label>
                <select value={editing.level} onChange={(e) => setEditing({ ...editing, level: Number(e.target.value) })} className="input text-sm">
                  <option value={1}>Bronze</option>
                  <option value={2}>Silver</option>
                  <option value={3}>Gold</option>
                </select>
              </div>
              <div>
                <label className="label">Credito</label>
                <select value={editing.creditType} onChange={(e) => setEditing({ ...editing, creditType: e.target.value })} className="input text-sm">
                  <option value="bronze">Bronze</option>
                  <option value="silver">Silver</option>
                  <option value="gold">Gold</option>
                </select>
              </div>
              <div>
                <label className="label">Costo crediti</label>
                <input type="number" min={1} value={editing.creditCost} onChange={(e) => setEditing({ ...editing, creditCost: Number(e.target.value) })} className="input text-sm" />
              </div>
              <div>
                <label className="label">Durata giorni</label>
                <input type="number" min={1} value={editing.durationDays} onChange={(e) => setEditing({ ...editing, durationDays: Number(e.target.value) })} className="input text-sm" />
              </div>
              <div>
                <label className="label">Prezzo EUR</label>
                <input value={editing.priceEur} onChange={(e) => setEditing({ ...editing, priceEur: e.target.value })} className="input text-sm" />
              </div>
              <div>
                <label className="label">Ordine</label>
                <input type="number" value={editing.sortOrder} onChange={(e) => setEditing({ ...editing, sortOrder: Number(e.target.value) })} className="input text-sm" />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" checked={editing.isActive} onChange={(e) => setEditing({ ...editing, isActive: e.target.checked })} />
              Attivo
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" checked={editing.autoRenewAvailable} onChange={(e) => setEditing({ ...editing, autoRenewAvailable: e.target.checked })} />
              Rinnovo automatico disponibile
            </label>
            {formError && <p className="text-sm text-red-600">{formError}</p>}
            <div className="flex gap-2">
              <button type="button" onClick={() => savePackage.mutate()} disabled={savePackage.isPending} className="btn-primary text-sm">
                <Plus className="w-4 h-4" /> {savePackage.isPending ? 'Salvataggio...' : 'Salva'}
              </button>
              {editing.id && (
                <button type="button" onClick={() => setEditing(EMPTY_PACKAGE)} className="btn-secondary text-sm">Annulla</button>
              )}
            </div>
          </div>

          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-gray-500">
                <tr>
                  <th className="px-4 py-3">Pacchetto</th>
                  <th className="px-4 py-3">Costo</th>
                  <th className="px-4 py-3">Durata</th>
                  <th className="px-4 py-3">Stato</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {!packages?.length ? (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">Nessun pacchetto configurato: il sistema usa i default legacy.</td></tr>
                ) : (
                  packages.map((pkg) => (
                    <tr key={pkg.id ?? pkg.key}>
                      <td className="px-4 py-3">
                        <button type="button" onClick={() => setEditing({ ...pkg, id: pkg.id, isActive: pkg.isActive ?? true })} className="font-medium hover:text-brand">{pkg.name}</button>
                        <p className="text-xs text-gray-500">{pkg.key} · livello {pkg.level}</p>
                      </td>
                      <td className="px-4 py-3">{pkg.creditCost} {pkg.creditType} · €{Number(pkg.priceEur).toLocaleString('it-IT', { minimumFractionDigits: 2 })}</td>
                      <td className="px-4 py-3">{pkg.durationDays} giorni</td>
                      <td className="px-4 py-3">
                        <span className={pkg.isActive ? 'badge bg-green-100 text-green-700' : 'badge bg-gray-100 text-gray-600'}>{pkg.isActive ? 'Attivo' : 'Disattivo'}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {pkg.id && (
                          <button type="button" onClick={() => deletePackage.mutate(pkg.id!)} className="text-red-600 hover:text-red-700" title="Elimina o disattiva">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <>

      <div className="flex gap-2 mb-4">
        {[
          { label: 'Attive', value: 'active' as const },
          { label: 'Scadute', value: 'expired' as const },
        ].map((filter) => (
          <button
            key={filter.value}
            onClick={() => { setStatus(filter.value); setPage(1); }}
            className={status === filter.value ? 'btn-primary text-sm' : 'btn-secondary text-sm'}
          >
            {filter.label}
          </button>
        ))}
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="px-4 py-3">Annuncio</th>
              <th className="px-4 py-3">Venditore</th>
              <th className="px-4 py-3">Livello</th>
              <th className="px-4 py-3">Performance</th>
              <th className="px-4 py-3">Interazioni</th>
              <th className="px-4 py-3">Scadenza</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">Caricamento...</td></tr>
            ) : !data?.ads.length ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">Nessuna promozione trovata.</td></tr>
            ) : (
              data.ads.map((ad) => (
                <tr key={ad.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link href={`/annunci/${ad.id}`} className="font-medium hover:text-brand">{ad.name}</Link>
                    <p className="text-xs text-gray-500">{ad.category.name} · €{parseFloat(ad.price).toLocaleString('it-IT')}</p>
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/utenti/${ad.user.id}`} className="font-medium hover:text-brand">@{ad.user.username}</Link>
                    <p className="text-xs text-gray-500">{ad.user.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={clsx('badge', LEVEL_CLASSES[ad.currentLevel] ?? LEVEL_CLASSES.none)}>
                      {LEVEL_LABELS[ad.currentLevel] ?? ad.currentLevel}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-3 text-gray-600">
                      <span className="inline-flex items-center gap-1"><Eye className="w-4 h-4" /> {ad.views}</span>
                      <span className="inline-flex items-center gap-1"><Phone className="w-4 h-4" /> {ad.callClicks}</span>
                      <span className="inline-flex items-center gap-1"><MessageCircle className="w-4 h-4" /> {ad.messageClicks}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <span className="badge bg-blue-50 text-blue-700">{ad._count.wishlists} preferiti</span>
                      <span className="badge bg-green-50 text-green-700">{ad._count.orders} ordini</span>
                      <span className="badge bg-purple-50 text-purple-700">{ad._count.offers} offerte</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {ad.activeUntil ? new Date(ad.activeUntil).toLocaleString('it-IT') : 'Scaduta'}
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

      <div className="admin-box mt-6">
        <div className="admin-box-header">
          <h3 className="admin-box-title flex items-center gap-2"><BarChart3 className="w-4 h-4 text-brand" /> Lettura dei dati</h3>
        </div>
        <div className="admin-box-body text-sm text-gray-600">
          I dati usano i contatori già disponibili sugli annunci: visite, click telefono, click messaggi, preferiti, ordini e offerte. Il report non modifica annunci o crediti.
        </div>
      </div>
        </>
      )}
    </div>
  );
}
