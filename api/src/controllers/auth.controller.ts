import { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { authService } from '../services/auth.service';
import { config } from '../config';
import { verifyRecaptcha } from '../services/recaptcha.service';
import {
  assertLoginAllowed,
  recordLoginAttempt,
  assertRegisterAllowed,
  assertForgotAllowed,
} from '../services/auth-rate-limit.service';

function clientIp(req: Request): string {
  return req.ip ?? req.socket.remoteAddress ?? 'unknown';
}

export const registerValidation = [
  body('email').isEmail().normalizeEmail(),
  body('username').isLength({ min: 3, max: 30 }).matches(/^[a-zA-Z0-9_]+$/),
  body('password').isLength({ min: 8 }),
  body('name').isLength({ min: 2, max: 100 }),
];

export const loginValidation = [
  body('emailOrUsername').notEmpty(),
  body('password').notEmpty(),
];

export const authController = {
  async register(req: Request, res: Response, next: NextFunction) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }
    try {
      await assertRegisterAllowed(clientIp(req));
      await verifyRecaptcha(req.body.recaptchaToken);
      const result = await authService.register(req.body);
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  },

  async login(req: Request, res: Response, next: NextFunction) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }
    try {
      const { emailOrUsername, password } = req.body;
      const ip = clientIp(req);
      await assertLoginAllowed(emailOrUsername, ip);
      try {
        const result = await authService.login(emailOrUsername, password);
        await recordLoginAttempt(emailOrUsername, ip, true);
        res.json(result);
      } catch (loginErr) {
        await recordLoginAttempt(emailOrUsername, ip, false);
        throw loginErr;
      }
    } catch (err) {
      next(err);
    }
  },

  async forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
      await assertForgotAllowed(String(req.body.email ?? ''), clientIp(req));
      await verifyRecaptcha(req.body.recaptchaToken);
      await authService.requestPasswordReset(req.body.email);
      res.json({ message: 'Se l\'email esiste, riceverai le istruzioni per il reset.' });
    } catch (err) {
      next(err);
    }
  },

  async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      await authService.resetPassword(req.body.token, req.body.password);
      res.json({ message: 'Password aggiornata con successo.' });
    } catch (err) {
      next(err);
    }
  },

  async verifyEmail(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.verifyEmail(req.params.code);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  oauthCallback(req: Request, res: Response) {
    const user = req.user as { token: string } | undefined;
    if (!user?.token) {
      res.redirect(`${config.appUrl}/login?error=oauth_failed`);
      return;
    }
    res.redirect(`${config.appUrl}/auth/callback?token=${user.token}`);
  },
};
