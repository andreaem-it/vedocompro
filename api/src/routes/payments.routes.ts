import { Router } from 'express';
import { paymentsController } from '../controllers/payments.controller';
import { requireAuth } from '../middleware/auth.middleware';
import express from 'express';

const router = Router();

router.get('/products', paymentsController.getProducts);
router.post('/ipn', express.urlencoded({ extended: false }), paymentsController.ipnWebhook);
router.get('/my', requireAuth, paymentsController.getMyPayments);

export default router;
