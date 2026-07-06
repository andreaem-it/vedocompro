'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { usersApi, stripeApi } from '@/lib/api';
import { BuySell, AdOrder } from '@/types';
import { Package, Truck, CheckCircle2, ReceiptText, CreditCard } from 'lucide-react';
import DisputeSection from '@/components/orders/DisputeSection';

// La contestazione è possibile solo su ordini accettati/spediti/completati
// (stessa regola dell'API: no pending/rejected/cancelled).
function canDispute(status: number) {
  return [1, 3, 4].includes(status);
}

type Tab = 'sells' | 'buys' | 'received-orders' | 'my-orders';
type OrderFilter = 'all' | 'pending' | 'active' | 'completed' | 'issue';

const ORDER_STATUS_LABELS: Record<number, string> = {
  0: 'In attesa',
  1: 'Accettato',
  2: 'Rifiutato',
  3: 'Spedito / pronto',
  4: 'Completato',
  5: 'Annullato',
};

const PAYMENT_LABELS: Record<string, string> = {
  unpaid: 'Pagamento non avviato',
  pending: 'Pagamento in verifica',
  paid: 'Pagato',
  refunded: 'Rimborsato',
};

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  bank_transfer: 'Bonifico',
  paypal: 'PayPal',
  cash: 'Contanti alla consegna',
  other: 'Altro accordo',
};

const TABS: { id: Tab; label: string }[] = [
  { id: 'sells', label: 'Le mie vendite' },
  { id: 'buys', label: 'I miei acquisti' },
  { id: 'received-orders', label: 'Ordini ricevuti' },
  { id: 'my-orders', label: 'I miei ordini' },
];

const ORDER_FILTERS: { id: OrderFilter; label: string; statuses?: number[]; dispute?: boolean }[] = [
  { id: 'all', label: 'Tutti' },
  { id: 'pending', label: 'Da gestire', statuses: [0] },
  { id: 'active', label: 'In corso', statuses: [1, 3] },
  { id: 'completed', label: 'Chiusi', statuses: [2, 4, 5] },
  { id: 'issue', label: 'Contestati', dispute: true },
];

export default function AcquistiVenditePage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('sells');

  useEffect(() => {
    if (!isLoading && !user) router.replace('/login');
  }, [user, isLoading, router]);

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6">
      <h1 className="mb-6">Acquisti e vendite</h1>

      <div className="flex gap-2 mb-6 border-b overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
              tab === t.id ? 'border-brand text-brand' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'sells' && <SellsTab />}
      {tab === 'buys' && <BuysTab />}
      {tab === 'received-orders' && <ReceivedOrdersTab />}
      {tab === 'my-orders' && <MyOrdersTab />}
    </div>
  );
}

