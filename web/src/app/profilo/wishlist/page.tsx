'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { usersApi } from '@/lib/api';
import AdCard from '@/components/ads/AdCard';
import { Heart } from 'lucide-react';
import Link from 'next/link';

export default function WishlistPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) router.replace('/login');
  }, [user, isLoading, router]);

  const { data: wishlist, isLoading: wishlistLoading } = useQuery({
    queryKey: ['wishlist'],
    queryFn: () => usersApi.getWishlist().then((r) => r.data),
    enabled: !!user,
  });

  if (!user) return null;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 sm:px-6">
      <h1 className="flex items-center gap-2 mb-6">
        <Heart className="w-6 h-6 text-brand" /> I tuoi preferiti
      </h1>

      {wishlistLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card h-64 animate-pulse bg-gray-100" />
          ))}
        </div>
      ) : !wishlist?.length ? (
        <div className="card p-12 text-center text-gray-500">
          <p className="mb-4">Non hai ancora aggiunto annunci ai preferiti.</p>
          <Link href="/annunci" className="btn-primary">Sfoglia gli annunci</Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {wishlist.map((ad: any) => <AdCard key={ad.id} ad={ad} />)}
        </div>
      )}
    </div>
  );
}
