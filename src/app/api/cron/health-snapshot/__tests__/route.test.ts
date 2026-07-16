import { beforeEach, describe, expect, it, vi } from 'vitest';
import { makeRequest } from '@/test-utils/api-helpers';

// ── Hoisted mocks ────────────────────────────────────────────────────────────
const { mockFrom, mockRpc } = vi.hoisted(() => ({
  mockFrom: vi.fn(),
  mockRpc: vi.fn(),
}));

vi.mock('@/lib/db/supabase', () => ({
  supabaseAdmin: {
    from: mockFrom,
    rpc: mockRpc,
  },
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
  },
}));

// Mock env var access
vi.stubGlobal('process', {
  env: {
    CRON_SECRET: 'test-secret-123',
  },
});

import { GET } from '@/app/api/cron/health-snapshot/route';

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Build a Supabase query-chain mock that resolves to result.
 * Every chained method returns the chain itself.
 * Terminal .then() resolves the query.
 */
function chainMock(result: { data?: unknown; error?: unknown; count?: number }) {
  const chain: Record<string, unknown> = {};
  chain.select = vi.fn().mockReturnValue(chain);
  chain.not = vi.fn().mockReturnValue(chain);
  chain.gt = vi.fn().mockReturnValue(chain);
  chain.upsert = vi.fn().mockReturnValue(chain);
  // biome-ignore lint/suspicious/noThenProperty: intentional thenable
  (chain as { then: ReturnType<typeof vi.fn> }).then = vi.fn((resolve: (val: unknown) => void) =>
    resolve(result),
  );
  return chain;
}

/**
 * Build a NextRequest with an optional Authorization header.
 */
function makeHealthSnapshotRequest(authHeader?: string) {
  const options: RequestInit = {};
  if (authHeader) {
    options.headers = {
      authorization: authHeader,
    };
  }
  return makeRequest('/api/cron/health-snapshot', options);
}

/**
 * Build an RPC mock that resolves to result via .then()
 */
function rpcMock(result: { data?: unknown; error?: unknown }) {
  const mock: { then?: ReturnType<typeof vi.fn> } = {};
  // biome-ignore lint/suspicious/noThenProperty: intentional thenable for Promise.all
  (mock as unknown as { then: ReturnType<typeof vi.fn> }).then = vi.fn(
    (resolve: (val: unknown) => void) => resolve(result),
  );
  return mock;
}

