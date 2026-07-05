import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/error.middleware';

/**
 * Rate limiting anti brute-force per gli endpoint di autenticazione.
 * DB-based (tabella auth_attempts) perché l'API gira serverless: un limiter
 * in-memory non sopravvive tra invocazioni. Stessa filosofia di antispam.service.
 */

// Login: dopo N tentativi falliti nella finestra, l'account/IP viene bloccato
const LOGIN_MAX_FAILED = 5;
const LOGIN_WINDOW_MINUTES = 15;
// L'IP ha una soglia più alta: può ospitare più utenti legittimi (NAT/uffici),
// ma un attacco a dizionario multi-account da un solo IP va comunque fermato.
const LOGIN_MAX_FAILED_PER_IP = 20;

// Register / forgot-password: limiti orari per IP (spam di account / email bombing)
const REGISTER_MAX_PER_IP_HOUR = 5;
const FORGOT_MAX_PER_IP_HOUR = 5;
const FORGOT_MAX_PER_EMAIL_HOUR = 3;

export type AuthAction = 'login' | 'register' | 'forgot';

function windowStart(minutes: number): Date {
  return new Date(Date.now() - minutes * 60 * 1000);
}

export async function assertLoginAllowed(identifier: string, ip: string): Promise<void> {
  const since = windowStart(LOGIN_WINDOW_MINUTES);
  const [failedForIdentifier, failedForIp] = await Promise.all([
    prisma.authAttempt.count({
      where: { identifier: identifier.toLowerCase(), action: 'login', success: false, createdAt: { gte: since } },
    }),
    prisma.authAttempt.count({
      where: { ip, action: 'login', success: false, createdAt: { gte: since } },
    }),
  ]);

  if (failedForIdentifier >= LOGIN_MAX_FAILED || failedForIp >= LOGIN_MAX_FAILED_PER_IP) {
    throw new AppError(429, `Troppi tentativi di accesso falliti. Riprova tra ${LOGIN_WINDOW_MINUTES} minuti.`);
  }
}

export async function recordLoginAttempt(identifier: string, ip: string, success: boolean): Promise<void> {
  await prisma.authAttempt.create({
    data: { identifier: identifier.toLowerCase(), ip, action: 'login', success },
  });
  // Login riuscito: azzera lo storico fallito dell'identifier così un utente legittimo
  // che sbaglia password un paio di volte non resta penalizzato.
  if (success) {
    await prisma.authAttempt.deleteMany({
      where: { identifier: identifier.toLowerCase(), action: 'login', success: false },
    });
  }
}

export async function assertRegisterAllowed(ip: string): Promise<void> {
  const count = await prisma.authAttempt.count({
    where: { ip, action: 'register', createdAt: { gte: windowStart(60) } },
  });
  if (count >= REGISTER_MAX_PER_IP_HOUR) {
    throw new AppError(429, 'Troppe registrazioni da questo indirizzo. Riprova più tardi.');
  }
  await prisma.authAttempt.create({ data: { identifier: '', ip, action: 'register', success: true } });
}

export async function assertForgotAllowed(email: string, ip: string): Promise<void> {
  const since = windowStart(60);
  const [byIp, byEmail] = await Promise.all([
    prisma.authAttempt.count({ where: { ip, action: 'forgot', createdAt: { gte: since } } }),
    prisma.authAttempt.count({
      where: { identifier: email.toLowerCase(), action: 'forgot', createdAt: { gte: since } },
    }),
  ]);
  if (byIp >= FORGOT_MAX_PER_IP_HOUR || byEmail >= FORGOT_MAX_PER_EMAIL_HOUR) {
    throw new AppError(429, 'Troppe richieste di reset password. Riprova più tardi.');
  }
  await prisma.authAttempt.create({
    data: { identifier: email.toLowerCase(), ip, action: 'forgot', success: true },
  });
}

// Pulizia periodica: i tentativi più vecchi di 24h non servono a nessuna finestra.
export async function pruneOldAttempts(): Promise<number> {
  const { count } = await prisma.authAttempt.deleteMany({
    where: { createdAt: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
  });
  return count;
}
