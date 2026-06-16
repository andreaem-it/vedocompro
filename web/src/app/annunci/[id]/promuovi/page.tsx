'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adsApi } from '@/lib/api';
import { Ad } from '@/types';
import { TrendingUp, Star } from 'lucide-react';
import clsx from 'clsx';

const LEVELS = [
  {
    id: 'bronze',
    label: 'Bronze',
    creditField: 'creditsBronze' as const,
    color: 'border-orange-400',
    badge: 'bg-orange-100 text-orange-800 border border-orange-300',
    endField: 'bronzePromotionEndDate' as const,
    objLevel: 1,
  },
  {
    id: 'silver',
    label: 'Silver',
    creditField: 'creditsSilver' as const,
    color: 'border-gray-400',
    badge: 'bg-gray-100 text-gray-700 border border-gray-300',
    endField: 'silverPromotionEndDate' as const,
    objLevel: 2,
  },
  {
    id: 'gold',
    label: 'Gold',
    creditField: 'creditsGold' as const,
    color: 'border-yellow-400',
    badge: 'bg-yellow-100 text-yellow-800 border border-yellow-300',
    endField: 'goldPromotionEndDate' as const,
    objLevel: 3,
  },
];

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

  useEffect(() => {
    if (ad && user && ad.user.id !== user.id) {
      router.replace('/profilo');
    }
  }, [ad, user, router]);

  const promoteMutation = useMutation({
    mutationFn: (level: string) => adsApi.promoteAd(adId, level),
    onSuccess: (_, level) => {
      setSuccessMsg(`Promozione ${level} attivata per 30 giorni!`);
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
        {LEVELS.map((level) => {
          const userCredits = user[level.creditField] ?? 0;
          const isActive = ad.objLevel >= level.objLevel;
          const endDate = ad[level.endField];
          const hasCredits = userCredits >= 1;

          return (
            <div key={level.id} className={clsx('card p-5 border-2', level.color)}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={clsx('badge', level.badge)}>{level.label}</span>
                    {isActive && endDate && (
                      <span className="text-xs text-green-600 font-medium">
                        Attiva fino al {new Date(endDate).toLocaleDateString('it-IT')}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-1">Promozione per 30 giorni con bordo {level.label}</p>
                  <div className="flex items-center gap-1 text-sm">
                    <Star className="w-4 h-4 text-brand" />
                    <span>Costo: 1 credito {level.label}</span>
                    <span className="text-gray-400 ml-2">({userCredits} disponibili)</span>
                  </div>
                </div>
                <button
                  onClick={() => promoteMutation.mutate(level.id)}
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