function formatMoney(value: string | number | null | undefined) {
  return `€${parseFloat(String(value ?? '0')).toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function filterOrders(orders: AdOrder[], filter: OrderFilter) {
  const config = ORDER_FILTERS.find((item) => item.id === filter);
  if (!config || filter === 'all') return orders;
  if (config.dispute) return orders.filter((order) => !!order.dispute);
  return orders.filter((order) => config.statuses?.includes(order.status));
}

function orderCounts(orders: AdOrder[]) {
  return {
    total: orders.length,
    pending: orders.filter((order) => order.status === 0).length,
    active: orders.filter((order) => [1, 3].includes(order.status)).length,
    completed: orders.filter((order) => [2, 4, 5].includes(order.status)).length,
    issues: orders.filter((order) => !!order.dispute).length,
  };
}

function orderStatusClass(status: number) {
  if (status === 0) return 'bg-amber-100 text-amber-800';
  if ([1, 3].includes(status)) return 'bg-blue-100 text-blue-800';
  if (status === 4) return 'bg-green-100 text-green-800';
  if ([2, 5].includes(status)) return 'bg-gray-100 text-gray-700';
  return 'bg-gray-100 text-gray-700';
}

function paymentStatusClass(status: string) {
  if (status === 'paid') return 'bg-green-100 text-green-800';
  if (status === 'pending') return 'bg-amber-100 text-amber-800';
  if (status === 'refunded') return 'bg-blue-100 text-blue-800';
  return 'bg-gray-100 text-gray-700';
}

function sellerNextAction(order: AdOrder) {
  if (order.dispute) return 'Contestazione aperta: rispondi nel thread e attendi la decisione.';
  if (order.status === 0) return 'Accetta o rifiuta l’ordine ricevuto.';
  if (order.status === 1) return order.deliveryMethod === 'shipping'
    ? 'Prepara la spedizione e aggiungi il tracking.'
    : 'Concorda il ritiro e segna quando è pronto.';
  if (order.status === 3) return 'Attendi la conferma del compratore o gestisci eventuali problemi.';
  if (order.status === 4) return 'Ordine completato.';
  if (order.status === 2) return 'Ordine rifiutato.';
  if (order.status === 5) return 'Ordine annullato.';
  return 'Controlla lo stato dell’ordine.';
}

function buyerNextAction(order: AdOrder) {
  if (order.dispute) return 'Contestazione aperta: segui il thread e rispondi se richiesto.';
  if (order.status === 0) return 'Attendi che il venditore accetti l’ordine.';
  if (order.paymentStatus !== 'paid' && ![2, 5].includes(order.status)) return 'Completa il pagamento o segnala il pagamento già inviato.';
  if (order.status === 1) return 'Pagamento e consegna sono in preparazione: resta in contatto con il venditore.';
  if (order.status === 3) return 'Verifica consegna/ritiro e conferma il completamento quando tutto è ok.';
  if (order.status === 4) return 'Ordine completato. Puoi conservare la ricevuta.';
  if (order.status === 2) return 'Ordine rifiutato dal venditore.';
  if (order.status === 5) return 'Ordine annullato.';
  return 'Controlla lo stato dell’ordine.';
}

function escapeHtml(value: string | number | null | undefined) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function getApiErrorMessage(error: unknown) {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const response = (error as { response?: { data?: { message?: string } } }).response;
    if (response?.data?.message) return response.data.message;
  }
  return 'Operazione non riuscita. Riprova tra poco.';
}

function SellerPaymentBox({ seller }: { seller?: AdOrder['ad']['user'] }) {
  if (!seller) return null;
  const methods = seller.paymentMethods ?? [];
  const hasPaymentInfo = methods.length > 0 || seller.paymentInstructions || seller.paymentPaypalEmail || seller.paymentIban;
  if (!hasPaymentInfo) return null;

  return (
    <div className="rounded-lg border border-blue-100 bg-blue-50 p-3 text-sm text-blue-900">
      <p className="font-medium mb-1">Indicazioni pagamento del venditore</p>
      {methods.length > 0 && (
        <p>Metodi: {methods.map((method) => PAYMENT_METHOD_LABELS[method] ?? method).join(', ')}</p>
      )}
      {seller.paymentPaypalEmail && <p>PayPal: {seller.paymentPaypalEmail}</p>}
      {seller.paymentIban && <p>IBAN: {seller.paymentIban}</p>}
      {seller.paymentAccountHolder && <p>Intestatario: {seller.paymentAccountHolder}</p>}
      {seller.paymentInstructions && <p className="mt-1 whitespace-pre-line">{seller.paymentInstructions}</p>}
    </div>
  );
}

function printOrderReceipt(order: AdOrder, role: 'buyer' | 'seller') {
  const seller = order.ad.user?.username ?? 'Venditore';
  const buyer = order.user?.username ?? order.buyerName ?? 'Compratore';
  const delivery = order.deliveryMethod === 'shipping' ? 'Spedizione' : 'Ritiro/consegna a mano';
  const address = order.deliveryMethod === 'shipping'
    ? `${order.shippingAddress ?? ''}, ${order.shippingPostalCode ?? ''} ${order.shippingCity ?? ''} (${order.shippingProvince ?? ''})`
    : 'Concordata tra le parti';
  const lines = [
    ['Ordine', `#${order.id}`],
    ['Ruolo copia', role === 'seller' ? 'Venditore' : 'Compratore'],
    ['Annuncio', order.ad.name],
    ['Venditore', seller],
    ['Compratore', buyer],
    ['Stato ordine', ORDER_STATUS_LABELS[order.status] ?? String(order.status)],
    ['Stato pagamento', PAYMENT_LABELS[order.paymentStatus] ?? order.paymentStatus],
    ['Consegna', delivery],
    ['Indirizzo/ritiro', address],
    ['Quantità', order.qty],
    ['Prezzo unitario', formatMoney(order.unitPrice)],
    ['Spedizione', formatMoney(order.shippingAmount)],
    ['Commissione piattaforma', formatMoney(order.platformFee)],
    ['Totale', formatMoney(order.totalAmount)],
    ['Tracking/note', order.trackingCode ?? '-'],
    ['Data ordine', new Date(order.orderDate).toLocaleString('it-IT')],
  ];

  const rows = lines.map(([label, value]) => `
    <tr>
      <th>${escapeHtml(label)}</th>
      <td>${escapeHtml(value)}</td>
    </tr>
  `).join('');

  const html = `<!doctype html>
    <html lang="it">
      <head>
        <meta charset="utf-8" />
        <title>Ricevuta ordine #${escapeHtml(order.id)}</title>
        <style>
          body { font-family: Arial, sans-serif; color: #1f2937; margin: 32px; }
          h1 { color: #236abd; margin-bottom: 4px; }
          .meta { color: #6b7280; margin-bottom: 24px; }
          table { width: 100%; border-collapse: collapse; margin-top: 24px; }
          th, td { border-bottom: 1px solid #e5e7eb; padding: 10px 8px; text-align: left; vertical-align: top; }
          th { width: 220px; color: #4b5563; background: #f9fafb; }
          .total td, .total th { font-weight: 700; font-size: 18px; }
          .note { margin-top: 28px; font-size: 12px; color: #6b7280; }
          @media print { button { display: none; } body { margin: 18mm; } }
        </style>
      </head>
      <body>
        <button onclick="window.print()">Stampa</button>
        <h1>VedoCompro.it</h1>
        <p class="meta">Ricevuta ordine generata il ${escapeHtml(new Date().toLocaleString('it-IT'))}</p>
        <table>${rows.replace('<tr>\n      <th>Totale</th>', '<tr class="total">\n      <th>Totale</th>')}</table>
        <p class="note">Documento operativo generato dal profilo utente. Non sostituisce fattura o ricevuta fiscale del venditore.</p>
      </body>
    </html>`;

  const printWindow = window.open('', '_blank', 'noopener,noreferrer,width=900,height=700');
  if (!printWindow) return;
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
}

