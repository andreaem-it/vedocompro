'use client';

import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { Users, FileText, MessageSquare, Euro, LayoutDashboard, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface Stats {
  users: number;
  ads: number;
  messages: number;
  totalRevenue: string;
  totalPayments: number;
}

export default function AdminDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => adminApi.getStats().then((r) => r.data),
  });

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-48" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-32 bg-gray-200 rounded-xl" />)}
          </div>
        </div>
      </div>
    );
  }

  const stats = data?.stats as Stats;

  // Pattern "small-box" AdminLTE: colore di sfondo distintivo per categoria
  // (blu utenti, verde annunci, giallo messaggi, viola fatturato).
  const cards = [
    { label: 'Utenti totali', value: stats?.users.toLocaleString('it-IT'), icon: Users, color: 'bg-blue-500', href: '/admin/utenti' },
    { label: 'Annunci attivi', value: stats?.ads.toLocaleString('it-IT'), icon: FileText, color: 'bg-green-500', href: '/admin/annunci' },
    { label: 'Messaggi', value: stats?.messages.toLocaleString('it-IT'), icon: MessageSquare, color: 'bg-yellow-500', href: '#' },
    { label: 'Revenue totale', value: `€${parseFloat(stats?.totalRevenue ?? '0').toLocaleString('it-IT')}`, icon: Euro, color: 'bg-purple-500', href: '/admin/pagamenti' },
  ];

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center gap-3 mb-6">
        <LayoutDashboard className="w-6 h-6 text-brand" />
        <div>
          <h1 className="text-2xl">Dashboard</h1>
          <p className="text-sm text-gray-500">Statistiche</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map(({ label, value, icon: Icon, color, href }) => (
          <div key={label} className={`admin-small-box ${color}`}>
            <div className="flex items-start justify-between p-4">
              <div>
                <p className="text-3xl font-bold leading-tight">{value}</p>
                <p className="text-sm text-white/90 mt-1">{label}</p>
              </div>
              <Icon className="w-12 h-12 text-white/30" strokeWidth={1.5} />
            </div>
            <Link
              href={href}
              className="flex items-center justify-between px-4 py-2 text-sm bg-black/10 hover:bg-black/20 transition-colors"
            >
              Vedi tutti <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent users */}
        <div className="admin-box">
          <div className="admin-box-header">
            <h3 className="admin-box-title">Nuovi utenti</h3>
            <Link href="/admin/utenti" className="text-sm text-brand hover:underline">Vedi tutti</Link>
          </div>
          <div className="admin-box-body space-y-3">
            {data?.recentUsers?.map((u: { id: number; username: string; email: string; createdAt: string; isAdmin: boolean }) => (
              <div key={u.id} className="flex items-center justify-between text-sm">
                <div>
                  <span className="font-medium">{u.username}</span>
                  <span className="text-gray-400 ml-2">{u.email}</span>
                </div>
                <span className="text-gray-400">{new Date(u.createdAt).toLocaleDateString('it-IT')}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent ads */}
        <div className="admin-box">
          <div className="admin-box-header">
            <h3 className="admin-box-title">Annunci recenti</h3>
            <Link href="/admin/annunci" className="text-sm text-brand hover:underline">Vedi tutti</Link>
          </div>
          <div className="admin-box-body space-y-3">
            {data?.recentAds?.map((ad: { id: number; name: string; price: string; user: { username: string }; published: number; creationTime: string }) => (
              <div key={ad.id} className="flex items-center justify-between text-sm">
                <div>
                  <Link href={`/annunci/${ad.id}`} className="font-medium hover:text-brand">{ad.name}</Link>
                  <span className="text-gray-400 ml-2">@{ad.user.username}</span>
                </div>
                <span className="font-medium">€{parseFloat(ad.price).toLocaleString('it-IT')}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
