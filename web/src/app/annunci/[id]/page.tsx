import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { MapPin, Eye, Phone, MessageSquare, Heart, Star, Share2 } from 'lucide-react';
import Link from 'next/link';
import PhotoGallery from '@/components/ads/PhotoGallery';
import { Photo } from '@/types';

async function getAd(id: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/ads/${id}`, { next: { revalidate: 60 } });
  if (!res.ok) return null;
  return res.json();
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const ad = await getAd(id);
  if (!ad) return { title: 'Annuncio non trovato' };
  return {
    title: ad.name,
    description: ad.description?.slice(0, 160),
  };
}

const CONDITION_LABELS: Record<string, string> = {
  new: 'Nuovo',
  like_new: 'Come nuovo',
  good: 'Buono',
  acceptable: 'Accettabile',
  for_parts: 'Per ricambi',
};

export default async function AdDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ad = await getAd(id);
  if (!ad) notFound();

  const avgRating = ad.reviews?.length
    ? ad.reviews.reduce((sum: number, r: { rating: number }) => sum + r.rating, 0) / ad.reviews.length
    : null;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Main content */}
        <div className="flex-1 min-w-0">
          <PhotoGallery photos={(ad.photos ?? []) as Photo[]} />

          {/* Title & Price */}
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h1 className="mb-2">{ad.name}</h1>
              <div className="flex items-center gap-3 text-sm text-gray-500">
                <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{ad.location}, {ad.provincia}</span>
                <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" />{ad.views} visualizzazioni</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-brand">€{parseFloat(ad.price).toLocaleString('it-IT')}</p>
              {avgRating !== null && (
                <div className="flex items-center gap-1 justify-end mt-1">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm font-medium">{avgRating.toFixed(1)}</span>
                  <span className="text-sm text-gray-500">({ad.reviews.length})</span>
                </div>
              )}
            </div>
          </div>

          {/* Badges */}
          <div className="flex gap-2 mb-6 flex-wrap">
            <span className="badge bg-gray-100 text-gray-700">{ad.category.name}</span>
            <span className="badge bg-blue-50 text-blue-700">{CONDITION_LABELS[ad.objCondition] ?? ad.objCondition}</span>
            {ad.sold === 1 && <span className="badge bg-red-100 text-red-700">Venduto</span>}
            {ad.isHotel && <span className="badge bg-purple-100 text-purple-700">Hotel</span>}
          </div>

          {/* Description */}
          <div className="card p-6 mb-6">
            <h2 className="mb-3">Descrizione</h2>
            <p className="text-gray-600 whitespace-pre-wrap leading-relaxed">{ad.description}</p>
          </div>

          {/* Tags */}
          {ad.tags?.length > 0 && (
            <div className="mb-6">
              <h3 className="font-medium mb-2">Tag</h3>
              <div className="flex flex-wrap gap-2">
                {ad.tags.map((tag: string) => (
                  <Link key={tag} href={`/annunci?q=${encodeURIComponent(tag)}`} className="badge bg-gray-100 text-gray-600 hover:bg-gray-200">
                    #{tag}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Reviews */}
          {ad.reviews?.length > 0 && (
            <div className="card p-6">
              <h2 className="mb-4">Recensioni ({ad.reviews.length})</h2>
              <div className="space-y-4">
                {ad.reviews.map((r: { id: number; rating: number; comment: string; datetime: string; user: { id: number; username: string } }) => (
                  <div key={r.id} className="border-b last:border-0 pb-4 last:pb-0">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="flex">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className={`w-4 h-4 ${i < r.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`} />
                        ))}
                      </div>
                      <Link href={`/utenti/${r.user.id}`} className="text-sm font-medium hover:text-brand">{r.user.username}</Link>
                      <span className="text-xs text-gray-400">{new Date(r.datetime).toLocaleDateString('it-IT')}</span>
                    </div>
                    <p className="text-sm text-gray-600">{r.comment}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <aside className="lg:w-80 flex-shrink-0">
          {/* Contact card */}
          <div className="card p-5 mb-4 sticky top-20">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-brand/10 flex items-center justify-center font-bold text-brand text-lg">
                {ad.user.username[0].toUpperCase()}
              </div>
              <div>
                <Link href={`/utenti/${ad.user.id}`} className="font-semibold hover:text-brand block">
                  {ad.user.name || ad.user.username}
                </Link>
                {ad.user.isCompany && <span className="text-xs badge bg-blue-100 text-blue-700">Azienda</span>}
              </div>
            </div>

            <div className="space-y-3">
              <Link href={`/messaggi?to=${ad.user.id}&ad=${ad.id}`} className="btn-primary w-full justify-center">
                <MessageSquare className="w-4 h-4" /> Invia messaggio
              </Link>
              {ad.user.phone && ad.user.phone !== '-' && (
                <a href={`tel:${ad.user.phone}`} className="btn-secondary w-full justify-center">
                  <Phone className="w-4 h-4" /> Chiama
                </a>
              )}
              <button className="btn-ghost w-full justify-center">
                <Heart className="w-4 h-4" /> Aggiungi ai preferiti
              </button>
              <button className="btn-ghost w-full justify-center">
                <Share2 className="w-4 h-4" /> Condividi
              </button>
            </div>

            <div className="mt-4 pt-4 border-t text-xs text-gray-500 space-y-1">
              <p>Pubblicato il {new Date(ad.creationTime).toLocaleDateString('it-IT')}</p>
              <p>Codice annuncio: #{ad.id}</p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
