'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { BellPlus } from 'lucide-react';
import { savedSearchesApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

// Salva i filtri di ricerca correnti come alert: l'utente riceve una notifica
// quando vengono pubblicati nuovi annunci compatibili (cron orario lato API).
export default function SaveSearchButton({ params }: { params: Record<string, string> }) {
  const { user } = useAuth();
  const router = useRouter();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const hasFilters = ['q', 'category', 'region', 'provincia', 'condition', 'minPrice', 'maxPrice']
    .some((k) => params[k]);

  if (!hasFilters) return null;

  const handleSave = async () => {
    if (!user) {
      router.push('/login?redirect=/annunci');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await savedSearchesApi.create({
        q: params.q,
        categoryId: params.category,
        region: params.region,
        provincia: params.provincia,
        condition: params.condition,
        minPrice: params.minPrice,
        maxPrice: params.maxPrice,
      });
      setSaved(true);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      setError(e.response?.data?.error ?? 'Errore durante il salvataggio');
    } finally {
      setLoading(false);
    }
  };

  if (saved) {
    return (
      <p className="text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg px-2.5 py-1.5">
        Ricerca salvata! Riceverai una notifica per i nuovi annunci compatibili.
      </p>
    );
  }

  return (
    <div>
      <button onClick={handleSave} disabled={loading} className="btn-secondary w-full justify-center text-sm">
        <BellPlus className="w-4 h-4" /> {loading ? 'Salvataggio…' : 'Salva ricerca e avvisami'}
      </button>
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}
