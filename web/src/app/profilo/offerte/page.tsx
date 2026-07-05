'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { HandCoins, CheckCircle2, XCircle, RotateCcw } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { offersApi, adsApi } from '@/lib/api';
import { AdOffer, Ad } from '@/types';
import OrderButton from '@/components/ads/OrderButton';

type Tab = 'made' | 'received';

const STATUS_LABELS: Record<AdOffer['status'], { label: string; className: string }> = {
  pending: { label: 'In attesa', className: 'bg-yellow-100 text-yellow-700' },
  countered: { label: 'Controproposta', className: 'bg-blue-100 text-blue-700' },
  accepted: { label: 'Accettata', className: 'bg-green-100 text-green-700' },
  rejected: { label: 'Rifiutata', className: 'bg-red-100 text-red-700' },
  withdrawn: { label: 'Ritirata', className: 'bg-gray-100 text-gray-600' },
  expired: { label: 'Scaduta', className: 'bg-gray-100 text-gray-600' },
};

function formatMoney(value: string | null | undefined) {
  return `€${parseFloat(String(value ?? '0')).toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function agreedAmount(offer: AdOffer): string {
  return offer.counterAmount ?? offer.amount;
}

export default function OffertePage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('made');

  useEffect(() => {
    if (!isLoading && !user) router.replace('/login');
  }, [user, isLoading, router]);

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6">
      <h1 className="mb-6">Le mie offerte</h1>

      <div className="flex gap-2 mb-6 border-b">
        {(['made', 'received'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === t ? 'border-brand text-brand' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t === 'made' ? 'Inviate' : 'Ricevute'}
          </button>
        ))}
      </div>

      <OffersList role={tab} />
    </div>
  );
}

function OffersList({ role }: { role: Tab }) {
  const queryClient = useQueryClient();
  const { data: offers } = useQuery({
    queryKey: ['my-offers', role],
    queryFn: () => offersApi.listMine(role).then((r) => r.data as AdOffer[]),
  });
  const [counterDrafts, setCounterDrafts] = useState<Record<number, string>>({});
  const [error, setError] = useState('');

  const respond = useMutation({
    mutationFn: ({ id, action, counterAmount }: { id: number; action: 'accept' | 'reject' | 'counter' | 'withdraw'; counterAmount?: string }) =>
      offersApi.respond(id, { action, counterAmount }),
    onSuccess: () => {
      setError('');
      queryClient.invalidateQueries({ queryKey: ['my-offers'] });
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { error?: string } } };
      setError(e.response?.data?.error ?? 'Errore');
    },
  });

  if (!offers?.length) {
    return (
      <div className="card p-12 text-center text-gray-500">
        <HandCoins className="w-10 h-10 mx-auto mb-3 text-gray-300" />
        <p>{role === 'made' ? 'Non hai ancora inviato offerte.' : 'Non hai ricevuto offerte.'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
      {offers.map((o) => {
        const status = STATUS_LABELS[o.status];
        return (
          <div key={o.id} className="card p-5 space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div>
                <Link href={`/annunci/${o.ad.id}`} className="font-semibold hover:text-brand">{o.ad.name}</Link>
                <p className="text-sm text-gray-500">
                  Prezzo richiesto {formatMoney(o.ad.price)} · offerta <span className="font-semibold text-gray-700">{formatMoney(o.amount)}</span>
                  {o.counterAmount && (
                    <> · controproposta <span className="font-semibold text-gray-700">{formatMoney(o.counterAmount)}</span></>
                  )}
                </p>
                <p className="text-xs text-gray-500">
                  {role === 'made' ? `Venditore: ${o.seller.username}` : `Da: ${o.buyer.username}`}
                  {' · '}scade il {new Date(o.expiresAt).toLocaleDateString('it-IT')}
                </p>
              </div>
              <span className={`badge ${status.className}`}>{status.label}</span>
            </div>

            {o.message && <p className="text-sm text-gray-600 bg-gray-50 border rounded-lg p-3">{o.message}</p>}
            {o.sellerMessage && (
              <p className="text-sm text-gray-600 bg-blue-50 border border-blue-100 rounded-lg p-3">
                Venditore: {o.sellerMessage}
              </p>
            )}

            {/* Azioni venditore su offerta in attesa */}
            {role === 'received' && o.status === 'pending' && (
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => respond.mutate({ id: o.id, action: 'accept' })} className="btn-primary text-xs">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Accetta {formatMoney(o.amount)}
                  </button>
                  <button onClick={() => respond.mutate({ id: o.id, action: 'reject' })} className="btn-secondary text-xs">
                    <XCircle className="w-3.5 h-3.5" /> Rifiuta
                  </button>
                </div>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min={0.01}
                    step="0.01"
                    className="input text-sm flex-1"
                    placeholder="Controproposta €"
                    value={counterDrafts[o.id] ?? ''}
                    onChange={(e) => setCounterDrafts((prev) => ({ ...prev, [o.id]: e.target.value }))}
                  />
                  <button
                    onClick={() => respond.mutate({ id: o.id, action: 'counter', counterAmount: counterDrafts[o.id] })}
                    disabled={!counterDrafts[o.id]}
                    className="btn-secondary text-xs"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Controproponi
                  </button>
                </div>
              </div>
            )}

            {/* Azioni compratore */}
            {role === 'made' && o.status === 'countered' && (
              <div className="flex flex-wrap gap-2">
                <button onClick={() => respond.mutate({ id: o.id, action: 'accept' })} className="btn-primary text-xs">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Accetta controproposta {formatMoney(o.counterAmount)}
                </button>
                <button onClick={() => respond.mutate({ id: o.id, action: 'reject' })} className="btn-secondary text-xs">
                  <XCircle className="w-3.5 h-3.5" /> Rifiuta
                </button>
              </div>
            )}
            {role === 'made' && (o.status === 'pending' || o.status === 'countered') && (
              <button onClick={() => respond.mutate({ id: o.id, action: 'withdraw' })} className="btn-secondary text-xs">
                Ritira offerta
              </button>
            )}

            {/* Offerta accettata: il compratore completa l'ordine al prezzo concordato */}
            {role === 'made' && o.status === 'accepted' && !o.orderId && (
              <AcceptedOfferCheckout offer={o} />
            )}
            {o.status === 'accepted' && o.orderId && (
              <p className="text-sm text-green-700">
                Ordine creato — <Link href="/profilo/acquisti-vendite" className="underline">vai agli ordini</Link>
              </p>
            )}
            {role === 'received' && o.status === 'accepted' && !o.orderId && (
              <p className="text-sm text-gray-600">
                In attesa che il compratore completi l&apos;ordine a {formatMoney(agreedAmount(o))}.
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}

// L'ordine da offerta ha bisogno dei dati completi dell'annuncio (spedizione, località)
// che la lista offerte non include: li carica on-demand all'apertura del checkout.
function AcceptedOfferCheckout({ offer }: { offer: AdOffer }) {
  const [open, setOpen] = useState(false);
  const { data: ad } = useQuery({
    queryKey: ['ad', String(offer.ad.id)],
    queryFn: () => adsApi.getById(offer.ad.id).then((r) => r.data as Ad),
    enabled: open,
  });

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="btn-primary text-sm">
        Completa l&apos;ordine a {formatMoney(agreedAmount(offer))}
      </button>
    );
  }
  if (!ad) return <p className="text-sm text-gray-500">Caricamento…</p>;
  return <OrderButton ad={ad} offerId={offer.id} agreedPrice={agreedAmount(offer)} />;
}
