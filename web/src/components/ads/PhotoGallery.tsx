'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, ImageOff, Maximize2, X } from 'lucide-react';
import { Photo } from '@/types';

interface PhotoGalleryProps {
  photos: Photo[];
  title?: string;
}

export default function PhotoGallery({ photos, title = 'Annuncio' }: PhotoGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [zoomOpen, setZoomOpen] = useState(false);

  if (!photos || photos.length === 0) {
    return (
      <div className="card mb-6 flex aspect-video items-center justify-center text-gray-400">
        <div className="text-center">
          <ImageOff className="mx-auto mb-2 h-7 w-7" />
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
      <div className="relative overflow-hidden rounded-xl border border-gray-200 bg-gray-50 aspect-video">
        <Image
          src={photos[currentIndex].url}
          alt={`${title} - foto ${currentIndex + 1} di ${photos.length}`}
          fill
          className="object-contain"
          sizes="(min-width: 1024px) 360px, 100vw"
        />
        <button
          type="button"
          onClick={() => setZoomOpen(true)}
          className="absolute right-2 top-2 rounded-full bg-black/45 p-2 text-white transition-colors hover:bg-black/65"
          title="Ingrandisci foto"
        >
          <Maximize2 className="h-4 w-4" />
        </button>
        {photos.length > 1 && (
          <>
            <button
              type="button"
              onClick={prev}
              className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors"
              title="Foto precedente"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={next}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors"
              title="Foto successiva"
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
              type="button"
              onClick={() => setCurrentIndex(i)}
              className={`flex-shrink-0 w-16 h-16 rounded overflow-hidden border-2 transition-colors ${i === currentIndex ? 'border-brand' : 'border-transparent'}`}
              title={`Apri foto ${i + 1}`}
            >
              <Image src={photo.url} alt={`${title} - anteprima ${i + 1}`} width={64} height={64} className="object-cover w-full h-full" />
            </button>
          ))}
        </div>
      )}

      {zoomOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
          <button
            type="button"
            onClick={() => setZoomOpen(false)}
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
            title="Chiudi"
          >
            <X className="h-6 w-6" />
          </button>
          {photos.length > 1 && (
            <>
              <button
                type="button"
                onClick={prev}
                className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white transition-colors hover:bg-white/20"
                title="Foto precedente"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                type="button"
                onClick={next}
                className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white transition-colors hover:bg-white/20"
                title="Foto successiva"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          )}
          <div className="relative h-[82vh] w-full max-w-5xl">
            <Image
              src={photos[currentIndex].url}
              alt={`${title} - foto ingrandita ${currentIndex + 1} di ${photos.length}`}
              fill
              className="object-contain"
              sizes="100vw"
            />
          </div>
          {photos.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-3 py-1 text-sm text-white">
              {currentIndex + 1} / {photos.length}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
