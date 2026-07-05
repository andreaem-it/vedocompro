'use client';

import { notFound } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { MapPin, Eye, Phone, MessageSquare, Star, CheckCircle2, ExternalLink, Facebook, Twitter, Mail as MailIcon, Pencil, Megaphone } from 'lucide-react';
import Link from 'next/link';
import PhotoGallery from '@/components/ads/PhotoGallery';
import OrderButton from '@/components/ads/OrderButton';
import OfferButton from '@/components/ads/OfferButton';
import ReportButton from '@/components/reports/ReportButton';
import { useAuth } from '@/contexts/AuthContext';
import { adsApi } from '@/lib/api';
import { Ad, Photo } from '@/types';

const CONDITION_LABELS: Record<string, string> = {
  new: 'Nuovo',
  like_new: 'Come nuovo',
  good: 'Buono',
  acceptable: 'Accettabile',
  for_parts: 'Per ricambi',
};

function daysSince(dateStr: string): number {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
}

export default function AdDetailContent({ id }: { id: string }) {
  const { user } = useAuth();
  const { data: ad, isLoading, isError } = useQuery({
    queryKey: ['ad', id],
    queryFn: () => adsApi.getById(Number(id)).then((r) => r.data as Ad),
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8 sm:px-6 animate-pulse">
        <div className="h-72 bg-gray-100 rounded-xl mb-6" />
        <div className="h-8 bg-gray-100 rounded w-1/2 mb-4" />
        <div className="h-4 bg-gray-100 rounded w-1/3" />
      </div>
    );
  }

  if (isError || !ad) {
    notFound();
  }

  const video = ad.videos?.[0];
  const isOld = daysSince(ad.updateTime) >= 30;
  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
  const isOwner = user?.id === ad.user.id;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 sm:px-6">
      {ad.published === 0 && (
        <div className="mb-4 bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg text-sm">
          Questo annuncio è in attesa di moderazione: solo tu (e gli admin) puoi vederlo.
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Colonna sinistra: video (media principale di VedoCompro) + info accessorie */}
        <div className="lg:w-[360px] flex-shrink-0">
          {video ? (
            <div className="rounded-xl overflow-hidden bg-black aspect-video mb-3">
              <video src={video.filename} controls poster={ad.photos?.[0]?.url} className="w-full h-full object-contain bg-black" />
            </div>
          ) : ad.photos && ad.photos.length > 0 ? (
            <PhotoGallery photos={ad.photos as Photo[]} />
          ) : (
            <div className="rounded-xl bg-gray-100 aspect-video mb-3 flex items-center justify-center text-gray-400 text-sm">
              Nessun video disponibile
            </div>
          )}

          {video && ad.photos && ad.photos.length > 0 && (
            <div className="grid grid-cols-4 gap-1.5 mb-4">
              {ad.photos.slice(0, 8).map((p) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={p.id} src={p.url} alt={ad.name} className="aspect-square object-cover rounded-md" />
              ))}
            </div>
          )}

          {ad.fields && ad.fields.length > 0 && (
            <ul className="card divide-y mb-4 text-sm">
              {ad.fields.map((field, i) => (
                <li key={i} className="flex justify-between px-3 py-2">
                  <span className="font-medium">{field}</span>
                  <span className="text-gray-600">{ad.vals?.[i]}</span>
                </li>
              ))}
            </ul>
          )}

          {ad.isHotel && ad.services?.length > 0 && (
            <div className="card p-4 mb-4">
              <h3 className="font-semibold text-sm mb-2">Servizi</h3>
              <div className="grid grid-cols-2 gap-1.5 text-sm">
                {ad.services.map((s) => (
                  <span key={s} className="flex items-center gap-1.5 text-gray-600">
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-600 flex-shrink-0" /> {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          <p className="text-sm text-gray-500 flex items-center gap-1.5">
            <Eye className="w-4 h-4" /> Visualizzato <span className="text-brand font-medium">{ad.views}</span> volte
          </p>

          {isOld && (
            <div className="mt-3 bg-blue-50 border border-blue-200 text-blue-800 px-3 py-2 rounded-lg text-xs">
              Attenzione: questo annuncio è stato inserito {daysSince(ad.updateTime)} giorni fa, l&apos;oggetto potrebbe non essere più disponibile. Contatta il venditore per saperne di più.
            </div>
          )}
        </div>

        {/* Colonna destra: contenuto principale */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4 mb-2">
            <h1 className="text-2xl font-semibold">{ad.name}</h1>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
                target="_blank" rel="noreferrer"
                className="w-8 h-8 rounded-full flex items-center justify-center text-white"
                style={{ backgroundColor: '#3B5998' }}
                title="Condividi su Facebook"
              >
                <Facebook className="w-4 h-4" />
              </a>
              <a
                href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(ad.name)}`}
                target="_blank" rel="noreferrer"
                className="w-8 h-8 rounded-full flex items-center justify-center text-white"
                style={{ backgroundColor: '#55acee' }}
                title="Condividi su Twitter"
              >
                <Twitter className="w-4 h-4" />
              </a>
              <a
                href={`https://wa.me/?text=${encodeURIComponent(`${ad.name} - ${shareUrl}`)}`}
                target="_blank" rel="noreferrer"
                className="w-8 h-8 rounded-full flex items-center justify-center text-white"
                style={{ backgroundColor: '#25d366' }}
                title="Condividi su WhatsApp"
              >
                <MessageSquare className="w-4 h-4" />
              </a>
              <a
                href={`mailto:?subject=${encodeURIComponent(ad.name)}&body=${encodeURIComponent(shareUrl)}`}
                className="w-8 h-8 rounded-full flex items-center justify-center text-white bg-gray-500"
                title="Condividi via email"
              >
                <MailIcon className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Venditore + reputazione */}
          <p className="text-sm text-gray-600 mb-4">
            Inserito da{' '}
            <Link href={`/utenti/${ad.user.id}`} className="text-brand font-medium hover:underline">
              {ad.user.name || ad.user.username}
            </Link>
            {ad.user.isCompany ? (
              <span className="inline-flex items-center gap-1 ml-1.5 badge bg-blue-50 text-blue-700">
                <CheckCircle2 className="w-3 h-3" /> Venditore verificato
              </span>
            ) : null}
            {ad.user.points !== undefined && (
              <span className="text-gray-400"> · {ad.user.points} punti</span>
            )}
            {ad.feedPercent !== null && ad.feedPercent !== undefined && (
              <span className="text-gray-400"> · {ad.feedPercent}% positivi</span>
            )}
          </p>

          {/* Prezzo */}
          <p className="text-3xl font-bold text-brand mb-4">
            {ad.isHotel && <span className="text-base font-normal text-gray-500 block">Camere a partire da</span>}
            €{parseFloat(ad.price).toLocaleString('it-IT')}{ad.isHotel && ' *'}
          </p>

          {/* Azioni */}
          {isOwner ? (
            <div className="mb-6 rounded-lg border border-brand/20 bg-brand/5 p-4">
              <div className="mb-3 flex flex-wrap items-center gap-2 text-sm font-medium text-brand">
                <CheckCircle2 className="w-4 h-4" />
                Annuncio personale
                {ad.canBeOrdered ? (
                  <span className="badge bg-green-100 text-green-700">Compralo subito attivo</span>
                ) : (
                  <span className="badge bg-amber-100 text-amber-700">Compralo subito non attivo</span>
                )}
                {ad.published === 0 && <span className="badge bg-amber-100 text-amber-700">In moderazione</span>}
                {ad.sold === 1 && <span className="badge bg-gray-100 text-gray-700">Venduto</span>}
                <span className="badge bg-white text-gray-700">
                  {ad.user.isCompany ? `${ad.availableQuantity} pezzi disponibili` : 'Pezzo unico'}
                </span>
              </div>
              <p className="mb-3 text-sm text-gray-600">
                {ad.canBeOrdered
                  ? 'Gli acquirenti vedono il pulsante Compralo subito e possono andare direttamente al pagamento.'
                  : 'Gli acquirenti possono solo fare un\'offerta o contattarti. Abilita Compralo subito dalla modifica annuncio per permettere acquisto e pagamento diretto.'}
              </p>
              <div className="flex flex-wrap gap-2">
                <Link href={`/annunci/${ad.id}/modifica`} className="btn-primary justify-center">
                  <Pencil className="w-4 h-4" /> Modifica
                </Link>
                <Link href={`/annunci/${ad.id}/promuovi`} className="btn-secondary justify-center">
                  <Megaphone className="w-4 h-4" /> Promuovi
                </Link>
              </div>
            </div>
          ) : (
            <div className="mb-6 flex flex-wrap items-center gap-2">
              {ad.sold !== 1 && ad.availableQuantity > 0 && ad.canBeOrdered && <OrderButton ad={ad} />}
              {ad.sold !== 1 && <OfferButton ad={ad} />}
              {ad.user.phone && ad.user.phone !== '-' && (
                <a href={`tel:${ad.user.phone}`} className="btn-secondary border-green-300 text-green-700 hover:bg-green-50">
                  <Phone className="w-4 h-4" /> Chiama
                </a>
              )}
              <Link href={`/messaggi?to=${ad.user.id}&ad=${ad.id}`} className="btn-secondary border-green-300 text-green-700 hover:bg-green-50">
                <MessageSquare className="w-4 h-4" /> Messaggio
              </Link>
              {ad.user.isCompany && ad.hasMap && ad.mapCoords && (
                <a
                  href={`https://www.google.com/maps/place/@${ad.mapCoords},143m/`}
                  target="_blank" rel="noreferrer"
                  className="btn-secondary border-green-300 text-green-700 hover:bg-green-50"
                >
                  <MapPin className="w-4 h-4" /> Indicazioni
                </a>
              )}
              <ReportButton targetType="ad" targetId={ad.id} />
            </div>
          )}

          {/* Descrizione + dettagli */}
          <div className="space-y-2 mb-6 text-[15px]">
            <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{ad.description}</p>
            <p>Condizione: <span className="text-brand font-medium">{CONDITION_LABELS[ad.objCondition] ?? ad.objCondition}</span></p>
            <p>Località: <span className="text-brand font-medium">{ad.location} ({ad.region})</span></p>
            <p>Categoria: <span className="text-brand font-medium">{ad.category.name}</span></p>
            <p>
              Disponibilità:{' '}
              <span className="text-brand font-medium">
                {ad.sold === 1
                  ? 'Venduto'
                  : ad.user.isCompany
                    ? `${ad.availableQuantity} pezzi disponibili`
                    : 'Pezzo unico disponibile'}
              </span>
            </p>
            <p>
              Spedizione:{' '}
              <span className="text-brand font-medium">
                {ad.shippingAvailable
                  ? `Disponibile${ad.shippingCost ? ` — €${parseFloat(ad.shippingCost).toLocaleString('it-IT')}` : ' (costo da concordare)'}`
                  : 'Solo ritiro a mano'}
              </span>
              {ad.shippingAvailable && ad.shippingNotes && (
                <span className="text-gray-500"> · {ad.shippingNotes}</span>
              )}
            </p>
          </div>

          {/* Tag */}
          {ad.tags?.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {ad.tags.map((tag) => (
                <Link key={tag} href={`/annunci?q=${encodeURIComponent(tag)}`} className="badge bg-gray-100 text-gray-600 hover:bg-gray-200">
                  #{tag}
                </Link>
              ))}
            </div>
          )}

          {/* Recensioni — solo per venditori business con recensioni abilitate, come nel legacy */}
          {ad.user.isCompany && ad.hasReviews ? (
            <div className="border-t pt-6">
              <h2 className="mb-4">Recensioni {ad.reviews?.length ? `(${ad.reviews.length})` : ''}</h2>
              {!ad.reviews?.length ? (
                <p className="text-sm text-gray-500">Non ci sono ancora recensioni per questo annuncio.</p>
              ) : (
                <div className="space-y-4">
                  {ad.reviews.map((r) => (
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
              )}
            </div>
          ) : null}
        </div>

        {ad.user.isCompany && (
          <aside className="lg:w-72 flex-shrink-0">
            <div className="card p-5 sticky top-24">
              <div className="mb-4 flex items-start gap-3">
                {ad.user.companyLogo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={ad.user.companyLogo} alt={ad.user.name || ad.user.username} className="h-14 w-14 rounded-lg object-contain border border-gray-100" />
                ) : (
                  <div className="h-14 w-14 rounded-lg bg-brand/10 flex items-center justify-center text-lg font-semibold text-brand">
                    {(ad.user.name || ad.user.username)[0]?.toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900">{ad.user.name || ad.user.username}</p>
                  <span className="badge bg-blue-50 text-blue-700 mt-1 inline-flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Account Business
                  </span>
                </div>
              </div>

              <div className="space-y-2 text-sm text-gray-600">
                {ad.user.city && (
                  <p className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-brand" /> {ad.user.city}
                  </p>
                )}
                {ad.user.points !== undefined && (
                  <p className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-400" /> {ad.user.points} punti reputazione
                  </p>
                )}
                {ad.feedPercent !== null && ad.feedPercent !== undefined && (
                  <p>{ad.feedPercent}% feedback positivi</p>
                )}
              </div>

              <div className="mt-4 flex flex-col gap-2">
                <Link href={`/utenti/${ad.user.id}`} className="btn-secondary justify-center text-sm">
                  Vedi profilo pubblico
                </Link>
                {ad.user.companyWebsite && (
                  <a href={ad.user.companyWebsite} target="_blank" rel="noreferrer" className="btn-secondary justify-center text-sm">
                    <ExternalLink className="w-4 h-4" /> Sito aziendale
                  </a>
                )}
              </div>
            </div>
          </aside>
        )}
      </div>

      {/* Annunci simili */}
      {ad.similar && ad.similar.length > 0 && (
        <div className="mt-12 border-t pt-8">
          <h2 className="mb-4">Inserzioni nella categoria {ad.category.name}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {ad.similar.map((s) => (
              <Link key={s.id} href={`/annunci/${s.id}`} className="card overflow-hidden hover:shadow-md transition-shadow group">
                <div className="aspect-square bg-gray-100">
                  {s.photos[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={s.photos[0].url} alt={s.name} className="w-full h-full object-cover" />
                  ) : null}
                </div>
                <div className="p-2">
                  <p className="text-xs font-medium line-clamp-2 group-hover:text-brand">{s.name}</p>
                  <p className="text-sm font-bold text-brand">€{parseFloat(s.price).toLocaleString('it-IT')}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
