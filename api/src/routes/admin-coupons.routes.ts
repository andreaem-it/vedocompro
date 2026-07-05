import { Router } from 'express';
import { adminCouponsController } from '../controllers/admin-coupons.controller';
import { requireAdmin } from '../middleware/auth.middleware';

const router = Router();

router.use(requireAdmin);

router.get('/', adminCouponsController.listCoupons);
router.post('/generate', adminCouponsController.generateCoupon);
router.delete('/:id', adminCouponsController.deleteCoupon);

export default router;
