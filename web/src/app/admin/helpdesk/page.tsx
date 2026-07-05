'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { HeadphonesIcon, Send, UserCheck, CheckCircle2, RotateCcw } from 'lucide-react';
import clsx from 'clsx';

interface AdminTicket {
  id: number;
  title: string;
  message: string;
  closed: number;
  assignedTo: number | null;
  timest: string;
  user?: { id: number; username: string; email: string };
  replies?: AdminTicketReply[];
}

interface AdminTicketReply {
  id: number;
  message: string;
  timest: string;
  user?: { id: number; username: string; email: string; isAdmin: boolean };
}

const TABS = [
  { status: 0, label: 'Aperti' },
  { status: 2, label: 'Assegnati' },
  { status: 1, label: 'Chiusi' },
];

export default function AdminHelpDeskPage() {
  const [status, setStatus] = useState(0);
  const [replyDrafts, setReplyDrafts] = useState<Record<number, string>>({});
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-helpdesk', status],
    queryFn: () => adminApi.listHelpDesk(status).then((r) => r.data as AdminTicket[]),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: { closed?: number; assignedTo?: number | null } }) =>
      adminApi.updateHelpDesk(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-helpdesk'] }),
  });

  const replyMutation = useMutation({
    mutationFn: ({ id, message }: { id: number; message: string }) => adminApi.replyHelpdesk(id, message),
    onSuccess: (_, { id }) => {
      setReplyDrafts((prev) => ({ ...prev, [id]: '' }));
      queryClient.invalidateQueries({ queryKey: ['admin-helpdesk'] });
    },
  });

  return (
    <div className="p-8">
      <div className="flex items-center gap-2 mb-6">
        <HeadphonesIcon className="w-5 h-5 text-brand" />
        <h1>Help Desk</h1>
      </div>

      <div className="flex gap-2 mb-6 border-b">
        {TABS.map((t) => (
          <button
            key={t.status}
            onClick={() => setStatus(t.status)}
            className={clsx(
              'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
              status === t.status ? 'border-brand text-brand' : 'border-transparent text-gray-500 hover:text-gray-700',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="text-gray-400">Caricamento...</div>
      ) : !data?.length ? (
        <div className="card p-12 text-center text-gray-500">Nessun ticket in questo vassoio.</div>
      ) : (
        <div className="space-y-3">
          {data.map((ticket) => (
            <div key={ticket.id} className="card p-4">
              <div className="flex items-start justify-between gap-4 mb-2">
                <div>
                  <h3 className="text-base font-medium">{ticket.title}</h3>
                  <p className="text-xs text-gray-400">
                    Da {ticket.user?.username} ({ticket.user?.email}) — {new Date(ticket.timest).toLocaleDateString('it-IT')}
                  </p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  {ticket.closed !== 2 && (
                    <button
                      onClick={() => updateMutation.mutate({ id: ticket.id, data: { closed: 2 } })}
                      className="btn-secondary text-xs"
                      title="Assegna a te"
                    >
                      <UserCheck className="w-3.5 h-3.5" /> Assegna
                    </button>
                  )}
                  {ticket.closed !== 1 ? (
                    <button
                      onClick={() => updateMutation.mutate({ id: ticket.id, data: { closed: 1 } })}
                      className="btn-secondary text-xs text-green-700 border-green-200 hover:bg-green-50"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Chiudi
                    </button>
                  ) : (
                    <button
                      onClick={() => updateMutation.mutate({ id: ticket.id, data: { closed: 0 } })}
                      className="btn-secondary text-xs"
                    >
                      <RotateCcw className="w-3.5 h-3.5" /> Riapri
                    </button>
                  )}
                </div>
              </div>

              <p className="text-sm text-gray-600 mb-3">{ticket.message}</p>

              {ticket.replies && ticket.replies.length > 0 && (
                <div className="space-y-2 mb-3">
                  {ticket.replies.map((reply) => (
                    <div
                      key={reply.id}
                      className={clsx(
                        'rounded border p-3 text-sm',
                        reply.user?.isAdmin ? 'border-brand/20 bg-brand/5' : 'border-gray-200 bg-gray-50',
                      )}
                    >
                      <p className="text-xs font-medium text-gray-500 mb-1">
                        {reply.user?.isAdmin ? 'Staff' : reply.user?.username ?? 'Utente'} · {new Date(reply.timest).toLocaleDateString('it-IT')}
                      </p>
                      <p className="text-gray-700 whitespace-pre-wrap">{reply.message}</p>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-2">
                <input
                  value={replyDrafts[ticket.id] ?? ''}
                  onChange={(e) => setReplyDrafts((prev) => ({ ...prev, [ticket.id]: e.target.value }))}
                  placeholder="Rispondi al ticket..."
                  className="input text-sm flex-1"
                />
                <button
                  onClick={() => replyMutation.mutate({ id: ticket.id, message: replyDrafts[ticket.id] ?? '' })}
                  disabled={!replyDrafts[ticket.id]?.trim() || replyMutation.isPending}
                  className="btn-primary px-3"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
