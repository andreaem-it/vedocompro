'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Paperclip, Scale, Send, X } from 'lucide-react';
import { disputesApi } from '@/lib/api';
import { Dispute } from '@/types';

const DISPUTE_STATUS_LABELS: Record<Dispute['status'], { label: string; className: string }> = {
  open: { label: 'Aperta', className: 'bg-yellow-100 text-yellow-700' },
  under_review: { label: 'In valutazione', className: 'bg-blue-100 text-blue-700' },
  resolved_buyer: { label: 'Risolta a favore del compratore', className: 'bg-green-100 text-green-700' },
  resolved_seller: { label: 'Risolta a favore del venditore', className: 'bg-green-100 text-green-700' },
  closed: { label: 'Chiusa', className: 'bg-gray-100 text-gray-600' },
};

const REASONS = [
  'Oggetto non ricevuto',
  'Oggetto non conforme alla descrizione',
  'Oggetto danneggiato',
  'Pagamento non ricevuto',
  'Altro',
];

// Contestazione ordine: mostrata sotto un ordine accettato/spedito/completato,
// sia lato compratore sia lato venditore.
export default function DisputeSection({ orderId, hasDispute }: { orderId: number; hasDispute?: boolean }) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: dispute } = useQuery({
    queryKey: ['dispute', orderId],
    queryFn: () => disputesApi.getByOrder(orderId).then((r) => r.data as Dispute),
    enabled: open || !!hasDispute,
    retry: false,
  });

  if (!open && !dispute) {
    return (
      <button onClick={() => setOpen(true)} className="btn-secondary text-xs text-rose-700 border-rose-200 hover:bg-rose-50">
        <Scale className="w-3.5 h-3.5" /> {hasDispute ? 'Vedi contestazione' : 'Contesta ordine'}
      </button>
    );
  }

  if (dispute) {
    return <DisputeView dispute={dispute} onChanged={() => queryClient.invalidateQueries({ queryKey: ['dispute', orderId] })} />;
  }

  return <DisputeForm orderId={orderId} onCancel={() => setOpen(false)} onCreated={() => queryClient.invalidateQueries({ queryKey: ['dispute', orderId] })} />;
}

function DisputeForm({ orderId, onCancel, onCreated }: { orderId: number; onCancel: () => void; onCreated: () => void }) {
  const [reason, setReason] = useState(REASONS[0]);
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  const openDispute = useMutation({
    mutationFn: () => disputesApi.open(orderId, { reason, description }),
    onSuccess: onCreated,
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { error?: string } } };
      setError(e.response?.data?.error ?? 'Errore');
    },
  });

  return (
    <div className="w-full space-y-2 rounded-lg border border-rose-200 bg-rose-50/50 p-3">
      <p className="text-sm font-medium text-rose-800 flex items-center gap-1.5">
        <Scale className="w-4 h-4" /> Apri una contestazione
      </p>
      <select value={reason} onChange={(e) => setReason(e.target.value)} className="input text-sm">
        {REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
      </select>
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="input text-sm min-h-20"
        placeholder="Descrivi il problema (minimo 20 caratteri). Un admin esaminerà la contestazione."
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
      <div className="flex gap-2">
        <button onClick={onCancel} className="btn-secondary text-xs">Annulla</button>
        <button
          onClick={() => openDispute.mutate()}
          disabled={openDispute.isPending || description.trim().length < 20}
          className="btn-primary text-xs"
        >
          Invia contestazione
        </button>
      </div>
    </div>
  );
}

