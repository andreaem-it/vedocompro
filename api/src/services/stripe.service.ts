import Stripe from 'stripe';
import { Prisma, AdOrder } from '@prisma/client';
import { config } from '../config';
import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/error.middleware';
import { NotificationType } from '../constants/notifications';
import { PaymentStatus } from '../constants/orders';
import { mailService } from './mail.service';

/**
 * Checkout Stripe per gli ordini marketplace (modello "merchant of record"):
 * il pagamento arriva sul conto Stripe della piattaforma; il trasferimento al
 * venditore resta un processo operativo (riconciliazione admin già esistente).
 * Per split payment automatici servirebbe Stripe Connect (onboarding venditori),
 * fuori scope per ora.
 */

let stripeClient: Stripe | null = null;

export function getStripe(): Stripe {
  if (!config.stripe.secretKey) {
    throw new AppError(503, 'Pagamenti con carta non configurati (STRIPE_SECRET_KEY mancante)');
  }
  if (!stripeClient) {
    stripeClient = new Stripe(config.stripe.secretKey);
  }
  return stripeClient;
}

export function stripeConfigured(): boolean {
  return Boolean(config.stripe.secretKey);
}

type OrderWithAd = AdOrder & { ad: { id: number; name: string; userId: number } };

export async function createCheckoutSession(order: OrderWithAd): Promise<Stripe.Checkout.Session> {
  const stripe = getStripe();

  // Decimal EUR → centesimi interi, senza passare da float
  const totalCents = new Prisma.Decimal(order.totalAmount).mul(100).toNumber();
  if (!Number.isInteger(totalCents) || totalCents < 50) {
    throw new AppError(400, 'Importo ordine non valido per il pagamento con carta (minimo €0,50)');
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [
      {
        price_data: {
          currency: order.currency.toLowerCase(),
          product_data: {
            name: order.ad.name,
            description: `Ordine #${order.id} su VedoCompro${order.qty > 1 ? ` (x${order.qty})` : ''}`,
          },
          // Un'unica riga con il totale congelato sull'ordine (articolo+spedizione):
          // è l'importo autoritativo, già validato alla creazione ordine.
          unit_amount: totalCents,
        },
        quantity: 1,
      },
    ],
    metadata: { orderId: String(order.id) },
    client_reference_id: String(order.id),
    success_url: `${config.appUrl}/profilo/acquisti-vendite?stripe=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${config.appUrl}/profilo/acquisti-vendite?stripe=cancelled`,
  });

  return session;
}

/**
 * Marca l'ordine come pagato a partire da una Checkout Session Stripe completata.
 * Idempotente: se l'ordine è già paid con lo stesso riferimento, non fa nulla.
 * Usata sia dal webhook sia dalla conferma su redirect.
 */
/**
 * Rimborso totale di un ordine pagato con Stripe (usato dalla risoluzione dispute
 * pro-compratore). Idempotente lato Stripe: un PaymentIntent già rimborsato per
 * intero solleva `charge_already_refunded`, che trattiamo come successo.
 */
export async function refundOrderPayment(
  order: Pick<AdOrder, 'id' | 'paymentStatus' | 'paymentProvider' | 'paymentIntentId'>,
  adminUserId: number,
  note: string,
): Promise<{ refunded: boolean; reason?: string }> {
  if (order.paymentProvider !== 'stripe' || !order.paymentIntentId) {
    return { refunded: false, reason: 'Ordine non pagato con Stripe' };
  }
  if (order.paymentStatus !== PaymentStatus.PAID) {
    return { refunded: false, reason: `Stato pagamento non rimborsabile (${order.paymentStatus})` };
  }

  const stripe = getStripe();
  try {
    await stripe.refunds.create({ payment_intent: order.paymentIntentId });
  } catch (err) {
    const stripeErr = err as Stripe.errors.StripeError;
    if (stripeErr.code !== 'charge_already_refunded') {
      return { refunded: false, reason: stripeErr.message ?? 'Errore Stripe durante il rimborso' };
    }
  }

  await prisma.$transaction([
    prisma.adOrder.update({
      where: { id: order.id },
      data: { paymentStatus: PaymentStatus.REFUNDED },
    }),
    prisma.orderPaymentReconciliation.create({
      data: {
        orderId: order.id,
        adminUserId,
        previousStatus: order.paymentStatus,
        newStatus: PaymentStatus.REFUNDED,
        provider: 'stripe',
        paymentIntentId: order.paymentIntentId,
        note,
      },
    }),
  ]);

  return { refunded: true };
}

export async function fulfillCheckoutSession(session: Stripe.Checkout.Session): Promise<{ orderId: number; updated: boolean }> {
  const orderId = parseInt(session.metadata?.orderId ?? session.client_reference_id ?? '', 10);
  if (!orderId) throw new AppError(400, 'Sessione Stripe senza riferimento ordine');
  if (session.payment_status !== 'paid') {
    return { orderId, updated: false };
  }

  const order = await prisma.adOrder.findUnique({
    where: { id: orderId },
    include: { ad: { select: { id: true, name: true, userId: true } }, user: { select: { id: true, email: true } } },
  });
  if (!order) throw new AppError(404, 'Ordine non trovato');

  const paymentIntentId =
    typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id ?? session.id;

  // Idempotenza: webhook e redirect possono arrivare entrambi
  if (order.paymentStatus === PaymentStatus.PAID && order.paymentIntentId === paymentIntentId) {
    return { orderId, updated: false };
  }

  // Verifica importo: la sessione deve coprire il totale congelato sull'ordine
  const expectedCents = new Prisma.Decimal(order.totalAmount).mul(100).toNumber();
  if (session.amount_total !== expectedCents) {
    throw new AppError(400, `Importo pagato (${session.amount_total}) diverso dal totale ordine (${expectedCents})`);
  }
  if ((session.currency ?? '').toUpperCase() !== order.currency.toUpperCase()) {
    throw new AppError(400, 'Valuta del pagamento diversa da quella dell\'ordine');
  }

  await prisma.adOrder.update({
    where: { id: orderId },
    data: {
      paymentStatus: PaymentStatus.PAID,
      paymentProvider: 'stripe',
      paymentIntentId,
    },
  });

  // Notifiche in-app + email best-effort a compratore e venditore
  await Promise.all([
    prisma.notification.create({
      data: { userId: order.userId, type: NotificationType.ORDER_UPDATE, object: order.id },
    }),
    prisma.notification.create({
      data: { userId: order.ad.userId, type: NotificationType.ORDER_UPDATE, object: order.id },
    }),
  ]);
  if (mailService.isConfigured()) {
    const seller = await prisma.user.findUnique({ where: { id: order.ad.userId }, select: { email: true } });
    await Promise.all([
      mailService
        .sendMarketplaceOrderUpdate(
          order.user.email,
          'Pagamento confermato',
          order.ad.name,
          'Il tuo pagamento con carta è andato a buon fine. Il venditore è stato avvisato.',
          order.id,
        )
        .catch(() => {}),
      seller
        ? mailService
            .sendMarketplaceOrderUpdate(
              seller.email,
              'Ordine pagato con carta',
              order.ad.name,
              'Il compratore ha pagato l\'ordine con carta tramite Stripe. Puoi procedere con la spedizione o il ritiro.',
              order.id,
            )
            .catch(() => {})
        : Promise.resolve(),
    ]);
  }

  return { orderId, updated: true };
}