function OrderToolbar({
  orders,
  filter,
  onFilter,
}: {
  orders: AdOrder[];
  filter: OrderFilter;
  onFilter: (filter: OrderFilter) => void;
}) {
  const counts = orderCounts(orders);
  const countByFilter: Record<OrderFilter, number> = {
    all: counts.total,
    pending: counts.pending,
    active: counts.active,
    completed: counts.completed,
    issue: counts.issues,
  };

  return (
    <div className="card p-4 space-y-3">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
        <div className="rounded-lg border border-gray-200 p-3">
          <p className="text-gray-500">Totali</p>
          <p className="text-xl font-semibold">{counts.total}</p>
        </div>
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
          <p className="text-amber-700">Da gestire</p>
          <p className="text-xl font-semibold text-amber-800">{counts.pending}</p>
        </div>
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
          <p className="text-blue-700">In corso</p>
          <p className="text-xl font-semibold text-blue-800">{counts.active}</p>
        </div>
        <div className="rounded-lg border border-red-200 bg-red-50 p-3">
          <p className="text-red-700">Contestati</p>
          <p className="text-xl font-semibold text-red-800">{counts.issues}</p>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto">
        {ORDER_FILTERS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onFilter(item.id)}
            className={filter === item.id ? 'btn-primary text-xs whitespace-nowrap' : 'btn-secondary text-xs whitespace-nowrap'}
          >
            {item.label}
            <span className="ml-1 opacity-75">({countByFilter[item.id]})</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function SellsTab() {
  const queryClient = useQueryClient();
  const { data: sells } = useQuery({
    queryKey: ['my-sells'],
    queryFn: () => usersApi.getSells().then((r) => r.data as BuySell[]),
  });
  const [trackingDrafts, setTrackingDrafts] = useState<Record<number, string>>({});

  const updateSell = useMutation({
    mutationFn: ({ id, data }: { id: number; data: { shipped?: boolean; paid?: boolean; trackingCode?: string } }) =>
      usersApi.updateSell(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['my-sells'] }),
  });

  if (!sells?.length) return <EmptyState text="Non hai ancora venduto nessun articolo." />;

  return (
    <div className="space-y-4">
      {sells.map((s) => (
        <div key={s.id} className="card p-5">
          <div className="flex items-start justify-between gap-4 mb-3">
            <div>
              <Link href={`/annunci/${s.ad.id}`} className="font-semibold hover:text-brand">{s.ad.name}</Link>
              <p className="text-sm text-gray-500">€{parseFloat(s.ad.price).toLocaleString('it-IT')}</p>
            </div>
            <div className="flex gap-2">
              {s.paid === 1 && <span className="badge bg-green-100 text-green-700">Pagato</span>}
              {s.shipped === 1 && <span className="badge bg-blue-100 text-blue-700">Spedito</span>}
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-3">
            <button
              onClick={() => updateSell.mutate({ id: s.id, data: { paid: s.paid !== 1 } })}
              className="btn-secondary text-xs"
            >
              <CheckCircle2 className="w-3.5 h-3.5" /> {s.paid === 1 ? 'Segna come non pagato' : 'Segna come pagato'}
            </button>
            <button
              onClick={() => updateSell.mutate({ id: s.id, data: { shipped: s.shipped !== 1 } })}
              className="btn-secondary text-xs"
            >
              <Truck className="w-3.5 h-3.5" /> {s.shipped === 1 ? 'Segna come non spedito' : 'Segna come spedito'}
            </button>
          </div>

          <div className="flex gap-2">
            <input
              className="input text-sm flex-1"
              placeholder="Codice di tracciamento"
              defaultValue={s.ad.trackingCode ?? ''}
              onChange={(e) => setTrackingDrafts((prev) => ({ ...prev, [s.id]: e.target.value }))}
            />
            <button
              onClick={() => updateSell.mutate({ id: s.id, data: { trackingCode: trackingDrafts[s.id] ?? s.ad.trackingCode ?? '' } })}
              className="btn-secondary text-sm"
            >
              Salva
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function BuysTab() {
  const { data: buys } = useQuery({
    queryKey: ['my-buys'],
    queryFn: () => usersApi.getBuys().then((r) => r.data as BuySell[]),
  });

  if (!buys?.length) return <EmptyState text="Non hai ancora acquistato nessun articolo." />;

  return (
    <div className="space-y-4">
      {buys.map((b) => (
        <div key={b.id} className="card p-5 flex items-start justify-between gap-4">
          <div>
            <Link href={`/annunci/${b.ad.id}`} className="font-semibold hover:text-brand">{b.ad.name}</Link>
            <p className="text-sm text-gray-500">€{parseFloat(b.ad.price).toLocaleString('it-IT')}</p>
            {b.ad.trackingCode && <p className="text-xs text-gray-500 mt-1">Tracking: {b.ad.trackingCode}</p>}
          </div>
          <div className="flex gap-2 flex-shrink-0">
            {b.paid === 1 && <span className="badge bg-green-100 text-green-700">Pagato</span>}
            {b.shipped === 1 && <span className="badge bg-blue-100 text-blue-700">Spedito</span>}
          </div>
        </div>
      ))}
    </div>
  );
}

function ReceivedOrdersTab() {
  const queryClient = useQueryClient();
  const [trackingDrafts, setTrackingDrafts] = useState<Record<number, string>>({});
  const [filter, setFilter] = useState<OrderFilter>('all');
  const { data: orders } = useQuery({
    queryKey: ['received-orders'],
    queryFn: () => usersApi.getReceivedOrders().then((r) => r.data as AdOrder[]),
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status, trackingCode }: { id: number; status: number; trackingCode?: string }) =>
      usersApi.updateOrderStatus(id, { status, trackingCode }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['received-orders'] }),
  });

  if (!orders?.length) return <EmptyState text="Non hai ricevuto nessun ordine." />;
  const filteredOrders = filterOrders(orders, filter);

  return (
    <div className="space-y-4">
      <OrderToolbar orders={orders} filter={filter} onFilter={setFilter} />
      {!filteredOrders.length && <EmptyState text="Nessun ordine in questo filtro." />}
      {filteredOrders.map((o) => (
        <div key={o.id} className="card p-5 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <Link href={`/annunci/${o.ad.id}`} className="font-semibold hover:text-brand">{o.ad.name}</Link>
              <p className="text-sm text-gray-500">
                Quantità: {o.qty} · Totale {formatMoney(o.totalAmount)} · da {o.user?.username}
              </p>
              <p className="text-xs text-gray-500">{PAYMENT_LABELS[o.paymentStatus] ?? o.paymentStatus}</p>
              {(o.paymentProvider || o.paymentIntentId) && (
                <p className="text-xs text-gray-500">
                  Pagamento: {o.paymentProvider ?? 'metodo non indicato'}
                  {o.paymentIntentId ? ` · rif. ${o.paymentIntentId}` : ''}
                </p>
              )}
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className={`badge ${orderStatusClass(o.status)}`}>{ORDER_STATUS_LABELS[o.status] ?? o.status}</span>
              <span className={`badge ${paymentStatusClass(o.paymentStatus)}`}>{PAYMENT_LABELS[o.paymentStatus] ?? o.paymentStatus}</span>
            </div>
          </div>

          <div className="rounded-lg border border-brand/20 bg-brand/5 p-3 text-sm">
            <p className="font-medium text-brand">Prossima azione</p>
            <p className="text-gray-700">{sellerNextAction(o)}</p>
          </div>

          <div className="grid md:grid-cols-2 gap-3 text-sm text-gray-600">
            <div>
              <p className="font-medium text-gray-700 mb-1">Consegna</p>
              <p>{o.deliveryMethod === 'shipping' ? 'Spedizione' : 'Ritiro/consegna a mano'}</p>
              {o.deliveryMethod === 'shipping' && (
                <p className="text-xs mt-1">
                  {o.buyerName} · {o.buyerPhone}<br />
                  {o.shippingAddress}, {o.shippingPostalCode} {o.shippingCity} ({o.shippingProvince})
                </p>
              )}
            </div>
            <div>
              <p className="font-medium text-gray-700 mb-1">Importi</p>
              <p>Articolo: {formatMoney(o.unitPrice)} × {o.qty}</p>
              <p>Spedizione: {formatMoney(o.shippingAmount)}</p>
              <p>Totale: {formatMoney(o.totalAmount)}</p>
            </div>
          </div>

          {o.buyerNotes && <p className="text-sm text-gray-600 bg-gray-50 border rounded-lg p-3">{o.buyerNotes}</p>}

          <div className="flex flex-wrap gap-2">
            {o.status === 0 && (
              <>
                <button onClick={() => updateStatus.mutate({ id: o.id, status: 1 })} className="btn-secondary text-xs">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Accetta
                </button>
                <button onClick={() => updateStatus.mutate({ id: o.id, status: 2 })} className="btn-secondary text-xs">
                  Rifiuta
                </button>
              </>
            )}
            {o.status === 1 && (
              <div className="flex flex-1 min-w-64 gap-2">
                <input
                  className="input text-sm flex-1"
                  placeholder={o.deliveryMethod === 'shipping' ? 'Tracking spedizione' : 'Note ritiro'}
                  defaultValue={o.trackingCode ?? ''}
                  onChange={(e) => setTrackingDrafts((prev) => ({ ...prev, [o.id]: e.target.value }))}
                />
                <button
                  onClick={() => updateStatus.mutate({ id: o.id, status: 3, trackingCode: trackingDrafts[o.id] ?? o.trackingCode ?? '' })}
                  className="btn-secondary text-xs"
                >
                  <Truck className="w-3.5 h-3.5" /> {o.deliveryMethod === 'shipping' ? 'Segna spedito' : 'Pronto ritiro'}
                </button>
              </div>
            )}
            {(canDispute(o.status) || o.dispute) && (
              <DisputeSection orderId={o.id} hasDispute={!!o.dispute} />
            )}
            <button onClick={() => printOrderReceipt(o, 'seller')} className="btn-secondary text-xs">
              <ReceiptText className="w-3.5 h-3.5" /> Ricevuta
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function MyOrdersTab() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<OrderFilter>('all');
  const [paymentOrder, setPaymentOrder] = useState<AdOrder | null>(null);
  const [paymentForm, setPaymentForm] = useState({ provider: 'bonifico', paymentIntentId: '', note: '' });
  const [paymentError, setPaymentError] = useState('');
  const [stripeMessage, setStripeMessage] = useState('');
  const [payingOrderId, setPayingOrderId] = useState<number | null>(null);
  const { data: orders } = useQuery({
    queryKey: ['my-orders'],
    queryFn: () => usersApi.getMyOrders().then((r) => r.data as AdOrder[]),
  });

  // Ritorno dal checkout Stripe: conferma la sessione (idempotente rispetto al
  // webhook) e ripulisce l'URL. In dev, senza webhook raggiungibile, è QUESTO
  // il canale che marca l'ordine come pagato.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const stripeStatus = params.get('stripe');
    const sessionId = params.get('session_id');
    if (!stripeStatus) return;
    window.history.replaceState(null, '', window.location.pathname);
    if (stripeStatus === 'cancelled') {
      setStripeMessage('Pagamento annullato. Puoi riprovare quando vuoi.');
      return;
    }
    if (stripeStatus === 'success' && sessionId) {
      stripeApi
        .confirm(sessionId)
        .then((r) => {
          setStripeMessage(r.data.paid ? 'Pagamento con carta completato!' : 'Pagamento in elaborazione, aggiorna tra poco.');
          queryClient.invalidateQueries({ queryKey: ['my-orders'] });
        })
        .catch(() => setStripeMessage('Non è stato possibile verificare il pagamento. Se hai pagato, contatta il supporto.'));
    }
  }, [queryClient]);

  const payWithCard = async (orderId: number) => {
    setPayingOrderId(orderId);
    setStripeMessage('');
    try {
      const res = await stripeApi.createCheckout(orderId);
      window.location.href = res.data.url;
    } catch (error) {
      setStripeMessage(getApiErrorMessage(error));
      setPayingOrderId(null);
    }
  };

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: number; status: number }) => usersApi.updateOrderStatus(id, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['my-orders'] }),
  });

  const submitPayment = useMutation({
    mutationFn: () => {
      if (!paymentOrder) throw new Error('Ordine non selezionato');
      return usersApi.submitOrderPayment(paymentOrder.id, paymentForm);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-orders'] });
      setPaymentOrder(null);
      setPaymentError('');
      setPaymentForm({ provider: 'bonifico', paymentIntentId: '', note: '' });
    },
    onError: (error) => setPaymentError(getApiErrorMessage(error)),
  });

  function openPaymentModal(order: AdOrder) {
    setPaymentOrder(order);
    setPaymentError('');
    setPaymentForm({
      provider: order.paymentProvider ?? 'bonifico',
      paymentIntentId: order.paymentIntentId ?? '',
      note: '',
    });
  }

  if (!orders?.length) return <EmptyState text="Non hai effettuato nessun ordine." />;
  const filteredOrders = filterOrders(orders, filter);

  return (
    <div className="space-y-4">
      <OrderToolbar orders={orders} filter={filter} onFilter={setFilter} />
      {stripeMessage && (
        <p className="text-sm rounded-lg border border-brand/30 bg-brand/5 px-3 py-2 text-gray-700">{stripeMessage}</p>
      )}
      {!filteredOrders.length && <EmptyState text="Nessun ordine in questo filtro." />}
      {filteredOrders.map((o) => (
        <div key={o.id} className="card p-5 space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div>
              <Link href={`/annunci/${o.ad.id}`} className="font-semibold hover:text-brand">{o.ad.name}</Link>
              <p className="text-sm text-gray-500">
                Quantità: {o.qty} · Totale {formatMoney(o.totalAmount)} · venditore {o.ad.user?.username}
              </p>
              <p className="text-xs text-gray-500">{PAYMENT_LABELS[o.paymentStatus] ?? o.paymentStatus}</p>
              {(o.paymentProvider || o.paymentIntentId) && (
                <p className="text-xs text-gray-500">
                  Pagamento: {o.paymentProvider ?? 'metodo non indicato'}
                  {o.paymentIntentId ? ` · rif. ${o.paymentIntentId}` : ''}
                </p>
              )}
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className={`badge ${orderStatusClass(o.status)}`}>{ORDER_STATUS_LABELS[o.status] ?? o.status}</span>
              <span className={`badge ${paymentStatusClass(o.paymentStatus)}`}>{PAYMENT_LABELS[o.paymentStatus] ?? o.paymentStatus}</span>
            </div>
          </div>

          <div className="rounded-lg border border-brand/20 bg-brand/5 p-3 text-sm">
            <p className="font-medium text-brand">Prossima azione</p>
            <p className="text-gray-700">{buyerNextAction(o)}</p>
          </div>

          <div className="text-sm text-gray-600">
            <p>{o.deliveryMethod === 'shipping' ? `Spedizione ${formatMoney(o.shippingAmount)}` : 'Ritiro/consegna a mano'}</p>
            {o.trackingCode && <p className="text-xs mt-1">Tracking/note: {o.trackingCode}</p>}
            {o.sellerNotes && <p className="text-xs mt-1">Note venditore: {o.sellerNotes}</p>}
          </div>

          <SellerPaymentBox seller={o.ad.user} />

          <div className="flex flex-wrap gap-2">
            {o.status === 0 && (
              <button onClick={() => updateStatus.mutate({ id: o.id, status: 5 })} className="btn-secondary text-xs">
                Annulla richiesta
              </button>
            )}
            {['unpaid', 'pending', 'refunded'].includes(o.paymentStatus) && ![2, 5].includes(o.status) && (
              <>
                <button
                  onClick={() => payWithCard(o.id)}
                  disabled={payingOrderId === o.id}
                  className="btn-primary text-xs"
                >
                  <CreditCard className="w-3.5 h-3.5" /> {payingOrderId === o.id ? 'Apertura checkout…' : 'Paga con carta'}
                </button>
                <button onClick={() => openPaymentModal(o)} className="btn-secondary text-xs">
                  Ho pagato in altro modo
                </button>
              </>
            )}
            {o.status === 3 && (
              <button onClick={() => updateStatus.mutate({ id: o.id, status: 4 })} className="btn-primary text-xs">
                Conferma completamento
              </button>
            )}
            {(canDispute(o.status) || o.dispute) && (
              <DisputeSection orderId={o.id} hasDispute={!!o.dispute} />
            )}
            <button onClick={() => printOrderReceipt(o, 'buyer')} className="btn-secondary text-xs">
              <ReceiptText className="w-3.5 h-3.5" /> Ricevuta
            </button>
          </div>
        </div>
      ))}

      {paymentOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              submitPayment.mutate();
            }}
            className="w-full max-w-lg rounded-lg bg-white p-5 shadow-xl space-y-4"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold">Pagamento inviato</h2>
                <p className="text-sm text-gray-500">Ordine #{paymentOrder.id} · {paymentOrder.ad.name}</p>
              </div>
              <button type="button" onClick={() => setPaymentOrder(null)} className="text-sm text-gray-500 hover:text-gray-700">
                Chiudi
              </button>
            </div>

            <label className="block text-sm">
              <span className="font-medium text-gray-700">Metodo</span>
              <select
                className="input mt-1"
                value={paymentForm.provider}
                onChange={(e) => setPaymentForm((prev) => ({ ...prev, provider: e.target.value }))}
              >
                <option value="bonifico">Bonifico</option>
                <option value="paypal">PayPal</option>
                <option value="contanti">Contanti alla consegna</option>
                <option value="altro">Altro</option>
              </select>
            </label>

            <label className="block text-sm">
              <span className="font-medium text-gray-700">Riferimento pagamento</span>
              <input
                className="input mt-1"
                value={paymentForm.paymentIntentId}
                onChange={(e) => setPaymentForm((prev) => ({ ...prev, paymentIntentId: e.target.value }))}
                placeholder="CRO, ID PayPal, riferimento accordato..."
                maxLength={160}
              />
            </label>

            <label className="block text-sm">
              <span className="font-medium text-gray-700">Nota per il venditore</span>
              <textarea
                className="input mt-1 min-h-24"
                value={paymentForm.note}
                onChange={(e) => setPaymentForm((prev) => ({ ...prev, note: e.target.value }))}
                placeholder="Dettagli utili per riconoscere il pagamento"
                maxLength={1000}
              />
            </label>

            {paymentError && <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{paymentError}</p>}

            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setPaymentOrder(null)} className="btn-secondary text-sm">
                Annulla
              </button>
              <button type="submit" disabled={submitPayment.isPending} className="btn-primary text-sm">
                {submitPayment.isPending ? 'Salvataggio...' : 'Segna in verifica'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="card p-12 text-center text-gray-500">
      <Package className="w-10 h-10 mx-auto mb-3 text-gray-300" />
      <p>{text}</p>
    </div>
  );
}