describe('GET /api/cron/health-snapshot', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Authorization tests ──────────────────────────────────────────────────

  it('returns 401 when authorization header is missing', async () => {
    const req = makeHealthSnapshotRequest();
    const res = await GET(req);

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Unauthorized');
  });

  it('returns 401 when authorization header is incorrect', async () => {
    const req = makeHealthSnapshotRequest('Bearer wrong-secret');
    const res = await GET(req);

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Unauthorized');
  });

  it('returns 401 when authorization header has wrong scheme', async () => {
    const req = makeHealthSnapshotRequest('Basic test-secret-123');
    const res = await GET(req);

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Unauthorized');
  });

  it('returns 500 when CRON_SECRET is not configured', async () => {
    // Temporarily remove CRON_SECRET from env
    const original = process.env.CRON_SECRET;
    delete process.env.CRON_SECRET;

    const req = makeHealthSnapshotRequest('Bearer test-secret-123');
    const res = await GET(req);

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('CRON_SECRET not configured');

    // Restore
    process.env.CRON_SECRET = original;
  });

  // ── Success path tests ───────────────────────────────────────────────────

  it('returns success when authorized with correct Bearer token', async () => {
    const membersChain = chainMock({ count: 100, error: null });
    const activeMembersChain = chainMock({ count: 45, error: null });
    const withFidChain = chainMock({ count: 78, error: null });
    const sessionsChain = chainMock({ count: 320, error: null });

    mockFrom
      .mockReturnValueOnce(membersChain)
      .mockReturnValueOnce(activeMembersChain)
      .mockReturnValueOnce(withFidChain)
      .mockReturnValueOnce(sessionsChain);

    mockRpc.mockReturnValueOnce(rpcMock({ data: 5420, error: null }));

    const insertChain = chainMock({ error: null });
    mockFrom.mockReturnValueOnce(insertChain);

    const req = makeHealthSnapshotRequest('Bearer test-secret-123');
    const res = await GET(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  it('snapshots all metrics correctly', async () => {
    const membersChain = chainMock({ count: 100, error: null });
    const activeMembersChain = chainMock({ count: 45, error: null });
    const withFidChain = chainMock({ count: 78, error: null });
    const sessionsChain = chainMock({ count: 320, error: null });

    mockFrom
      .mockReturnValueOnce(membersChain)
      .mockReturnValueOnce(activeMembersChain)
      .mockReturnValueOnce(withFidChain)
      .mockReturnValueOnce(sessionsChain);

    mockRpc.mockReturnValueOnce(rpcMock({ data: 5420, error: null }));

    const insertChain = chainMock({ error: null });
    mockFrom.mockReturnValueOnce(insertChain);

    const req = makeHealthSnapshotRequest('Bearer test-secret-123');
    const res = await GET(req);

    expect(res.status).toBe(200);

    // Verify the upsert was called with correct snapshot data
    expect(insertChain.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        total_members: 100,
        active_members: 45,
        with_fid: 78,
        total_sessions: 320,
        total_respect: 5420,
        snapshot_date: expect.any(String), // YYYY-MM-DD format
      }),
      { onConflict: 'snapshot_date' },
    );
  });

  it('handles count as null (fallback to 0)', async () => {
    const membersChain = chainMock({ count: null, error: null });
    const activeMembersChain = chainMock({ count: null, error: null });
    const withFidChain = chainMock({ count: null, error: null });
    const sessionsChain = chainMock({ count: null, error: null });

    mockFrom
      .mockReturnValueOnce(membersChain)
      .mockReturnValueOnce(activeMembersChain)
      .mockReturnValueOnce(withFidChain)
      .mockReturnValueOnce(sessionsChain);

    mockRpc.mockReturnValueOnce(rpcMock({ data: null, error: null }));

    const insertChain = chainMock({ error: null });
    mockFrom.mockReturnValueOnce(insertChain);

    const req = makeHealthSnapshotRequest('Bearer test-secret-123');
    const res = await GET(req);

    expect(res.status).toBe(200);

    expect(insertChain.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        total_members: 0,
        active_members: 0,
        with_fid: 0,
        total_sessions: 0,
        total_respect: 0,
      }),
      { onConflict: 'snapshot_date' },
    );
  });

  it("uses today's date in YYYY-MM-DD format for snapshot_date", async () => {
    const membersChain = chainMock({ count: 10, error: null });
    const activeMembersChain = chainMock({ count: 5, error: null });
    const withFidChain = chainMock({ count: 8, error: null });
    const sessionsChain = chainMock({ count: 20, error: null });

    mockFrom
      .mockReturnValueOnce(membersChain)
      .mockReturnValueOnce(activeMembersChain)
      .mockReturnValueOnce(withFidChain)
      .mockReturnValueOnce(sessionsChain);

    mockRpc.mockReturnValueOnce(rpcMock({ data: 100, error: null }));

    const insertChain = chainMock({ error: null });
    mockFrom.mockReturnValueOnce(insertChain);

    const req = makeHealthSnapshotRequest('Bearer test-secret-123');
    await GET(req);

    const today = new Date().toISOString().split('T')[0];
    expect(insertChain.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        snapshot_date: today,
      }),
      { onConflict: 'snapshot_date' },
    );
  });

  // ── Query verification tests ─────────────────────────────────────────────

  it('queries total members with correct parameters', async () => {
    const membersChain = chainMock({ count: 100, error: null });
    const activeMembersChain = chainMock({ count: 45, error: null });
    const withFidChain = chainMock({ count: 78, error: null });
    const sessionsChain = chainMock({ count: 320, error: null });

    mockFrom
      .mockReturnValueOnce(membersChain)
      .mockReturnValueOnce(activeMembersChain)
      .mockReturnValueOnce(withFidChain)
      .mockReturnValueOnce(sessionsChain);

    mockRpc.mockReturnValueOnce(rpcMock({ data: 5420, error: null }));

    const insertChain = chainMock({ error: null });
    mockFrom.mockReturnValueOnce(insertChain);

    const req = makeHealthSnapshotRequest('Bearer test-secret-123');
    await GET(req);

    // First query: total members
    expect(mockFrom).toHaveBeenNthCalledWith(1, 'respect_members');
    expect(membersChain.select).toHaveBeenCalledWith('*', { count: 'exact', head: true });
  });

  it('queries active members with fractal_count > 0', async () => {
    const membersChain = chainMock({ count: 100, error: null });
    const activeMembersChain = chainMock({ count: 45, error: null });
    const withFidChain = chainMock({ count: 78, error: null });
    const sessionsChain = chainMock({ count: 320, error: null });

    mockFrom
      .mockReturnValueOnce(membersChain)
      .mockReturnValueOnce(activeMembersChain)
      .mockReturnValueOnce(withFidChain)
      .mockReturnValueOnce(sessionsChain);

    mockRpc.mockReturnValueOnce(rpcMock({ data: 5420, error: null }));

    const insertChain = chainMock({ error: null });
    mockFrom.mockReturnValueOnce(insertChain);

    const req = makeHealthSnapshotRequest('Bearer test-secret-123');
    await GET(req);

    // Second query: active members
    expect(mockFrom).toHaveBeenNthCalledWith(2, 'respect_members');
    expect(activeMembersChain.gt).toHaveBeenCalledWith('fractal_count', 0);
  });

  it('queries members with fid not null', async () => {
    const membersChain = chainMock({ count: 100, error: null });
    const activeMembersChain = chainMock({ count: 45, error: null });
    const withFidChain = chainMock({ count: 78, error: null });
    const sessionsChain = chainMock({ count: 320, error: null });

    mockFrom
      .mockReturnValueOnce(membersChain)
      .mockReturnValueOnce(activeMembersChain)
      .mockReturnValueOnce(withFidChain)
      .mockReturnValueOnce(sessionsChain);

    mockRpc.mockReturnValueOnce(rpcMock({ data: 5420, error: null }));

    const insertChain = chainMock({ error: null });
    mockFrom.mockReturnValueOnce(insertChain);

    const req = makeHealthSnapshotRequest('Bearer test-secret-123');
    await GET(req);

    // Third query: members with fid
    expect(mockFrom).toHaveBeenNthCalledWith(3, 'respect_members');
    expect(withFidChain.not).toHaveBeenCalledWith('fid', 'is', null);
  });

  it('calls rpc sum_total_respect', async () => {
    const membersChain = chainMock({ count: 100, error: null });
    const activeMembersChain = chainMock({ count: 45, error: null });
    const withFidChain = chainMock({ count: 78, error: null });
    const sessionsChain = chainMock({ count: 320, error: null });

    mockFrom
      .mockReturnValueOnce(membersChain)
      .mockReturnValueOnce(activeMembersChain)
      .mockReturnValueOnce(withFidChain)
      .mockReturnValueOnce(sessionsChain);

    mockRpc.mockReturnValueOnce(rpcMock({ data: 5420, error: null }));

    const insertChain = chainMock({ error: null });
    mockFrom.mockReturnValueOnce(insertChain);

    const req = makeHealthSnapshotRequest('Bearer test-secret-123');
    await GET(req);

    expect(mockRpc).toHaveBeenCalledWith('sum_total_respect');
  });

  // ── Error path tests ─────────────────────────────────────────────────────

  it('returns 500 when health_snapshots insert fails', async () => {
    const membersChain = chainMock({ count: 100, error: null });
    const activeMembersChain = chainMock({ count: 45, error: null });
    const withFidChain = chainMock({ count: 78, error: null });
    const sessionsChain = chainMock({ count: 320, error: null });

    mockFrom
      .mockReturnValueOnce(membersChain)
      .mockReturnValueOnce(activeMembersChain)
      .mockReturnValueOnce(withFidChain)
      .mockReturnValueOnce(sessionsChain);

    mockRpc.mockReturnValueOnce(rpcMock({ data: 5420, error: null }));

    const insertError = new Error('Unique constraint failed');
    const insertChain = chainMock({ error: insertError });
    mockFrom.mockReturnValueOnce(insertChain);

    const req = makeHealthSnapshotRequest('Bearer test-secret-123');
    const res = await GET(req);

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toContain('Failed to insert health snapshot');
  });

  it('returns 500 when total_members query fails', async () => {
    const failedChain = chainMock({ error: new Error('db error') });
    mockFrom.mockReturnValueOnce(failedChain);

    const req = makeHealthSnapshotRequest('Bearer test-secret-123');
    const res = await GET(req);

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('Internal server error');
  });

  it('returns 500 when active_members query fails', async () => {
    const membersChain = chainMock({ count: 100, error: null });
    const failedChain = chainMock({ error: new Error('db error') });

    mockFrom.mockReturnValueOnce(membersChain).mockReturnValueOnce(failedChain);

    const req = makeHealthSnapshotRequest('Bearer test-secret-123');
    const res = await GET(req);

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('Internal server error');
  });

  it('returns 500 when with_fid query fails', async () => {
    const membersChain = chainMock({ count: 100, error: null });
    const activeMembersChain = chainMock({ count: 45, error: null });
    const failedChain = chainMock({ error: new Error('db error') });

    mockFrom
      .mockReturnValueOnce(membersChain)
      .mockReturnValueOnce(activeMembersChain)
      .mockReturnValueOnce(failedChain);

    const req = makeHealthSnapshotRequest('Bearer test-secret-123');
    const res = await GET(req);

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('Internal server error');
  });

  it('returns 500 when sessions query fails', async () => {
    const membersChain = chainMock({ count: 100, error: null });
    const activeMembersChain = chainMock({ count: 45, error: null });
    const withFidChain = chainMock({ count: 78, error: null });
    const failedChain = chainMock({ error: new Error('db error') });

    mockFrom
      .mockReturnValueOnce(membersChain)
      .mockReturnValueOnce(activeMembersChain)
      .mockReturnValueOnce(withFidChain)
      .mockReturnValueOnce(failedChain);

    const req = makeHealthSnapshotRequest('Bearer test-secret-123');
    const res = await GET(req);

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('Internal server error');
  });

  it('returns 500 when rpc sum_total_respect fails', async () => {
    const membersChain = chainMock({ count: 100, error: null });
    const activeMembersChain = chainMock({ count: 45, error: null });
    const withFidChain = chainMock({ count: 78, error: null });
    const sessionsChain = chainMock({ count: 320, error: null });

    mockFrom
      .mockReturnValueOnce(membersChain)
      .mockReturnValueOnce(activeMembersChain)
      .mockReturnValueOnce(withFidChain)
      .mockReturnValueOnce(sessionsChain);

    mockRpc.mockReturnValueOnce(rpcMock({ error: new Error('rpc error') }));

    const req = makeHealthSnapshotRequest('Bearer test-secret-123');
    const res = await GET(req);

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('Internal server error');
  });

  it('returns 500 on unexpected thrown exception', async () => {
    mockFrom.mockImplementationOnce(() => {
      throw new Error('Unexpected exception');
    });

    const req = makeHealthSnapshotRequest('Bearer test-secret-123');
    const res = await GET(req);

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('Internal server error');
  });

  // ── Edge cases ───────────────────────────────────────────────────────────

  it('handles large metric values', async () => {
    const membersChain = chainMock({ count: 999999, error: null });
    const activeMembersChain = chainMock({ count: 888888, error: null });
    const withFidChain = chainMock({ count: 777777, error: null });
    const sessionsChain = chainMock({ count: 666666, error: null });

    mockFrom
      .mockReturnValueOnce(membersChain)
      .mockReturnValueOnce(activeMembersChain)
      .mockReturnValueOnce(withFidChain)
      .mockReturnValueOnce(sessionsChain);

    mockRpc.mockReturnValueOnce(rpcMock({ data: 123456789, error: null }));

    const insertChain = chainMock({ error: null });
    mockFrom.mockReturnValueOnce(insertChain);

    const req = makeHealthSnapshotRequest('Bearer test-secret-123');
    const res = await GET(req);

    expect(res.status).toBe(200);
    expect(insertChain.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        total_members: 999999,
        active_members: 888888,
        with_fid: 777777,
        total_sessions: 666666,
        total_respect: 123456789,
      }),
      { onConflict: 'snapshot_date' },
    );
  });

  it('handles zero metrics (community is idle)', async () => {
    const membersChain = chainMock({ count: 0, error: null });
    const activeMembersChain = chainMock({ count: 0, error: null });
    const withFidChain = chainMock({ count: 0, error: null });
    const sessionsChain = chainMock({ count: 0, error: null });

    mockFrom
      .mockReturnValueOnce(membersChain)
      .mockReturnValueOnce(activeMembersChain)
      .mockReturnValueOnce(withFidChain)
      .mockReturnValueOnce(sessionsChain);

    mockRpc.mockReturnValueOnce(rpcMock({ data: 0, error: null }));

    const insertChain = chainMock({ error: null });
    mockFrom.mockReturnValueOnce(insertChain);

    const req = makeHealthSnapshotRequest('Bearer test-secret-123');
    const res = await GET(req);

    expect(res.status).toBe(200);
    expect(insertChain.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        total_members: 0,
        active_members: 0,
        with_fid: 0,
        total_sessions: 0,
        total_respect: 0,
      }),
      { onConflict: 'snapshot_date' },
    );
  });

  it('executes all queries in parallel using Promise.all', async () => {
    const membersChain = chainMock({ count: 100, error: null });
    const activeMembersChain = chainMock({ count: 45, error: null });
    const withFidChain = chainMock({ count: 78, error: null });
    const sessionsChain = chainMock({ count: 320, error: null });

    mockFrom
      .mockReturnValueOnce(membersChain)
      .mockReturnValueOnce(activeMembersChain)
      .mockReturnValueOnce(withFidChain)
      .mockReturnValueOnce(sessionsChain);

    mockRpc.mockReturnValueOnce(rpcMock({ data: 5420, error: null }));

    const insertChain = chainMock({ error: null });
    mockFrom.mockReturnValueOnce(insertChain);

    const req = makeHealthSnapshotRequest('Bearer test-secret-123');
    const res = await GET(req);

    // All 4 queries should be initiated before awaiting
    expect(res.status).toBe(200);
    expect(mockFrom).toHaveBeenCalledTimes(5); // 4 queries + 1 upsert
    expect(mockRpc).toHaveBeenCalledTimes(1);
  });
});
