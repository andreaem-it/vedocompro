'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { usersApi } from '@/lib/api';
import { Bell, MessageSquare, Star, CheckCircle2, XCircle, ThumbsUp, HeadphonesIcon, ShoppingBag, Truck, ClipboardList, Video, TrendingDown, MessageSquarePlus, Flag, HandCoins, Scale, BellRing } from 'lucide-react';
import clsx from 'clsx';

// Numerazione centralizzata in api/src/constants/notifications.ts (NotificationType) —
// tenere sincronizzata se cambia lì.
const TYPE_CONFIG: Record<number, { icon: typeof Bell; label: string; tone: string }> = {
  1: { icon: MessageSquare, label: 'Nuovo messaggio', tone: 'text-blue-600 bg-blue-50' },
  2: { icon: Star, label: 'Nuova recensione', tone: 'text-yellow-600 bg-yellow-50' },
  3: { icon: CheckCircle2, label: 'Annuncio approvato', tone: 'text-green-600 bg-green-50' },
  4: { icon: XCircle, label: 'Annuncio non approvato', tone: 'text-red-600 bg-red-50' },
  5: { icon: ThumbsUp, label: 'Nuovo feedback', tone: 'text-brand bg-brand/10' },
  6: { icon: HeadphonesIcon, label: 'Risposta al ticket di supporto', tone: 'text-purple-600 bg-purple-50' },
  10: { icon: Video, label: 'Nuovo video da moderare', tone: 'text-indigo-600 bg-indigo-50' },
  11: { icon: ClipboardList, label: 'Nuovo annuncio da moderare', tone: 'text-indigo-600 bg-indigo-50' },
  12: { icon: HeadphonesIcon, label: 'Nuova risposta al ticket di supporto', tone: 'text-purple-600 bg-purple-50' },
  13: { icon: ShoppingBag, label: 'Aggiornamento ordine', tone: 'text-brand bg-brand/10' },
  14: { icon: Truck, label: 'Aggiornamento vendita', tone: 'text-orange-600 bg-orange-50' },
  15: { icon: TrendingDown, label: 'Promozione scaduta', tone: 'text-amber-600 bg-amber-50' },
  16: { icon: MessageSquarePlus, label: 'Lascia un feedback', tone: 'text-teal-600 bg-teal-50' },
  17: { icon: CheckCircle2, label: 'Account Business approvato', tone: 'text-green-600 bg-green-50' },
  18: { icon: XCircle, label: 'Richiesta Business non approvata', tone: 'text-red-600 bg-red-50' },
  19: { icon: Flag, label: 'Nuova segnalazione', tone: 'text-red-600 bg-red-50' },
  20: { icon: HandCoins, label: 'Nuova offerta ricevuta', tone: 'text-emerald-600 bg-emerald-50' },
  21: { icon: HandCoins, label: 'Aggiornamento offerta', tone: 'text-emerald-600 bg-emerald-50' },
  22: { icon: Scale, label: 'Contestazione aperta', tone: 'text-rose-600 bg-rose-50' },
  23: { icon: Scale, label: 'Aggiornamento contestazione', tone: 'text-rose-600 bg-rose-50' },
  24: { icon: BellRing, label: 'Nuovi annunci per la tua ricerca salvata', tone: 'text-cyan-600 bg-cyan-50' },
};

export default function NotifichePage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!isLoading && !user) router.replace('/login');
  }, [user, isLoading, router]);

  const { data } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => usersApi.getNotifications().then((r) => r.data),
    enabled: !!user,
  });

  const openMutation = useMutation({
    mutationFn: (id: number) => usersApi.openNotification(id),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      router.push(res.data.href ?? '/notifiche');
    },
  });

  const markAllMutation = useMutation({
    mutationFn: () => usersApi.markNotificationsRead(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 sm:px-6">
      <div className="flex items-center justify-between gap-4 mb-6">
        <h1 className="flex items-center gap-2"><Bell className="w-6 h-6 text-brand" /> Notifiche</h1>
        {data?.unread > 0 && (
          <button onClick={() => markAllMutation.mutate()} className="btn-secondary text-sm" disabled={markAllMutation.isPending}>
            Segna tutte come lette
          </button>
        )}
      </div>

      {!data?.notifications?.length ? (
        <div className="card p-12 text-center text-gray-500">
          <Bell className="w-8 h-8 mx-auto mb-3 text-gray-300" />
          Nessuna notifica.
        </div>
      ) : (
        <div className="card divide-y">
          {data.notifications.map((n: any) => {
            const config = TYPE_CONFIG[n.type] ?? { icon: Bell, label: 'Notifica', tone: 'text-brand bg-brand/10' };
            const Icon = config.icon;
            return (
              <button
                key={n.id}
                onClick={() => openMutation.mutate(n.id)}
                className={clsx('relative w-full text-left flex items-center gap-3 p-4 transition-colors hover:bg-gray-50', !n.readed && 'bg-brand/5')}
              >
                {!n.readed && <span className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-brand" />}
                <div className={clsx('w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0', config.tone)}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={clsx('text-sm', !n.readed ? 'font-semibold text-gray-900' : 'font-medium text-gray-700')}>
                    {config.label}
                  </p>
                  <p className="text-xs text-gray-400">{new Date(n.date).toLocaleString('it-IT')}</p>
                </div>
                {!n.readed && <span className="badge bg-brand text-white flex-shrink-0">Nuova</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
