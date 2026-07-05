'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { helpdeskApi } from '@/lib/api';
import { HelpDeskTicket } from '@/types';
import { HeadphonesIcon, ChevronDown, ChevronUp, Send, Plus } from 'lucide-react';
import clsx from 'clsx';

const TICKET_TYPES: Record<number, string> = {
  1: 'Problema tecnico',
  2: 'Pagamenti',
  3: 'Annunci',
  4: 'Account',
  5: 'Altro',
};

export default function HelpdeskPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [replyText, setReplyText] = useState('');
  const [form, setForm] = useState({ type: 1, title: '', message: '' });

  useEffect(() => {
    if (!isLoading && !user) router.replace('/login');
  }, [user, isLoading, router]);

  const { data: tickets } = useQuery({
    queryKey: ['helpdesk-tickets'],
    queryFn: () => helpdeskApi.getMyTickets().then((r) => r.data as HelpDeskTicket[]),
    enabled: !!user,
  });

  const createMutation = useMutation({
    mutationFn: (data: { type: number; title: string; message: string }) =>
      helpdeskApi.createTicket(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['helpdesk-tickets'] });
      setShowForm(false);
      setForm({ type: 1, title: '', message: '' });
    },
  });

  const replyMutation = useMutation({
    mutationFn: ({ id, message }: { id: number; message: string }) =>
      helpdeskApi.replyToTicket(id, message),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['helpdesk-tickets'] });
      setReplyText('');
    },
  });

  if (!user) return null;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 sm:px-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="flex items-center gap-2">
          <HeadphonesIcon className="w-6 h-6 text-brand" /> Supporto
        </h1>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary text-sm">
          <Plus className="w-4 h-4" /> Nuovo ticket
        </button>
      </div>

      {showForm && (
        <div className="card p-5 mb-6 space-y-4">
          <h2 className="text-base font-semibold">Crea nuovo ticket</h2>
          <div>
            <label className="label">Tipo problema</label>
            <select
              value={form.type}
              onChange={(e) => setForm((f) => ({ ...f, type: parseInt(e.target.value, 10) }))}
              className="input"
            >
              {Object.entries(TICKET_TYPES).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Oggetto</label>
            <input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              className="input"
              placeholder="Descrivi brevemente il problema"
            />
          </div>
          <div>
            <label className="label">Messaggio</label>
            <textarea
              value={form.message}
              onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
              rows={5}
              className="input resize-none"
              placeholder="Descrivi il problema in dettaglio..."
            />
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowForm(false)} className="btn-secondary text-sm">Annulla</button>
            <button
              onClick={() => createMutation.mutate(form)}
              disabled={!form.title || !form.message || createMutation.isPending}
              className="btn-primary text-sm"
            >
              {createMutation.isPending ? 'Invio...' : 'Invia ticket'}
            </button>
          </div>
        </div>
      )}

      {!tickets?.length ? (
        <div className="card p-12 text-center text-gray-500">
          <p className="mb-2">Nessun ticket aperto.</p>
          <p className="text-sm">Crea un ticket se hai bisogno di assistenza.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tickets.map((ticket) => (
            <div key={ticket.id} className="card overflow-hidden">
              <button
                className="w-full text-left flex items-center justify-between p-4 hover:bg-gray-50"
                onClick={() => setExpandedId(expandedId === ticket.id ? null : ticket.id)}
              >
                <div className="flex items-center gap-3 flex-wrap">
                  <span className={clsx(
                    'badge',
                    ticket.closed === 1 ? 'bg-gray-100 text-gray-600' : ticket.closed === 2 ? 'bg-blue-50 text-blue-700' : 'bg-green-100 text-green-700',
                  )}>
                    {ticket.closed === 1 ? 'Chiuso' : ticket.closed === 2 ? 'Assegnato' : 'Aperto'}
                  </span>
                  <span className="badge bg-blue-50 text-blue-700">{TICKET_TYPES[ticket.type]}</span>
                  <span className="font-medium text-sm">{ticket.title}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-400 flex-shrink-0">
                  <span>{new Date(ticket.timest).toLocaleDateString('it-IT')}</span>
                  {expandedId === ticket.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </button>

              {expandedId === ticket.id && (
                <div className="border-t px-4 pb-4">
                  <div className="py-3 text-sm text-gray-700 whitespace-pre-wrap">{ticket.message}</div>

                  {ticket.replies && ticket.replies.length > 0 && (
                    <div className="space-y-2 mt-2">
                      {ticket.replies.map((reply) => (
                        <div key={reply.id} className="bg-brand/5 border border-brand/20 rounded-lg p-3 text-sm">
                          <p className="text-xs font-medium text-brand mb-1">Risposta del supporto</p>
                          <p className="text-gray-700">{reply.message}</p>
                          <p className="text-xs text-gray-400 mt-1">{new Date(reply.timest).toLocaleDateString('it-IT')}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {ticket.closed !== 1 && (
                    <div className="flex gap-2 mt-3">
                      <input
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Aggiungi una risposta..."
                        className="input text-sm flex-1"
                        onKeyDown={(e) => e.key === 'Enter' && replyText.trim() && replyMutation.mutate({ id: ticket.id, message: replyText })}
                      />
                      <button
                        onClick={() => replyMutation.mutate({ id: ticket.id, message: replyText })}
                        disabled={!replyText.trim() || replyMutation.isPending}
                        className="btn-primary px-3"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
