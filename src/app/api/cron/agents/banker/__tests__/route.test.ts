import { beforeEach, describe, expect, it, vi } from 'vitest';
import { makeRequest } from '@/test-utils/api-helpers';

// ── Hoisted mocks ────────────────────────────────────────────────────────────
const { mockRunBanker } = vi.hoisted(() => ({
  mockRunBanker: vi.fn(),
}));

vi.mock('@/lib/agents/banker', () => ({
  runBanker: mockRunBanker,
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

import { GET } from '@/app/api/cron/agents/banker/route';

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Build a NextRequest with an optional Authorization header.
 */
function makeBankerRequest(authHeader?: string) {
  const options: RequestInit = {};
  if (authHeader) {
    options.headers = {
      authorization: authHeader,
    };
  }
  return makeRequest('/api/cron/agents/banker', options);
}

describe('GET /api/cron/agents/banker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Authorization tests ──────────────────────────────────────────────────

  it('returns 401 when authorization header is missing', async () => {
    const req = makeBankerRequest();
    const res = await GET(req);

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Unauthorized');
  });

  it('returns 401 when authorization header is incorrect', async () => {
    const req = makeBankerRequest('Bearer wrong-secret');
    const res = await GET(req);

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Unauthorized');
  });

  it('returns 401 when authorization header has wrong scheme', async () => {
    const req = makeBankerRequest('Basic test-secret-123');
    const res = await GET(req);

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Unauthorized');
  });

  it('returns 500 when CRON_SECRET is not configured', async () => {
    // Temporarily remove CRON_SECRET from env
    const original = process.env.CRON_SECRET;
    delete process.env.CRON_SECRET;

    const req = makeBankerRequest('Bearer test-secret-123');
    const res = await GET(req);

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('CRON_SECRET not configured');

    // Restore
    process.env.CRON_SECRET = original;
  });

  // ── Success path tests ───────────────────────────────────────────────────

  it('returns success when authorized with correct Bearer token', async () => {
    mockRunBanker.mockResolvedValueOnce({
      action: 'buy_zabal',
      status: 'success',
      details: 'Bought 10 ZABAL',
    });

    const req = makeBankerRequest('Bearer test-secret-123');
    const res = await GET(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.agent).toBe('BANKER');
    expect(body.action).toBe('buy_zabal');
    expect(body.status).toBe('success');
    expect(body.details).toBe('Bought 10 ZABAL');
    expect(body.timestamp).toBeDefined();
  });

  it('calls runBanker when authorized', async () => {
    mockRunBanker.mockResolvedValueOnce({
      action: 'buy_zabal',
      status: 'success',
      details: 'Agent executed',
    });

    const req = makeBankerRequest('Bearer test-secret-123');
    await GET(req);

    expect(mockRunBanker).toHaveBeenCalledOnce();
    expect(mockRunBanker).toHaveBeenCalledWith();
  });

  it('includes timestamp in successful response', async () => {
    const before = new Date().toISOString();
    mockRunBanker.mockResolvedValueOnce({
      action: 'buy_zabal',
      status: 'success',
      details: 'Executed',
    });

    const req = makeBankerRequest('Bearer test-secret-123');
    const res = await GET(req);
    const body = await res.json();
    const after = new Date().toISOString();

    expect(body.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/);
    expect(body.timestamp >= before && body.timestamp <= after).toBe(true);
  });

  it('returns status skipped when agent is disabled', async () => {
    mockRunBanker.mockResolvedValueOnce({
      action: 'buy_zabal',
      status: 'skipped',
      details: 'Agent disabled',
    });

    const req = makeBankerRequest('Bearer test-secret-123');
    const res = await GET(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.agent).toBe('BANKER');
    expect(body.status).toBe('skipped');
  });

  // ── Error path tests ─────────────────────────────────────────────────────

  it('returns 500 when runBanker throws an error', async () => {
    mockRunBanker.mockRejectedValueOnce(new Error('Wallet disconnected'));

    const req = makeBankerRequest('Bearer test-secret-123');
    const res = await GET(req);

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.agent).toBe('BANKER');
    expect(body.action).toBe('buy_zabal');
    expect(body.status).toBe('failed');
    expect(body.details).toContain('Wallet disconnected');
  });

  it('returns 500 with failed status when runBanker throws', async () => {
    mockRunBanker.mockRejectedValueOnce(new Error('Network timeout'));

    const req = makeBankerRequest('Bearer test-secret-123');
    const res = await GET(req);

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.status).toBe('failed');
    expect(body.details).toContain('Network timeout');
  });

  it('handles non-Error thrown values gracefully', async () => {
    mockRunBanker.mockRejectedValueOnce('unexpected string error');

    const req = makeBankerRequest('Bearer test-secret-123');
    const res = await GET(req);

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.status).toBe('failed');
    expect(body.details).toContain('unexpected string error');
  });

  it('includes timestamp in error response', async () => {
    const before = new Date().toISOString();
    mockRunBanker.mockRejectedValueOnce(new Error('Test error'));

    const req = makeBankerRequest('Bearer test-secret-123');
    const res = await GET(req);
    const body = await res.json();
    const after = new Date().toISOString();

    expect(body.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/);
    expect(body.timestamp >= before && body.timestamp <= after).toBe(true);
  });

  // ── Edge cases ───────────────────────────────────────────────────────────

  it('handles multiple sequential requests independently', async () => {
    mockRunBanker
      .mockResolvedValueOnce({
        action: 'buy_zabal',
        status: 'success',
        details: 'First run',
      })
      .mockResolvedValueOnce({
        action: 'buy_zabal',
        status: 'skipped',
        details: 'Second run disabled',
      });

    const req1 = makeBankerRequest('Bearer test-secret-123');
    const res1 = await GET(req1);
    const body1 = await res1.json();

    const req2 = makeBankerRequest('Bearer test-secret-123');
    const res2 = await GET(req2);
    const body2 = await res2.json();

    expect(body1.status).toBe('success');
    expect(body2.status).toBe('skipped');
    expect(mockRunBanker).toHaveBeenCalledTimes(2);
  });

  it('preserves agent result action in response', async () => {
    mockRunBanker.mockResolvedValueOnce({
      action: 'report',
      status: 'skipped',
      details: 'No budget',
    });

    const req = makeBankerRequest('Bearer test-secret-123');
    const res = await GET(req);
    const body = await res.json();

    expect(body.action).toBe('report');
  });

  it('spreads all runBanker result fields into response', async () => {
    mockRunBanker.mockResolvedValueOnce({
      action: 'buy_zabal',
      status: 'success',
      details: 'Executed with metadata',
    });

    const req = makeBankerRequest('Bearer test-secret-123');
    const res = await GET(req);
    const body = await res.json();

    expect(body).toMatchObject({
      agent: 'BANKER',
      action: 'buy_zabal',
      status: 'success',
      details: 'Executed with metadata',
    });
    expect(body.timestamp).toBeDefined();
  });
});
