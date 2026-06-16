'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { CheckCircle, XCircle, Star } from 'lucide-react';
import Link from 'next/link';

export default function AdminRecensioniPage() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-reviews'],
    queryFn: () => adminApi.listReviews().then((r) => r.data),
  });

  const approveMutation = useMutation({
    mutationFn: (id: number) => adminApi.approveReview(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-reviews'] }),
  });

  const rejectMutation = useMutation({
    mutationFn: (id: number) => adminApi.rejectReview(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-reviews'] }),
  });

  return (
    <div className="p-8">
      <div className="flex items-center gap-2 mb-6">
        <Star className="w-5 h-5 text-brand" />
        <h1>Moderazione Recensioni</h1>
      </div>

      {isLoading ? (
        <div className="text-gray-400">Caricamento...</div>
      ) : !data?.length ? (
        <div className="card p-12 text-center text-gray-500">
          <p>Nessuna recensione in attesa di moderazione.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {data.map((review: any) => (
            <div key={review.id} className="card p-4">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="flex">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`w-4 h-4 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`} />
                      ))}
                    </div>
                    <span className="text-xs text-gray-500">{new Date(review.datetime).toLocaleDateString('it-IT')}</span>
                  </div>
                  <p className="text-sm mb-1">{review.comment}</p>
                  <div className="text-xs text-gray-500">
                    Da: {review.user?.username} — Annuncio:{' '}
                    <Link href={`/annunci/${review.ad?.id}`} className="hover:text-brand">
                      {review.ad?.name}
                    </Link>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => approveMutation.mutate(review.id)}
                    disabled={approveMutation.isPending}
                    className="btn-primary text-sm"
                  >
                    <CheckCircle className="w-4 h-4" /> Approva
                  </button>
                  <button
                    onClick={() => rejectMutation.mutate(review.id)}
                    disabled={rejectMutation.isPending}
                    className="btn-secondary text-sm text-red-600 border-red-200 hover:bg-red-50"
                  >
                    <XCircle className="w-4 h-4" /> Rifiuta
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
