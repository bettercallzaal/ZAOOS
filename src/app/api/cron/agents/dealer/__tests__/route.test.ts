import { beforeEach, describe, expect, it, vi } from 'vitest';
import { makeRequest } from '@/test-utils/api-helpers';

// ── Hoisted mocks ────────────────────────────────────────────────────────────
const { mockRunDealer } = vi.hoisted(() => ({
  mockRunDealer: vi.fn(),
}));

const { mockLogger } = vi.hoisted(() => ({
  mockLogger: {
    error: vi.fn(),
  },
}));

vi.mock('@/lib/agents/dealer', () => ({
  runDealer: mockRunDealer,
}));

vi.mock('@/lib/logger', () => ({
  logger: mockLogger,
}));

// Mock env var access
vi.stubGlobal('process', {
  env: {
    CRON_SECRET: 'test-secret-123',
  },
});

import { GET } from '@/app/api/cron/agents/dealer/route';

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Build a NextRequest with an optional Authorization header.
 */
function makeDealerRequest(authHeader?: string) {
  const options: RequestInit = {};
  if (authHeader) {
    options.headers = {
      authorization: authHeader,
    };
  }
  return makeRequest('/api/cron/agents/dealer', options);
}

describe('GET /api/cron/agents/dealer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Authorization tests ──────────────────────────────────────────────────

  it('returns 401 when authorization header is missing', async () => {
    const req = makeDealerRequest();
    const res = await GET(req);

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Unauthorized');
    expect(mockRunDealer).not.toHaveBeenCalled();
  });

  it('returns 401 when authorization header is incorrect', async () => {
    const req = makeDealerRequest('Bearer wrong-secret');
    const res = await GET(req);

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Unauthorized');
    expect(mockRunDealer).not.toHaveBeenCalled();
  });

  it('returns 401 when authorization header has wrong scheme', async () => {
    const req = makeDealerRequest('Basic test-secret-123');
    const res = await GET(req);

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Unauthorized');
    expect(mockRunDealer).not.toHaveBeenCalled();
  });

  it('returns 401 when authorization header is empty Bearer', async () => {
    const req = makeDealerRequest('Bearer ');
    const res = await GET(req);

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Unauthorized');
    expect(mockRunDealer).not.toHaveBeenCalled();
  });

  it('returns 500 when CRON_SECRET is not configured', async () => {
    // Temporarily remove CRON_SECRET from env
    const original = process.env.CRON_SECRET;
    delete process.env.CRON_SECRET;

    const req = makeDealerRequest('Bearer test-secret-123');
    const res = await GET(req);

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('CRON_SECRET not configured');
    expect(mockRunDealer).not.toHaveBeenCalled();

    // Restore
    process.env.CRON_SECRET = original;
  });

  // ── Success path tests ───────────────────────────────────────────────────

  it('returns 200 when authorized with correct Bearer token', async () => {
    mockRunDealer.mockResolvedValue({
      action: 'buy_zabal',
      status: 'success',
      details: 'Purchased 100 ZABAL tokens',
    });

    const req = makeDealerRequest('Bearer test-secret-123');
    const res = await GET(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.agent).toBe('DEALER');
    expect(body.action).toBe('buy_zabal');
    expect(body.status).toBe('success');
    expect(body.timestamp).toBeDefined();
    expect(mockRunDealer).toHaveBeenCalledTimes(1);
  });

  it('calls runDealer when auth succeeds', async () => {
    mockRunDealer.mockResolvedValue({
      action: 'buy_zabal',
      status: 'success',
    });

    const req = makeDealerRequest('Bearer test-secret-123');
    await GET(req);

    expect(mockRunDealer).toHaveBeenCalledTimes(1);
  });

  it('includes runDealer result in response', async () => {
    const dealerResult = {
      action: 'buy_zabal',
      status: 'success',
      details: 'Executed 5 trades',
      volume: 500,
    };
    mockRunDealer.mockResolvedValue(dealerResult);

    const req = makeDealerRequest('Bearer test-secret-123');
    const res = await GET(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toMatchObject(dealerResult);
    expect(body.agent).toBe('DEALER');
    expect(body.timestamp).toBeDefined();
  });

  it('includes timestamp in response', async () => {
    mockRunDealer.mockResolvedValue({
      action: 'buy_zabal',
      status: 'success',
    });

    const req = makeDealerRequest('Bearer test-secret-123');
    const res = await GET(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.timestamp).toBeDefined();
    // Verify it's a valid ISO string
    expect(() => new Date(body.timestamp)).not.toThrow();
  });

  // ── Error path tests ─────────────────────────────────────────────────────

  it('returns 500 when runDealer throws an Error', async () => {
    const error = new Error('Agent execution failed');
    mockRunDealer.mockRejectedValue(error);

    const req = makeDealerRequest('Bearer test-secret-123');
    const res = await GET(req);

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.agent).toBe('DEALER');
    expect(body.action).toBe('buy_zabal');
    expect(body.status).toBe('failed');
    expect(body.details).toContain('Agent execution failed');
    expect(body.timestamp).toBeDefined();
    expect(mockLogger.error).toHaveBeenCalledWith(expect.stringContaining('[DEALER cron]'));
  });

  it('returns 500 when runDealer throws a non-Error value', async () => {
    mockRunDealer.mockRejectedValue('Unexpected string error');

    const req = makeDealerRequest('Bearer test-secret-123');
    const res = await GET(req);

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.status).toBe('failed');
    expect(body.details).toContain('Unexpected string error');
  });

  it('logs error when runDealer throws', async () => {
    const error = new Error('Network timeout');
    mockRunDealer.mockRejectedValue(error);

    const req = makeDealerRequest('Bearer test-secret-123');
    await GET(req);

    expect(mockLogger.error).toHaveBeenCalledWith(expect.stringContaining('[DEALER cron]'));
  });

  it('returns error response shape on agent failure', async () => {
    const error = new Error('Buy failed');
    mockRunDealer.mockRejectedValue(error);

    const req = makeDealerRequest('Bearer test-secret-123');
    const res = await GET(req);

    const body = await res.json();
    expect(body).toEqual({
      agent: 'DEALER',
      action: 'buy_zabal',
      status: 'failed',
      details: expect.stringContaining('Buy failed'),
      timestamp: expect.any(String),
    });
  });

  it('includes timestamp in error response', async () => {
    mockRunDealer.mockRejectedValue(new Error('Test error'));

    const req = makeDealerRequest('Bearer test-secret-123');
    const res = await GET(req);

    const body = await res.json();
    expect(body.timestamp).toBeDefined();
    expect(() => new Date(body.timestamp)).not.toThrow();
  });

  // ── Edge cases ───────────────────────────────────────────────────────────

  it('handles runDealer with empty result object', async () => {
    mockRunDealer.mockResolvedValue({});

    const req = makeDealerRequest('Bearer test-secret-123');
    const res = await GET(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.agent).toBe('DEALER');
    expect(body.timestamp).toBeDefined();
  });

  it('handles runDealer with null values in result', async () => {
    mockRunDealer.mockResolvedValue({
      action: 'buy_zabal',
      status: null,
      details: null,
    });

    const req = makeDealerRequest('Bearer test-secret-123');
    const res = await GET(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBeNull();
    expect(body.details).toBeNull();
  });

  it('does not call runDealer when CRON_SECRET is missing', async () => {
    const original = process.env.CRON_SECRET;
    delete process.env.CRON_SECRET;

    const req = makeDealerRequest('Bearer test-secret-123');
    await GET(req);

    expect(mockRunDealer).not.toHaveBeenCalled();
    process.env.CRON_SECRET = original;
  });

  it('does not call runDealer when auth header is wrong', async () => {
    const req = makeDealerRequest('Bearer wrong');
    await GET(req);

    expect(mockRunDealer).not.toHaveBeenCalled();
  });

  it('extracts Bearer token correctly with multiple spaces in result', async () => {
    mockRunDealer.mockResolvedValue({
      action: 'buy_zabal',
      status: 'success',
    });

    const req = makeDealerRequest('Bearer test-secret-123');
    const res = await GET(req);

    // Should succeed (Bearer token was extracted and matched correctly)
    expect(res.status).toBe(200);
    expect(mockRunDealer).toHaveBeenCalled();
  });

  it('response JSON is valid', async () => {
    mockRunDealer.mockResolvedValue({
      action: 'buy_zabal',
      status: 'success',
    });

    const req = makeDealerRequest('Bearer test-secret-123');
    const res = await GET(req);

    expect(res.headers.get('content-type')).toContain('application/json');
    const body = await res.json();
    expect(typeof body).toBe('object');
    expect(body).not.toBeNull();
  });

  it('error response JSON is valid', async () => {
    mockRunDealer.mockRejectedValue(new Error('Test'));

    const req = makeDealerRequest('Bearer test-secret-123');
    const res = await GET(req);

    expect(res.headers.get('content-type')).toContain('application/json');
    const body = await res.json();
    expect(typeof body).toBe('object');
    expect(body).not.toBeNull();
  });
});
