'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Settings, Heart, MessageSquare, FileText, Award, ThumbsUp, HeadphonesIcon, CreditCard, Camera } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { usersApi } from '@/lib/api';
import AdCard from '@/components/ads/AdCard';

export default function ProfiloPage() {
  const { user, isLoading, refresh } = useAuth();
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!isLoading && !user) router.replace('/login');
  }, [user, isLoading, router]);

  const { data: myAds } = useQuery({
    queryKey: ['my-ads', user?.id],
    queryFn: () => usersApi.getMyAds().then((r) => r.data),
    enabled: !!user,
  });

  const handleAvatarChange = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const formData = new FormData();
    formData.append('avatar', files[0]);
    try {
      await usersApi.uploadAvatar(formData);
      await refresh();
      queryClient.invalidateQueries({ queryKey: ['my-ads'] });
    } catch {
      // silently fail
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 sm:px-6">
      {/* Profile header */}
      <div className="card p-6 mb-6 flex items-center gap-6 flex-wrap">
        <div className="relative">
          {user.pic ? (
            <Image src={user.pic} alt={user.username} width={80} height={80} className="rounded-full object-cover w-20 h-20" />
          ) : (
            <div className="w-20 h-20 rounded-full bg-brand/10 flex items-center justify-center text-2xl font-bold text-brand">
              {user.username[0].toUpperCase()}
            </div>
          )}
          <button
            onClick={() => fileRef.current?.click()}
            className="absolute bottom-0 right-0 p-1.5 bg-brand text-white rounded-full shadow"
            title="Cambia foto"
          >
            <Camera className="w-3.5 h-3.5" />
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleAvatarChange(e.target.files)}
          />
        </div>

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
        <Link href="/pagamenti" className="card p-4 text-center hover:shadow-md transition-shadow">
          <p className="text-2xl font-bold text-yellow-600">{user.creditsGold}</p>
          <p className="text-sm text-gray-500">Crediti Gold</p>
        </Link>
        <Link href="/pagamenti" className="card p-4 text-center hover:shadow-md transition-shadow">
          <p className="text-2xl font-bold text-gray-600">{user.creditsSilver}</p>
          <p className="text-sm text-gray-500">Crediti Silver</p>
        </Link>
        <Link href="/pagamenti" className="card p-4 text-center hover:shadow-md transition-shadow">
          <p className="text-2xl font-bold text-orange-600">{user.creditsBronze}</p>
          <p className="text-sm text-gray-500">Crediti Bronze</p>
        </Link>
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
        <Link href="/profilo/feedback" className="card p-4 flex items-center gap-3 hover:shadow-md transition-shadow">
          <ThumbsUp className="w-5 h-5 text-brand" />
          <span className="font-medium">Feedback</span>
        </Link>
        <Link href="/profilo/helpdesk" className="card p-4 flex items-center gap-3 hover:shadow-md transition-shadow">
          <HeadphonesIcon className="w-5 h-5 text-brand" />
          <span className="font-medium">Supporto</span>
        </Link>
        <Link href="/pagamenti" className="card p-4 flex items-center gap-3 hover:shadow-md transition-shadow">
          <CreditCard className="w-5 h-5 text-brand" />
          <span className="font-medium">Pagamenti</span>
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
          {myAds.map((ad: any) => (
            <div key={ad.id} className="relative group">
              <AdCard ad={ad} />
              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Link href={`/annunci/${ad.id}/modifica`} className="p-1.5 bg-white rounded shadow text-xs font-medium hover:bg-brand hover:text-white transition-colors">
                  Modifica
                </Link>
                <Link href={`/annunci/${ad.id}/promuovi`} className="p-1.5 bg-white rounded shadow text-xs font-medium hover:bg-brand hover:text-white transition-colors">
                  Promuovi
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
