import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../lib/prisma', () => ({
  prisma: {
    authAttempt: {
      count: vi.fn(),
      create: vi.fn(),
      deleteMany: vi.fn(),
    },
  },
}));

import { prisma } from '../../lib/prisma';
import {
  assertLoginAllowed,
  recordLoginAttempt,
  assertRegisterAllowed,
  assertForgotAllowed,
} from '../auth-rate-limit.service';

const mockCount = prisma.authAttempt.count as ReturnType<typeof vi.fn>;
const mockCreate = prisma.authAttempt.create as ReturnType<typeof vi.fn>;
const mockDeleteMany = prisma.authAttempt.deleteMany as ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.clearAllMocks();
  mockCreate.mockResolvedValue({});
  mockDeleteMany.mockResolvedValue({ count: 0 });
});

describe('assertLoginAllowed', () => {
  it('permette il login sotto soglia', async () => {
    mockCount.mockResolvedValue(0);
    await expect(assertLoginAllowed('user@example.com', '1.2.3.4')).resolves.toBeUndefined();
  });

  it('blocca dopo 5 tentativi falliti per identifier', async () => {
    mockCount.mockResolvedValueOnce(5).mockResolvedValueOnce(0);
    await expect(assertLoginAllowed('user@example.com', '1.2.3.4')).rejects.toMatchObject({
      statusCode: 429,
    });
  });

  it('blocca dopo 20 tentativi falliti per IP anche con identifier diversi', async () => {
    mockCount.mockResolvedValueOnce(0).mockResolvedValueOnce(20);
    await expect(assertLoginAllowed('other@example.com', '1.2.3.4')).rejects.toMatchObject({
      statusCode: 429,
    });
  });

  it('normalizza l\'identifier in lowercase', async () => {
    mockCount.mockResolvedValue(0);
    await assertLoginAllowed('User@Example.COM', '1.2.3.4');
    expect(mockCount).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ identifier: 'user@example.com' }),
      }),
    );
  });
});

describe('recordLoginAttempt', () => {
  it('su successo azzera i tentativi falliti precedenti', async () => {
    await recordLoginAttempt('user@example.com', '1.2.3.4', true);
    expect(mockCreate).toHaveBeenCalled();
    expect(mockDeleteMany).toHaveBeenCalledWith({
      where: { identifier: 'user@example.com', action: 'login', success: false },
    });
  });

  it('su fallimento registra senza azzerare', async () => {
    await recordLoginAttempt('user@example.com', '1.2.3.4', false);
    expect(mockCreate).toHaveBeenCalled();
    expect(mockDeleteMany).not.toHaveBeenCalled();
  });
});

describe('assertRegisterAllowed', () => {
  it('blocca la sesta registrazione dallo stesso IP in un\'ora', async () => {
    mockCount.mockResolvedValue(5);
    await expect(assertRegisterAllowed('1.2.3.4')).rejects.toMatchObject({ statusCode: 429 });
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('registra il tentativo quando permesso', async () => {
    mockCount.mockResolvedValue(0);
    await assertRegisterAllowed('1.2.3.4');
    expect(mockCreate).toHaveBeenCalled();
  });
});

describe('assertForgotAllowed', () => {
  it('blocca oltre 3 richieste per email in un\'ora', async () => {
    mockCount.mockResolvedValueOnce(0).mockResolvedValueOnce(3);
    await expect(assertForgotAllowed('user@example.com', '1.2.3.4')).rejects.toMatchObject({
      statusCode: 429,
    });
  });

  it('blocca oltre 5 richieste per IP in un\'ora', async () => {
    mockCount.mockResolvedValueOnce(5).mockResolvedValueOnce(0);
    await expect(assertForgotAllowed('user@example.com', '1.2.3.4')).rejects.toMatchObject({
      statusCode: 429,
    });
  });
});
