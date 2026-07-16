import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  makePostRequest,
  mockAdminSession,
  mockAuthenticatedSession,
  mockUnauthenticatedSession,
} from '@/test-utils/api-helpers';

// ── Hoisted mocks ────────────────────────────────────────────────────────────
const { mockGetSessionData, mockFrom, mockLogger } = vi.hoisted(() => ({
  mockGetSessionData: vi.fn(),
  mockFrom: vi.fn(),
  mockLogger: {
    error: vi.fn(),
  },
}));

vi.mock('@/lib/auth/session', () => ({
  getSessionData: () => mockGetSessionData(),
}));

vi.mock('@/lib/db/supabase', () => ({
  supabaseAdmin: { from: mockFrom },
}));

vi.mock('@/lib/logger', () => ({
  logger: mockLogger,
}));

import { GET, PATCH } from '../route';

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Build a Supabase query-chain mock that resolves to result.
 * Every chained method returns the chain itself for chaining.
 * Terminal .single() resolves the query (for awaited direct chains).
 * Includes all methods used by agents route: select, update, eq, order, limit.
 */
function chainMock(result: { data?: unknown; error?: unknown; count?: number | null }) {
  const chain: Record<string, unknown> = {};
  const chainable = ['select', 'update', 'eq', 'order', 'limit'];

  for (const method of chainable) {
    chain[method] = vi.fn().mockReturnValue(chain);
  }

  // Terminal — resolves the query
  chain.single = vi.fn().mockResolvedValue(result);

  // Allow the chain to be awaited directly (for queries without .single())
  // biome-ignore lint/suspicious/noThenProperty: intentional thenable — mocks an awaitable Supabase query chain
  chain.then = vi.fn((resolve: (val: unknown) => void) => resolve(result));

  return chain;
}

/**
 * Create a mock queue that returns chains in sequence for parallel queries.
 * Useful for testing Promise.allSettled() with multiple queries that need different results.
 */
function createChainQueue(
  results: Array<{ data?: unknown; error?: unknown; count?: number | null }>,
) {
  let callIndex = 0;
  return {
    mockFn: vi.fn(() => {
      if (callIndex >= results.length) {
        throw new Error(`Chain queue exhausted at call ${callIndex}`);
      }
      return chainMock(results[callIndex++]);
    }),
    getCallCount: () => callIndex,
  };
}

