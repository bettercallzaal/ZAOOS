// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));
vi.mock('@/lib/notifications', () => ({ createInAppNotification: vi.fn().mockResolvedValue(undefined) }));

const mockReadContract = vi.hoisted(() => vi.fn());
vi.mock('viem', async (importOriginal) => {
  const actual = await importOriginal<typeof import('viem')>();
  return {
    ...actual,
    createPublicClient: vi.fn(() => ({ readContract: mockReadContract })),
  };
});

const mockSingle = vi.hoisted(() => vi.fn());
const mockFrom = vi.hoisted(() =>
  vi.fn().mockReturnValue({
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    not: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockResolvedValue({ error: null }),
    single: mockSingle,
  }),
);
vi.mock('@/lib/db/supabase', () => ({ supabaseAdmin: { from: mockFrom } }));

import { NextRequest } from 'next/server';
import { GET } from '../route';

beforeEach(() => {
  process.env.CRON_SECRET = 'test-cron-secret';
});
afterEach(() => {
  vi.clearAllMocks();
  delete process.env.CRON_SECRET;
});

function makeRequest(authHeader?: string) {
  return new NextRequest(new URL('/api/cron/zounz-events', 'http://localhost:3000'), {
    headers: authHeader ? { authorization: authHeader } : {},
  });
}

describe('GET /api/cron/zounz-events', () => {
  it('returns 401 when authorization header is wrong', async () => {
    const res = await GET(makeRequest('Bearer wrong-secret'));
    expect(res.status).toBe(401);
  });

  it('returns 500 when viem readContract throws', async () => {
    mockSingle.mockResolvedValue({ data: { value: '5' }, error: null });
    mockReadContract.mockRejectedValue(new Error('RPC error'));
    const res = await GET(makeRequest('Bearer test-cron-secret'));
    expect(res.status).toBe(500);
  });

  it('returns success:true with no events when proposal count matches and auction settled', async () => {
    // proposalCount → same as stored; no new proposals
    mockReadContract
      .mockResolvedValueOnce(BigInt(5)) // proposalCount
      .mockResolvedValueOnce([
        BigInt(1), BigInt(0), '0x0', BigInt(0), BigInt(0), true, // settled=true
      ]);
    // lastState: stored count is 5 (same as current)
    mockSingle.mockResolvedValue({ data: { value: '5' }, error: null });
    const res = await GET(makeRequest('Bearer test-cron-secret'));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.events).toEqual([]);
    expect(body.proposalCount).toBe(5);
  });
});
