'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { CheckCircle, XCircle, Video } from 'lucide-react';
import Link from 'next/link';

export default function AdminVideoPage() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-videos'],
    queryFn: () => adminApi.listVideos().then((r) => r.data),
  });

  const approveMutation = useMutation({
    mutationFn: (id: number) => adminApi.approveVideo(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-videos'] }),
  });

  const rejectMutation = useMutation({
    mutationFn: (id: number) => adminApi.rejectVideo(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-videos'] }),
  });

  return (
    <div className="p-8">
      <div className="flex items-center gap-2 mb-6">
        <Video className="w-5 h-5 text-brand" />
        <h1>Moderazione Video</h1>
      </div>

      {isLoading ? (
        <div className="text-gray-400">Caricamento...</div>
      ) : !data?.length ? (
        <div className="card p-12 text-center text-gray-500">
          <p>Nessun video in attesa di moderazione.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {data.map((video: any) => (
            <div key={video.id} className="card p-4">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm mb-1">
                    Annuncio:{' '}
                    <Link href={`/annunci/${video.ad?.id}`} className="hover:text-brand">
                      {video.ad?.name}
                    </Link>
                  </p>
                  <p className="text-xs text-gray-500 mb-1">
                    Utente: {video.user?.username} ({video.user?.email})
                  </p>
                  <p className="text-xs text-gray-400 truncate">{video.filename}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => approveMutation.mutate(video.id)}
                    disabled={approveMutation.isPending}
                    className="btn-primary text-sm"
                  >
                    <CheckCircle className="w-4 h-4" /> Approva
                  </button>
                  <button
                    onClick={() => rejectMutation.mutate(video.id)}
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
