import Link from 'next/link';
import Image from 'next/image';
import { Heart, MapPin, Eye, Star, Truck } from 'lucide-react';
import { Ad } from '@/types';
import clsx from 'clsx';

interface AdCardProps {
  ad: Ad;
  onToggleWishlist?: (id: number) => void;
}

const CONDITION_LABELS: Record<string, string> = {
  new: 'Nuovo',
  like_new: 'Come nuovo',
  good: 'Buono',
  acceptable: 'Accettabile',
  for_parts: 'Per ricambi',
};

const LEVEL_CLASS: Record<number, string> = {
  1: 'badge-bronze',
  2: 'badge-silver',
  3: 'badge-gold',
};

export default function AdCard({ ad, onToggleWishlist }: AdCardProps) {
  const promotionLevel = ad.goldPromotionEndDate && new Date(ad.goldPromotionEndDate) > new Date()
    ? 3
    : ad.silverPromotionEndDate && new Date(ad.silverPromotionEndDate) > new Date()
    ? 2
    : ad.bronzePromotionEndDate && new Date(ad.bronzePromotionEndDate) > new Date()
    ? 1
    : 0;

  return (
    <div className={clsx('card overflow-hidden hover:shadow-md transition-shadow group', promotionLevel === 3 && 'ring-2 ring-yellow-400')}>
      {/* Thumbnail */}
      <div className="relative h-48 bg-gray-100">
        {ad.photos && ad.photos.length > 0 ? (
          <Image src={ad.photos[0].url} alt={ad.name} fill className="object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm">
            Nessuna immagine
          </div>
        )}

        {promotionLevel > 0 && (
          <div className={clsx('absolute top-2 left-2', LEVEL_CLASS[promotionLevel])}>
            {promotionLevel === 3 ? '⭐ Gold' : promotionLevel === 2 ? 'Silver' : 'Bronze'}
          </div>
        )}

        {ad.sold === 1 && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="bg-red-600 text-white font-bold px-4 py-1 rounded-full text-sm">VENDUTO</span>
          </div>
        )}

        <button
          onClick={(e) => { e.preventDefault(); onToggleWishlist?.(ad.id); }}
          className="absolute top-2 right-2 p-1.5 rounded-full bg-white/80 hover:bg-white transition-colors"
          title={ad.isWishlisted ? 'Rimuovi dai preferiti' : 'Aggiungi ai preferiti'}
        >
          <Heart className={clsx('w-4 h-4', ad.isWishlisted ? 'fill-red-500 text-red-500' : 'text-gray-500')} />
        </button>
      </div>

      <Link href={`/annunci/${ad.id}`} className="block p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-semibold text-gray-900 line-clamp-2 group-hover:text-brand transition-colors">
            {ad.name}
          </h3>
          <span className="text-lg font-bold text-brand whitespace-nowrap">
            €{parseFloat(ad.price).toLocaleString('it-IT')}
          </span>
        </div>

        <div className="flex items-center gap-3 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {ad.location}, {ad.provincia}
            {ad.distanceKm !== undefined && <span>({ad.distanceKm.toLocaleString('it-IT')} km)</span>}
          </span>
          <span className="flex items-center gap-1">
            <Eye className="w-3 h-3" />
            {ad.views}
          </span>
          {ad.hasReviews && ad._count?.reviews && ad._count.reviews > 0 && (
            <span className="flex items-center gap-1">
              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
              {ad._count.reviews}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 mt-3 flex-wrap">
          <span className="badge bg-gray-100 text-gray-600">{ad.category.name}</span>
          <span className="badge bg-blue-50 text-blue-700">{CONDITION_LABELS[ad.objCondition] ?? ad.objCondition}</span>
          {ad.shippingAvailable && (
            <span className="badge bg-green-50 text-green-700 flex items-center gap-1">
              <Truck className="w-3 h-3" /> Spedizione
            </span>
          )}
        </div>
      </Link>
    </div>
  );
}
