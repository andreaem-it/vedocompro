'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Settings, Heart, MessageSquare, FileText, Award, ThumbsUp, HeadphonesIcon, CreditCard, Camera, Package, Star, Building2, MapPin, CalendarDays, PauseCircle, CheckCircle2, XCircle, HandCoins, BellRing, BarChart3, ShoppingCart, Truck, Pencil, Megaphone, User } from 'lucide-react';
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

  const statusBadge = (ad: { published: number }) => {
    if (ad.published === 1) {
      return (
        <span className="badge bg-green-100 text-green-700 flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3" /> Pubblicato
        </span>
      );
    }
    if (ad.published === 2) {
      return (
        <span className="badge bg-red-100 text-red-700 flex items-center gap-1">
          <XCircle className="w-3 h-3" /> Rifiutato
        </span>
      );
    }
    return (
      <span className="badge bg-amber-100 text-amber-700 flex items-center gap-1">
        <PauseCircle className="w-3 h-3" /> In attesa
      </span>
    );
  };

  const profileSections = [
    {
      title: 'Vendere',
      items: [
        { href: '/annunci/nuovo', label: 'Pubblica annuncio', icon: FileText },
        { href: '/profilo/acquisti-vendite', label: 'Acquisti e vendite', icon: Package },
        { href: '/profilo/statistiche', label: 'Statistiche vendite', icon: BarChart3 },
        { href: user.isCompany ? '/business/dashboard' : '/business', label: user.isCompany ? 'Dashboard Business' : 'Passa a Business', icon: Award },
      ],
    },
    {
      title: 'Comprare',
      items: [
        { href: '/profilo/offerte', label: 'Le mie offerte', icon: HandCoins },
        { href: '/profilo/wishlist', label: 'Preferiti', icon: Heart },
        { href: '/profilo/ricerche-salvate', label: 'Ricerche salvate', icon: BellRing },
        { href: '/messaggi', label: 'Messaggi', icon: MessageSquare },
      ],
    },
    {
      title: 'Account',
      items: [
        { href: '/profilo/impostazioni', label: 'Impostazioni', icon: Settings },
        { href: '/profilo/feedback', label: 'Feedback', icon: ThumbsUp },
        { href: '/profilo/helpdesk', label: 'Supporto', icon: HeadphonesIcon },
        { href: '/pagamenti', label: 'Pagamenti e crediti', icon: CreditCard },
      ],
    },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 sm:px-6">
      {/* Profile header */}
      <div className="card p-6 mb-6 flex items-start gap-6 flex-wrap">
        <div className="relative flex-shrink-0">
          {user.pic ? (
            <Image src={user.pic} alt={user.username} width={96} height={96} className="rounded-full object-cover w-24 h-24" />
          ) : (
            <div className="w-24 h-24 rounded-full bg-brand/10 flex items-center justify-center text-3xl font-bold text-brand">
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

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h1>{user.realname || user.name}</h1>
            {user.isCompany ? (
              <span className="badge bg-blue-100 text-blue-700 flex items-center gap-1">
                <Building2 className="w-3 h-3" /> Account aziendale
              </span>
            ) : null}
          </div>
          <p className="text-gray-500 mb-2">@{user.username}</p>

          <div className="flex flex-wrap gap-4 text-sm text-gray-600">
            {user.city && (
              <span className="flex items-center gap-1">
                <MapPin className="w-4 h-4" /> {user.city}
              </span>
            )}
            {user.dateJoin && (
              <span className="flex items-center gap-1">
                <CalendarDays className="w-4 h-4" /> Registrato dal {new Date(user.dateJoin).toLocaleDateString('it-IT')}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" /> {user.points} punti reputazione
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Link href="/profilo/impostazioni" className="btn-secondary">
            <Settings className="w-4 h-4" /> Impostazioni
          </Link>
          <Link href={`/utenti/${user.id}`} className="btn-secondary">
            <User className="w-4 h-4" /> Profilo pubblico
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

      <div className="grid gap-4 mb-8 lg:grid-cols-3">
        {profileSections.map((section) => (
          <section key={section.title} className="rounded-lg border border-gray-200 bg-white p-4">
            <h2 className="mb-3 text-base font-semibold">{section.title}</h2>
            <div className="grid gap-2">
              {section.items.map(({ href, label, icon: Icon }) => (
                <Link key={href} href={href} className="flex items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-brand/5 hover:text-brand">
                  <Icon className="w-4 h-4 text-brand" />
                  <span className="font-medium">{label}</span>
                </Link>
              ))}
            </div>
          </section>
        ))}
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
            <div key={ad.id} className="space-y-2">
              <AdCard ad={ad} />
              <div className="rounded-lg border border-gray-200 bg-white p-3 text-sm">
                <div className="mb-3 flex flex-wrap gap-2">
                  {statusBadge(ad)}
                  {ad.sold === 1 ? (
                    <span className="badge bg-gray-100 text-gray-700 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Venduto
                    </span>
                  ) : null}
                  <span className="badge bg-white text-gray-700 flex items-center gap-1">
                    <Package className="w-3 h-3" /> {user.isCompany ? `${ad.availableQuantity ?? 1} pezzi` : 'Pezzo unico'}
                  </span>
                  {ad.canBeOrdered ? (
                    <span className="badge bg-green-50 text-green-700 flex items-center gap-1">
                      <ShoppingCart className="w-3 h-3" /> Compralo subito
                    </span>
                  ) : (
                    <span className="badge bg-gray-100 text-gray-600 flex items-center gap-1">
                      <ShoppingCart className="w-3 h-3" /> Solo offerte/contatto
                    </span>
                  )}
                  {ad.shippingAvailable ? (
                    <span className="badge bg-blue-50 text-blue-700 flex items-center gap-1">
                      <Truck className="w-3 h-3" /> Spedizione
                    </span>
                  ) : null}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Link href={`/annunci/${ad.id}/modifica`} className="btn-secondary justify-center text-xs">
                    <Pencil className="w-3.5 h-3.5" /> Modifica
                  </Link>
                  <Link href={`/annunci/${ad.id}/promuovi`} className="btn-secondary justify-center text-xs">
                    <Megaphone className="w-3.5 h-3.5" /> Promuovi
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
