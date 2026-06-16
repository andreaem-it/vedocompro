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
router.put('/ads/:id', adminController.updateAd);
router.get('/helpdesk', adminController.listHelpDesk);
router.put('/helpdesk/:id', adminController.updateHelpDesk);
router.post('/helpdesk/:id/reply', adminController.replyHelpDesk);
router.get('/payments', adminController.listPayments);
router.get('/videos', adminController.listVideos);
router.put('/videos/:id', adminController.updateVideo);
router.get('/reviews', adminController.listReviews);
router.put('/reviews/:id', adminController.updateReview);

export default router;
