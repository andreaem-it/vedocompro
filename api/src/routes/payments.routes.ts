import { Router } from 'express';
import { paymentsController } from '../controllers/payments.controller';
import { stripeController } from '../controllers/stripe.controller';
import { requireAuth } from '../middleware/auth.middleware';
import express from 'express';

const router = Router();

router.get('/products', paymentsController.getProducts);
router.post('/ipn', express.urlencoded({ extended: false }), paymentsController.ipnWebhook);
router.get('/my', requireAuth, paymentsController.getMyPayments);
router.post('/coupon', requireAuth, paymentsController.applyCoupon);

// Stripe (checkout ordini marketplace) — il raw body del webhook è montato in app.ts
router.get('/stripe/config', stripeController.getConfig);
router.post('/stripe/checkout', requireAuth, stripeController.createCheckout);
router.post('/stripe/webhook', stripeController.webhook);
router.get('/stripe/confirm', requireAuth, stripeController.confirm);

export default router;
