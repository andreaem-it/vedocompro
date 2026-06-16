'use client';

import Link from 'next/link';
import { Heart, MapPin, Eye } from 'lucide-react';
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

function getPromoLevel(ad: Ad): 0 | 1 | 2 | 3 {
  if (ad.goldPromotionEndDate && new Date(ad.goldPromotionEndDate) > new Date()) return 3;
  if (ad.silverPromotionEndDate && new Date(ad.silverPromotionEndDate) > new Date()) return 2;
  if (ad.bronzePromotionEndDate && new Date(ad.bronzePromotionEndDate) > new Date()) return 1;
  return 0;
}

const PROMO_BORDER: Record<number, string> = {
  3: '4px solid #DAA520',
  2: '4px solid #cccccc',
  1: '4px solid #CD7F32',
  0: '1px solid #e5e7eb',
};

const PROMO_LABEL: Record<number, string> = {
  3: '★ Gold',
  2: 'Silver',
  1: 'Bronze',
};

export default function AdCard({ ad, onToggleWishlist }: AdCardProps) {
  const level = getPromoLevel(ad);

  return (
    <div
      className="bg-white rounded-lg overflow-hidden hover:shadow-lg transition-shadow group relative"
      style={{ border: PROMO_BORDER[level], boxShadow: '5px 5px 10px 0px #BBB' }}
    >
      {/* Image area */}
      <div className="relative h-48 bg-gray-100 overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm">
          <svg className="w-10 h-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>

        {/* Premium badge */}
        {level > 0 && (
          <div
            className="absolute top-2 left-2 text-xs font-bold px-2 py-0.5 rounded"
            style={{
              backgroundColor: level === 3 ? '#DAA520' : level === 2 ? '#ccc' : '#CD7F32',
              color: level === 2 ? '#555' : '#fff',
            }}
          >
            {PROMO_LABEL[level]}
          </div>
        )}

        {/* Sold overlay */}
        {ad.sold === 1 && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="bg-red-600 text-white font-bold px-4 py-1 rounded-full text-sm tracking-wider">VENDUTO</span>
          </div>
        )}

        {/* Wishlist button */}
        <button
          onClick={(e) => { e.preventDefault(); onToggleWishlist?.(ad.id); }}
          className="absolute top-2 right-2 p-1.5 rounded-full bg-white/80 hover:bg-white transition-colors shadow"
          title={ad.isWishlisted ? 'Rimuovi dai preferiti' : 'Aggiungi ai preferiti'}
        >
          <Heart className={clsx('w-4 h-4', ad.isWishlisted ? 'fill-red-500 text-red-500' : 'text-gray-500')} />
        </button>

        {/* Hover overlay */}
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center"
          style={{ backgroundColor: 'rgba(70,163,217,0.15)' }}
        />
      </div>

      {/* Card body */}
      <Link href={`/annunci/${ad.id}`} className="block p-3">
        <h3 className="font-light text-gray-900 text-base mb-1 line-clamp-2 group-hover:text-brand transition-colors" style={{ fontSize: '16px' }}>
          {ad.name}
        </h3>

        <div className="text-xs text-gray-400 mb-2" style={{ fontSize: '11px' }}>
          {ad.category.name}
        </div>

        <div className="flex items-end justify-between mt-2">
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {ad.location}
            </span>
            <span className="flex items-center gap-1">
              <Eye className="w-3 h-3" />
              {ad.views}
            </span>
          </div>
          <span className="font-bold text-gray-900 text-base">
            €{parseFloat(ad.price).toLocaleString('it-IT')}
          </span>
        </div>

        <div className="mt-2">
          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">
            {CONDITION_LABELS[ad.objCondition] ?? ad.objCondition}
          </span>
        </div>
      </Link>
    </div>
  );
}
