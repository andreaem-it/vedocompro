'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { usersApi } from '@/lib/api';
import { ThumbsUp, ThumbsDown, Star, Award, BadgeCheck } from 'lucide-react';
import Link from 'next/link';
import { Feedback } from '@/types';

export default function FeedbackPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) router.replace('/login');
  }, [user, isLoading, router]);

  const { data: feedbacks, isLoading: feedLoading } = useQuery({
    queryKey: ['my-feedback'],
    queryFn: () => usersApi.getMyFeedback().then((r) => r.data as Feedback[]),
    enabled: !!user,
  });

  const positiveCount = feedbacks?.filter((f) => f.positive === 1).length ?? 0;
  const negativeCount = feedbacks?.filter((f) => f.positive === 0).length ?? 0;
  const totalCount = feedbacks?.length ?? 0;
  const positivePercent = totalCount > 0 ? Math.round((positiveCount / totalCount) * 100) : null;

  if (!user) return null;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 sm:px-6">
      <h1 className="flex items-center gap-2 mb-2"><ThumbsUp className="w-6 h-6 text-brand" /> Il mio feedback</h1>

      {feedbacks && feedbacks.length > 0 && (
        <div className="card p-4 mb-6 flex items-center gap-6 flex-wrap text-sm">
          {positivePercent !== null && (
            <span className="flex items-center gap-1.5 font-semibold text-green-600">
              <Award className="w-5 h-5" /> {positivePercent}% positivi
            </span>
          )}
          <span className="flex items-center gap-1 text-green-600">
            <ThumbsUp className="w-4 h-4" /> {positiveCount} positivi
          </span>
          <span className="flex items-center gap-1 text-red-500">
            <ThumbsDown className="w-4 h-4" /> {negativeCount} negativi
          </span>
          <span className="flex items-center gap-1 text-gray-500 ml-auto">
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" /> Punteggio reputazione: {user.points}
          </span>
        </div>
      )}

      {feedLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card h-20 animate-pulse bg-gray-100" />
          ))}
        </div>
      ) : !feedbacks?.length ? (
        <div className="card p-12 text-center text-gray-500">
          <p className="mb-2">Nessun feedback ricevuto ancora.</p>
          <p className="text-sm">Il feedback viene lasciato dagli altri utenti dopo una transazione.</p>
        </div>
      ) : (
        <div className="card divide-y">
          {feedbacks.map((fb) => (
            <div key={fb.id} className="flex items-start gap-4 p-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${fb.positive === 1 ? 'bg-green-100' : 'bg-red-100'}`}>
                {fb.positive === 1
                  ? <ThumbsUp className="w-5 h-5 text-green-600" />
                  : <ThumbsDown className="w-5 h-5 text-red-500" />
                }
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Link href={`/utenti/${fb.fromUser.id}`} className="font-medium text-sm hover:text-brand">
                    {fb.fromUser.username}
                  </Link>
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={`w-3.5 h-3.5 ${i < fb.vote ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`} />
                    ))}
                  </div>
                  <span className="text-xs text-gray-400 ml-auto">
                    {new Date(fb.datetime).toLocaleDateString('it-IT')}
                  </span>
                </div>
                <p className="text-sm text-gray-600">{fb.description}</p>
                {fb.orderId && (
                  <p className="inline-flex items-center gap-1 text-xs text-green-700 bg-green-50 px-2 py-0.5 rounded-full mt-2">
                    <BadgeCheck className="w-3.5 h-3.5" /> Acquisto verificato
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
