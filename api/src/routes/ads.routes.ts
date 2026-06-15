import { Router } from 'express';
import { adsController, createAdValidation } from '../controllers/ads.controller';
import { requireAuth, optionalAuth } from '../middleware/auth.middleware';

const router = Router();

router.get('/', optionalAuth, adsController.list);
router.get('/:id', optionalAuth, adsController.getById);
router.post('/', requireAuth, createAdValidation, adsController.create);
router.put('/:id', requireAuth, adsController.update);
router.delete('/:id', requireAuth, adsController.delete);
router.post('/:id/wishlist', requireAuth, adsController.toggleWishlist);

export default router;
