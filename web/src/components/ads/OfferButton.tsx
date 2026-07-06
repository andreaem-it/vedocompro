'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Clock3, HandCoins, MessageSquare, X } from 'lucide-react';
import { offersApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Ad } from '@/types';

type OfferableAd = Pick<Ad, 'id' | 'price'>;

export default function OfferButton({ ad }: { ad: OfferableAd }) {
  const { user } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [offerMessage, setOfferMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const askingPrice = parseFloat(ad.price);
  const numericAmount = parseFloat(amount);
  const suggestedAmounts = [0.9, 0.85, 0.8]
    .map((discount) => Math.max(1, Math.round(askingPrice * discount)))
    .filter((value, index, list) => value < askingPrice && list.indexOf(value) === index);

  const handleSubmit = async () => {
    if (!user) {
      router.push(`/login?redirect=/annunci/${ad.id}`);
      return;
    }
    if (!amount || Number.isNaN(numericAmount) || numericAmount <= 0) {
      setError('Inserisci un importo valido.');
      return;
    }
    if (numericAmount >= askingPrice) {
      setError('Per acquistare al prezzo richiesto usa Compralo subito. L\'offerta deve essere inferiore al prezzo dell\'annuncio.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await offersApi.create(ad.id, { amount, message: offerMessage || undefined });
      setSuccess('Offerta inviata! Il venditore riceverà una notifica e potrà accettare, rifiutare o fare una controproposta.');
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      setError(e.response?.data?.error ?? "Errore durante l'invio dell'offerta");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">{success}</p>;
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="btn-secondary justify-center">
        <HandCoins className="w-4 h-4" /> Fai un&apos;offerta
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6">
      <div className="w-full max-w-md rounded-lg bg-white shadow-xl">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <h2 className="text-base font-semibold">Fai un&apos;offerta</h2>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-full p-1 text-gray-500 hover:bg-gray-100"
            title="Chiudi"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 p-5">
          <div className="rounded-lg border border-gray-200 p-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-gray-500">Prezzo richiesto</span>
              <span className="text-lg font-semibold text-brand">
                €{askingPrice.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <p className="mt-1 text-xs text-gray-500">Proponi un importo inferiore: il venditore potra accettare, rifiutare o rilanciare.</p>
          </div>

          {suggestedAmounts.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-medium uppercase text-gray-500">Suggerimenti rapidi</p>
              <div className="grid grid-cols-3 gap-2">
                {suggestedAmounts.map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setAmount(String(value))}
                    className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${numericAmount === value ? 'border-brand bg-brand/5 text-brand' : 'border-gray-200 text-gray-700 hover:border-brand/50'}`}
                  >
                    €{value.toLocaleString('it-IT')}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center gap-2">
            <span className="text-gray-500">€</span>
            <input
              type="number"
              min={0.01}
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="input flex-1"
              placeholder={`Meno di €${askingPrice.toLocaleString('it-IT', { minimumFractionDigits: 2 })}`}
              autoFocus
            />
          </div>
          <textarea
            value={offerMessage}
            onChange={(e) => setOfferMessage(e.target.value)}
            className="input text-sm min-h-20 resize-none"
            placeholder="Messaggio per il venditore (opzionale)"
          />
          <div className="rounded-lg bg-gray-50 p-3 text-xs text-gray-600">
            <p className="mb-2 font-medium text-gray-900">Cosa succede dopo?</p>
            <div className="space-y-1.5">
              <p className="flex items-center gap-2">
                <MessageSquare className="h-3.5 w-3.5 text-brand" /> Il venditore riceve la tua proposta.
              </p>
              <p className="flex items-center gap-2">
                <Clock3 className="h-3.5 w-3.5 text-brand" /> L&apos;offerta resta valida 7 giorni.
              </p>
              <p className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-green-600" /> Se accetta, completi l&apos;ordine da Le mie offerte.
              </p>
            </div>
          </div>
          {error && <p className="text-xs text-red-600">{error}</p>}
        </div>

        <div className="grid grid-cols-2 gap-2 border-t p-5">
          <button onClick={() => setOpen(false)} className="btn-secondary justify-center text-sm">
            Annulla
          </button>
          <button onClick={handleSubmit} disabled={loading || !amount || numericAmount >= askingPrice} className="btn-primary justify-center text-sm">
            {loading ? 'Invio...' : 'Invia offerta'}
          </button>
        </div>
      </div>
    </div>
  );
}
