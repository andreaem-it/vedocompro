import { Router } from 'express';
import { prisma } from '../lib/prisma';
import authRoutes from './auth.routes';
import adsRoutes from './ads.routes';
import usersRoutes from './users.routes';
import adminRoutes from './admin.routes';
import paymentsRoutes from './payments.routes';
import cronRoutes from './cron.routes';
import shopRoutes from './shop.routes';
import adminShopRoutes from './admin-shop.routes';
import adminCategoriesRoutes from './admin-categories.routes';
import adminCouponsRoutes from './admin-coupons.routes';
import adminMailRoutes from './admin-mail.routes';
import adminSuggestsRoutes from './admin-suggests.routes';
import businessRoutes from './business.routes';

const router = Router();

router.get('/health', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', db: 'connected' });
  } catch {
    res.status(503).json({ status: 'error', db: 'disconnected' });
  }
});

router.use('/auth', authRoutes);
router.use('/ads', adsRoutes);
router.use('/users', usersRoutes);
router.use('/admin', adminRoutes);
router.use('/payments', paymentsRoutes);
router.use('/cron', cronRoutes);
router.use('/shop', shopRoutes);
router.use('/admin/shop', adminShopRoutes);
router.use('/admin/categories', adminCategoriesRoutes);
router.use('/admin/coupons', adminCouponsRoutes);
router.use('/admin/mail-templates', adminMailRoutes);
router.use('/admin/suggests', adminSuggestsRoutes);
router.use('/business', businessRoutes);

router.get('/categories', async (_req, res, next) => {
  try {
    const categories = await prisma.category.findMany({
      where: { parentId: null },
      include: { children: true },
      orderBy: { name: 'asc' },
    });
    res.json(categories);
  } catch (err) {
    next(err);
  }
});

// Campi configurati per una categoria: usati dal form annuncio e dai filtri di ricerca
router.get('/categories/:id/fields', async (req, res, next) => {
  try {
    const categoryId = parseInt(req.params.id, 10);
    const fields = await prisma.advancedField.findMany({
      where: { categoryId },
      orderBy: { sortOrder: 'asc' },
      select: { id: true, name: true, type: true, options: true, filterable: true, required: true },
    });
    res.json(fields);
  } catch (err) {
    next(err);
  }
});

router.get('/regions', async (_req, res, next) => {
  try {
    const regioni = await prisma.regione.findMany({ orderBy: { nome: 'asc' } });
    res.json(regioni);
  } catch (err) {
    next(err);
  }
});

router.get('/provinces', async (req, res, next) => {
  try {
    const regioneId = req.query.regioneId ? parseInt(req.query.regioneId as string, 10) : undefined;
    const province = await prisma.province.findMany({
      where: regioneId ? { regioneId } : {},
      orderBy: { nome: 'asc' },
    });
    res.json(province);
  } catch (err) {
    next(err);
  }
});

router.get('/username-availability', async (req, res, next) => {
  try {
    const username = req.query.username as string | undefined;
    if (!username) {
      res.status(400).json({ error: 'Username richiesto' });
      return;
    }
    const existing = await prisma.user.findUnique({ where: { username } });
    if (existing) {
      res.json({ available: false, message: 'Username già in uso' });
    } else {
      res.json({ available: true, message: 'Username disponibile' });
    }
  } catch (err) {
    next(err);
  }
});

router.get('/comuni', async (req, res, next) => {
  try {
    const provinceId = req.query.provinceId ? parseInt(req.query.provinceId as string, 10) : undefined;
    const comuni = await prisma.comune.findMany({
      where: provinceId ? { provinceId } : {},
      orderBy: { comune: 'asc' },
    });
    res.json(comuni);
  } catch (err) {
    next(err);
  }
});

router.post('/suggest', async (req, res, next) => {
  try {
    const { name, mail, type, message } = req.body;
    const suggest = await prisma.suggest.create({
      data: { name, mail, type, message },
    });
    res.status(201).json(suggest);
  } catch (err) {
    next(err);
  }
});

export default router;
