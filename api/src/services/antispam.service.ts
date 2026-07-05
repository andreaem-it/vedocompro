import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/error.middleware';

/**
 * Anti-spam per la messaggistica interna. Tutti i controlli sono DB-based (query su
 * `messages`) e non in-memory: l'API gira serverless su Vercel, dove ogni invocazione
 * può essere un processo diverso — un rate limiter in memoria non funzionerebbe.
 */

// Limiti per tutti gli account
const MAX_MESSAGES_PER_MINUTE = 10;
// Stesso testo inviato a N+ destinatari diversi nell'ultima ora = pattern spam seriale
const MAX_IDENTICAL_RECIPIENTS_PER_HOUR = 3;

// Limiti aggiuntivi per account recenti (protezione nuovi account, roadmap P1)
const NEW_ACCOUNT_AGE_DAYS = 7;
const NEW_ACCOUNT_MAX_RECIPIENTS_PER_DAY = 5;
const NEW_ACCOUNT_MAX_MESSAGES_PER_DAY = 30;
const VERIFIED_NEW_ACCOUNT_MAX_RECIPIENTS_PER_DAY = 12;
const VERIFIED_NEW_ACCOUNT_MAX_MESSAGES_PER_DAY = 80;

type SuspiciousSignal = {
  pattern: RegExp;
  weight: number;
};

const BLOCK_TEXT_SCORE = 6;

