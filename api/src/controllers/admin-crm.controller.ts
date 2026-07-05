import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { AppError } from '../middleware/error.middleware';
import { AdminActionType } from '../constants/adminActions';
import { logAdminAction } from '../services/auditLog.service';
import { prisma } from '../lib/prisma';

const RISK_TAGS = new Set(['none', 'watch', 'risk', 'blocked', 'vip']);

function parseRiskTag(value: unknown) {
  const tag = typeof value === 'string' ? value : 'none';
  if (!RISK_TAGS.has(tag)) throw new AppError(400, 'Tag rischio non valido');
  return tag;
}

function parseFollowUpAt(value: unknown) {
  if (!value) return null;
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) throw new AppError(400, 'Data follow-up non valida');
  return date;
}

export const adminCrmController = {
  async listUserNotes(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = parseInt(req.params.id, 10);
      const notes = await prisma.adminUserNote.findMany({
        where: { userId },
        orderBy: [{ resolvedAt: 'asc' }, { followUpAt: 'asc' }, { createdAt: 'desc' }],
        include: { adminUser: { select: { id: true, username: true } } },
      });

      res.json({
        notes,
        openFollowUps: notes.filter((note) => note.followUpAt && !note.resolvedAt).length,
        openRiskTags: notes.filter((note) => note.riskTag !== 'none' && !note.resolvedAt).length,
      });
    } catch (err) {
      next(err);
    }
  },

  async createUserNote(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = parseInt(req.params.id, 10);
      const note = String(req.body.note ?? '').trim();
      if (note.length < 3) throw new AppError(400, 'Inserisci una nota di almeno 3 caratteri');

      const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
      if (!user) throw new AppError(404, 'Utente non trovato');

      const created = await prisma.adminUserNote.create({
        data: {
          userId,
          adminUserId: req.user!.id,
          note,
          riskTag: parseRiskTag(req.body.riskTag),
          followUpAt: parseFollowUpAt(req.body.followUpAt),
        },
        include: { adminUser: { select: { id: true, username: true } } },
      });

      await logAdminAction(req.user!.id, AdminActionType.CRM_NOTE_CREATE);
      res.status(201).json(created);
    } catch (err) {
      next(err);
    }
  },

  async updateUserNote(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = parseInt(req.params.id, 10);
      const noteId = parseInt(req.params.noteId, 10);
      const existing = await prisma.adminUserNote.findFirst({ where: { id: noteId, userId } });
      if (!existing) throw new AppError(404, 'Nota CRM non trovata');

      const data: {
        note?: string;
        riskTag?: string;
        followUpAt?: Date | null;
        resolvedAt?: Date | null;
      } = {};

      if (req.body.note !== undefined) {
        const note = String(req.body.note).trim();
        if (note.length < 3) throw new AppError(400, 'Inserisci una nota di almeno 3 caratteri');
        data.note = note;
      }
      if (req.body.riskTag !== undefined) data.riskTag = parseRiskTag(req.body.riskTag);
      if (req.body.followUpAt !== undefined) data.followUpAt = parseFollowUpAt(req.body.followUpAt);
      if (req.body.resolved !== undefined) data.resolvedAt = req.body.resolved ? new Date() : null;
      if (Object.keys(data).length === 0) throw new AppError(400, 'Nessun campo da aggiornare');

      const updated = await prisma.adminUserNote.update({
        where: { id: noteId },
        data,
        include: { adminUser: { select: { id: true, username: true } } },
      });

      if (req.body.resolved !== undefined) {
        await logAdminAction(req.user!.id, AdminActionType.CRM_NOTE_RESOLVE);
      }
      res.json(updated);
    } catch (err) {
      next(err);
    }
  },
};
