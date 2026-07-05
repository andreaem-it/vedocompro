import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { AppError } from '../middleware/error.middleware';
import { AdminActionType } from '../constants/adminActions';
import { NotificationType } from '../constants/notifications';
import { PaymentStatus } from '../constants/orders';
import { logAdminAction } from '../services/auditLog.service';
import { prisma } from '../lib/prisma';

const PAYMENT_STATUSES = new Set<string>(Object.values(PaymentStatus));

export const adminOrdersController = {
  async list(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const page = Math.max(1, parseInt((req.query.page as string) ?? '1', 10));
      const limit = Math.min(100, Math.max(1, parseInt((req.query.limit as string) ?? '30', 10)));
      const status = req.query.status !== undefined && req.query.status !== ''
        ? parseInt(req.query.status as string, 10)
        : undefined;
      const paymentStatus = typeof req.query.paymentStatus === 'string' && req.query.paymentStatus
        ? req.query.paymentStatus
        : undefined;
      const disputed = req.query.disputed === 'true';

      const where = {
        ...(Number.isFinite(status) ? { status } : {}),
        ...(paymentStatus ? { paymentStatus } : {}),
        ...(disputed ? { dispute: { isNot: null } } : {}),
      };

      const [orders, total, statusCounts, paymentCounts, openDisputes, completedGmv] = await Promise.all([
        prisma.adOrder.findMany({
          where,
          orderBy: { orderDate: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
          include: {
            ad: { select: { id: true, name: true, price: true, user: { select: { id: true, username: true, email: true } } } },
            user: { select: { id: true, username: true, email: true, phone: true } },
            dispute: { select: { id: true, status: true } },
            paymentReconciliations: {
              orderBy: { createdAt: 'desc' },
              take: 3,
              include: { adminUser: { select: { id: true, username: true } } },
            },
          },
        }),
        prisma.adOrder.count({ where }),
        prisma.adOrder.groupBy({ by: ['status'], _count: { _all: true } }),
        prisma.adOrder.groupBy({ by: ['paymentStatus'], _count: { _all: true } }),
        prisma.dispute.count({ where: { status: { notIn: ['resolved_buyer', 'resolved_seller', 'closed'] } } }),
        prisma.adOrder.aggregate({
          where: { status: 4 },
          _sum: { totalAmount: true },
        }),
      ]);

      res.json({
        orders,
        stats: {
          total,
          openDisputes,
          completedGmv: completedGmv._sum.totalAmount ?? 0,
          byStatus: Object.fromEntries(statusCounts.map((row) => [row.status, row._count._all])),
          byPaymentStatus: Object.fromEntries(paymentCounts.map((row) => [row.paymentStatus, row._count._all])),
        },
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      });
    } catch (err) {
      next(err);
    }
  },

  async reconcilePayment(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id, 10);
      const paymentStatus = String(req.body.paymentStatus ?? '').trim();
      const provider = String(req.body.provider ?? '').trim() || null;
      const paymentIntentId = String(req.body.paymentIntentId ?? '').trim() || null;
      const note = String(req.body.note ?? '').trim() || null;

      if (!PAYMENT_STATUSES.has(paymentStatus)) throw new AppError(400, 'Stato pagamento non valido');
      if (provider && provider.length > 80) throw new AppError(400, 'Provider troppo lungo');
      if (paymentIntentId && paymentIntentId.length > 160) throw new AppError(400, 'ID pagamento troppo lungo');
      if (!note && paymentStatus !== PaymentStatus.PENDING) {
        throw new AppError(400, 'Nota obbligatoria per riconciliare un pagamento');
      }

      const order = await prisma.adOrder.findUnique({
        where: { id },
        include: { ad: { select: { id: true, name: true, userId: true } } },
      });
      if (!order) throw new AppError(404, 'Ordine non trovato');
      if (order.paymentStatus === paymentStatus && order.paymentProvider === provider && order.paymentIntentId === paymentIntentId) {
        throw new AppError(400, 'Nessuna modifica da registrare');
      }

      const updated = await prisma.$transaction(async (tx) => {
        const reconciled = await tx.adOrder.update({
          where: { id },
          data: {
            paymentStatus,
            paymentProvider: provider,
            paymentIntentId,
          },
          include: {
            ad: { select: { id: true, name: true, price: true, user: { select: { id: true, username: true, email: true } } } },
            user: { select: { id: true, username: true, email: true, phone: true } },
            dispute: { select: { id: true, status: true } },
            paymentReconciliations: {
              orderBy: { createdAt: 'desc' },
              take: 3,
              include: { adminUser: { select: { id: true, username: true } } },
            },
          },
        });

        await tx.orderPaymentReconciliation.create({
          data: {
            orderId: id,
            adminUserId: req.user!.id,
            previousStatus: order.paymentStatus,
            newStatus: paymentStatus,
            provider,
            paymentIntentId,
            note,
          },
        });

        if ([PaymentStatus.PAID, PaymentStatus.REFUNDED].includes(paymentStatus as typeof PaymentStatus.PAID | typeof PaymentStatus.REFUNDED)) {
          await tx.notification.createMany({
            data: [
              { userId: order.userId, type: NotificationType.ORDER_UPDATE, object: order.id },
              { userId: order.ad.userId, type: NotificationType.ORDER_UPDATE, object: order.id },
            ],
          });
        }

        return reconciled;
      });

      await logAdminAction(req.user!.id, AdminActionType.ORDER_PAYMENT_RECONCILE);
      res.json(updated);
    } catch (err) {
      next(err);
    }
  },
};
