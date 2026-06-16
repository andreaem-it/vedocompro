'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Settings, Heart, MessageSquare, FileText, Award } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { usersApi } from '@/lib/api';
import AdCard from '@/components/ads/AdCard';

export default function ProfiloPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) router.replace('/login');
  }, [user, isLoading, router]);

  const { data: myAds } = useQuery({
    queryKey: ['my-ads', user?.id],
    queryFn: () => usersApi.getMyAds().then((r) => r.data),
    enabled: !!user,
  });

  if (!user) return null;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 sm:px-6">
      {/* Profile header */}
      <div className="card p-6 mb-6 flex items-center gap-6 flex-wrap">
        {user.pic ? (
          <Image src={user.pic} alt={user.username} width={80} height={80} className="rounded-full object-cover" />
        ) : (
          <div className="w-20 h-20 rounded-full bg-brand/10 flex items-center justify-center text-2xl font-bold text-brand">
            {user.username[0].toUpperCase()}
          </div>
        )}

        <div className="flex-1">
          <h1 className="mb-1">{user.realname || user.name}</h1>
          <p className="text-gray-500">@{user.username}</p>
          {user.isCompany ? <span className="badge bg-blue-100 text-blue-700 mt-2">Account aziendale</span> : null}
        </div>

        <div className="flex gap-2">
          <Link href="/profilo/impostazioni" className="btn-secondary">
            <Settings className="w-4 h-4" /> Impostazioni
          </Link>
        </div>
      </div>

      {/* Credits */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-yellow-600">{user.creditsGold}</p>
          <p className="text-sm text-gray-500">Crediti Gold</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-gray-600">{user.creditsSilver}</p>
          <p className="text-sm text-gray-500">Crediti Silver</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-orange-600">{user.creditsBronze}</p>
          <p className="text-sm text-gray-500">Crediti Bronze</p>
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
        <Link href="/profilo/wishlist" className="card p-4 flex items-center gap-3 hover:shadow-md transition-shadow">
          <Heart className="w-5 h-5 text-brand" />
          <span className="font-medium">Preferiti</span>
        </Link>
        <Link href="/messaggi" className="card p-4 flex items-center gap-3 hover:shadow-md transition-shadow">
          <MessageSquare className="w-5 h-5 text-brand" />
          <span className="font-medium">Messaggi</span>
        </Link>
        <Link href="/business" className="card p-4 flex items-center gap-3 hover:shadow-md transition-shadow">
          <Award className="w-5 h-5 text-brand" />
          <span className="font-medium">Passa a Business</span>
        </Link>
      </div>

      {/* My ads */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="flex items-center gap-2"><FileText className="w-5 h-5" /> I miei annunci</h2>
        <Link href="/annunci/nuovo" className="btn-primary text-sm">Pubblica nuovo</Link>
      </div>

      {!myAds?.length ? (
        <div className="card p-12 text-center text-gray-500">
          <p className="mb-4">Non hai ancora pubblicato nessun annuncio.</p>
          <Link href="/annunci/nuovo" className="btn-primary">Pubblica il tuo primo annuncio</Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {myAds.map((ad: any) => <AdCard key={ad.id} ad={ad} />)}
        </div>
      )}
    </div>
  );
}
