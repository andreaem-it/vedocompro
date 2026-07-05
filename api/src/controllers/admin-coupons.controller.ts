import { Response, NextFunction } from 'express';
import crypto from 'crypto';
import { AuthenticatedRequest } from '../types';
import { AppError } from '../middleware/error.middleware';
import { prisma } from '../lib/prisma';

const CODE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

function randomCodeSuffix(length = 10): string {
  let result = '';
  for (let i = 0; i < length; i++) {
    result += CODE_CHARS[crypto.randomInt(0, CODE_CHARS.length)];
  }
  return result;
}

async function generateUniqueCode(): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt++) {
    const code = `VC-${randomCodeSuffix()}`;
    const existing = await prisma.coupon.findUnique({ where: { code } });
    if (!existing) return code;
  }
  throw new AppError(500, 'Impossibile generare un codice coupon univoco, riprova');
}

export const adminCouponsController = {
  async listCoupons(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const page = Math.max(1, parseInt((req.query.page as string) ?? '1', 10));
      const limit = Math.min(100, Math.max(1, parseInt((req.query.limit as string) ?? '20', 10)));
      const skip = (page - 1) * limit;

      const [coupons, total] = await Promise.all([
        prisma.coupon.findMany({
          orderBy: { id: 'desc' },
          skip,
          take: limit,
        }),
        prisma.coupon.count(),
      ]);

      res.json({ coupons, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
    } catch (err) {
      next(err);
    }
  },

  async generateCoupon(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { value, assigned } = req.body;
      const parsedValue = typeof value === 'number' ? value : parseFloat(value);
      if (value === undefined || value === null || value === '' || Number.isNaN(parsedValue) || parsedValue <= 0) {
        throw new AppError(400, 'Valore coupon richiesto e deve essere un numero positivo');
      }

      const code = await generateUniqueCode();

      const coupon = await prisma.coupon.create({
        data: {
          code,
          value: parsedValue,
          valid: 1,
          assigned: assigned ? String(assigned) : '',
        },
      });

      res.status(201).json(coupon);
    } catch (err) {
      next(err);
    }
  },

  async deleteCoupon(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id, 10);
      const existing = await prisma.coupon.findUnique({ where: { id } });
      if (!existing) throw new AppError(404, 'Coupon non trovato');

      if (existing.valid === 0) {
        throw new AppError(400, 'Coupon già utilizzato, non può essere eliminato');
      }

      await prisma.coupon.delete({ where: { id } });
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  },
};
