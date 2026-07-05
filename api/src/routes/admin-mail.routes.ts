import { Router } from 'express';
import { adminMailController } from '../controllers/admin-mail.controller';
import { requireAdmin } from '../middleware/auth.middleware';

const router = Router();

router.use(requireAdmin);

router.get('/', adminMailController.list);
router.post('/send', adminMailController.send);
router.get('/:id', adminMailController.getById);
router.post('/', adminMailController.create);
router.put('/:id', adminMailController.update);
router.delete('/:id', adminMailController.remove);

export default router;
