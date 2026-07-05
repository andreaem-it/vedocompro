'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingCart, Truck, X } from 'lucide-react';
import { adsApi, stripeApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Ad } from '@/types';

type OrderableAd = Pick<Ad, 'id' | 'price' | 'availableQuantity' | 'shippingAvailable' | 'shippingCost' | 'shippingNotes' | 'location' | 'provincia'>;

// offerId/agreedPrice: checkout da offerta accettata — prezzo bloccato all'importo
// concordato, quantità fissa 1 (vedi createOrder lato API).
export default function OrderButton({ ad, offerId, agreedPrice }: { ad: OrderableAd; offerId?: number; agreedPrice?: string }) {
  const { user } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [qty, setQty] = useState(1);
  const [deliveryMethod, setDeliveryMethod] = useState<'meetup' | 'shipping'>('meetup');
  const [buyerName, setBuyerName] = useState(user?.name ?? '');
  const [buyerPhone, setBuyerPhone] = useState(user?.phone ?? '');
  const [shippingAddress, setShippingAddress] = useState('');
  const [shippingCity, setShippingCity] = useState('');
  const [shippingPostalCode, setShippingPostalCode] = useState('');
  const [shippingProvince, setShippingProvince] = useState('');
  const [buyerNotes, setBuyerNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const effectivePrice = agreedPrice ?? ad.price;
  const effectiveQty = offerId ? 1 : qty;
  const maxQty = Math.max(1, ad.availableQuantity ?? 1);
  const shippingAmount = deliveryMethod === 'shipping' && ad.shippingCost ? parseFloat(ad.shippingCost) : 0;
  const total = parseFloat(effectivePrice) * effectiveQty + shippingAmount;

  const handleOrder = async () => {
    if (!user) {
      router.push(`/login?redirect=/annunci/${ad.id}`);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const orderRes = await adsApi.createOrder(ad.id, {
        qty: effectiveQty,
        offerId,
        deliveryMethod,
        buyerName,
        buyerPhone,
        shippingAddress,
        shippingCity,
        shippingPostalCode,
        shippingProvince,
        buyerNotes,
      });
      const orderId = orderRes.data?.id;
      if (!orderId) {
        setMessage('Ordine creato. Vai ad acquisti e vendite per completare il pagamento.');
        setOpen(false);
        return;
      }

      try {
        const checkoutRes = await stripeApi.createCheckout(orderId);
        if (checkoutRes.data?.url) {
          window.location.href = checkoutRes.data.url;
          return;
        }
        setMessage('Ordine creato. Vai ad acquisti e vendite per completare il pagamento.');
      } catch {
        setMessage('Ordine creato. Il pagamento con carta non è disponibile: vai ad acquisti e vendite per completarlo.');
      }
      setOpen(false);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      setError(e.response?.data?.error ?? 'Errore durante l\'ordine');
    } finally {
      setLoading(false);
    }
  };

  if (message) {
    return <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">{message}</p>;
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="btn-primary justify-center">
        <ShoppingCart className="w-4 h-4" /> {offerId ? 'Completa ordine' : 'Compralo subito'}
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg bg-white shadow-xl">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <h2 className="text-base font-semibold">{offerId ? 'Completa ordine' : 'Compralo subito'}</h2>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-full p-1 text-gray-500 hover:bg-gray-100"
            title="Chiudi"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3 p-5">
          {offerId ? (
            <p className="text-sm text-gray-600">
              Prezzo concordato: <span className="font-semibold text-brand">€{parseFloat(effectivePrice).toLocaleString('it-IT', { minimumFractionDigits: 2 })}</span>
            </p>
          ) : (
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">Quantità</label>
              <input
                type="number"
                min={1}
                max={maxQty}
                value={qty}
                onChange={(e) => setQty(Math.min(maxQty, Math.max(1, parseInt(e.target.value, 10) || 1)))}
                className="input w-20 py-1.5"
              />
              <span className="text-xs text-gray-500">Disponibili: {maxQty}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setDeliveryMethod('meetup')}
              className={`btn-secondary justify-center text-xs ${deliveryMethod === 'meetup' ? 'border-brand text-brand bg-brand/5' : ''}`}
            >
              Ritiro
            </button>
            <button
              type="button"
              onClick={() => ad.shippingAvailable && setDeliveryMethod('shipping')}
              disabled={!ad.shippingAvailable}
              className={`btn-secondary justify-center text-xs disabled:opacity-40 ${deliveryMethod === 'shipping' ? 'border-brand text-brand bg-brand/5' : ''}`}
              title={ad.shippingAvailable ? undefined : 'Spedizione non disponibile'}
            >
              <Truck className="w-3.5 h-3.5" /> Spedizione
            </button>
          </div>

          {deliveryMethod === 'meetup' ? (
            <p className="text-xs text-gray-500">Ritiro/consegna da concordare con il venditore in zona {ad.location}, {ad.provincia}.</p>
          ) : (
            <div className="space-y-2">
              {ad.shippingNotes && <p className="text-xs text-gray-500">{ad.shippingNotes}</p>}
              <div className="grid sm:grid-cols-2 gap-2">
                <input value={buyerName} onChange={(e) => setBuyerName(e.target.value)} className="input text-sm" placeholder="Nome destinatario" />
                <input value={buyerPhone} onChange={(e) => setBuyerPhone(e.target.value)} className="input text-sm" placeholder="Telefono" />
              </div>
              <input value={shippingAddress} onChange={(e) => setShippingAddress(e.target.value)} className="input text-sm" placeholder="Indirizzo" />
              <div className="grid grid-cols-3 gap-2">
                <input value={shippingPostalCode} onChange={(e) => setShippingPostalCode(e.target.value)} className="input text-sm" placeholder="CAP" />
                <input value={shippingCity} onChange={(e) => setShippingCity(e.target.value)} className="input text-sm col-span-2" placeholder="Comune" />
              </div>
              <input value={shippingProvince} onChange={(e) => setShippingProvince(e.target.value)} className="input text-sm" placeholder="Provincia" />
            </div>
          )}

          <textarea
            value={buyerNotes}
            onChange={(e) => setBuyerNotes(e.target.value)}
            className="input text-sm min-h-20 resize-none"
            placeholder="Note per il venditore (opzionale)"
          />

          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Totale ordine</span>
            <span className="font-semibold text-brand">€{total.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>

          {error && <p className="text-xs text-red-600">{error}</p>}
        </div>

        <div className="grid grid-cols-2 gap-2 border-t p-5">
          <button type="button" onClick={() => setOpen(false)} className="btn-secondary justify-center text-sm">
            Annulla
          </button>
          <button onClick={handleOrder} disabled={loading} className="btn-primary justify-center text-sm">
            <ShoppingCart className="w-4 h-4" /> {loading ? 'Apertura pagamento...' : 'Vai al pagamento'}
          </button>
        </div>
      </div>
    </div>
  );
}
