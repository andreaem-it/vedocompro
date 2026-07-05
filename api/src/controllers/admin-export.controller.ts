import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { prisma } from '../lib/prisma';

type CsvValue = string | number | boolean | Date | null | undefined;

const MAX_EXPORT_ROWS = 10000;

function csvCell(value: CsvValue): string {
  if (value === null || value === undefined) return '';
  const raw = value instanceof Date ? value.toISOString() : String(value);
  const safe = /^[=+\-@]/.test(raw) ? `'${raw}` : raw;
  return `"${safe.replace(/"/g, '""')}"`;
}

function sendCsv(res: Response, filename: string, headers: string[], rows: CsvValue[][]) {
  const csv = [
    headers.map(csvCell).join(','),
    ...rows.map((row) => row.map(csvCell).join(',')),
  ].join('\n');

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(`\uFEFF${csv}`);
}

function todayStamp() {
  return new Date().toISOString().slice(0, 10);
}

export const adminExportController = {
  async users(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
      const where = q
        ? { OR: [{ email: { contains: q, mode: 'insensitive' as const } }, { username: { contains: q, mode: 'insensitive' as const } }] }
        : {};

      const users = await prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: MAX_EXPORT_ROWS,
        select: {
          id: true,
          email: true,
          username: true,
          name: true,
          realname: true,
          phone: true,
          phoneVerified: true,
          city: true,
          isActive: true,
          isAdmin: true,
          isCompany: true,
          creditsGold: true,
          creditsSilver: true,
          creditsBronze: true,
          points: true,
          dateJoin: true,
          createdAt: true,
          businessEnd: true,
          _count: { select: { ads: true, payments: true, reportsReceived: true } },
        },
      });

      sendCsv(
        res,
        `vedocompro-utenti-${todayStamp()}.csv`,
        [
          'id', 'email', 'username', 'nome', 'nome_reale', 'telefono', 'telefono_verificato',
          'citta', 'attivo', 'admin', 'business', 'crediti_gold', 'crediti_silver',
          'crediti_bronze', 'punti', 'data_iscrizione', 'creato_il', 'business_scadenza',
          'annunci', 'pagamenti', 'segnalazioni_ricevute',
        ],
        users.map((u) => [
          u.id, u.email, u.username, u.name, u.realname, u.phone, u.phoneVerified,
          u.city, u.isActive, u.isAdmin, !!u.isCompany, u.creditsGold, u.creditsSilver,
          u.creditsBronze, u.points, u.dateJoin, u.createdAt, u.businessEnd,
          u._count.ads, u._count.payments, u._count.reportsReceived,
        ]),
      );
    } catch (err) {
      next(err);
    }
  },

  async ads(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const published = req.query.published === '0' || req.query.published === '1'
        ? Number(req.query.published)
        : undefined;

      const ads = await prisma.ad.findMany({
        where: published === undefined ? {} : { published },
        orderBy: { creationTime: 'desc' },
        take: MAX_EXPORT_ROWS,
        select: {
          id: true,
          name: true,
          price: true,
          region: true,
          provincia: true,
          location: true,
          objCondition: true,
          objLevel: true,
          published: true,
          sold: true,
          showcase: true,
          canBeOrdered: true,
          shippingAvailable: true,
          views: true,
          callClicks: true,
          messageClicks: true,
          creationTime: true,
          updateTime: true,
          category: { select: { name: true } },
          user: { select: { id: true, username: true, email: true } },
          _count: { select: { wishlists: true, orders: true, offers: true, reports: true } },
        },
      });

      sendCsv(
        res,
        `vedocompro-annunci-${todayStamp()}.csv`,
        [
          'id', 'titolo', 'categoria', 'venditore_id', 'venditore_username', 'venditore_email',
          'prezzo', 'regione', 'provincia', 'comune', 'condizione', 'livello', 'pubblicato',
          'venduto', 'showcase', 'ordinabile', 'spedizione', 'visite', 'click_telefono',
          'click_messaggi', 'preferiti', 'ordini', 'offerte', 'segnalazioni', 'creato_il',
          'aggiornato_il',
        ],
        ads.map((ad) => [
          ad.id, ad.name, ad.category.name, ad.user.id, ad.user.username, ad.user.email,
          ad.price.toString(), ad.region, ad.provincia, ad.location, ad.objCondition, ad.objLevel,
          ad.published === 1, ad.sold === 1, ad.showcase === 1, ad.canBeOrdered,
          ad.shippingAvailable, ad.views, ad.callClicks, ad.messageClicks, ad._count.wishlists,
          ad._count.orders, ad._count.offers, ad._count.reports, ad.creationTime, ad.updateTime,
        ]),
      );
    } catch (err) {
      next(err);
    }
  },

  async payments(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const status = typeof req.query.status === 'string' && req.query.status.trim()
        ? req.query.status.trim()
        : undefined;

      const payments = await prisma.payment.findMany({
        where: status ? { paymentStatus: status } : {},
        orderBy: { timestamp: 'desc' },
        take: MAX_EXPORT_ROWS,
        select: {
          id: true,
          paypalTxnId: true,
          price: true,
          paymentCurrency: true,
          paymentStatus: true,
          paymentEmail: true,
          timestamp: true,
          user: { select: { id: true, username: true, email: true } },
          product: { select: { id: true, name: true } },
        },
      });

      sendCsv(
        res,
        `vedocompro-pagamenti-${todayStamp()}.csv`,
        [
          'id', 'transazione', 'utente_id', 'username', 'email_utente', 'prodotto_id',
          'prodotto', 'importo', 'valuta', 'stato', 'email_pagamento', 'data',
        ],
        payments.map((p) => [
          p.id, p.paypalTxnId, p.user.id, p.user.username, p.user.email, p.product.id,
          p.product.name, p.price.toString(), p.paymentCurrency, p.paymentStatus, p.paymentEmail,
          p.timestamp,
        ]),
      );
    } catch (err) {
      next(err);
    }
  },
};
