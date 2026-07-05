import { Router } from 'express';
import { shopController } from '../controllers/shop.controller';
import { config } from '../config';

const router = Router();

router.use((_req, res, next) => {
  if (!config.features.shop) {
    res.status(404).json({ error: 'Modulo Shop disattivato' });
    return;
  }
  next();
});

router.get('/categories', shopController.listCategories);
router.get('/products', shopController.listProducts);
router.get('/products/:id', shopController.getProductById);

export default router;
