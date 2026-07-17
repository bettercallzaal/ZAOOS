// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

const mockGetSupabaseAdmin = vi.hoisted(() => vi.fn());
vi.mock('@/lib/db/supabase', () => ({ getSupabaseAdmin: mockGetSupabaseAdmin }));

import { claimBudget, getAgentConfig, getDailySpend } from '../config';

afterEach(() => vi.clearAllMocks());

// ---------------------------------------------------------------------------
// getAgentConfig
// ---------------------------------------------------------------------------
describe('getAgentConfig', () => {
  it('returns config on success', async () => {
    const CONFIG = { name: 'vault', trading_enabled: true, wallet_address: '0xABCD' };
    mockGetSupabaseAdmin.mockReturnValue({
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: CONFIG, error: null }),
          }),
        }),
      }),
    });
    const result = await getAgentConfig('VAULT');
    expect(result).toMatchObject({ name: 'vault' });
  });

  it('returns null and logs error on DB error', async () => {
    mockGetSupabaseAdmin.mockReturnValue({
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: { message: 'connection failed' } }),
          }),
        }),
      }),
    });
    const result = await getAgentConfig('VAULT');
    expect(result).toBeNull();
  });

  it('returns null when no config row exists', async () => {
    mockGetSupabaseAdmin.mockReturnValue({
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
      }),
    });
    const result = await getAgentConfig('VAULT');
    expect(result).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// getDailySpend
// ---------------------------------------------------------------------------
describe('getDailySpend', () => {
  it('sums usd_value of success events', async () => {
    const events = [{ usd_value: 1.5 }, { usd_value: 0.5 }, { usd_value: 0.25 }];
    const mockFrom = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          in: vi.fn().mockReturnValue({
            gte: vi.fn().mockResolvedValue({ data: events, error: null }),
          }),
        }),
      }),
    });
    mockGetSupabaseAdmin.mockReturnValue({ from: mockFrom });
    const result = await getDailySpend('VAULT');
    expect(result).toBeCloseTo(2.25);
  });

  it('returns 0 when no events', async () => {
    mockGetSupabaseAdmin.mockReturnValue({
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            in: vi.fn().mockReturnValue({
              gte: vi.fn().mockResolvedValue({ data: null, error: null }),
            }),
          }),
        }),
      }),
    });
    const result = await getDailySpend('VAULT');
    expect(result).toBe(0);
  });

  it('throws on DB error (fail-closed behaviour)', async () => {
    mockGetSupabaseAdmin.mockReturnValue({
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            in: vi.fn().mockReturnValue({
              gte: vi.fn().mockResolvedValue({ data: null, error: { message: 'timeout' } }),
            }),
          }),
        }),
      }),
    });
    await expect(getDailySpend('VAULT')).rejects.toThrow('getDailySpend failed');
  });
});

// ---------------------------------------------------------------------------
// claimBudget
// ---------------------------------------------------------------------------
describe('claimBudget', () => {
  function makeDb({
    preSpendEvents = [] as { usd_value: number }[],
    insertResult = { data: { id: 'res-1' }, error: null },
    reVerifyEvents = [] as { usd_value: number }[],
    deleteResult = { error: null },
  } = {}) {
    let selectCall = 0;
    return {
      from: vi.fn().mockImplementation((table: string) => {
        if (table === 'agent_events') {
          return {
            select: vi.fn().mockImplementation(() => ({
              eq: vi.fn().mockReturnValue({
                in: vi.fn().mockReturnValue({
                  gte: vi.fn().mockImplementation(() => {
                    selectCall++;
                    const events = selectCall === 1 ? preSpendEvents : reVerifyEvents;
                    return Promise.resolve({ data: events, error: null });
                  }),
                }),
              }),
            })),
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue(insertResult),
              }),
            }),
            delete: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue(deleteResult) }),
          };
        }
        return {};
      }),
    };
  }

  it('returns true when budget is available and insert succeeds', async () => {
    // Pre-spend: $2, re-verify: $2.5 (after our $0.5 reservation) — under $10 max
    const db = makeDb({
      preSpendEvents: [{ usd_value: 2.0 }],
      reVerifyEvents: [{ usd_value: 2.5 }],
    });
    mockGetSupabaseAdmin.mockReturnValue(db);
    const result = await claimBudget('VAULT', 0.5, 10.0);
    expect(result).toBe(true);
  });

  it('returns false when pre-spend exceeds max', async () => {
    const db = makeDb({ preSpendEvents: [{ usd_value: 9.8 }] });
    mockGetSupabaseAdmin.mockReturnValue(db);
    const result = await claimBudget('VAULT', 0.5, 10.0);
    expect(result).toBe(false);
  });

  it('returns false when insert fails', async () => {
    const db = makeDb({
      preSpendEvents: [],
      insertResult: { data: null as unknown as { id: string }, error: { message: 'insert fail' } },
    });
    mockGetSupabaseAdmin.mockReturnValue(db);
    const result = await claimBudget('VAULT', 0.5, 10.0);
    expect(result).toBe(false);
  });

  it('returns false and rolls back when re-verify exceeds max (concurrent over-claim)', async () => {
    // Pre-spend: $9, our trade: $0.5, re-verify total: $10.5 (concurrent also claimed $0.5)
    const db = makeDb({
      preSpendEvents: [{ usd_value: 9.0 }],
      reVerifyEvents: [{ usd_value: 10.5 }],
    });
    mockGetSupabaseAdmin.mockReturnValue(db);
    const result = await claimBudget('VAULT', 0.5, 10.0);
    expect(result).toBe(false);
    // Verify delete was called to roll back the reservation
    const fromMock = db.from as ReturnType<typeof vi.fn>;
    const deleteCall = fromMock.mock.results.find(
      (r) => r.value?.delete && typeof r.value.delete === 'function',
    );
    expect(deleteCall).toBeDefined();
  });
});
