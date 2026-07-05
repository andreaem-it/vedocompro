import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { prisma } from '../lib/prisma';
import { OrderStatus } from '../constants/orders';
import { OfferStatus } from '../constants/offers';

// Statistiche venditore per tutti gli utenti (la dashboard Business resta separata e
// più ricca: qui si aggregano i contatori già presenti su Ad — views/callClicks/
// messageClicks — più ordini e offerte, senza scrivere nuove righe di tracking).
export const sellerStatsController = {
  async getMyStats(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;

      const [adAgg, adCounts, publishedCount, soldCount, orderGroups, completedRevenue, offerGroups, topAds] =
        await Promise.all([
          prisma.ad.aggregate({
            where: { userId },
            _sum: { views: true, callClicks: true, messageClicks: true },
          }),
          prisma.ad.count({ where: { userId } }),
          prisma.ad.count({ where: { userId, published: 1 } }),
          prisma.ad.count({ where: { userId, sold: 1 } }),
          prisma.adOrder.groupBy({
            by: ['status'],
            where: { ad: { userId } },
            _count: { id: true },
          }),
          prisma.adOrder.aggregate({
            where: { ad: { userId }, status: OrderStatus.COMPLETED },
            _sum: { totalAmount: true },
          }),
          prisma.adOffer.groupBy({
            by: ['status'],
            where: { sellerId: userId },
            _count: { id: true },
          }),
          prisma.ad.findMany({
            where: { userId },
            select: {
              id: true, name: true, price: true, views: true, callClicks: true,
              messageClicks: true, published: true, sold: true, creationTime: true,
              _count: { select: { orders: true, offers: true, wishlists: true } },
            },
            orderBy: { views: 'desc' },
            take: 10,
          }),
        ]);

      const ordersByStatus: Record<number, number> = {};
      for (const g of orderGroups) ordersByStatus[g.status] = g._count.id;
      const totalOrders = orderGroups.reduce((acc, g) => acc + g._count.id, 0);
      const completedOrders = ordersByStatus[OrderStatus.COMPLETED] ?? 0;

      const offersByStatus: Record<string, number> = {};
      for (const g of offerGroups) offersByStatus[g.status] = g._count.id;
      const pendingOffers =
        (offersByStatus[OfferStatus.PENDING] ?? 0) + (offersByStatus[OfferStatus.COUNTERED] ?? 0);

      const totalViews = adAgg._sum.views ?? 0;

      res.json({
        ads: { total: adCounts, published: publishedCount, sold: soldCount },
        engagement: {
          views: totalViews,
          callClicks: adAgg._sum.callClicks ?? 0,
          messageClicks: adAgg._sum.messageClicks ?? 0,
        },
        orders: {
          total: totalOrders,
          pending: ordersByStatus[OrderStatus.PENDING] ?? 0,
          accepted: ordersByStatus[OrderStatus.ACCEPTED] ?? 0,
          shipped: ordersByStatus[OrderStatus.SHIPPED] ?? 0,
          completed: completedOrders,
          cancelled: (ordersByStatus[OrderStatus.CANCELLED] ?? 0) + (ordersByStatus[OrderStatus.REJECTED] ?? 0),
          revenue: completedRevenue._sum.totalAmount ?? 0,
        },
        offers: {
          total: offerGroups.reduce((acc, g) => acc + g._count.id, 0),
          pending: pendingOffers,
          accepted: offersByStatus[OfferStatus.ACCEPTED] ?? 0,
        },
        // Conversione grezza: ordini completati sul totale visite annunci
        conversionPercent: totalViews > 0 ? Math.round((completedOrders / totalViews) * 1000) / 10 : null,
        topAds,
      });
    } catch (err) {
      next(err);
    }
  },
};
