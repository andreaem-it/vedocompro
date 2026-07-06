'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Flag, ShieldAlert, X } from 'lucide-react';
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
    <>
      <button type="button" onClick={() => setOpen(true)} className="btn-secondary justify-center text-sm border-red-200 text-red-700 hover:bg-red-50">
        <Flag className="w-4 h-4" /> Segnala
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6">
          <div className="w-full max-w-md rounded-lg bg-white shadow-xl">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <h2 className="flex items-center gap-2 text-base font-semibold">
                <ShieldAlert className="h-5 w-5 text-red-600" />
                Segnala {targetType === 'ad' ? 'annuncio' : 'utente'}
              </h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full p-1 text-gray-500 hover:bg-gray-100"
                title="Chiudi"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 p-5">
              <p className="text-sm text-gray-600">
                Usa la segnalazione solo per problemi reali: truffe, spam, contenuti vietati o informazioni fuorvianti.
              </p>
              <select value={reason} onChange={(e) => setReason(e.target.value)} className="input text-sm bg-white">
                {REASONS.map((item) => (
                  <option key={item.value} value={item.value}>{item.label}</option>
                ))}
              </select>
              <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                className="input min-h-28 bg-white text-sm"
                placeholder="Aggiungi dettagli utili per la moderazione..."
              />
              <div className="rounded-lg bg-red-50 p-3 text-xs text-red-800">
                Il team controllera la segnalazione. Se hai gia acquistato e c&apos;e un problema con l&apos;ordine, usa anche la contestazione da Acquisti e vendite.
              </div>
              {error && <p className="text-xs text-red-600">{error}</p>}
            </div>

            <div className="grid grid-cols-2 gap-2 border-t p-5">
              <button type="button" onClick={() => setOpen(false)} className="btn-secondary justify-center text-sm">
                Annulla
              </button>
              <button type="button" onClick={submit} disabled={submitting} className="btn-primary justify-center text-sm">
                {submitting ? 'Invio...' : 'Invia segnalazione'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
