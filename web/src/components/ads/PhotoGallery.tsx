'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Photo } from '@/types';

interface PhotoGalleryProps {
  photos: Photo[];
}

export default function PhotoGallery({ photos }: PhotoGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!photos || photos.length === 0) {
    return (
      <div className="card h-80 flex items-center justify-center text-gray-400 mb-6">
        <div className="text-center">
          <p className="text-lg mb-1">Nessuna immagine</p>
          <p className="text-sm">Il venditore non ha aggiunto foto</p>
        </div>
      </div>
    );
  }

  const prev = () => setCurrentIndex((i) => (i - 1 + photos.length) % photos.length);
  const next = () => setCurrentIndex((i) => (i + 1) % photos.length);

  return (
    <div className="mb-6">
      <div className="relative card h-80 overflow-hidden">
        <Image
          src={photos[currentIndex].url}
          alt={`Foto ${currentIndex + 1}`}
          fill
          className="object-contain"
        />
        {photos.length > 1 && (
          <>
            <button
              onClick={prev}
              className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={next}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-xs bg-black/50 text-white px-2 py-0.5 rounded-full">
              {currentIndex + 1} / {photos.length}
            </div>
          </>
        )}
      </div>

      {photos.length > 1 && (
        <div className="flex gap-2 mt-2 overflow-x-auto py-1">
          {photos.map((photo, i) => (
            <button
              key={photo.id}
              onClick={() => setCurrentIndex(i)}
              className={`flex-shrink-0 w-16 h-16 rounded overflow-hidden border-2 transition-colors ${i === currentIndex ? 'border-brand' : 'border-transparent'}`}
            >
              <Image src={photo.url} alt={`Thumb ${i + 1}`} width={64} height={64} className="object-cover w-full h-full" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
