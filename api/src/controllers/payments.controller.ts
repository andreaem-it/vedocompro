import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { AuthenticatedRequest } from '../types';
import { AppError } from '../middleware/error.middleware';
import { config } from '../config';
import { prisma } from '../lib/prisma';

function requiredIpnField(body: Record<string, unknown>, field: string): string {
  const value = body[field];
  if (typeof value !== 'string' || value.trim() === '') {
    throw new AppError(400, `Missing IPN field: ${field}`);
  }
  return value.trim();
}

function jsonSafePayload(body: Record<string, unknown>): Prisma.InputJsonObject {
  return Object.fromEntries(
    Object.entries(body).map(([key, value]) => [key, value === undefined || value === null ? null : String(value)]),
  ) as Prisma.InputJsonObject;
}

async function createWebhookLog(body: Record<string, unknown>) {
  return prisma.paymentWebhookLog.create({
    data: {
      provider: 'paypal',
      eventId: typeof body.txn_id === 'string' ? body.txn_id : null,
      status: 'received',
      rawPayload: jsonSafePayload(body),
    },
  }).catch(() => null);
}

async function updateWebhookLog(id: number | undefined, status: string, error?: string | null) {
  if (!id) return;
  await prisma.paymentWebhookLog.update({
    where: { id },
    data: {
      status,
      error: error ? error.slice(0, 1000) : null,
      processedAt: new Date(),
    },
  }).catch(() => {});
}

export const paymentsController = {
  async getProducts(_req: Request, res: Response, next: NextFunction) {
    try {
      const products = await prisma.product.findMany({ orderBy: { price: 'asc' } });
      res.json(products);
    } catch (err) {
      next(err);
    }
  },

  async ipnWebhook(req: Request, res: Response, next: NextFunction) {
    let webhookLogId: number | undefined;
    try {
      const ipnBody = req.body as Record<string, unknown>;
      const webhookLog = await createWebhookLog(ipnBody);
      webhookLogId = webhookLog?.id;

      const params = new URLSearchParams();
      for (const [key, value] of Object.entries(ipnBody)) {
        if (value !== undefined && value !== null) params.append(key, String(value));
      }
      params.set('cmd', '_notify-validate');

      const paypalUrl =
        config.paypal.mode === 'sandbox'
          ? 'https://ipnpb.sandbox.paypal.com/cgi-bin/webscr'
          : 'https://ipnpb.paypal.com/cgi-bin/webscr';

      const verifyRes = await fetch(paypalUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString(),
      });
      const verification = await verifyRes.text();

      if (verification !== 'VERIFIED') {
        await updateWebhookLog(webhookLogId, 'invalid', 'PayPal verification failed');
        res.status(400).send('INVALID');
        return;
      }

      const txnId = requiredIpnField(ipnBody, 'txn_id');
      const paymentStatus = requiredIpnField(ipnBody, 'payment_status');
      const receiverEmail = requiredIpnField(ipnBody, 'receiver_email');
      const itemNumber = parseInt(requiredIpnField(ipnBody, 'item_number'), 10);
      const userId = parseInt(requiredIpnField(ipnBody, 'custom'), 10);
      const gross = requiredIpnField(ipnBody, 'mc_gross');
      const price = new Prisma.Decimal(gross);
      const currency = requiredIpnField(ipnBody, 'mc_currency');
      const payerEmail = requiredIpnField(ipnBody, 'payer_email');

      if (!Number.isFinite(itemNumber) || !Number.isFinite(userId)) {
        throw new AppError(400, 'Invalid product or user id');
      }
      if (price.lte(0)) throw new AppError(400, 'Invalid payment amount');
      if (!config.paypal.email) throw new AppError(500, 'PayPal receiver email not configured');

      if (receiverEmail.toLowerCase() !== config.paypal.email.toLowerCase()) {
        await updateWebhookLog(webhookLogId, 'invalid_receiver', receiverEmail);
        res.status(400).send('INVALID_RECEIVER');
        return;
      }

      if (paymentStatus !== 'Completed') {
        await updateWebhookLog(webhookLogId, 'ignored_non_completed', paymentStatus);
        res.sendStatus(200);
        return;
      }

      const existing = await prisma.payment.findFirst({ where: { paypalTxnId: txnId } });
      if (existing) {
        await updateWebhookLog(webhookLogId, 'duplicate', txnId);
        res.sendStatus(200);
        return;
      }

      const product = await prisma.product.findUnique({ where: { id: itemNumber } });
      if (!product) throw new AppError(400, 'Product not found');
      if (currency !== 'EUR') throw new AppError(400, 'Invalid currency');
      if (!price.equals(product.price)) {
        throw new AppError(400, 'Invalid payment amount');
      }
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) throw new AppError(400, 'User not found');

      await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        await tx.payment.create({
          data: { userId, productId: itemNumber, paypalTxnId: txnId, price, paymentCurrency: currency, paymentStatus, paymentEmail: payerEmail },
        });
        await tx.user.update({
          where: { id: userId },
          data: {
            creditsGold: { increment: product.creditsGold },
            creditsSilver: { increment: product.creditsSilver },
            creditsBronze: { increment: product.creditsBronze },
          },
        });
      });

      await updateWebhookLog(webhookLogId, 'processed');
      res.sendStatus(200);
    } catch (err) {
      await updateWebhookLog(webhookLogId, 'error', err instanceof Error ? err.message : 'Errore sconosciuto');
      next(err);
    }
  },

  async getMyPayments(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const payments = await prisma.payment.findMany({
        where: { userId: req.user!.id },
        include: { product: { select: { name: true } } },
        orderBy: { timestamp: 'desc' },
      });
      res.json(payments);
    } catch (err) {
      next(err);
    }
  },

  async applyCoupon(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { code } = req.body;
      if (!code) throw new AppError(400, 'Codice coupon richiesto');

      const coupon = await prisma.coupon.findUnique({ where: { code } });
      if (!coupon || coupon.valid !== 1) throw new AppError(400, 'Coupon non valido');
      const user = await prisma.user.findUnique({
        where: { id: req.user!.id },
        select: { email: true, username: true },
      });
      if (!user) throw new AppError(404, 'Utente non trovato');

      const assigned = coupon.assigned.trim().toLowerCase();
      if (assigned && assigned !== user.email.toLowerCase() && assigned !== user.username.toLowerCase()) {
        throw new AppError(403, 'Coupon assegnato a un altro utente');
      }

      // Mark coupon as used
      await prisma.coupon.update({ where: { id: coupon.id }, data: { valid: 0 } });

      // Add value as silver credits to user
      const updatedUser = await prisma.user.update({
        where: { id: req.user!.id },
        data: { creditsSilver: { increment: coupon.value } },
        select: {
          id: true, creditsSilver: true, creditsGold: true, creditsBronze: true,
        },
      });

      res.json({ applied: true, value: coupon.value, credits: updatedUser });
    } catch (err) {
      next(err);
    }
  },
};
