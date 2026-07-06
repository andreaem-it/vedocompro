'use client';

import { notFound } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MapPin, Eye, Phone, MessageSquare, Star, CheckCircle2, ExternalLink, Facebook, Twitter, Mail as MailIcon, Pencil, Megaphone, Shield, Truck, CreditCard, PackageCheck, ChevronLeft, ImageOff, BarChart3, BadgeCheck, Heart } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
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
  const queryClient = useQueryClient();
  const [wishlistError, setWishlistError] = useState('');
  const { data: ad, isLoading, isError } = useQuery({
    queryKey: ['ad', id],
    queryFn: () => adsApi.getById(Number(id)).then((r) => r.data as Ad),
    retry: false,
  });
  const wishlistMutation = useMutation({
    mutationFn: () => adsApi.toggleWishlist(Number(id)),
    onSuccess: (response) => {
      setWishlistError('');
      queryClient.setQueryData<Ad>(['ad', id], (current) => current ? { ...current, isWishlisted: response.data.wishlisted } : current);
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
      queryClient.invalidateQueries({ queryKey: ['ads'] });
    },
    onError: () => {
      setWishlistError('Non sono riuscito ad aggiornare i preferiti. Riprova tra poco.');
    },
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
  const availabilityText = ad.sold === 1
    ? 'Venduto'
    : ad.user.isCompany
      ? `${ad.availableQuantity} pezzi disponibili`
      : 'Pezzo unico disponibile';
  const priceLabel = `€${parseFloat(ad.price).toLocaleString('it-IT')}`;
  const canBuyNow = !isOwner && ad.sold !== 1 && ad.availableQuantity > 0 && ad.canBeOrdered;
  const canMakeOffer = !isOwner && ad.sold !== 1;
  const publicationLabel = ad.published === 1 ? 'Pubblicato' : ad.published === 2 ? 'Rifiutato' : 'In moderazione';
  const promotionLabel = ad.objLevel >= 3 ? 'Gold' : ad.objLevel === 2 ? 'Silver' : ad.objLevel === 1 ? 'Bronze' : 'Nessuna';
  const creationDateLabel = new Date(ad.creationTime).toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' });
  const updateDateLabel = new Date(ad.updateTime).toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' });
  const trustSignals = [
    ad.feedPercent !== null && ad.feedPercent !== undefined ? `${ad.feedPercent}% feedback positivi` : null,
    ad.user.phoneVerified ? 'Telefono verificato' : null,
    ad.user.isCompany ? 'Account Business' : 'Venditore privato',
  ].filter(Boolean);
  const glanceCard = (
    <div className="mb-5 rounded-xl border border-gray-200 bg-white p-3">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-gray-900">A colpo d&apos;occhio</h2>
        <span className="text-xs text-gray-500">{ad.location} ({ad.region})</span>
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <div className="rounded-lg border border-gray-200 bg-white p-3 text-sm">
          <p className="mb-1 flex items-center gap-2 font-medium text-gray-900">
            <PackageCheck className="w-4 h-4 text-brand" /> Disponibilita
          </p>
          <p className="text-gray-600">{availabilityText}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-3 text-sm">
          <p className="mb-1 flex items-center gap-2 font-medium text-gray-900">
            <Truck className="w-4 h-4 text-brand" /> Consegna
          </p>
          <p className="text-gray-600">
            {ad.shippingAvailable
              ? `Spedizione disponibile${ad.shippingCost ? ` a €${parseFloat(ad.shippingCost).toLocaleString('it-IT')}` : ''}`
              : 'Ritiro/consegna da concordare'}
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-3 text-sm">
          <p className="mb-1 flex items-center gap-2 font-medium text-gray-900">
            <CreditCard className="w-4 h-4 text-brand" /> Acquisto
          </p>
          <p className="text-gray-600">
            {ad.canBeOrdered ? 'Compralo subito disponibile' : 'Offerta o contatto con il venditore'}
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-3 text-sm">
          <p className="mb-1 flex items-center gap-2 font-medium text-gray-900">
            <Shield className="w-4 h-4 text-brand" /> Fiducia
          </p>
          <p className="text-gray-600">
            {ad.feedPercent !== null && ad.feedPercent !== undefined
              ? `${ad.feedPercent}% feedback positivi`
              : ad.user.isCompany ? 'Venditore Business verificato' : 'Controlla profilo e feedback'}
          </p>
        </div>
      </div>
    </div>
  );
  const ownerPanel = isOwner ? (
    <div className="mt-4 rounded-lg border border-brand/20 bg-brand/5 p-4">
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
        <span className="badge bg-white text-gray-700">{availabilityText}</span>
      </div>
      <p className="mb-3 text-sm text-gray-600">
        {ad.canBeOrdered
          ? 'Gli acquirenti vedono il pulsante Compralo subito e possono andare direttamente al pagamento.'
          : 'Gli acquirenti possono solo fare un\'offerta o contattarti. Abilita Compralo subito dalla modifica annuncio per permettere acquisto e pagamento diretto.'}
      </p>
      <div className="mb-4 grid grid-cols-2 gap-2 text-xs">
        <div className="rounded-lg bg-white p-2">
          <p className="text-gray-500">Stato</p>
          <p className="font-semibold text-gray-900">{publicationLabel}</p>
        </div>
        <div className="rounded-lg bg-white p-2">
          <p className="text-gray-500">Promozione</p>
          <p className="font-semibold text-gray-900">{promotionLabel}</p>
        </div>
        <div className="rounded-lg bg-white p-2">
          <p className="text-gray-500">Visite</p>
          <p className="font-semibold text-gray-900">{ad.views.toLocaleString('it-IT')}</p>
        </div>
        <div className="rounded-lg bg-white p-2">
          <p className="text-gray-500">Contatti</p>
          <p className="font-semibold text-gray-900">{(ad.callClicks + ad.messageClicks).toLocaleString('it-IT')}</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Link href={`/annunci/${ad.id}/modifica`} className="btn-primary justify-center">
          <Pencil className="w-4 h-4" /> Modifica
        </Link>
        <Link href={`/annunci/${ad.id}/promuovi`} className="btn-secondary justify-center">
          <Megaphone className="w-4 h-4" /> Promuovi
        </Link>
        <Link href="/profilo/statistiche" className="btn-secondary justify-center">
          <BarChart3 className="w-4 h-4" /> Statistiche
        </Link>
      </div>
    </div>
  ) : null;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 pb-28 sm:px-6 lg:pb-8">
      {ad.published === 0 && (
        <div className="mb-4 bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg text-sm">
          Questo annuncio è in attesa di moderazione: solo tu (e gli admin) puoi vederlo.
        </div>
      )}

      <nav className="mb-4 flex flex-wrap items-center gap-2 text-sm text-gray-500">
        <Link href="/annunci" className="inline-flex items-center gap-1 font-medium text-brand hover:underline">
          <ChevronLeft className="h-4 w-4" />
          Annunci
        </Link>
        <span>/</span>
        <Link href={`/annunci?categoryId=${ad.category.id}`} className="hover:text-brand hover:underline">
          {ad.category.name}
        </Link>
        <span>/</span>
        <Link href={`/annunci?location=${encodeURIComponent(ad.location)}`} className="hover:text-brand hover:underline">
          {ad.location}
        </Link>
      </nav>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Colonna sinistra: video (media principale di VedoCompro) + info accessorie */}
        <div className="lg:w-[360px] flex-shrink-0">
          {video ? (
            <div className="rounded-xl overflow-hidden bg-black aspect-video mb-3">
              <video src={video.filename} controls poster={ad.photos?.[0]?.url} className="w-full h-full object-contain bg-black" />
            </div>
          ) : ad.photos && ad.photos.length > 0 ? (
            <PhotoGallery photos={ad.photos as Photo[]} title={ad.name} />
          ) : (
            <div className="rounded-xl bg-gray-100 aspect-video mb-3 flex flex-col items-center justify-center text-gray-400 text-sm">
              <ImageOff className="mb-2 h-7 w-7" />
              Nessuna foto o video disponibile
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

          {glanceCard}

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
          <div className="mb-2 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <h1 className="text-2xl font-semibold">{ad.name}</h1>
              {wishlistError && <p className="mt-1 text-xs text-red-600">{wishlistError}</p>}
            </div>
            {!isOwner && (
              <button
                type="button"
                onClick={() => wishlistMutation.mutate()}
                disabled={wishlistMutation.isPending}
                className={`btn-secondary flex-shrink-0 justify-center text-sm ${ad.isWishlisted ? 'border-red-200 bg-red-50 text-red-700 hover:bg-red-100' : ''}`}
                title={ad.isWishlisted ? 'Rimuovi dai preferiti' : 'Aggiungi ai preferiti'}
              >
                <Heart className={`h-4 w-4 ${ad.isWishlisted ? 'fill-red-500 text-red-500' : ''}`} />
                {ad.isWishlisted ? 'Salvato' : 'Salva'}
              </button>
            )}
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
            {priceLabel}{ad.isHotel && ' *'}
          </p>

          {/* Azioni */}
          {isOwner ? (
            null
          ) : (
            <div className="mb-6 rounded-xl border border-gray-200 bg-white p-4">
              {ad.sold === 1 || ad.availableQuantity <= 0 ? (
                <div className="rounded-lg bg-gray-50 p-3 text-sm text-gray-600">
                  Questo annuncio risulta venduto o non piu disponibile.
                </div>
              ) : (
                <>
                  <div className="mb-3">
                    <h2 className="text-base font-semibold text-gray-900">Come vuoi procedere?</h2>
                    <p className="text-sm text-gray-500">
                      {ad.canBeOrdered
                        ? 'Puoi acquistare subito oppure provare a trattare con un\'offerta.'
                        : 'Il venditore non ha attivato l\'acquisto diretto: puoi fare un\'offerta o chiedere dettagli.'}
                    </p>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {canBuyNow && (
                      <div className="sm:col-span-2">
                        <OrderButton ad={ad} />
                      </div>
                    )}
                    {canMakeOffer && <OfferButton ad={ad} />}
                    <Link href={`/messaggi?to=${ad.user.id}&ad=${ad.id}`} className="btn-secondary justify-center border-green-300 text-green-700 hover:bg-green-50">
                      <MessageSquare className="w-4 h-4" /> Messaggio
                    </Link>
                    {ad.user.phone && ad.user.phone !== '-' && (
                      <a href={`tel:${ad.user.phone}`} className="btn-secondary justify-center border-green-300 text-green-700 hover:bg-green-50">
                        <Phone className="w-4 h-4" /> Chiama
                      </a>
                    )}
                    {ad.user.isCompany && ad.hasMap && ad.mapCoords && (
                      <a
                        href={`https://www.google.com/maps/place/@${ad.mapCoords},143m/`}
                        target="_blank" rel="noreferrer"
                        className="btn-secondary justify-center border-green-300 text-green-700 hover:bg-green-50"
                      >
                        <MapPin className="w-4 h-4" /> Indicazioni
                      </a>
                    )}
                    <ReportButton targetType="ad" targetId={ad.id} />
                  </div>
                  <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                    <p className="mb-1 flex items-center gap-2 font-semibold">
                      <Shield className="h-4 w-4" />
                      Acquista con attenzione
                    </p>
                    <p>Resta su VedoCompro per messaggi, offerte e pagamenti tracciabili. Evita ricariche, link esterni e codici inviati fuori piattaforma.</p>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Descrizione + dettagli */}
          <div className="card mb-6 p-5">
            <h2 className="mb-3 text-lg font-semibold text-gray-900">Informazioni prodotto</h2>
            <p className="mb-5 text-[15px] leading-relaxed text-gray-700 whitespace-pre-wrap">{ad.description}</p>
            <dl className="grid gap-3 border-t border-gray-100 pt-4 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-gray-500">Condizione</dt>
                <dd className="font-medium text-brand">{CONDITION_LABELS[ad.objCondition] ?? ad.objCondition}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Localita</dt>
                <dd className="font-medium text-brand">{ad.location} ({ad.region})</dd>
              </div>
              <div>
                <dt className="text-gray-500">Categoria</dt>
                <dd className="font-medium text-brand">{ad.category.name}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Disponibilita</dt>
                <dd className="font-medium text-brand">{ad.sold === 1 ? 'Venduto' : availabilityText}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Pubblicato</dt>
                <dd className="font-medium text-gray-900">{creationDateLabel}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Aggiornato</dt>
                <dd className="font-medium text-gray-900">{updateDateLabel}</dd>
              </div>
              <div>
                <dt className="text-gray-500">ID annuncio</dt>
                <dd className="font-medium text-gray-900">#{ad.id}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-gray-500">Spedizione</dt>
                <dd className="font-medium text-brand">
                  {ad.shippingAvailable
                    ? `Disponibile${ad.shippingCost ? ` - €${parseFloat(ad.shippingCost).toLocaleString('it-IT')}` : ' (costo da concordare)'}`
                    : 'Solo ritiro a mano'}
                  {ad.shippingAvailable && ad.shippingNotes && (
                    <span className="font-normal text-gray-500"> · {ad.shippingNotes}</span>
                  )}
                </dd>
              </div>
            </dl>
            {ad.fields && ad.fields.length > 0 && (
              <div className="mt-5 border-t border-gray-100 pt-4">
                <h3 className="mb-3 text-base font-semibold text-gray-900">Specifiche</h3>
                <dl className="grid gap-3 text-sm sm:grid-cols-2">
                  {ad.fields.map((field, i) => (
                    <div key={`${field}-${i}`}>
                      <dt className="text-gray-500">{field}</dt>
                      <dd className="font-medium text-gray-900">{ad.vals?.[i] || '-'}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}
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
                {ad.user.isCompany ? (
                  <span className="badge bg-blue-50 text-blue-700 mt-1 inline-flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Account Business
                  </span>
                ) : (
                  <span className="badge bg-gray-100 text-gray-700 mt-1">Venditore privato</span>
                )}
              </div>
            </div>

            <div className="space-y-2 text-sm text-gray-600">
              {trustSignals.length > 0 && (
                <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                  <p className="mb-2 flex items-center gap-2 font-medium text-gray-900">
                    <BadgeCheck className="w-4 h-4 text-brand" /> Segnali di fiducia
                  </p>
                  <ul className="space-y-1 text-xs text-gray-600">
                    {trustSignals.map((signal) => (
                      <li key={signal} className="flex items-center gap-2">
                        <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                        {signal}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
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

            <div className="mt-5 border-t border-gray-100 pt-4">
              <p className="mb-2 text-xs font-medium uppercase text-gray-500">Condividi annuncio</p>
              <div className="grid grid-cols-4 gap-2">
                <a
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
                  target="_blank" rel="noreferrer"
                  className="flex h-9 items-center justify-center rounded-lg text-white"
                  style={{ backgroundColor: '#3B5998' }}
                  title="Condividi su Facebook"
                >
                  <Facebook className="w-4 h-4" />
                </a>
                <a
                  href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(ad.name)}`}
                  target="_blank" rel="noreferrer"
                  className="flex h-9 items-center justify-center rounded-lg text-white"
                  style={{ backgroundColor: '#55acee' }}
                  title="Condividi su Twitter"
                >
                  <Twitter className="w-4 h-4" />
                </a>
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(`${ad.name} - ${shareUrl}`)}`}
                  target="_blank" rel="noreferrer"
                  className="flex h-9 items-center justify-center rounded-lg text-white"
                  style={{ backgroundColor: '#25d366' }}
                  title="Condividi su WhatsApp"
                >
                  <MessageSquare className="w-4 h-4" />
                </a>
                <a
                  href={`mailto:?subject=${encodeURIComponent(ad.name)}&body=${encodeURIComponent(shareUrl)}`}
                  className="flex h-9 items-center justify-center rounded-lg bg-gray-500 text-white"
                  title="Condividi via email"
                >
                  <MailIcon className="w-4 h-4" />
                </a>
              </div>
            </div>

            {ownerPanel}
          </div>
        </aside>
      </div>

      {/* Annunci simili */}
      {ad.similar && ad.similar.length > 0 && (
        <section className="mt-12 border-t pt-8">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Altri annunci in {ad.category.name}</h2>
              <p className="text-sm text-gray-500">Continua a confrontare prodotti simili prima di decidere.</p>
            </div>
            <Link href={`/annunci?categoryId=${ad.category.id}`} className="btn-secondary justify-center text-sm">
              Vedi tutta la categoria
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {ad.similar.map((s) => (
              <Link key={s.id} href={`/annunci/${s.id}`} className="card overflow-hidden hover:shadow-md transition-shadow group">
                <div className="aspect-[4/3] bg-gray-100">
                  {s.photos[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={s.photos[0].url} alt={s.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center text-xs text-gray-400">
                      <ImageOff className="mb-1 h-5 w-5" />
                      Nessuna immagine
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <p className="min-h-10 text-sm font-medium line-clamp-2 group-hover:text-brand">{s.name}</p>
                  <p className="mt-2 text-base font-bold text-brand">€{parseFloat(s.price).toLocaleString('it-IT')}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white/95 px-4 py-3 shadow-lg backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-xs text-gray-500">{availabilityText}</p>
            <p className="text-lg font-bold text-brand">{priceLabel}</p>
          </div>
          {isOwner ? (
            <Link href={`/annunci/${ad.id}/modifica`} className="btn-primary flex-shrink-0 justify-center text-sm">
              <Pencil className="w-4 h-4" /> Modifica
            </Link>
          ) : canBuyNow ? (
            <div className="flex-shrink-0">
              <OrderButton ad={ad} />
            </div>
          ) : canMakeOffer ? (
            <div className="flex-shrink-0">
              <OfferButton ad={ad} />
            </div>
          ) : (
            <Link href={`/messaggi?to=${ad.user.id}&ad=${ad.id}`} className="btn-secondary flex-shrink-0 justify-center text-sm">
              <MessageSquare className="w-4 h-4" /> Messaggio
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
