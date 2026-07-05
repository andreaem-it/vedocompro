import { Response, NextFunction, Request } from 'express';
import Stripe from 'stripe';
import { AuthenticatedRequest } from '../types';
import { AppError } from '../middleware/error.middleware';
import { prisma } from '../lib/prisma';
import { config } from '../config';
import { OrderStatus, PaymentStatus } from '../constants/orders';
import { getStripe, createCheckoutSession, fulfillCheckoutSession, stripeConfigured } from '../services/stripe.service';

async function logWebhook(
  eventId: string | null,
  status: string,
  rawPayload: unknown,
  error?: string,
): Promise<void> {
  await prisma.paymentWebhookLog
    .create({
      data: {
        provider: 'stripe',
        eventId,
        status,
        rawPayload: rawPayload as object,
        error: error ?? null,
        processedAt: new Date(),
      },
    })
    .catch(() => {}); // il log non deve mai far fallire la risposta al webhook
}

export const stripeController = {
  // Config pubblica per il frontend (solo publishable key, mai la secret)
  async getConfig(_req: Request, res: Response) {
    res.json({ enabled: stripeConfigured() });
  },

  // POST /payments/stripe/checkout { orderId } — solo il compratore, ordine pagabile
  async createCheckout(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const orderId = parseInt(req.body.orderId, 10);
      if (!orderId) throw new AppError(400, 'orderId richiesto');

      const order = await prisma.adOrder.findUnique({
        where: { id: orderId },
        include: { ad: { select: { id: true, name: true, userId: true } } },
      });
      if (!order) throw new AppError(404, 'Ordine non trovato');
      if (order.userId !== req.user!.id) throw new AppError(403, 'Non autorizzato');
      if (order.paymentStatus === PaymentStatus.PAID) throw new AppError(400, 'Ordine già pagato');
      if (
        order.status === OrderStatus.REJECTED ||
        order.status === OrderStatus.CANCELLED
      ) {
        throw new AppError(400, 'Non puoi pagare un ordine rifiutato o annullato');
      }

      const session = await createCheckoutSession(order);
      res.json({ url: session.url, sessionId: session.id });
    } catch (err) {
      next(err);
    }
  },

  // POST /payments/stripe/webhook — firma obbligatoria (raw body montato in app.ts)
  async webhook(req: Request, res: Response) {
    if (!config.stripe.webhookSecret) {
      // Senza secret non possiamo verificare la firma: rifiutiamo esplicitamente.
      // La conferma pagamenti resta garantita dal redirect (GET /confirm).
      res.status(503).json({ error: 'Webhook Stripe non configurato (STRIPE_WEBHOOK_SECRET)' });
      return;
    }

    let event: Stripe.Event;
    try {
      const signature = req.headers['stripe-signature'] as string;
      event = getStripe().webhooks.constructEvent(req.body, signature, config.stripe.webhookSecret);
    } catch (err) {
      await logWebhook(null, 'invalid_signature', { error: String(err) }, String(err));
      res.status(400).json({ error: 'Firma webhook non valida' });
      return;
    }

    try {
      if (event.type === 'checkout.session.completed' || event.type === 'checkout.session.async_payment_succeeded') {
        const session = event.data.object as Stripe.Checkout.Session;
        const result = await fulfillCheckoutSession(session);
        await logWebhook(event.id, result.updated ? 'processed' : 'duplicate', event);
      } else {
        await logWebhook(event.id, 'ignored', { type: event.type });
      }
      res.json({ received: true });
    } catch (err) {
      await logWebhook(event.id, 'error', event, String(err));
      // 500 → Stripe ritenta la consegna
      res.status(500).json({ error: 'Errore elaborazione webhook' });
    }
  },

  // GET /payments/stripe/confirm?session_id= — conferma sul redirect di ritorno.
  // Canale primario in dev (dove il webhook non è raggiungibile); in produzione fa
  // da fallback: fulfillCheckoutSession è idempotente rispetto al webhook.
  async confirm(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const sessionId = String(req.query.session_id ?? '');
      if (!sessionId) throw new AppError(400, 'session_id richiesto');

      const session = await getStripe().checkout.sessions.retrieve(sessionId);
      const orderId = parseInt(session.metadata?.orderId ?? '', 10);
      if (orderId) {
        const order = await prisma.adOrder.findUnique({ where: { id: orderId }, select: { userId: true } });
        if (order && order.userId !== req.user!.id) throw new AppError(403, 'Non autorizzato');
      }

      const result = await fulfillCheckoutSession(session);
      res.json({ paid: session.payment_status === 'paid', ...result });
    } catch (err) {
      next(err);
    }
  },
};
