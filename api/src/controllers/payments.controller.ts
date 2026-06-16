import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { AuthenticatedRequest } from '../types';
import { AppError } from '../middleware/error.middleware';
import { config } from '../config';
import crypto from 'crypto';
import { prisma } from '../lib/prisma';

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
    try {
      const params = new URLSearchParams(req.body);
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
        res.status(400).send('INVALID');
        return;
      }

      const txnId = req.body.txn_id as string;
      const paymentStatus = req.body.payment_status as string;
      const receiverEmail = req.body.receiver_email as string;
      const itemNumber = parseInt(req.body.item_number as string, 10);
      const userId = parseInt(req.body.custom as string, 10);
      const price = parseFloat(req.body.mc_gross as string);
      const currency = req.body.mc_currency as string;
      const payerEmail = req.body.payer_email as string;

      if (receiverEmail.toLowerCase() !== config.paypal.email.toLowerCase()) {
        res.status(400).send('INVALID_RECEIVER');
        return;
      }

      if (paymentStatus !== 'Completed') {
        res.sendStatus(200);
        return;
      }

      const existing = await prisma.payment.findFirst({ where: { paypalTxnId: txnId } });
      if (existing) {
        res.sendStatus(200);
        return;
      }

      const product = await prisma.product.findUnique({ where: { id: itemNumber } });
      if (!product) throw new AppError(400, 'Product not found');

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

      res.sendStatus(200);
    } catch (err) {
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
