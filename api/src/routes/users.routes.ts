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
router.get('/me/wishlist', requireAuth, usersController.getWishlist);
router.get('/me/ads', requireAuth, usersController.getMyAds);

// Public profile
router.get('/:id', usersController.getProfile);

export default router;
