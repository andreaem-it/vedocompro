'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Flag } from 'lucide-react';
import { reportsApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

const REASONS = [
  { value: 'fraud', label: 'Possibile truffa' },
  { value: 'spam', label: 'Spam o comportamento molesto' },
  { value: 'prohibited', label: 'Contenuto vietato' },
  { value: 'wrong_info', label: 'Informazioni false o fuorvianti' },
  { value: 'other', label: 'Altro' },
];

export default function ReportButton({ targetType, targetId }: { targetType: 'ad' | 'user'; targetId: number }) {
  const { user } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState(REASONS[0].value);
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const submit = async () => {
    if (!user) {
      router.push('/login');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      if (targetType === 'ad') await reportsApi.reportAd(targetId, { reason, details });
      else await reportsApi.reportUser(targetId, { reason, details });
      setMessage('Segnalazione inviata. Il team la controllerà.');
      setOpen(false);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      setError(e.response?.data?.error ?? 'Errore durante la segnalazione.');
    } finally {
      setSubmitting(false);
    }
  };

  if (message) {
    return <span className="text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">{message}</span>;
  }

  return (
    <div className="w-full space-y-2">
      <button type="button" onClick={() => setOpen((v) => !v)} className="btn-secondary text-sm border-red-200 text-red-700 hover:bg-red-50">
        <Flag className="w-4 h-4" /> Segnala
      </button>

      {open && (
        <div className="rounded-lg border border-red-100 bg-red-50/40 p-3 space-y-2">
          <select value={reason} onChange={(e) => setReason(e.target.value)} className="input text-sm bg-white">
            {REASONS.map((item) => (
              <option key={item.value} value={item.value}>{item.label}</option>
            ))}
          </select>
          <textarea
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            className="input text-sm min-h-20 bg-white"
            placeholder="Aggiungi dettagli utili per la moderazione..."
          />
          {error && <p className="text-xs text-red-600">{error}</p>}
          <div className="flex gap-2">
            <button type="button" onClick={submit} disabled={submitting} className="btn-primary text-sm">
              {submitting ? 'Invio...' : 'Invia segnalazione'}
            </button>
            <button type="button" onClick={() => setOpen(false)} className="btn-secondary text-sm">
              Annulla
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
