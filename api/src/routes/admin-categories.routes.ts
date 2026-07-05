import { Router } from 'express';
import { adminCategoriesController } from '../controllers/admin-categories.controller';
import { requireAdmin } from '../middleware/auth.middleware';

const router = Router();

router.use(requireAdmin);

router.get('/', adminCategoriesController.list);
// Route campi PRIMA di /:id per evitare che "fields" venga interpretato come id categoria
router.put('/fields/:fieldId', adminCategoriesController.updateField);
router.delete('/fields/:fieldId', adminCategoriesController.deleteField);
router.get('/:id', adminCategoriesController.getById);
router.post('/', adminCategoriesController.create);
router.put('/:id', adminCategoriesController.update);
router.delete('/:id', adminCategoriesController.remove);
router.get('/:id/fields', adminCategoriesController.listFields);
router.post('/:id/fields', adminCategoriesController.createField);

export default router;