export function DisputeView({ dispute, onChanged, canModerate, onModerate }: {
  dispute: Dispute;
  onChanged: () => void;
  canModerate?: boolean;
  onModerate?: (status: string, adminDecision: string) => void;
}) {
  const [draft, setDraft] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [decision, setDecision] = useState('');
  const [error, setError] = useState('');
  const status = DISPUTE_STATUS_LABELS[dispute.status];
  const isClosed = ['resolved_buyer', 'resolved_seller', 'closed'].includes(dispute.status);

  const reply = useMutation({
    mutationFn: () => disputesApi.addMessage(dispute.id, draft, attachments),
    onSuccess: () => { setDraft(''); setAttachments([]); setError(''); onChanged(); },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { error?: string } } };
      setError(e.response?.data?.error ?? 'Errore');
    },
  });

  return (
    <div className="w-full space-y-3 rounded-lg border border-gray-200 p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium flex items-center gap-1.5">
            <Scale className="w-4 h-4 text-rose-600" /> Contestazione: {dispute.reason}
          </p>
          <p className="text-xs text-gray-500">
            Aperta da {dispute.openedBy.username} il {new Date(dispute.createdAt).toLocaleDateString('it-IT')}
          </p>
        </div>
        <span className={`badge ${status.className}`}>{status.label}</span>
      </div>

      <p className="text-sm text-gray-600 bg-gray-50 border rounded-lg p-3">{dispute.description}</p>

      {dispute.messages.length > 0 && (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {dispute.messages.map((m) => (
            <div key={m.id} className={`text-sm rounded-lg p-2.5 ${m.isAdmin ? 'bg-purple-50 border border-purple-100' : 'bg-gray-50 border'}`}>
              <p className="text-xs font-medium text-gray-700 mb-0.5">
                {m.user.username}{m.isAdmin && ' (staff)'} · {new Date(m.createdAt).toLocaleString('it-IT')}
              </p>
              <p className="text-gray-600">{m.message}</p>
              {!!m.attachments?.length && (
                <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {m.attachments.map((file) => (
                    <a
                      key={file.id}
                      href={file.url}
                      target="_blank"
                      rel="noreferrer"
                      className="group block overflow-hidden rounded border bg-white"
                    >
                      <img src={file.url} alt={file.fileName} className="h-24 w-full object-cover transition-opacity group-hover:opacity-80" />
                      <span className="block truncate px-2 py-1 text-xs text-gray-500">{file.fileName}</span>
                    </a>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {dispute.adminDecision && (
        <p className="text-sm bg-purple-50 border border-purple-200 rounded-lg p-3">
          <span className="font-medium">Decisione admin:</span> {dispute.adminDecision}
        </p>
      )}

      {!isClosed && (
        <div className="space-y-2">
          <div className="flex gap-2">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              className="input text-sm flex-1"
              placeholder="Scrivi un messaggio…"
            />
            <label className="btn-secondary text-sm cursor-pointer">
              <Paperclip className="w-3.5 h-3.5" />
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                multiple
                className="hidden"
                onChange={(e) => setAttachments(Array.from(e.target.files ?? []).slice(0, 5))}
              />
            </label>
            <button onClick={() => reply.mutate()} disabled={(!draft.trim() && attachments.length === 0) || reply.isPending} className="btn-secondary text-sm">
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {attachments.map((file, index) => (
                <span key={`${file.name}-${index}`} className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-600">
                  {file.name}
                  <button type="button" onClick={() => setAttachments((prev) => prev.filter((_, i) => i !== index))}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      )}
      {error && <p className="text-xs text-red-600">{error}</p>}

      {canModerate && onModerate && !isClosed && (
        <div className="space-y-2 border-t pt-3">
          <textarea
            value={decision}
            onChange={(e) => setDecision(e.target.value)}
            className="input text-sm min-h-16"
            placeholder="Motivazione della decisione (obbligatoria per risolvere)"
          />
          <div className="flex flex-wrap gap-2">
            {dispute.status === 'open' && (
              <button onClick={() => onModerate('under_review', decision)} className="btn-secondary text-xs">Prendi in carico</button>
            )}
            <button onClick={() => onModerate('resolved_buyer', decision)} disabled={!decision.trim()} className="btn-primary text-xs">
              Risolvi pro compratore
            </button>
            <button onClick={() => onModerate('resolved_seller', decision)} disabled={!decision.trim()} className="btn-primary text-xs">
              Risolvi pro venditore
            </button>
            <button onClick={() => onModerate('closed', decision)} className="btn-secondary text-xs">Chiudi senza esito</button>
          </div>
        </div>
      )}
    </div>
  );
}
