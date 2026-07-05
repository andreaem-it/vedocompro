import { Router } from 'express';
import { requireCronSecret } from '../middleware/cron.middleware';
import { processPendingVideos } from '../jobs/process-pending-videos';
import { processSavedSearchAlerts } from '../jobs/process-saved-search-alerts';
import { pruneOldAttempts } from '../services/auth-rate-limit.service';
import { adsService } from '../services/ads.service';

const router = Router();

router.get('/process-videos', requireCronSecret, async (_req, res, next) => {
  try {
    const result = await processPendingVideos();
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.get('/expire-promotions', requireCronSecret, async (_req, res, next) => {
  try {
    const result = await adsService.expirePromotions();
    // Accodata qui per non consumare un ulteriore cron Vercel: pulizia oraria dei
    // tentativi di login più vecchi di 24h (fuori da ogni finestra di rate limit).
    const prunedAuthAttempts = await pruneOldAttempts();
    res.json({ ...result, prunedAuthAttempts });
  } catch (err) {
    next(err);
  }
});

router.get('/saved-search-alerts', requireCronSecret, async (_req, res, next) => {
  try {
    const result = await processSavedSearchAlerts();
    res.json(result);
  } catch (err) {
    next(err);
  }
});

export default router;