describe('GET /api/admin/agents', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Authentication tests ──────────────────────────────────────────────────

  it('returns 401 when not authenticated (no session)', async () => {
    mockGetSessionData.mockResolvedValue(mockUnauthenticatedSession());
    const res = await GET();
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Unauthorized');
  });

  it('returns 403 when authenticated but not admin', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ isAdmin: false }));
    const res = await GET();
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toBe('Admin access required');
  });

  // ── Success path: list agents and recent events ──────────────────────────

  it('passes authentication when isAdmin is true and fetches configs + events', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());

    const queue = createChainQueue([
      { data: [], error: null }, // agent_config
      { data: [], error: null }, // agent_events
    ]);

    mockFrom.mockImplementation(queue.mockFn);

    const res = await GET();
    expect(res.status).toBe(200);
    expect(queue.getCallCount()).toBe(2);
  });

  it('returns agents and recentEvents on success', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());

    const agentConfigs = [
      {
        name: 'VAULT',
        trading_enabled: true,
        max_daily_spend: 1000,
        enabled: true,
      },
      {
        name: 'BANKER',
        trading_enabled: false,
        max_daily_spend: 500,
        enabled: true,
      },
    ];

    const recentEvents = [
      {
        agent_name: 'VAULT',
        event_type: 'trade_executed',
        created_at: '2026-07-16T10:00:00Z',
      },
      {
        agent_name: 'BANKER',
        event_type: 'trade_failed',
        created_at: '2026-07-16T09:55:00Z',
      },
    ];

    const queue = createChainQueue([
      { data: agentConfigs, error: null },
      { data: recentEvents, error: null },
    ]);

    mockFrom.mockImplementation(queue.mockFn);

    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.agents).toHaveLength(2);
    expect(body.agents[0].name).toBe('VAULT');
    expect(body.recentEvents).toHaveLength(2);
    expect(body.recentEvents[0].event_type).toBe('trade_executed');
  });

  it('handles empty agents list', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());

    const queue = createChainQueue([
      { data: [], error: null }, // no agents
      { data: [], error: null }, // no events
    ]);

    mockFrom.mockImplementation(queue.mockFn);

    const res = await GET();
    const body = await res.json();

    expect(body.agents).toEqual([]);
    expect(body.recentEvents).toEqual([]);
  });

  it('orders agent configs by name', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());

    const chain1 = chainMock({ data: [], error: null });
    const chain2 = chainMock({ data: [], error: null });

    let callIndex = 0;
    mockFrom.mockImplementation(() => {
      const chains = [chain1, chain2];
      return chains[callIndex++];
    });

    await GET();

    // Verify order('name') was called on the first chain
    expect(chain1.order).toHaveBeenCalledWith('name');
  });

  it('limits agent events to 50', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());

    const chain1 = chainMock({ data: [], error: null });
    const chain2 = chainMock({ data: [], error: null });

    let callIndex = 0;
    mockFrom.mockImplementation(() => {
      const chains = [chain1, chain2];
      return chains[callIndex++];
    });

    await GET();

    // Verify limit(50) was called on the second chain
    expect(chain2.limit).toHaveBeenCalledWith(50);
  });

  // ── Error path: rejected Promise.allSettled ──────────────────────────────

  it('returns 500 when agent_config query is rejected via Promise.allSettled', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());

    const chain1 = chainMock({ data: [], error: null });
    // Override .then to throw for agent_config
    // biome-ignore lint/suspicious/noThenProperty: intentional thenable — mocks an awaitable Supabase query chain
    chain1.then = vi.fn(() => {
      throw new Error('DB connection lost');
    });

    const chain2 = chainMock({ data: [], error: null });

    let callIndex = 0;
    mockFrom.mockImplementation(() => {
      const chains = [chain1, chain2];
      return chains[callIndex++];
    });

    const res = await GET();
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('Failed to fetch agent configs');
  });

  it('returns 500 when agent_events query is rejected via Promise.allSettled', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());

    const chain1 = chainMock({ data: [], error: null });
    const chain2 = chainMock({ data: [], error: null });
    // Override .then to throw for agent_events
    // biome-ignore lint/suspicious/noThenProperty: intentional thenable — mocks an awaitable Supabase query chain
    chain2.then = vi.fn(() => {
      throw new Error('DB connection lost');
    });

    let callIndex = 0;
    mockFrom.mockImplementation(() => {
      const chains = [chain1, chain2];
      return chains[callIndex++];
    });

    const res = await GET();
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('Failed to fetch agent events');
  });

  // ── Error path: Supabase error in value.error ────────────────────────────

  it('returns 500 when agent_config returns error in value.error', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());

    const queue = createChainQueue([
      { data: null, error: { message: 'permission denied' } }, // agent_config error
      { data: [], error: null }, // agent_events succeeds
    ]);

    mockFrom.mockImplementation(queue.mockFn);

    const res = await GET();
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('Failed to fetch agent configs');
  });

  it('returns 500 when agent_events returns error in value.error', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());

    const queue = createChainQueue([
      { data: [], error: null }, // agent_config succeeds
      { data: null, error: { message: 'table not found' } }, // agent_events error
    ]);

    mockFrom.mockImplementation(queue.mockFn);

    const res = await GET();
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('Failed to fetch agent events');
  });

  it('logs error to logger.error on agent_config failure', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());

    const queue = createChainQueue([
      { data: null, error: { message: 'db error' } },
      { data: [], error: null },
    ]);

    mockFrom.mockImplementation(queue.mockFn);

    await GET();

    expect(mockLogger.error).toHaveBeenCalledWith(
      'GET /api/admin/agents: agent_config returned error:',
      expect.any(Object),
    );
  });

  it('logs error to logger.error on agent_events failure', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());

    const queue = createChainQueue([
      { data: [], error: null },
      { data: null, error: { message: 'db error' } },
    ]);

    mockFrom.mockImplementation(queue.mockFn);

    await GET();

    expect(mockLogger.error).toHaveBeenCalledWith(
      'GET /api/admin/agents: agent_events returned error:',
      expect.any(Object),
    );
  });

  it('returns response with exact shape on success', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());

    const queue = createChainQueue([
      { data: [], error: null },
      { data: [], error: null },
    ]);

    mockFrom.mockImplementation(queue.mockFn);

    const res = await GET();
    const body = await res.json();

    expect(Object.keys(body).sort()).toEqual(['agents', 'recentEvents'].sort());
    expect(Array.isArray(body.agents)).toBe(true);
    expect(Array.isArray(body.recentEvents)).toBe(true);
  });
});

