import { Router } from 'express';
import { usersController } from '../controllers/users.controller';
import { offersController } from '../controllers/offers.controller';
import { disputesController } from '../controllers/disputes.controller';
import { savedSearchesController } from '../controllers/saved-searches.controller';
import { sellerStatsController } from '../controllers/seller-stats.controller';
import { requireAuth } from '../middleware/auth.middleware';
import { uploadImage } from '../middleware/upload.middleware';

const router = Router();

// Me endpoints
router.get('/me', requireAuth, usersController.getMe);
router.put('/me', requireAuth, usersController.updateMe);
router.put('/me/password', requireAuth, usersController.changePassword);
router.post('/me/phone/verification', requireAuth, usersController.requestPhoneVerification);
router.post('/me/phone/verify', requireAuth, usersController.verifyPhone);
router.post('/me/avatar', requireAuth, uploadImage.single('avatar'), usersController.uploadAvatar);
router.get('/me/notifications', requireAuth, usersController.getNotifications);
router.post('/me/notifications/read', requireAuth, usersController.markNotificationsRead);
router.post('/me/notifications/:id/open', requireAuth, usersController.openNotification);
router.get('/me/messages', requireAuth, usersController.getMessages);
router.post('/me/messages', requireAuth, usersController.sendMessage);
router.put('/me/messages/:id/read', requireAuth, usersController.markMessageRead);
router.post('/me/messages/bulk-read', requireAuth, usersController.bulkMarkRead);
router.post('/me/messages/bulk-unread', requireAuth, usersController.bulkMarkUnread);
router.delete('/me/messages/:id', requireAuth, usersController.deleteMessage);
router.get('/me/wishlist', requireAuth, usersController.getWishlist);
router.get('/me/ads', requireAuth, usersController.getMyAds);
router.get('/me/feedback', requireAuth, usersController.getFeedback);
router.get('/me/helpdesk', requireAuth, usersController.getHelpDesk);
router.post('/me/helpdesk', requireAuth, usersController.createHelpDesk);
router.post('/me/helpdesk/:id/reply', requireAuth, usersController.replyHelpDesk);
router.get('/me/buys', requireAuth, usersController.getBuys);
router.get('/me/sells', requireAuth, usersController.getSells);
router.put('/me/sells/:id', requireAuth, usersController.updateSell);
router.get('/me/offers', requireAuth, offersController.listMine);
router.put('/me/offers/:id', requireAuth, offersController.respond);
router.get('/me/orders', requireAuth, usersController.getMyOrders);
router.get('/me/orders/received', requireAuth, usersController.getReceivedOrders);
router.post('/me/orders/:id/payment', requireAuth, usersController.submitOrderPayment);
router.put('/me/orders/:id', requireAuth, usersController.updateOrderStatus);
router.post('/me/orders/:id/dispute', requireAuth, disputesController.open);
router.get('/me/orders/:id/dispute', requireAuth, disputesController.getByOrder);
router.post('/me/disputes/:id/messages', requireAuth, uploadImage.array('attachments', 5), disputesController.addMessage);
router.get('/me/saved-searches', requireAuth, savedSearchesController.list);
router.post('/me/saved-searches', requireAuth, savedSearchesController.create);
router.put('/me/saved-searches/:id', requireAuth, savedSearchesController.update);
router.delete('/me/saved-searches/:id', requireAuth, savedSearchesController.remove);
router.get('/me/seller-stats', requireAuth, sellerStatsController.getMyStats);

// Public profile
router.get('/:id/feedback-orders', requireAuth, usersController.getFeedbackEligibleOrders);
router.get('/:id', usersController.getProfile);
router.post('/:id/report', requireAuth, usersController.reportUser);

// Feedback for user
router.post('/:id/feedback', requireAuth, usersController.giveFeedback);

export default router;
