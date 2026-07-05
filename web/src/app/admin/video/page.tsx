'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { CheckCircle, XCircle, Video, Loader2 } from 'lucide-react';
import Link from 'next/link';

interface AdminVideo {
  id: number;
  filename: string;
  processing: boolean;
  uploaded: boolean;
  thumbnails?: string[];
  ad?: { id: number; name: string };
  user?: { username: string; email: string };
}

export default function AdminVideoPage() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-videos'],
    queryFn: () => adminApi.listVideos().then((r) => r.data as AdminVideo[]),
    refetchInterval: 10000,
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
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.map((video) => (
            <div key={video.id} className="card overflow-hidden">
              <div className="aspect-video bg-black flex items-center justify-center">
                {video.processing ? (
                  <div className="text-white/70 text-sm flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" /> Elaborazione in corso...
                  </div>
                ) : video.uploaded ? (
                  <video
                    src={video.filename}
                    poster={video.thumbnails?.[0]}
                    controls
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <p className="text-white/50 text-xs px-4 text-center">In coda per l&apos;elaborazione (transcodifica + thumbnail)</p>
                )}
              </div>
              <div className="p-4">
                <p className="font-medium text-sm mb-1">
                  Annuncio:{' '}
                  <Link href={`/annunci/${video.ad?.id}`} className="hover:text-brand">
                    {video.ad?.name}
                  </Link>
                </p>
                <p className="text-xs text-gray-500 mb-3">
                  Utente: {video.user?.username} ({video.user?.email})
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => approveMutation.mutate(video.id)}
                    disabled={approveMutation.isPending || video.processing}
                    className="btn-primary text-sm flex-1 justify-center"
                  >
                    <CheckCircle className="w-4 h-4" /> Approva
                  </button>
                  <button
                    onClick={() => rejectMutation.mutate(video.id)}
                    disabled={rejectMutation.isPending}
                    className="btn-secondary text-sm text-red-600 border-red-200 hover:bg-red-50 flex-1 justify-center"
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
