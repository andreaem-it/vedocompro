import { Router } from 'express';
import { usersController } from '../controllers/users.controller';
import { requireAuth } from '../middleware/auth.middleware';
import { uploadImage } from '../middleware/upload.middleware';

const router = Router();

// Me endpoints
router.get('/me', requireAuth, usersController.getMe);
router.put('/me', requireAuth, usersController.updateMe);
router.put('/me/password', requireAuth, usersController.changePassword);
router.post('/me/avatar', requireAuth, uploadImage.single('avatar'), usersController.uploadAvatar);
router.get('/me/notifications', requireAuth, usersController.getNotifications);
router.post('/me/notifications/read', requireAuth, usersController.markNotificationsRead);
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

// Public profile
router.get('/:id', usersController.getProfile);

// Feedback for user
router.post('/:id/feedback', requireAuth, usersController.giveFeedback);

export default router;
