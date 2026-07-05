import { Router } from 'express';
import { adminSuggestsController } from '../controllers/admin-suggests.controller';
import { requireAdmin } from '../middleware/auth.middleware';

const router = Router();

router.use(requireAdmin);

router.get('/', adminSuggestsController.listSuggests);
router.delete('/:id', adminSuggestsController.deleteSuggest);

export default router;
