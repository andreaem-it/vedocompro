'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, useMemo, Suspense } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { usersApi } from '@/lib/api';
import { Message } from '@/types';
import { AlertTriangle, MessageSquare, Package, Search, Send, ShieldCheck } from 'lucide-react';
import clsx from 'clsx';
import Link from 'next/link';
import Image from 'next/image';

function Avatar({ username, pic, size = 40 }: { username: string; pic: string | null; size?: number }) {
  if (pic) {
    return (
      <Image
        src={pic}
        alt={username}
        width={size}
        height={size}
        className="rounded-full object-cover flex-shrink-0"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <div
      className="rounded-full bg-brand/10 text-brand font-semibold flex items-center justify-center flex-shrink-0"
      style={{ width: size, height: size, fontSize: size / 2.4 }}
    >
      {username[0]?.toUpperCase()}
    </div>
  );
}

function MessagesContent() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) router.replace('/login');
  }, [user, isLoading, router]);

  const { data: messages } = useQuery({
    queryKey: ['messages'],
    queryFn: () => usersApi.getMessages().then((r) => r.data as Message[]),
    enabled: !!user,
    refetchInterval: 15000,
  });

  // Group messages into conversations by the other participant
  const conversations = useMemo(() => {
    if (!messages || !user) return [];
    const map = new Map<number, { otherUser: Message['fromUser']; lastMessage: Message; messages: Message[]; unreadCount: number }>();
    for (const m of messages) {
      const other = m.fromUser.id === user.id ? m.toUser : m.fromUser;
      const existing = map.get(other.id);
      if (existing) {
        existing.messages.push(m);
        if (new Date(m.datetime) > new Date(existing.lastMessage.datetime)) existing.lastMessage = m;
      } else {
        map.set(other.id, { otherUser: other, lastMessage: m, messages: [m], unreadCount: 0 });
      }
    }
    for (const conv of map.values()) {
      conv.unreadCount = conv.messages.filter((m) => m.fromUser.id !== user.id && m.isRead === 0).length;
    }
    return Array.from(map.values()).sort((a, b) => new Date(b.lastMessage.datetime).getTime() - new Date(a.lastMessage.datetime).getTime());
  }, [messages, user]);

  const toParam = searchParams.get('to');
  const [activeUserId, setActiveUserId] = useState<number | null>(toParam ? parseInt(toParam, 10) : null);

  const selectedUserId = activeUserId ?? conversations[0]?.otherUser.id ?? null;
  const activeConversation = conversations.find((c) => c.otherUser.id === selectedUserId);
  const adId = searchParams.get('ad');
  const activeMessages = activeConversation
    ? [...activeConversation.messages].sort((a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime())
    : [];
  const activeAd =
    activeMessages.find((m) => (adId ? m.ad?.id === parseInt(adId, 10) : false))?.ad ??
    activeMessages.find((m) => m.ad)?.ad ??
    null;
  const canWrite = !!selectedUserId;

  const handleSend = async () => {
    if (!text.trim() || !selectedUserId) return;
    setSending(true);
    try {
      await usersApi.sendMessage({ toUserId: selectedUserId, message: text.trim(), adId: adId ? parseInt(adId, 10) : undefined });
      setText('');
      queryClient.invalidateQueries({ queryKey: ['messages'] });
    } finally {
      setSending(false);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 sm:px-6">
      <h1 className="flex items-center gap-2 mb-6"><MessageSquare className="w-6 h-6 text-brand" /> Messaggi</h1>

      <div className="card flex h-[600px] overflow-hidden">
        {/* Conversation list */}
        <div className="w-80 border-r flex-shrink-0 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="p-6 text-center text-sm text-gray-500">Nessuna conversazione.</div>
          ) : (
            conversations.map((c) => (
              <button
                key={c.otherUser.id}
                onClick={() => setActiveUserId(c.otherUser.id)}
                className={clsx(
                  'w-full text-left px-4 py-3 border-b flex items-center gap-3 hover:bg-gray-50 transition-colors',
                  selectedUserId === c.otherUser.id && 'bg-brand/5 border-l-2 border-l-brand',
                )}
              >
                <Avatar username={c.otherUser.username} pic={c.otherUser.pic} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className={clsx('text-sm truncate', c.unreadCount > 0 ? 'font-semibold text-gray-900' : 'font-medium text-gray-700')}>
                      {c.otherUser.username}
                    </p>
                    <span className="text-[11px] text-gray-400 flex-shrink-0">
                      {new Date(c.lastMessage.datetime).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <p className={clsx('text-xs truncate', c.unreadCount > 0 ? 'text-gray-700 font-medium' : 'text-gray-500')}>
                      {c.lastMessage.ad && <span className="text-gray-400">Re: {c.lastMessage.ad.name} — </span>}
                      {c.lastMessage.message}
                    </p>
                    {c.unreadCount > 0 && (
                      <span className="flex-shrink-0 min-w-[18px] h-[18px] px-1 rounded-full bg-brand text-white text-[10px] font-semibold flex items-center justify-center">
                        {c.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>

        {/* Active conversation */}
        <div className="flex-1 flex flex-col bg-gray-50/50">
          {!canWrite ? (
            <div className="flex-1 flex items-center justify-center p-6">
              <div className="max-w-sm text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-brand/10">
                  <MessageSquare className="h-6 w-6 text-brand" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900">Nessuna conversazione selezionata</h2>
                <p className="mt-2 text-sm text-gray-500">
                  Apri una conversazione esistente oppure parti da un annuncio per chiedere dettagli al venditore.
                </p>
                <Link href="/annunci" className="btn-primary mt-4 inline-flex items-center gap-2">
                  <Search className="h-4 w-4" />
                  Cerca annunci
                </Link>
              </div>
            </div>
          ) : (
            <>
              <div className="border-b bg-white">
                <div className="px-4 py-3 flex items-center gap-3">
                  {activeConversation ? (
                    <>
                      <Avatar username={activeConversation.otherUser.username} pic={activeConversation.otherUser.pic} size={32} />
                      <div className="min-w-0">
                        <Link href={`/utenti/${activeConversation.otherUser.id}`} className="font-medium hover:text-brand">
                          {activeConversation.otherUser.username}
                        </Link>
                        {activeAd && (
                          <Link href={`/annunci/${activeAd.id}`} className="mt-0.5 flex items-center gap-1 text-xs text-gray-500 hover:text-brand">
                            <Package className="h-3.5 w-3.5" />
                            <span className="truncate">Annuncio: {activeAd.name}</span>
                          </Link>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900">Nuova conversazione</p>
                      <p className="text-xs text-gray-500">Scrivi il primo messaggio al venditore.</p>
                    </div>
                  )}
                </div>
                <div className="border-t bg-amber-50 px-4 py-2 text-xs text-amber-900 flex gap-2">
                  <ShieldCheck className="mt-0.5 h-4 w-4 flex-shrink-0" />
                  <p>
                    Per sicurezza resta su VedoCompro, evita pagamenti fuori piattaforma e non condividere codici o documenti non necessari.
                  </p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {activeMessages.length === 0 ? (
                  <div className="flex h-full items-center justify-center">
                    <div className="max-w-sm rounded-lg border border-dashed bg-white p-5 text-center">
                      <AlertTriangle className="mx-auto mb-3 h-6 w-6 text-amber-500" />
                      <h2 className="text-sm font-semibold text-gray-900">Prima di iniziare</h2>
                      <p className="mt-1 text-sm text-gray-500">
                        Fai domande chiare su condizioni, disponibilita e consegna. Se concludi, usa Compralo subito o un metodo tracciabile.
                      </p>
                    </div>
                  </div>
                ) : (
                  activeMessages.map((m) => (
                    <div key={m.id} className={clsx('flex', m.fromUser.id === user.id ? 'justify-end' : 'justify-start')}>
                      <div className={clsx('max-w-xs px-4 py-2 rounded-2xl text-sm shadow-sm', m.fromUser.id === user.id ? 'bg-brand text-white' : 'bg-white text-gray-900')}>
                        {m.ad && (
                          <Link
                            href={`/annunci/${m.ad.id}`}
                            className={clsx('mb-1 block text-xs underline-offset-2 hover:underline', m.fromUser.id === user.id ? 'opacity-75' : 'text-gray-400')}
                          >
                            Re: {m.ad.name}
                          </Link>
                        )}
                        {m.message}
                        <p className={clsx('text-[10px] mt-1 text-right', m.fromUser.id === user.id ? 'opacity-70' : 'text-gray-400')}>
                          {new Date(m.datetime).toLocaleString('it-IT', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="border-t p-3 flex gap-2 bg-white">
                <input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder={activeAd ? `Scrivi su ${activeAd.name}...` : 'Scrivi un messaggio...'}
                  className="input"
                />
                <button onClick={handleSend} disabled={sending || !text.trim()} className="btn-primary px-4">
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MessaggiPage() {
  return <Suspense><MessagesContent /></Suspense>;
}