describe('PATCH /api/admin/agents', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Authentication tests ──────────────────────────────────────────────────

  it('returns 401 when not authenticated (no session)', async () => {
    mockGetSessionData.mockResolvedValue(mockUnauthenticatedSession());
    const req = makePostRequest('/api/admin/agents', { name: 'VAULT' });
    const res = await PATCH(req);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Unauthorized');
  });

  it('returns 403 when authenticated but not admin', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ isAdmin: false }));
    const req = makePostRequest('/api/admin/agents', { name: 'VAULT' });
    const res = await PATCH(req);
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toBe('Admin access required');
  });

  // ── Input validation tests ────────────────────────────────────────────────

  it('returns 400 for missing name field', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());
    const req = makePostRequest('/api/admin/agents', {});
    const res = await PATCH(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid input');
    expect(body.details).toBeDefined();
  });

  it('returns 400 for empty name string', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());
    const req = makePostRequest('/api/admin/agents', { name: '' });
    const res = await PATCH(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid input');
    expect(body.details).toBeDefined();
  });

  it('returns 400 for non-string name', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());
    const req = makePostRequest('/api/admin/agents', { name: 123 });
    const res = await PATCH(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid input');
  });

  it('returns 400 for non-boolean trading_enabled', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());
    const req = makePostRequest('/api/admin/agents', { name: 'VAULT', trading_enabled: 'yes' });
    const res = await PATCH(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid input');
  });

  it('returns 400 for negative max_daily_spend', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());
    const req = makePostRequest('/api/admin/agents', {
      name: 'VAULT',
      max_daily_spend: -100,
    });
    const res = await PATCH(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid input');
  });

  it('returns 400 for zero max_daily_spend (must be positive)', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());
    const req = makePostRequest('/api/admin/agents', {
      name: 'VAULT',
      max_daily_spend: 0,
    });
    const res = await PATCH(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid input');
  });

  it('returns 400 for non-number max_daily_spend', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());
    const req = makePostRequest('/api/admin/agents', {
      name: 'VAULT',
      max_daily_spend: 'five-hundred',
    });
    const res = await PATCH(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid input');
  });

  it('returns 400 for non-boolean enabled', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());
    const req = makePostRequest('/api/admin/agents', { name: 'VAULT', enabled: 'true' });
    const res = await PATCH(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid input');
  });

  it('accepts valid optional fields (trading_enabled, max_daily_spend, enabled)', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());

    const chain = chainMock({ data: { name: 'VAULT' }, error: null });
    mockFrom.mockReturnValue(chain);

    const req = makePostRequest('/api/admin/agents', {
      name: 'VAULT',
      trading_enabled: true,
      max_daily_spend: 2000,
      enabled: false,
    });

    const res = await PATCH(req);
    expect(res.status).toBe(200);
  });

  // ── Success path: agent update ──────────────────────────────────────────

  it('updates agent with only name and returns updated config', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());

    const updatedAgent = {
      name: 'VAULT',
      trading_enabled: true,
      max_daily_spend: 1000,
      enabled: true,
      updated_at: '2026-07-16T10:00:00Z',
    };

    const chain = chainMock({ data: updatedAgent, error: null });
    mockFrom.mockReturnValue(chain);

    const req = makePostRequest('/api/admin/agents', { name: 'VAULT' });
    const res = await PATCH(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.agent).toEqual(updatedAgent);
  });

  it('updates agent with trading_enabled flag', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());

    const chain = chainMock({
      data: {
        name: 'BANKER',
        trading_enabled: false,
        updated_at: '2026-07-16T10:00:00Z',
      },
      error: null,
    });
    mockFrom.mockReturnValue(chain);

    const req = makePostRequest('/api/admin/agents', {
      name: 'BANKER',
      trading_enabled: false,
    });

    const res = await PATCH(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.agent.trading_enabled).toBe(false);
  });

  it('updates agent with max_daily_spend', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());

    const chain = chainMock({
      data: {
        name: 'DEALER',
        max_daily_spend: 5000,
        updated_at: '2026-07-16T10:00:00Z',
      },
      error: null,
    });
    mockFrom.mockReturnValue(chain);

    const req = makePostRequest('/api/admin/agents', {
      name: 'DEALER',
      max_daily_spend: 5000,
    });

    const res = await PATCH(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.agent.max_daily_spend).toBe(5000);
  });

  it('includes updated_at timestamp in update call', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());

    const chain = chainMock({ data: { name: 'VAULT' }, error: null });
    mockFrom.mockReturnValue(chain);

    const req = makePostRequest('/api/admin/agents', { name: 'VAULT', enabled: true });
    await PATCH(req);

    expect(chain.update).toHaveBeenCalledWith({
      enabled: true,
      updated_at: expect.stringMatching(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/),
    });
  });

  it('filters out name from update object (uses it for eq)', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());

    const chain = chainMock({ data: { name: 'VAULT' }, error: null });
    mockFrom.mockReturnValue(chain);

    const req = makePostRequest('/api/admin/agents', {
      name: 'VAULT',
      trading_enabled: true,
    });

    await PATCH(req);

    // Verify that update() does NOT contain 'name'
    const updateCall = (chain.update as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(updateCall).not.toHaveProperty('name');
    expect(updateCall).toHaveProperty('trading_enabled');
  });

  it('calls supabase eq with the agent name', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());

    const chain = chainMock({ data: { name: 'VAULT' }, error: null });
    mockFrom.mockReturnValue(chain);

    const req = makePostRequest('/api/admin/agents', { name: 'VAULT', enabled: true });
    await PATCH(req);

    expect(chain.eq).toHaveBeenCalledWith('name', 'VAULT');
  });

  it('returns response with exact shape on success', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());

    const chain = chainMock({ data: { name: 'VAULT' }, error: null });
    mockFrom.mockReturnValue(chain);

    const req = makePostRequest('/api/admin/agents', { name: 'VAULT' });
    const res = await PATCH(req);
    const body = await res.json();

    expect(Object.keys(body)).toEqual(['agent']);
    expect(body.agent).toBeDefined();
  });

  // ── Error path: Supabase error ──────────────────────────────────────────

  it('returns 500 when update returns error', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());

    const chain = chainMock({
      data: null,
      error: { message: 'agent not found' },
    });
    mockFrom.mockReturnValue(chain);

    const req = makePostRequest('/api/admin/agents', { name: 'NONEXISTENT' });
    const res = await PATCH(req);

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('Failed to update agent config');
  });

  it('logs error when Supabase update fails', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());

    const chain = chainMock({
      data: null,
      error: { message: 'unique constraint violation' },
    });
    mockFrom.mockReturnValue(chain);

    const req = makePostRequest('/api/admin/agents', { name: 'VAULT' });
    await PATCH(req);

    expect(mockLogger.error).toHaveBeenCalledWith(
      'Failed to update agent config:',
      expect.any(Object),
    );
  });

  // ── Error path: exception thrown ────────────────────────────────────────

  it('returns 500 when req.json() throws', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());

    const mockReq = {
      json: vi.fn().mockRejectedValue(new Error('Invalid JSON')),
    } as { json: () => Promise<never> };

    const res = await PATCH(mockReq as never);
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('Internal server error');
  });

  it('logs error when exception is thrown', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());

    const mockReq = {
      json: vi.fn().mockRejectedValue(new Error('JSON parse error')),
    } as { json: () => Promise<never> };

    await PATCH(mockReq as never);

    expect(mockLogger.error).toHaveBeenCalledWith(
      'PATCH /api/admin/agents error:',
      expect.any(Error),
    );
  });

  it('handles Zod parsing errors and returns flatten()', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());
    const req = makePostRequest('/api/admin/agents', {
      name: '',
      max_daily_spend: -50,
    });
    const res = await PATCH(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.details).toBeDefined();
    expect(body.details.fieldErrors || body.details.formErrors).toBeDefined();
  });
});
