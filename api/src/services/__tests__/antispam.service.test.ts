import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../lib/prisma', () => ({
  prisma: {
    message: {
      count: vi.fn(),
      findMany: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
  },
}));

import { prisma } from '../../lib/prisma';
import { assertCanSendMessage, suspiciousMessageScore } from '../antispam.service';

const mockMsgCount = prisma.message.count as ReturnType<typeof vi.fn>;
const mockMsgFindMany = prisma.message.findMany as ReturnType<typeof vi.fn>;
const mockUserFind = prisma.user.findUnique as ReturnType<typeof vi.fn>;

const OLD_ACCOUNT = { dateJoin: new Date('2020-01-01'), isAdmin: false, phoneVerified: false };
const ADMIN = { dateJoin: new Date('2020-01-01'), isAdmin: true, phoneVerified: false };
const NEW_ACCOUNT = { dateJoin: new Date(), isAdmin: false, phoneVerified: false };
const NEW_VERIFIED = { dateJoin: new Date(), isAdmin: false, phoneVerified: true };

beforeEach(() => {
  vi.clearAllMocks();
  mockMsgCount.mockResolvedValue(0);
  mockMsgFindMany.mockResolvedValue([]);
});

describe('assertCanSendMessage', () => {
  it('scoring testuale: non blocca riferimenti innocui o un singolo canale esterno', () => {
    expect(suspiciousMessageScore('Ciao, il prodotto è ancora disponibile?')).toBe(0);
    expect(suspiciousMessageScore('Preferisci sentirci su whatsapp per accordare il ritiro?')).toBeLessThan(6);
  });

  it('scoring testuale: riconosce combinazioni ad alto rischio', () => {
    expect(suspiciousMessageScore('Scrivimi su whatsapp, pagamento fuori piattaforma con link')).toBeGreaterThanOrEqual(6);
    expect(suspiciousMessageScore('Ti mando il corriere, clicca questo link e paga la caparra urgente')).toBeGreaterThanOrEqual(6);
    expect(suspiciousMessageScore('Ricarica Postepay e poi continuiamo su Telegram')).toBeGreaterThanOrEqual(6);
  });

  it('permette un messaggio normale', async () => {
    mockUserFind.mockResolvedValue(OLD_ACCOUNT);
    await expect(assertCanSendMessage(1, 2, 'ciao')).resolves.toBeUndefined();
  });

  it('blocca messaggi con segnali testuali sospetti combinati', async () => {
    mockUserFind.mockResolvedValue(OLD_ACCOUNT);
    await expect(
      assertCanSendMessage(1, 2, 'Scrivimi su whatsapp e paghiamo fuori piattaforma con questo link'),
    ).rejects.toMatchObject({ statusCode: 429 });
  });

  it('blocca oltre 10 messaggi al minuto', async () => {
    mockUserFind.mockResolvedValue(OLD_ACCOUNT);
    mockMsgCount.mockResolvedValueOnce(10);
    await expect(assertCanSendMessage(1, 2, 'ciao')).rejects.toMatchObject({ statusCode: 429 });
  });

  it('gli admin sono esenti dai limiti', async () => {
    mockUserFind.mockResolvedValue(ADMIN);
    mockMsgCount.mockResolvedValueOnce(999);
    await expect(assertCanSendMessage(1, 2, 'ciao')).resolves.toBeUndefined();
  });

  it('blocca lo stesso testo inviato a più di 3 destinatari in un\'ora', async () => {
    mockUserFind.mockResolvedValue(OLD_ACCOUNT);
    // stesso messaggio già inviato a 3 destinatari diversi, il 4° scatta il blocco
    mockMsgFindMany.mockResolvedValueOnce([{ toUserId: 10 }, { toUserId: 11 }, { toUserId: 12 }]);
    await expect(assertCanSendMessage(1, 13, 'compro tutto scrivimi')).rejects.toMatchObject({
      statusCode: 429,
    });
  });

  it('account nuovo non verificato: blocca al 30° messaggio del giorno', async () => {
    mockUserFind.mockResolvedValue(NEW_ACCOUNT);
    // 1a chiamata count: finestra 1 minuto → 0; 2a chiamata count: finestra 24h → 30
    mockMsgCount.mockResolvedValueOnce(0).mockResolvedValueOnce(30);
    mockMsgFindMany.mockResolvedValueOnce([]).mockResolvedValueOnce([]);
    await expect(assertCanSendMessage(1, 2, 'ciao')).rejects.toMatchObject({ statusCode: 429 });
  });

  it('account nuovo con telefono verificato: soglia giornaliera più alta (30 non blocca)', async () => {
    mockUserFind.mockResolvedValue(NEW_VERIFIED);
    mockMsgCount.mockResolvedValueOnce(0).mockResolvedValueOnce(30);
    mockMsgFindMany.mockResolvedValueOnce([]).mockResolvedValueOnce([]);
    await expect(assertCanSendMessage(1, 2, 'ciao')).resolves.toBeUndefined();
  });

  it('account nuovo: blocca il 6° nuovo destinatario del giorno', async () => {
    mockUserFind.mockResolvedValue(NEW_ACCOUNT);
    mockMsgCount.mockResolvedValueOnce(0).mockResolvedValueOnce(10);
    mockMsgFindMany
      .mockResolvedValueOnce([]) // messaggi identici recenti
      .mockResolvedValueOnce([
        { toUserId: 10 }, { toUserId: 11 }, { toUserId: 12 }, { toUserId: 13 }, { toUserId: 14 },
      ]); // 5 destinatari già contattati oggi
    await expect(assertCanSendMessage(1, 99, 'ciao')).rejects.toMatchObject({ statusCode: 429 });
  });

  it('account nuovo: permette di riscrivere a un destinatario già contattato oggi', async () => {
    mockUserFind.mockResolvedValue(NEW_ACCOUNT);
    mockMsgCount.mockResolvedValueOnce(0).mockResolvedValueOnce(10);
    mockMsgFindMany
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        { toUserId: 10 }, { toUserId: 11 }, { toUserId: 12 }, { toUserId: 13 }, { toUserId: 14 },
      ]);
    await expect(assertCanSendMessage(1, 12, 'ciao ancora')).resolves.toBeUndefined();
  });
});
