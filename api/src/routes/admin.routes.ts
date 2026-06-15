import { Router } from 'express';
import { adminController } from '../controllers/admin.controller';
import { requireAdmin } from '../middleware/auth.middleware';

const router = Router();

router.use(requireAdmin);

router.get('/stats', adminController.getStats);
router.get('/users', adminController.listUsers);
router.put('/users/:id', adminController.updateUser);
router.delete('/users/:id', adminController.deleteUser);
router.get('/ads', adminController.listAds);
router.get('/helpdesk', adminController.listHelpDesk);
router.get('/payments', adminController.listPayments);

export default router;
