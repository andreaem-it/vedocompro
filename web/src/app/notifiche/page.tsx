'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { usersApi } from '@/lib/api';
import { Bell, MessageSquare, Star, ShoppingBag, Truck } from 'lucide-react';
import clsx from 'clsx';

const TYPE_CONFIG: Record<number, { icon: typeof Bell; label: string }> = {
  1: { icon: MessageSquare, label: 'Nuovo messaggio' },
  2: { icon: Star, label: 'Nuova recensione' },
  3: { icon: ShoppingBag, label: 'Annuncio venduto' },
  4: { icon: Truck, label: 'Ordine spedito' },
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

  useEffect(() => {
    if (data?.unread > 0) {
      usersApi.markNotificationsRead().then(() => queryClient.invalidateQueries({ queryKey: ['notifications'] }));
    }
  }, [data?.unread, queryClient]);

  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 sm:px-6">
      <h1 className="flex items-center gap-2 mb-6"><Bell className="w-6 h-6 text-brand" /> Notifiche</h1>

      {!data?.notifications?.length ? (
        <div className="card p-12 text-center text-gray-500">Nessuna notifica.</div>
      ) : (
        <div className="card divide-y">
          {data.notifications.map((n: any) => {
            const config = TYPE_CONFIG[n.type] ?? { icon: Bell, label: 'Notifica' };
            const Icon = config.icon;
            return (
              <div key={n.id} className={clsx('flex items-center gap-3 p-4', !n.readed && 'bg-brand/5')}>
                <div className="w-9 h-9 rounded-full bg-brand/10 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-brand" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{config.label}</p>
                  <p className="text-xs text-gray-400">{new Date(n.date).toLocaleString('it-IT')}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
