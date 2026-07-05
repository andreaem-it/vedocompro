import { Router } from 'express';
import { adminShopController } from '../controllers/admin-shop.controller';
import { config } from '../config';
import { requireAdmin } from '../middleware/auth.middleware';
import { uploadImage } from '../middleware/upload.middleware';

const router = Router();

router.use((_req, res, next) => {
  if (!config.features.shop) {
    res.status(404).json({ error: 'Modulo Shop disattivato' });
    return;
  }
  next();
});

router.use(requireAdmin);

// Categories
router.get('/categories', adminShopController.listCategories);
router.get('/categories/:id', adminShopController.getCategoryById);
router.post('/categories', adminShopController.createCategory);
router.put('/categories/:id', adminShopController.updateCategory);
router.delete('/categories/:id', adminShopController.deleteCategory);

// Products
router.get('/products', adminShopController.listProducts);
router.get('/products/:id', adminShopController.getProductById);
router.post('/products', uploadImage.array('pics', 10), adminShopController.createProduct);
router.put('/products/:id', uploadImage.array('pics', 10), adminShopController.updateProduct);
router.delete('/products/:id', adminShopController.deleteProduct);

// Shipments
router.get('/shipments', adminShopController.listShipments);
router.get('/shipments/:id', adminShopController.getShipmentById);
router.post('/shipments', adminShopController.createShipment);
router.put('/shipments/:id', adminShopController.updateShipment);
router.delete('/shipments/:id', adminShopController.deleteShipment);

export default router;
