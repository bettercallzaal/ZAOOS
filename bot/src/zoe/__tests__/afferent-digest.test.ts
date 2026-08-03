import { describe, it, expect, vi, beforeEach } from 'vitest';
import { persistDailyDigest } from '../afferent-digest';

/**
 * Tests for the afferent digest job. Database I/O is mocked; what is under test is
 * the STATUS the job reports back to the scheduler, because the scheduler logs an
 * 'error' status at error level and a 'silent' status at info level. A DB failure
 * reported as 'silent' is a green-while-broken outage
 * (.claude/rules/silent-failure-guard.md).
 */

const state = vi.hoisted(() => ({
  // Result of the last-24h receipts query (awaited after .order()).
  receiptsQuery: { data: [] as unknown[], error: null as { message: string } | null },
  // Result of the idempotency lookup (.single()).
  idempotency: {
    data: null as { id: string } | null,
    error: null as { code?: string; message: string } | null,
  },
  emitReceiptResult: true,
  emitReceiptCalls: 0,
}));

vi.mock('../../supabase', () => ({
  db: vi.fn(() => ({
    from: vi.fn(() => {
      const builder: Record<string, unknown> = {};
      builder.select = () => builder;
      builder.eq = () => builder;
      builder.gte = () => builder;
      builder.limit = () => builder;
      builder.order = () => Promise.resolve(state.receiptsQuery);
      builder.single = () => Promise.resolve(state.idempotency);
      return builder;
    }),
  })),
}));

vi.mock('../receipts', () => ({
  emitReceipt: vi.fn(() => {
    state.emitReceiptCalls++;
    return Promise.resolve(state.emitReceiptResult);
  }),
}));

vi.mock('../bonfire-queue', () => ({
  queueConfigured: () => false,
  promoteSubmission: vi.fn(() => Promise.resolve({ ok: true })),
  buildEpisode: vi.fn(),
}));

const RECEIPT = {
  agent_identity: 'zoe',
  capability: 'post_github',
  action: 'create_pull_request',
  result_type: 'success',
  created_at: '2026-08-02T00:00:00.000Z',
};

describe('persistDailyDigest', () => {
  beforeEach(() => {
    state.receiptsQuery = { data: [RECEIPT], error: null };
    state.idempotency = { data: null, error: { code: 'PGRST116', message: 'not found' } };
    state.emitReceiptResult = true;
    state.emitReceiptCalls = 0;
  });

  it('reports success when there are receipts to digest', async () => {
    const result = await persistDailyDigest();
    expect(result.status).toBe('success');
    expect(result.receiptCount).toBe(1);
    expect(state.emitReceiptCalls).toBe(1);
  });

  it('reports silent when the day genuinely had no receipts', async () => {
    state.receiptsQuery = { data: [], error: null };
    const result = await persistDailyDigest();
    expect(result.status).toBe('silent');
    expect(state.emitReceiptCalls).toBe(0);
  });

  it('reports error - not silent - when the receipts query fails', async () => {
    state.receiptsQuery = { data: [], error: { message: 'connection refused' } };
    const result = await persistDailyDigest();
    expect(result.status).toBe('error');
    expect(result.message).toContain('connection refused');
    expect(state.emitReceiptCalls).toBe(0);
  });

  it('reports silent when today already has a digest receipt', async () => {
    state.idempotency = { data: { id: 'receipt-1' }, error: null };
    const result = await persistDailyDigest();
    expect(result.status).toBe('silent');
    expect(state.emitReceiptCalls).toBe(0);
  });

  it('does NOT emit when the idempotency check itself fails', async () => {
    state.idempotency = { data: null, error: { code: '57014', message: 'statement timeout' } };
    const result = await persistDailyDigest();
    expect(result.status).toBe('error');
    expect(state.emitReceiptCalls).toBe(0);
  });
});
