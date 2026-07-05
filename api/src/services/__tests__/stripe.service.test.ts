import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../lib/prisma', () => ({
  prisma: {
    adOrder: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    orderPaymentReconciliation: {
      create: vi.fn(),
    },
    notification: {
      create: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

const mockRefundsCreate = vi.fn();
vi.mock('stripe', () => ({
  default: class StripeMock {
    refunds = { create: mockRefundsCreate };
    checkout = { sessions: { create: vi.fn(), retrieve: vi.fn() } };
    webhooks = { constructEvent: vi.fn() };
  },
}));

// La config viene letta al momento dell'import: secretKey fittizia per abilitare il client
vi.mock('../../config', () => ({
  config: {
    appUrl: 'http://localhost:3000',
    stripe: { secretKey: 'sk_test_fake', webhookSecret: '' },
  },
}));

vi.mock('../mail.service', () => ({
  mailService: { isConfigured: () => false, sendMarketplaceOrderUpdate: vi.fn() },
}));

import Stripe from 'stripe';
import { prisma } from '../../lib/prisma';
import { fulfillCheckoutSession, refundOrderPayment } from '../stripe.service';

const mockOrderFind = prisma.adOrder.findUnique as ReturnType<typeof vi.fn>;
const mockOrderUpdate = prisma.adOrder.update as ReturnType<typeof vi.fn>;
const mockTransaction = prisma.$transaction as ReturnType<typeof vi.fn>;
const mockNotifCreate = prisma.notification.create as ReturnType<typeof vi.fn>;

// Ordine da €25,50 pagato/pagabile con Stripe
const BASE_ORDER = {
  id: 42,
  userId: 1,
  paymentStatus: 'unpaid',
  paymentProvider: null as string | null,
  paymentIntentId: null as string | null,
  currency: 'EUR',
  totalAmount: '25.50',
  ad: { id: 7, name: 'Bici da corsa', userId: 2 },
  user: { id: 1, email: 'buyer@example.com' },
};

function session(overrides: Partial<Stripe.Checkout.Session> = {}): Stripe.Checkout.Session {
  return {
    id: 'cs_test_123',
    payment_status: 'paid',
    payment_intent: 'pi_test_123',
    amount_total: 2550,
    currency: 'eur',
    metadata: { orderId: '42' },
    client_reference_id: '42',
    ...overrides,
  } as unknown as Stripe.Checkout.Session;
}

beforeEach(() => {
  vi.clearAllMocks();
  mockOrderUpdate.mockResolvedValue({});
  mockNotifCreate.mockResolvedValue({});
  mockTransaction.mockResolvedValue([]);
  mockRefundsCreate.mockResolvedValue({ id: 're_test' });
});

describe('fulfillCheckoutSession', () => {
  it('marca pagato un ordine con sessione valida', async () => {
    mockOrderFind.mockResolvedValue({ ...BASE_ORDER });
    const result = await fulfillCheckoutSession(session());
    expect(result).toEqual({ orderId: 42, updated: true });
    expect(mockOrderUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ paymentStatus: 'paid', paymentProvider: 'stripe', paymentIntentId: 'pi_test_123' }),
      }),
    );
  });

  it('è idempotente: ordine già pagato con stesso intent non viene ritoccato', async () => {
    mockOrderFind.mockResolvedValue({ ...BASE_ORDER, paymentStatus: 'paid', paymentIntentId: 'pi_test_123' });
    const result = await fulfillCheckoutSession(session());
    expect(result).toEqual({ orderId: 42, updated: false });
    expect(mockOrderUpdate).not.toHaveBeenCalled();
  });

  it('non fa nulla se la sessione non è pagata', async () => {
    const result = await fulfillCheckoutSession(session({ payment_status: 'unpaid' } as Partial<Stripe.Checkout.Session>));
    expect(result).toEqual({ orderId: 42, updated: false });
    expect(mockOrderFind).not.toHaveBeenCalled();
  });

  it('rifiuta un importo diverso dal totale ordine', async () => {
    mockOrderFind.mockResolvedValue({ ...BASE_ORDER });
    await expect(fulfillCheckoutSession(session({ amount_total: 100 } as Partial<Stripe.Checkout.Session>))).rejects.toMatchObject({
      statusCode: 400,
    });
    expect(mockOrderUpdate).not.toHaveBeenCalled();
  });

  it('rifiuta una valuta diversa da quella dell\'ordine', async () => {
    mockOrderFind.mockResolvedValue({ ...BASE_ORDER });
    await expect(fulfillCheckoutSession(session({ currency: 'usd' } as Partial<Stripe.Checkout.Session>))).rejects.toMatchObject({
      statusCode: 400,
    });
  });

  it('fallisce senza riferimento ordine nella sessione', async () => {
    await expect(
      fulfillCheckoutSession(session({ metadata: {}, client_reference_id: null } as unknown as Partial<Stripe.Checkout.Session>)),
    ).rejects.toMatchObject({ statusCode: 400 });
  });
});

describe('refundOrderPayment', () => {
  const PAID_STRIPE_ORDER = {
    id: 42,
    paymentStatus: 'paid',
    paymentProvider: 'stripe',
    paymentIntentId: 'pi_test_123',
  };

  it('rimborsa un ordine pagato con Stripe e logga la riconciliazione', async () => {
    const result = await refundOrderPayment(PAID_STRIPE_ORDER, 99, 'dispute #1');
    expect(result).toEqual({ refunded: true });
    expect(mockRefundsCreate).toHaveBeenCalledWith({ payment_intent: 'pi_test_123' });
    expect(mockTransaction).toHaveBeenCalled();
  });

  it('non rimborsa ordini non pagati con Stripe', async () => {
    const result = await refundOrderPayment({ ...PAID_STRIPE_ORDER, paymentProvider: 'bonifico' }, 99, 'x');
    expect(result.refunded).toBe(false);
    expect(mockRefundsCreate).not.toHaveBeenCalled();
  });

  it('non rimborsa ordini non in stato paid', async () => {
    const result = await refundOrderPayment({ ...PAID_STRIPE_ORDER, paymentStatus: 'refunded' }, 99, 'x');
    expect(result.refunded).toBe(false);
  });

  it('tratta charge_already_refunded come successo (idempotenza)', async () => {
    mockRefundsCreate.mockRejectedValue(Object.assign(new Error('already refunded'), { code: 'charge_already_refunded' }));
    const result = await refundOrderPayment(PAID_STRIPE_ORDER, 99, 'x');
    expect(result.refunded).toBe(true);
    expect(mockTransaction).toHaveBeenCalled();
  });

  it('riporta il motivo se Stripe rifiuta il rimborso', async () => {
    mockRefundsCreate.mockRejectedValue(Object.assign(new Error('Insufficient funds'), { code: 'insufficient_funds' }));
    const result = await refundOrderPayment(PAID_STRIPE_ORDER, 99, 'x');
    expect(result.refunded).toBe(false);
    expect(result.reason).toContain('Insufficient funds');
    expect(mockTransaction).not.toHaveBeenCalled();
  });
});
