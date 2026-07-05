import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { businessController } from '../controllers/business.controller';

const router = Router();

router.get('/me', requireAuth, businessController.getMe);
router.post('/requests', requireAuth, businessController.createRequest);
router.get('/dashboard', requireAuth, businessController.dashboard);

export default router;
