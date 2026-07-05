import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { AppError } from '../middleware/error.middleware';
import { prisma } from '../lib/prisma';
import { NotificationType } from '../constants/notifications';
import { OrderStatus } from '../constants/orders';
import { DisputeStatus } from '../constants/offers';
import { AdminActionType } from '../constants/adminActions';
import { logAdminAction } from '../services/auditLog.service';
import { storageService } from '../services/storage.service';
import { generateS3Key } from '../middleware/upload.middleware';
import { mailService } from '../services/mail.service';
import { refundOrderPayment } from '../services/stripe.service';

// Email best-effort agli utenti coinvolti: mai bloccare la risposta API per errori SMTP
async function emailDisputeEvent(userIds: number[], subject: string, message: string, orderId: number): Promise<void> {
  if (!mailService.isConfigured() || userIds.length === 0) return;
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { email: true },
  });
  await Promise.all(
    users.map((u) => mailService.sendDisputeNotification(u.email, subject, message, orderId).catch(() => {})),
  );
}

const DISPUTE_INCLUDE = {
  order: {
    select: {
      id: true,
      status: true,
      totalAmount: true,
      orderDate: true,
      userId: true,
      user: { select: { id: true, username: true } },
      ad: { select: { id: true, name: true, userId: true, user: { select: { id: true, username: true } } } },
    },
  },
  openedBy: { select: { id: true, username: true } },
  messages: {
    orderBy: { createdAt: 'asc' as const },
    include: {
      user: { select: { id: true, username: true } },
      attachments: { orderBy: { id: 'asc' as const } },
    },
  },
} as const;

const DISPUTE_MESSAGE_INCLUDE = {
  user: { select: { id: true, username: true } },
  attachments: { orderBy: { id: 'asc' as const } },
} as const;

async function notifyAdmins(type: number, object: number): Promise<void> {
  const admins = await prisma.user.findMany({ where: { isAdmin: true }, select: { id: true } });
  await Promise.all(
    admins.map((admin) => prisma.notification.create({ data: { userId: admin.id, type, object } })),
  );
}