// Pesi volutamente conservativi: un singolo "whatsapp" non basta a bloccare,
// ma combinazioni con pagamento anticipato, link esterni o pressione all'uscita
// dalla piattaforma diventano segnali forti.
const SUSPICIOUS_SIGNALS: SuspiciousSignal[] = [
  { pattern: /\b(?:whats?app|wa\.me|telegram|t\.me)\b/i, weight: 2 },
  { pattern: /\b(?:fuori|estern[oa]|lontano)\s+(?:da|dalla|dal)\s+(?:piattaforma|sito|chat)\b/i, weight: 4 },
  { pattern: /\bfuori\s+(?:piattaforma|sito|chat)\b/i, weight: 4 },
  { pattern: /\b(?:scrivimi|contattami|rispondimi)\s+(?:su|via|al|alla)\s+(?:whats?app|telegram|mail|email)\b/i, weight: 3 },
  { pattern: /\b(?:anticipo|caparra|acconto|bloccare\s+l['’]?oggetto|fermare\s+l['’]?oggetto)\b/i, weight: 2 },
  { pattern: /\b(?:ricarica\s+(?:postepay|poste\s*pay)|western\s+union|moneygram|gift\s*card|buono\s+regalo)\b/i, weight: 5 },
  { pattern: /\b(?:bitcoin|btc|crypto|criptovalut[ae])\b/i, weight: 4 },
  { pattern: /\b(?:corriere|spedizioniere)\s+(?:passa|ritira|mandato|mando|organizzo)\b/i, weight: 2 },
  { pattern: /\b(?:clicca|apri|segui)\s+(?:questo\s+)?link\b/i, weight: 3 },
  { pattern: /\bhttps?:\/\/|www\./i, weight: 2 },
  { pattern: /\b(?:bit\.ly|tinyurl\.com|t\.co|goo\.gl|cutt\.ly|is\.gd)\b/i, weight: 3 },
  { pattern: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i, weight: 2 },
  { pattern: /\b(?:urgente|subito|entro\s+(?:oggi|stasera|1\s*ora|un'?ora))\b/i, weight: 1 },
];

const STRONG_BLOCK_PATTERNS = [
  /\b(?:ricarica\s+(?:postepay|poste\s*pay)|western\s+union|moneygram|gift\s*card|buono\s+regalo)\b.*\b(?:whats?app|telegram|fuori|link)\b/i,
  /\b(?:whats?app|telegram|fuori|link)\b.*\b(?:ricarica\s+(?:postepay|poste\s*pay)|western\s+union|moneygram|gift\s*card|buono\s+regalo)\b/i,
  /\b(?:pagamento|paga|paghiamo|pagare|versamento)\b.*\b(?:fuori|estern[oa])\b.*\b(?:piattaforma|sito|chat)\b/i,
];

function normalizeText(value: string) {
  return value
    .normalize('NFKC')
    .replace(/\s+/g, ' ')
    .trim();
}

export function suspiciousMessageScore(message: string): number {
  const text = normalizeText(message);
  if (!text) return 0;
  if (STRONG_BLOCK_PATTERNS.some((pattern) => pattern.test(text))) return BLOCK_TEXT_SCORE;

  return SUSPICIOUS_SIGNALS.reduce((score, signal) => (
    signal.pattern.test(text) ? score + signal.weight : score
  ), 0);
}

export async function assertCanSendMessage(
  fromUserId: number,
  toUserId: number,
  message: string,
): Promise<void> {
  const now = Date.now();
  const oneMinuteAgo = new Date(now - 60 * 1000);
  const oneHourAgo = new Date(now - 60 * 60 * 1000);
  const oneDayAgo = new Date(now - 24 * 60 * 60 * 1000);

  const [lastMinuteCount, identicalRecent, sender] = await Promise.all([
    prisma.message.count({
      where: { fromUserId, datetime: { gte: oneMinuteAgo } },
    }),
    prisma.message.findMany({
      where: { fromUserId, message, datetime: { gte: oneHourAgo } },
      select: { toUserId: true },
    }),
    prisma.user.findUnique({
      where: { id: fromUserId },
      select: { dateJoin: true, isAdmin: true, phoneVerified: true },
    }),
  ]);

  if (sender?.isAdmin) return; // gli admin non sono soggetti ai limiti

  if (suspiciousMessageScore(message) >= BLOCK_TEXT_SCORE) {
    throw new AppError(429, 'Il messaggio contiene segnali tipici di spam o truffa. Mantieni la conversazione su VedoCompro e riprova.');
  }

  if (lastMinuteCount >= MAX_MESSAGES_PER_MINUTE) {
    throw new AppError(429, 'Stai inviando messaggi troppo velocemente. Attendi un minuto e riprova.');
  }

  const identicalRecipients = new Set(identicalRecent.map((m) => m.toUserId));
  identicalRecipients.add(toUserId);
  if (identicalRecipients.size > MAX_IDENTICAL_RECIPIENTS_PER_HOUR) {
    throw new AppError(429, 'Hai inviato lo stesso messaggio a troppi utenti diversi. Riprova più tardi.');
  }

  const accountAgeDays = sender
    ? (now - sender.dateJoin.getTime()) / (1000 * 60 * 60 * 24)
    : Infinity;

  if (accountAgeDays < NEW_ACCOUNT_AGE_DAYS) {
    const maxMessagesPerDay = sender?.phoneVerified
      ? VERIFIED_NEW_ACCOUNT_MAX_MESSAGES_PER_DAY
      : NEW_ACCOUNT_MAX_MESSAGES_PER_DAY;
    const maxRecipientsPerDay = sender?.phoneVerified
      ? VERIFIED_NEW_ACCOUNT_MAX_RECIPIENTS_PER_DAY
      : NEW_ACCOUNT_MAX_RECIPIENTS_PER_DAY;

    const [dayCount, dayRecipients] = await Promise.all([
      prisma.message.count({ where: { fromUserId, datetime: { gte: oneDayAgo } } }),
      prisma.message.findMany({
        where: { fromUserId, datetime: { gte: oneDayAgo } },
        select: { toUserId: true },
        distinct: ['toUserId'],
      }),
    ]);

    if (dayCount >= maxMessagesPerDay) {
      throw new AppError(429, 'Limite giornaliero di messaggi raggiunto per gli account appena creati.');
    }
    const isNewRecipient = !dayRecipients.some((m) => m.toUserId === toUserId);
    if (isNewRecipient && dayRecipients.length >= maxRecipientsPerDay) {
      throw new AppError(429, `Gli account appena creati possono contattare al massimo ${maxRecipientsPerDay} nuovi utenti al giorno.`);
    }
  }
}
