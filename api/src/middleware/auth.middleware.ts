import { Response, NextFunction } from 'express';
import { verifyJwt } from '../utils/tokens';
import { AuthenticatedRequest, JwtPayload } from '../types';

function toReqUser(payload: JwtPayload): Express.User {
  return { id: payload.sub, email: payload.email, username: payload.username, isAdmin: payload.isAdmin };
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  try {
    const token = header.slice(7);
    req.user = toReqUser(verifyJwt(token));
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  requireAuth(req, res, () => {
    if (!req.user?.isAdmin) {
      res.status(403).json({ error: 'Admin access required' });
      return;
    }
    next();
  });
}

export function optionalAuth(req: AuthenticatedRequest, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) {
    try {
      req.user = toReqUser(verifyJwt(header.slice(7)));
    } catch {
      // ignore invalid token for optional auth
    }
  }
  next();
}
