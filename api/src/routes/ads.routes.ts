import { Router } from 'express';
import { adsController, createAdValidation } from '../controllers/ads.controller';
import { requireAuth, optionalAuth } from '../middleware/auth.middleware';
import { uploadImage, uploadVideo } from '../middleware/upload.middleware';

const router = Router();

router.get('/', optionalAuth, adsController.list);
router.get('/:id', optionalAuth, adsController.getById);
router.post('/', requireAuth, createAdValidation, adsController.create);
router.put('/:id', requireAuth, adsController.update);
router.delete('/:id', requireAuth, adsController.delete);
router.post('/:id/wishlist', requireAuth, adsController.toggleWishlist);

// Photos
router.get('/:id/photos', adsController.listPhotos);
router.post('/:id/photos', requireAuth, uploadImage.array('photos', 10), adsController.uploadPhotos);
router.delete('/:id/photos/:photoId', requireAuth, adsController.deletePhoto);

// Videos
router.post('/:id/videos', requireAuth, uploadVideo.single('video'), adsController.uploadVideo);

// Clicks
router.post('/:id/click', adsController.trackClick);

// Promote
router.post('/:id/promote', requireAuth, adsController.promoteAd);

// Reviews
router.post('/:id/reviews', requireAuth, adsController.submitReview);

export default router;
