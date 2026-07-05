'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { HandCoins, X } from 'lucide-react';
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

  const handleSubmit = async () => {
    if (!user) {
      router.push(`/login?redirect=/annunci/${ad.id}`);
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

        <div className="space-y-3 p-5">
          <p className="text-sm text-gray-600">Proponi un prezzo inferiore a quello richiesto.</p>
          <div className="flex items-center gap-2">
            <span className="text-gray-500">€</span>
            <input
              type="number"
              min={0.01}
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="input flex-1"
              placeholder={`Meno di €${parseFloat(ad.price).toLocaleString('it-IT', { minimumFractionDigits: 2 })}`}
              autoFocus
            />
          </div>
          <textarea
            value={offerMessage}
            onChange={(e) => setOfferMessage(e.target.value)}
            className="input text-sm min-h-20 resize-none"
            placeholder="Messaggio per il venditore (opzionale)"
          />
          <p className="text-xs text-gray-500">
            L&apos;offerta resta valida 7 giorni. Se il venditore accetta, potrai completare
            l&apos;ordine al prezzo concordato dalla pagina &quot;Le mie offerte&quot;.
          </p>
          {error && <p className="text-xs text-red-600">{error}</p>}
        </div>

        <div className="grid grid-cols-2 gap-2 border-t p-5">
          <button onClick={() => setOpen(false)} className="btn-secondary justify-center text-sm">
            Annulla
          </button>
          <button onClick={handleSubmit} disabled={loading || !amount} className="btn-primary justify-center text-sm">
            {loading ? 'Invio...' : 'Invia offerta'}
          </button>
        </div>
      </div>
    </div>
  );
}
