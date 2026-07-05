import { hashPassword, verifyPassword } from '../utils/password';
import { signJwt, generateSecureToken } from '../utils/tokens';
import { mailService } from './mail.service';
import { AppError } from '../middleware/error.middleware';
import { prisma } from '../lib/prisma';

function toSafeUser<T extends Record<string, unknown>>(user: T) {
  const { password, resetToken, resetTokenExpiry, googleAccessToken, facebookAccessToken, ...safeUser } = user;
  return safeUser;
}

export const authService = {
  async register(data: {
    email: string;
    username: string;
    password: string;
    name: string;
  }) {
    const existing = await prisma.user.findFirst({
      where: { OR: [{ email: data.email }, { username: data.username }] },
    });
    if (existing) {
      throw new AppError(409, existing.email === data.email ? 'Email già in uso' : 'Username già in uso');
    }

    const hashed = await hashPassword(data.password);
    const code = generateSecureToken();
    const user = await prisma.user.create({
      data: { ...data, password: hashed, code, isActive: false },
      select: { id: true, email: true, username: true, name: true, isAdmin: true },
    });

    await mailService.sendVerifyEmail(user.email, code).catch(() => {});

    return { user, message: 'Registrazione completata. Controlla la tua email per attivare l\'account.' };
  },

  async login(emailOrUsername: string, password: string) {
    const user = await prisma.user.findFirst({
      where: { OR: [{ email: emailOrUsername }, { username: emailOrUsername }] },
    });
    if (!user) throw new AppError(401, 'Credenziali non valide');

    const valid = await verifyPassword(password, user.password);
    if (!valid) throw new AppError(401, 'Credenziali non valide');

    if (!user.isActive) {
      throw new AppError(403, 'Account non attivo. Verifica la tua email o contatta il supporto.');
    }

    const token = signJwt({ sub: user.id, email: user.email, username: user.username, isAdmin: user.isAdmin });
    return { user: toSafeUser(user), token };
  },

  async verifyEmail(code: string) {
    if (!code || code.length < 16) throw new AppError(400, 'Codice di verifica non valido');

    const user = await prisma.user.findFirst({ where: { code } });
    if (!user) throw new AppError(400, 'Codice di verifica non valido o già utilizzato');

    if (!user.isActive) {
      await prisma.user.update({ where: { id: user.id }, data: { isActive: true } });
      await mailService.sendWelcome(user.email, user.username).catch(() => {});
    }

    return { message: 'Account verificato con successo. Ora puoi accedere.' };
  },

  async findOrCreateOAuthUser(data: {
    provider: 'google' | 'facebook';
    providerId: string;
    accessToken: string;
    email: string;
    name: string;
    pic?: string;
  }) {
    const idField = data.provider === 'google' ? 'googleId' : 'facebookId';
    const tokenField = data.provider === 'google' ? 'googleAccessToken' : 'facebookAccessToken';

    let user = await prisma.user.findFirst({ where: { [idField]: data.providerId } });

    if (!user) {
      user = await prisma.user.findFirst({ where: { email: data.email } });
      if (user) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { [idField]: data.providerId, [tokenField]: data.accessToken },
        });
      } else {
        const baseUsername = data.email.split('@')[0].replace(/[^a-z0-9]/gi, '').toLowerCase();
        let username = baseUsername;
        let counter = 1;
        while (await prisma.user.findFirst({ where: { username } })) {
          username = `${baseUsername}${counter++}`;
        }
        user = await prisma.user.create({
          data: {
            email: data.email,
            username,
            password: await hashPassword(generateSecureToken()),
            name: data.name,
            realname: data.name,
            pic: data.pic,
            isActive: true,
            [idField]: data.providerId,
            [tokenField]: data.accessToken,
          },
        });
      }
    }

    const token = signJwt({ sub: user.id, email: user.email, username: user.username, isAdmin: user.isAdmin });
    return { user: toSafeUser(user), token };
  },

  async requestPasswordReset(email: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return; // Silent — don't reveal if email exists

    const token = generateSecureToken();
    const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data: { resetToken: token, resetTokenExpiry: expiry },
    });

    await mailService.sendPasswordReset(email, token);
  },

  async resetPassword(token: string, newPassword: string) {
    const user = await prisma.user.findFirst({
      where: { resetToken: token, resetTokenExpiry: { gt: new Date() } },
    });
    if (!user) throw new AppError(400, 'Token non valido o scaduto');

    const hashed = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashed, resetToken: null, resetTokenExpiry: null },
    });
  },
};
