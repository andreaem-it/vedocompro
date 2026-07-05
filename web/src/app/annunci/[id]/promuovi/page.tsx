'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adsApi } from '@/lib/api';
import { Ad, PromotionPackage } from '@/types';
import { TrendingUp, Star } from 'lucide-react';
import clsx from 'clsx';

const CREDIT_META = {
  bronze: {
    creditField: 'creditsBronze' as const,
    color: 'border-orange-400',
    badge: 'bg-orange-100 text-orange-800 border border-orange-300',
    endField: 'bronzePromotionEndDate' as const,
  },
  silver: {
    creditField: 'creditsSilver' as const,
    color: 'border-gray-400',
    badge: 'bg-gray-100 text-gray-700 border border-gray-300',
    endField: 'silverPromotionEndDate' as const,
  },
  gold: {
    creditField: 'creditsGold' as const,
    color: 'border-yellow-400',
    badge: 'bg-yellow-100 text-yellow-800 border border-yellow-300',
    endField: 'goldPromotionEndDate' as const,
  },
};

export default function PromuoviPage() {
  const { user, isLoading, refresh } = useAuth();
  const router = useRouter();
  const params = useParams();
  const adId = Number(params.id);
  const queryClient = useQueryClient();
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!isLoading && !user) router.replace('/login');
  }, [user, isLoading, router]);

  const { data: ad } = useQuery({
    queryKey: ['ad', adId],
    queryFn: () => adsApi.getById(adId).then((r) => r.data as Ad),
    enabled: !!adId,
  });

  const { data: packages } = useQuery({
    queryKey: ['promotion-packages'],
    queryFn: () => adsApi.promotionPackages().then((r) => r.data as PromotionPackage[]),
  });

  useEffect(() => {
    if (ad && user && ad.user.id !== user.id) {
      router.replace('/profilo');
    }
  }, [ad, user, router]);

  const promoteMutation = useMutation({
    mutationFn: (packageKey: string) => adsApi.promoteAd(adId, packageKey),
    onSuccess: (_, packageKey) => {
      const pkg = packages?.find((item) => item.key === packageKey);
      const days = pkg?.durationDays ?? 0;
      setSuccessMsg(`Promozione ${pkg?.name ?? packageKey} attivata per ${days} ${days === 1 ? 'giorno' : 'giorni'}!`);
      setErrorMsg('');
      refresh();
      queryClient.invalidateQueries({ queryKey: ['ad', adId] });
    },
    onError: (err: any) => {
      setErrorMsg(err.response?.data?.error ?? 'Errore durante la promozione');
    },
  });

  if (!user || !ad) return null;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 sm:px-6">
      <div className="flex items-center gap-2 mb-2">
        <TrendingUp className="w-6 h-6 text-brand" />
        <h1>Promuovi annuncio</h1>
      </div>
      <p className="text-gray-500 mb-8">
        Annuncio: <strong>{ad.name}</strong>
      </p>

      {successMsg && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm mb-6">
          {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-6">
          {errorMsg}
        </div>
      )}

      <div className="grid gap-4">
        {packages?.map((pkg) => {
          const meta = CREDIT_META[pkg.creditType];
          const userCredits = user[meta.creditField] ?? 0;
          const isActive = ad.objLevel >= pkg.level;
          const endDate = ad[meta.endField];
          const hasCredits = userCredits >= pkg.creditCost;

          return (
            <div key={pkg.key} className={clsx('card p-5 border-2', meta.color)}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={clsx('badge', meta.badge)}>{pkg.name}</span>
                    {isActive && endDate && (
                      <span className="text-xs text-green-600 font-medium">
                        Attiva fino al {new Date(endDate).toLocaleDateString('it-IT')}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-1">
                    Promozione per {pkg.durationDays} {pkg.durationDays === 1 ? 'giorno' : 'giorni'} con livello {pkg.name} (cumulabile se già attiva)
                  </p>
                  <div className="flex items-center gap-1 text-sm">
                    <Star className="w-4 h-4 text-brand" />
                    <span>Costo: {pkg.creditCost} credit{pkg.creditCost === 1 ? 'o' : 'i'} {pkg.creditType}</span>
                    <span className="text-gray-400 ml-2">({userCredits} disponibili)</span>
                  </div>
                  {Number(pkg.priceEur) > 0 && (
                    <p className="mt-1 text-xs text-gray-500">Valore campagna: €{Number(pkg.priceEur).toLocaleString('it-IT', { minimumFractionDigits: 2 })}</p>
                  )}
                  {pkg.autoRenewAvailable && <p className="mt-1 text-xs text-brand">Rinnovo automatico configurabile prossimamente.</p>}
                </div>
                <button
                  onClick={() => promoteMutation.mutate(pkg.key)}
                  disabled={!hasCredits || promoteMutation.isPending}
                  className={clsx('btn-primary text-sm flex-shrink-0', !hasCredits && 'opacity-40 cursor-not-allowed')}
                >
                  {promoteMutation.isPending ? 'Attivazione...' : 'Attiva'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 text-center">
        <p className="text-sm text-gray-500 mb-2">Non hai crediti? Acquistali nella sezione pagamenti.</p>
        <a href="/pagamenti" className="text-brand hover:underline text-sm">Vai ai pagamenti →</a>
      </div>
    </div>
  );
}
