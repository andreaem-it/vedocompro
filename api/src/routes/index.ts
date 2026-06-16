import { Router } from 'express';
import { prisma } from '../lib/prisma';
import authRoutes from './auth.routes';
import adsRoutes from './ads.routes';
import usersRoutes from './users.routes';
import adminRoutes from './admin.routes';
import paymentsRoutes from './payments.routes';

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

export default router;
