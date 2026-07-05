import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { AppError } from '../middleware/error.middleware';
import { NotificationType } from '../constants/notifications';
import { mailService } from '../services/mail.service';
import { prisma } from '../lib/prisma';

function replacePlaceholders(text: string, user: { username: string; name: string; email: string }): string {
  return text
    .split('{{username}}').join(user.username)
    .split('{{name}}').join(user.name)
    .split('{{email}}').join(user.email);
}

export const adminMailController = {
  async list(_req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const templates = await prisma.adminDefaultMail.findMany({ orderBy: { id: 'asc' } });
      res.json(templates);
    } catch (err) {
      next(err);
    }
  },

  async getById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id, 10);
      const template = await prisma.adminDefaultMail.findUnique({ where: { id } });
      if (!template) throw new AppError(404, 'Template email non trovato');
      res.json(template);
    } catch (err) {
      next(err);
    }
  },

  async create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { title, message, type } = req.body;
      if (!title || !message) throw new AppError(400, 'Titolo e messaggio sono obbligatori');

      const parsedType = typeof type === 'number' ? type : parseInt(type, 10);
      if (!Number.isInteger(parsedType)) throw new AppError(400, 'Type deve essere un numero intero');

      const template = await prisma.adminDefaultMail.create({
        data: { title, message, type: parsedType },
      });
      res.status(201).json(template);
    } catch (err) {
      next(err);
    }
  },

  async update(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id, 10);
      const existing = await prisma.adminDefaultMail.findUnique({ where: { id } });
      if (!existing) throw new AppError(404, 'Template email non trovato');

      const { title, message, type } = req.body;

      let parsedType: number | undefined;
      if (type !== undefined) {
        parsedType = typeof type === 'number' ? type : parseInt(type, 10);
        if (!Number.isInteger(parsedType)) throw new AppError(400, 'Type deve essere un numero intero');
      }

      const template = await prisma.adminDefaultMail.update({
        where: { id },
        data: {
          ...(title !== undefined ? { title } : {}),
          ...(message !== undefined ? { message } : {}),
          ...(parsedType !== undefined ? { type: parsedType } : {}),
        },
      });
      res.json(template);
    } catch (err) {
      next(err);
    }
  },

  async remove(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id, 10);
      const existing = await prisma.adminDefaultMail.findUnique({ where: { id } });
      if (!existing) throw new AppError(404, 'Template email non trovato');

      await prisma.adminDefaultMail.delete({ where: { id } });
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  },

  async send(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const {
        mode,
        userIds,
        templateId,
        subject,
        message,
        from,
      } = req.body as {
        mode?: 'email' | 'internal';
        userIds?: number[];
        templateId?: number | null;
        subject?: string;
        message?: string;
        from?: string;
      };

      if (mode !== 'email' && mode !== 'internal') throw new AppError(400, 'Tipo invio non valido');
      if (!Array.isArray(userIds) || userIds.length === 0) throw new AppError(400, 'Seleziona almeno un destinatario');
      if (userIds.length > 100) throw new AppError(400, 'Massimo 100 destinatari per invio');

      const users = await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, email: true, username: true, name: true },
      });
      if (users.length === 0) throw new AppError(400, 'Nessun destinatario valido');

      const template = templateId
        ? await prisma.adminDefaultMail.findUnique({ where: { id: templateId } })
        : null;

      const baseSubject = template?.title ?? subject;
      const baseMessage = template?.message ?? message;
      if (mode === 'email' && !baseSubject?.trim()) throw new AppError(400, 'Oggetto richiesto');
      if (!baseMessage?.trim()) throw new AppError(400, 'Messaggio richiesto');

      let sent = 0;
      for (const user of users) {
        const renderedMessage = replacePlaceholders(baseMessage, user);
        const renderedSubject = replacePlaceholders(baseSubject ?? 'Messaggio da VedoCompro', user);

        if (mode === 'email') {
          await mailService.send(user.email, renderedSubject, renderedMessage, from);
        } else {
          const internalMessage = await prisma.message.create({
            data: {
              fromUserId: req.user!.id,
              toUserId: user.id,
              message: renderedMessage,
            },
          });
          await prisma.notification.create({
            data: { userId: user.id, type: NotificationType.NEW_MESSAGE, object: internalMessage.id },
          });
          await mailService.sendInternalMessageNotify(user.email, req.user!.username, renderedMessage).catch(() => {});
        }
        sent++;
      }

      res.json({ sent });
    } catch (err) {
      next(err);
    }
  },
};
