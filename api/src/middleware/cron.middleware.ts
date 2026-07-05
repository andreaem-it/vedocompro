import { Request, Response, NextFunction } from 'express';
import { config } from '../config';

/** Protegge gli endpoint cron verificando `Authorization: Bearer <CRON_SECRET>`. */
export function requireCronSecret(req: Request, res: Response, next: NextFunction): void {
  if (!config.cronSecret) {
    res.status(503).json({ error: 'Cron non configurato' });
    return;
  }

  const authHeader = req.headers.authorization ?? '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice('Bearer '.length) : '';

  if (token !== config.cronSecret) {
    res.status(401).json({ error: 'Non autorizzato' });
    return;
  }

  next();
}