export const disputesController = {
  // POST /users/me/orders/:id/dispute — apre una contestazione (compratore o venditore)
  async open(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const orderId = parseInt(req.params.id, 10);
      const order = await prisma.adOrder.findUnique({ where: { id: orderId }, include: { ad: true, dispute: true } });
      if (!order) throw new AppError(404, 'Ordine non trovato');

      const isBuyer = order.userId === req.user!.id;
      const isSeller = order.ad.userId === req.user!.id;
      if (!isBuyer && !isSeller) throw new AppError(403, 'Non autorizzato');
      if (order.dispute) throw new AppError(400, 'Esiste già una contestazione per questo ordine');
      if (order.status === OrderStatus.PENDING || order.status === OrderStatus.CANCELLED || order.status === OrderStatus.REJECTED) {
        throw new AppError(400, 'Puoi contestare solo un ordine accettato, spedito o completato');
      }

      const reason = String(req.body.reason ?? '').trim();
      const description = String(req.body.description ?? '').trim();
      if (!reason) throw new AppError(400, 'Motivo della contestazione richiesto');
      if (description.length < 20) throw new AppError(400, 'Descrivi il problema con almeno 20 caratteri');

      const dispute = await prisma.dispute.create({
        data: {
          orderId,
          openedById: req.user!.id,
          reason,
          description,
          status: DisputeStatus.OPEN,
        },
        include: DISPUTE_INCLUDE,
      });

      // Notifica controparte + admin
      const counterpartId = isBuyer ? order.ad.userId : order.userId;
      await prisma.notification.create({
        data: { userId: counterpartId, type: NotificationType.DISPUTE_OPENED, object: dispute.id },
      });
      await notifyAdmins(NotificationType.DISPUTE_OPENED, dispute.id);
      await emailDisputeEvent(
        [counterpartId],
        'È stata aperta una contestazione su un tuo ordine',
        `Motivo: ${reason}. Puoi rispondere e allegare prove dalla pagina Acquisti e vendite; un moderatore esaminerà il caso.`,
        orderId,
      );

      res.status(201).json(dispute);
    } catch (err) {
      next(err);
    }
  },

  // GET /users/me/orders/:id/dispute — dettaglio contestazione con messaggi
  async getByOrder(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const orderId = parseInt(req.params.id, 10);
      const dispute = await prisma.dispute.findUnique({ where: { orderId }, include: DISPUTE_INCLUDE });
      if (!dispute) throw new AppError(404, 'Nessuna contestazione per questo ordine');

      const isParty =
        dispute.order.userId === req.user!.id || dispute.order.ad.userId === req.user!.id;
      if (!isParty && !req.user!.isAdmin) throw new AppError(403, 'Non autorizzato');

      res.json(dispute);
    } catch (err) {
      next(err);
    }
  },

  // POST /users/me/disputes/:id/messages — messaggio delle parti nella contestazione
  async addMessage(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id, 10);
      const dispute = await prisma.dispute.findUnique({ where: { id }, include: { order: { include: { ad: true } } } });
      if (!dispute) throw new AppError(404, 'Contestazione non trovata');

      const isBuyer = dispute.order.userId === req.user!.id;
      const isSeller = dispute.order.ad.userId === req.user!.id;
      const isAdmin = req.user!.isAdmin === true;
      if (!isBuyer && !isSeller && !isAdmin) throw new AppError(403, 'Non autorizzato');

      if (
        dispute.status === DisputeStatus.RESOLVED_BUYER ||
        dispute.status === DisputeStatus.RESOLVED_SELLER ||
        dispute.status === DisputeStatus.CLOSED
      ) {
        throw new AppError(400, 'La contestazione è chiusa');
      }

      const files = (req.files as Express.Multer.File[] | undefined) ?? [];
      const message = String(req.body.message ?? '').trim();
      if (!message && files.length === 0) throw new AppError(400, 'Messaggio vuoto');
      if (message.length > 5000) throw new AppError(400, 'Messaggio troppo lungo');

      const uploaded = await Promise.all(
        files.map(async (file) => {
          const key = generateS3Key(file.originalname, `disputes/${id}`);
          const url = await storageService.upload(key, file.buffer, file.mimetype);
          return {
            url,
            fileName: file.originalname,
            mimeType: file.mimetype,
            size: file.size,
          };
        }),
      );

      const created = await prisma.$transaction(async (tx) => {
        const createdMessage = await tx.disputeMessage.create({
          data: { disputeId: id, userId: req.user!.id, message: message || 'Allegato inviato', isAdmin },
        });
        if (uploaded.length) {
          await tx.disputeAttachment.createMany({
            data: uploaded.map((file) => ({ ...file, messageId: createdMessage.id, userId: req.user!.id })),
          });
        }
        return tx.disputeMessage.findUniqueOrThrow({
          where: { id: createdMessage.id },
          include: DISPUTE_MESSAGE_INCLUDE,
        });
      });

      // Notifica le altre parti coinvolte (non chi scrive)
      const parties = new Set([dispute.order.userId, dispute.order.ad.userId]);
      parties.delete(req.user!.id);
      await Promise.all(
        [...parties].map((userId) =>
          prisma.notification.create({
            data: { userId, type: NotificationType.DISPUTE_UPDATE, object: dispute.id },
          }),
        ),
      );
      await emailDisputeEvent(
        [...parties],
        'Nuovo messaggio nella contestazione',
        isAdmin
          ? 'Lo staff ha scritto nella contestazione del tuo ordine.'
          : "L'altra parte ha risposto nella contestazione del tuo ordine.",
        dispute.orderId,
      );

      res.status(201).json(created);
    } catch (err) {
      next(err);
    }
  },

  // GET /admin/disputes?status=
  async adminList(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const status = req.query.status as string | undefined;
      const disputes = await prisma.dispute.findMany({
        where: status ? { status } : {},
        include: DISPUTE_INCLUDE,
        orderBy: { id: 'desc' },
      });
      res.json(disputes);
    } catch (err) {
      next(err);
    }
  },

  // PUT /admin/disputes/:id — { status, adminDecision }
  async adminUpdate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id, 10);
      const dispute = await prisma.dispute.findUnique({ where: { id }, include: { order: { include: { ad: true } } } });
      if (!dispute) throw new AppError(404, 'Contestazione non trovata');

      const status = String(req.body.status ?? '');
      const validStatuses: string[] = [
        DisputeStatus.UNDER_REVIEW,
        DisputeStatus.RESOLVED_BUYER,
        DisputeStatus.RESOLVED_SELLER,
        DisputeStatus.CLOSED,
      ];
      if (!validStatuses.includes(status)) throw new AppError(400, 'Stato non valido');

      const isResolution =
        status === DisputeStatus.RESOLVED_BUYER || status === DisputeStatus.RESOLVED_SELLER;
      const adminDecision = String(req.body.adminDecision ?? '').trim();
      if (isResolution && !adminDecision) {
        throw new AppError(400, 'La decisione va motivata (adminDecision)');
      }

      const updated = await prisma.dispute.update({
        where: { id },
        data: {
          status,
          adminDecision: adminDecision || dispute.adminDecision,
          resolvedBy: isResolution || status === DisputeStatus.CLOSED ? req.user!.id : dispute.resolvedBy,
          resolvedAt: isResolution || status === DisputeStatus.CLOSED ? new Date() : dispute.resolvedAt,
        },
        include: DISPUTE_INCLUDE,
      });

      if (isResolution || status === DisputeStatus.CLOSED) {
        await logAdminAction(req.user!.id, AdminActionType.DISPUTE_RESOLVE);
      }

      // Risoluzione pro-compratore su ordine pagato con Stripe: rimborso automatico
      // (opt-out con refund:false nel body). Un esito negativo non blocca la decisione:
      // viene riportato nella risposta e l'admin può riconciliare manualmente.
      let refundResult: { refunded: boolean; reason?: string } | null = null;
      if (status === DisputeStatus.RESOLVED_BUYER && req.body.refund !== false) {
        const order = await prisma.adOrder.findUnique({
          where: { id: dispute.orderId },
          select: { id: true, paymentStatus: true, paymentProvider: true, paymentIntentId: true },
        });
        if (order?.paymentProvider === 'stripe' && order.paymentIntentId) {
          refundResult = await refundOrderPayment(
            order,
            req.user!.id,
            `Rimborso automatico da dispute #${dispute.id}: ${adminDecision}`,
          ).catch((err) => ({ refunded: false, reason: String(err) }));
        }
      }

      // Notifica entrambe le parti
      await Promise.all(
        [dispute.order.userId, dispute.order.ad.userId].map((userId) =>
          prisma.notification.create({
            data: { userId, type: NotificationType.DISPUTE_UPDATE, object: dispute.id },
          }),
        ),
      );

      if (isResolution || status === DisputeStatus.CLOSED) {
        const outcome =
          status === DisputeStatus.RESOLVED_BUYER
            ? 'La contestazione è stata risolta a favore del compratore.'
            : status === DisputeStatus.RESOLVED_SELLER
              ? 'La contestazione è stata risolta a favore del venditore.'
              : 'La contestazione è stata chiusa senza esito.';
        const refundNote = refundResult?.refunded
          ? " Il pagamento con carta è stato rimborsato: l'accredito arriva in 5-10 giorni lavorativi."
          : '';
        await emailDisputeEvent(
          [dispute.order.userId, dispute.order.ad.userId],
          'La contestazione è stata decisa',
          `${outcome}${adminDecision ? ` Motivazione: ${adminDecision}` : ''}${refundNote}`,
          dispute.orderId,
        );
      }

      res.json({ ...updated, refund: refundResult });
    } catch (err) {
      next(err);
    }
  },
};
