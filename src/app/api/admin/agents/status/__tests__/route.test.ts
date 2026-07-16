import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AgentEvent } from '@/components/admin/agents/constants';
import { AGENTS } from '@/components/admin/agents/constants';
import {
  chainMock,
  makeGetRequest,
  mockAdminSession,
  mockAuthenticatedSession,
  mockUnauthenticatedSession,
} from '@/test-utils/api-helpers';

const { mockGetSessionData, mockFrom } = vi.hoisted(() => ({
  mockGetSessionData: vi.fn(),
  mockFrom: vi.fn(),
}));

vi.mock('@/lib/auth/session', () => ({
  getSessionData: () => mockGetSessionData(),
}));

vi.mock('@/lib/db/supabase', () => ({
  supabaseAdmin: { from: mockFrom },
}));

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

import { GET } from '../route';

// ============================================================================
// Test Fixtures
// ============================================================================

/**
 * Create a mock agent event for testing
 */
function createMockAgentEvent(overrides?: Partial<AgentEvent>): AgentEvent {
  const now = new Date().toISOString();
  return {
    id: '550e8400-e29b-41d4-a716-446655440000',
    agent_name: 'zoe',
    event_type: 'task_started',
    summary: 'Processing task',
    payload: {},
    dispatched_by: null,
    notified_at: null,
    created_at: now,
    ...overrides,
  };
}

// ============================================================================
// GET /api/admin/agents/status
// ============================================================================

describe('GET /api/admin/agents/status', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSessionData.mockResolvedValue(mockAdminSession({ fid: 123 }));
  });

  describe('authentication', () => {
    it('returns 401 when unauthenticated', async () => {
      mockGetSessionData.mockResolvedValue(mockUnauthenticatedSession());

      const req = makeGetRequest('/api/admin/agents/status');
      const res = await GET(req);
      const body = await res.json();

      expect(res.status).toBe(401);
      expect(body.error).toBe('Unauthorized');
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it('returns 403 when authenticated but not admin', async () => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 456, isAdmin: false }));

      const req = makeGetRequest('/api/admin/agents/status');
      const res = await GET(req);
      const body = await res.json();

      expect(res.status).toBe(403);
      expect(body.error).toBe('Admin access required');
      expect(mockFrom).not.toHaveBeenCalled();
    });
  });

  describe('squad view (default)', () => {
    it('returns 200 with agents array on default view', async () => {
      const latestChain = chainMock({ data: [], error: null }).chain;
      const countsChain = chainMock({ data: [], error: null }).chain;

      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount += 1;
        return callCount === 1 ? latestChain : countsChain;
      });

      const req = makeGetRequest('/api/admin/agents/status');
      const res = await GET(req);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(Array.isArray(body.agents)).toBe(true);
    });

    it('returns all agents from AGENTS constant', async () => {
      const latestChain = chainMock({ data: [], error: null }).chain;
      const countsChain = chainMock({ data: [], error: null }).chain;

      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount += 1;
        return callCount === 1 ? latestChain : countsChain;
      });

      const req = makeGetRequest('/api/admin/agents/status');
      const res = await GET(req);
      const body = await res.json();

      expect(body.agents).toHaveLength(AGENTS.length);
      expect(body.agents.map((a: (typeof AGENTS)[0]) => a.name)).toEqual(AGENTS.map((a) => a.name));
    });

    it('derives status as idle when agent has no events', async () => {
      const latestChain = chainMock({ data: [], error: null }).chain;
      const countsChain = chainMock({ data: [], error: null }).chain;

      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount += 1;
        return callCount === 1 ? latestChain : countsChain;
      });

      const req = makeGetRequest('/api/admin/agents/status');
      const res = await GET(req);
      const body = await res.json();

      const zoeAgent = body.agents.find((a: (typeof AGENTS)[0]) => a.name === 'zoe');
      expect(zoeAgent.status).toBe('idle');
      expect(zoeAgent.last_event).toBeNull();
      expect(zoeAgent.current_task).toBeNull();
    });

    it('derives status as active when last event is task_started', async () => {
      const event = createMockAgentEvent({
        agent_name: 'zoe',
        event_type: 'task_started',
        summary: 'Running important task',
      });

      const latestChain = chainMock({ data: [event], error: null }).chain;
      const countsChain = chainMock({ data: [event], error: null }).chain;

      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount += 1;
        return callCount === 1 ? latestChain : countsChain;
      });

      const req = makeGetRequest('/api/admin/agents/status');
      const res = await GET(req);
      const body = await res.json();

      const zoeAgent = body.agents.find((a: (typeof AGENTS)[0]) => a.name === 'zoe');
      expect(zoeAgent.status).toBe('active');
      expect(zoeAgent.last_event).toEqual(event);
      expect(zoeAgent.current_task).toBe('Running important task');
    });

    it('derives status as error when last event is task_failed', async () => {
      const event = createMockAgentEvent({
        agent_name: 'builder',
        event_type: 'task_failed',
        summary: 'Build failed',
      });

      const latestChain = chainMock({ data: [event], error: null }).chain;
      const countsChain = chainMock({ data: [event], error: null }).chain;

      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount += 1;
        return callCount === 1 ? latestChain : countsChain;
      });

      const req = makeGetRequest('/api/admin/agents/status');
      const res = await GET(req);
      const body = await res.json();

      const builderAgent = body.agents.find((a: (typeof AGENTS)[0]) => a.name === 'builder');
      expect(builderAgent.status).toBe('error');
      expect(builderAgent.last_event?.event_type).toBe('task_failed');
    });

    it('derives status as error when last event is blocked', async () => {
      const event = createMockAgentEvent({
        agent_name: 'scout',
        event_type: 'blocked',
        summary: 'Rate limited',
      });

      const latestChain = chainMock({ data: [event], error: null }).chain;
      const countsChain = chainMock({ data: [event], error: null }).chain;

      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount += 1;
        return callCount === 1 ? latestChain : countsChain;
      });

      const req = makeGetRequest('/api/admin/agents/status');
      const res = await GET(req);
      const body = await res.json();

      const scoutAgent = body.agents.find((a: (typeof AGENTS)[0]) => a.name === 'scout');
      expect(scoutAgent.status).toBe('error');
    });

    it('derives status as approval_needed when last event requires approval', async () => {
      const event = createMockAgentEvent({
        agent_name: 'wallet',
        event_type: 'approval_needed',
        summary: 'Needs approval',
      });

      const latestChain = chainMock({ data: [event], error: null }).chain;
      const countsChain = chainMock({ data: [event], error: null }).chain;

      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount += 1;
        return callCount === 1 ? latestChain : countsChain;
      });

      const req = makeGetRequest('/api/admin/agents/status');
      const res = await GET(req);
      const body = await res.json();

      const walletAgent = body.agents.find((a: (typeof AGENTS)[0]) => a.name === 'wallet');
      expect(walletAgent.status).toBe('approval_needed');
    });

    it('derives status as idle when last event is task_completed', async () => {
      const event = createMockAgentEvent({
        agent_name: 'caster',
        event_type: 'task_completed',
        summary: 'Task done',
      });

      const latestChain = chainMock({ data: [event], error: null }).chain;
      const countsChain = chainMock({ data: [event], error: null }).chain;

      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount += 1;
        return callCount === 1 ? latestChain : countsChain;
      });

      const req = makeGetRequest('/api/admin/agents/status');
      const res = await GET(req);
      const body = await res.json();

      const casterAgent = body.agents.find((a: (typeof AGENTS)[0]) => a.name === 'caster');
      expect(casterAgent.status).toBe('idle');
    });

    it('sets current_task to event summary when event_type is task_started', async () => {
      const event = createMockAgentEvent({
        agent_name: 'zoe',
        event_type: 'task_started',
        summary: 'Building feature X',
      });

      const latestChain = chainMock({ data: [event], error: null }).chain;
      const countsChain = chainMock({ data: [event], error: null }).chain;

      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount += 1;
        return callCount === 1 ? latestChain : countsChain;
      });

      const req = makeGetRequest('/api/admin/agents/status');
      const res = await GET(req);
      const body = await res.json();

      const zoeAgent = body.agents.find((a: (typeof AGENTS)[0]) => a.name === 'zoe');
      expect(zoeAgent.current_task).toBe('Building feature X');
    });

    it('sets current_task to null when event_type is not task_started', async () => {
      const event = createMockAgentEvent({
        agent_name: 'zoe',
        event_type: 'task_completed',
        summary: 'Task complete',
      });

      const latestChain = chainMock({ data: [event], error: null }).chain;
      const countsChain = chainMock({ data: [event], error: null }).chain;

      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount += 1;
        return callCount === 1 ? latestChain : countsChain;
      });

      const req = makeGetRequest('/api/admin/agents/status');
      const res = await GET(req);
      const body = await res.json();

      const zoeAgent = body.agents.find((a: (typeof AGENTS)[0]) => a.name === 'zoe');
      expect(zoeAgent.current_task).toBeNull();
    });

    it('counts events in last 24 hours per agent', async () => {
      const now = new Date();
      const events: AgentEvent[] = [
        createMockAgentEvent({
          agent_name: 'zoe',
          created_at: now.toISOString(),
        }),
        createMockAgentEvent({
          agent_name: 'zoe',
          created_at: new Date(now.getTime() - 60 * 60 * 1000).toISOString(),
        }),
        createMockAgentEvent({
          agent_name: 'zoe',
          created_at: new Date(now.getTime() - 12 * 60 * 60 * 1000).toISOString(),
        }),
        createMockAgentEvent({
          agent_name: 'builder',
          created_at: now.toISOString(),
        }),
      ];

      const latestChain = chainMock({ data: [events[0]], error: null }).chain;
      const countsChain = chainMock({ data: events, error: null }).chain;

      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount += 1;
        return callCount === 1 ? latestChain : countsChain;
      });

      const req = makeGetRequest('/api/admin/agents/status');
      const res = await GET(req);
      const body = await res.json();

      const zoeAgent = body.agents.find((a: (typeof AGENTS)[0]) => a.name === 'zoe');
      expect(zoeAgent.events_24h).toBe(3);

      const builderAgent = body.agents.find((a: (typeof AGENTS)[0]) => a.name === 'builder');
      expect(builderAgent.events_24h).toBe(1);
    });

    it('queries latest 50 events ordered by created_at descending', async () => {
      const latestChain = chainMock({ data: [], error: null }).chain;
      const countsChain = chainMock({ data: [], error: null }).chain;

      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount += 1;
        return callCount === 1 ? latestChain : countsChain;
      });

      await GET(makeGetRequest('/api/admin/agents/status'));

      const firstFromCall = mockFrom.mock.calls[0];
      expect(firstFromCall).toEqual(['agent_events']);

      const latestChainSelect = vi.mocked(latestChain.select);
      expect(latestChainSelect).toHaveBeenCalledWith('*');

      const latestChainOrder = vi.mocked(latestChain.order);
      expect(latestChainOrder).toHaveBeenCalledWith('created_at', { ascending: false });

      const latestChainLimit = vi.mocked(latestChain.limit);
      expect(latestChainLimit).toHaveBeenCalledWith(50);
    });

    it('queries events from last 24 hours for counts', async () => {
      const latestChain = chainMock({ data: [], error: null }).chain;
      const countsChain = chainMock({ data: [], error: null }).chain;

      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount += 1;
        return callCount === 1 ? latestChain : countsChain;
      });

      await GET(makeGetRequest('/api/admin/agents/status'));

      const countsChainSelect = vi.mocked(countsChain.select);
      expect(countsChainSelect).toHaveBeenCalledWith('agent_name');

      const countsChainGte = vi.mocked(countsChain.gte);
      expect(countsChainGte).toHaveBeenCalled();
      const [field, _timestamp] = countsChainGte.mock.calls[0] as unknown as [string, string];
      expect(field).toBe('created_at');
    });

    it('returns agent with all required fields', async () => {
      const event = createMockAgentEvent({
        agent_name: 'zoe',
        event_type: 'task_started',
        summary: 'Test task',
      });

      const latestChain = chainMock({ data: [event], error: null }).chain;
      const countsChain = chainMock({ data: [event], error: null }).chain;

      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount += 1;
        return callCount === 1 ? latestChain : countsChain;
      });

      const req = makeGetRequest('/api/admin/agents/status');
      const res = await GET(req);
      const body = await res.json();

      const zoeAgent = body.agents[0];
      expect(zoeAgent).toHaveProperty('name');
      expect(zoeAgent).toHaveProperty('label');
      expect(zoeAgent).toHaveProperty('emoji');
      expect(zoeAgent).toHaveProperty('color');
      expect(zoeAgent).toHaveProperty('role');
      expect(zoeAgent).toHaveProperty('status');
      expect(zoeAgent).toHaveProperty('current_task');
      expect(zoeAgent).toHaveProperty('last_event');
      expect(zoeAgent).toHaveProperty('events_24h');
    });

    it('picks most recent event for each agent from latest 50', async () => {
      const now = new Date();
      const zoeEvent1 = createMockAgentEvent({
        agent_name: 'zoe',
        created_at: new Date(now.getTime() - 60 * 60 * 1000).toISOString(),
        event_type: 'task_completed',
      });
      const zoeEvent2 = createMockAgentEvent({
        agent_name: 'zoe',
        created_at: now.toISOString(),
        event_type: 'task_started',
        summary: 'Current task',
      });

      // Simulating latest events ordered by created_at DESC, so zoeEvent2 comes first
      const latestChain = chainMock({ data: [zoeEvent2, zoeEvent1], error: null }).chain;
      const countsChain = chainMock({ data: [zoeEvent2, zoeEvent1], error: null }).chain;

      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount += 1;
        return callCount === 1 ? latestChain : countsChain;
      });

      const req = makeGetRequest('/api/admin/agents/status');
      const res = await GET(req);
      const body = await res.json();

      const zoeAgent = body.agents.find((a: (typeof AGENTS)[0]) => a.name === 'zoe');
      // Should pick the first one (most recent)
      expect(zoeAgent.last_event).toEqual(zoeEvent2);
      expect(zoeAgent.current_task).toBe('Current task');
    });
  });

  describe('detailed events view', () => {
    it('returns events array when view=detailed', async () => {
      const event = createMockAgentEvent({ agent_name: 'zoe' });
      const chain = chainMock({ data: [event], error: null }).chain;
      mockFrom.mockReturnValue(chain);

      const req = makeGetRequest('/api/admin/agents/status', { view: 'detailed' });
      const res = await GET(req);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(Array.isArray(body.events)).toBe(true);
      expect(body.events).toEqual([event]);
    });

    it('respects agent filter in detailed view', async () => {
      const event = createMockAgentEvent({ agent_name: 'builder' });
      const chain = chainMock({ data: [event], error: null }).chain;
      mockFrom.mockReturnValue(chain);

      const req = makeGetRequest('/api/admin/agents/status', {
        view: 'detailed',
        agent: 'builder',
      });
      await GET(req);

      const eqCall = vi.mocked(chain.eq);
      expect(eqCall).toHaveBeenCalledWith('agent_name', 'builder');
    });

    it('respects event_type filter in detailed view', async () => {
      const event = createMockAgentEvent({ event_type: 'task_failed' });
      const chain = chainMock({ data: [event], error: null }).chain;
      mockFrom.mockReturnValue(chain);

      const req = makeGetRequest('/api/admin/agents/status', {
        view: 'detailed',
        event_type: 'task_failed',
      });
      await GET(req);

      const eqCall = vi.mocked(chain.eq);
      expect(eqCall).toHaveBeenCalledWith('event_type', 'task_failed');
    });

    it('respects since timestamp filter in detailed view', async () => {
      const event = createMockAgentEvent();
      const chain = chainMock({ data: [event], error: null }).chain;
      mockFrom.mockReturnValue(chain);

      const timestamp = '2026-07-15T00:00:00Z';
      const req = makeGetRequest('/api/admin/agents/status', {
        view: 'detailed',
        since: timestamp,
      });
      await GET(req);

      const gteCall = vi.mocked(chain.gte);
      expect(gteCall).toHaveBeenCalledWith('created_at', timestamp);
    });

    it('respects custom limit (max 200)', async () => {
      const chain = chainMock({ data: [], error: null }).chain;
      mockFrom.mockReturnValue(chain);

      const req = makeGetRequest('/api/admin/agents/status', {
        view: 'detailed',
        limit: '100',
      });
      await GET(req);

      const limitCall = vi.mocked(chain.limit);
      expect(limitCall).toHaveBeenCalledWith(100);
    });

    it('caps limit at 200 when higher value provided', async () => {
      const chain = chainMock({ data: [], error: null }).chain;
      mockFrom.mockReturnValue(chain);

      const req = makeGetRequest('/api/admin/agents/status', {
        view: 'detailed',
        limit: '500',
      });
      await GET(req);

      const limitCall = vi.mocked(chain.limit);
      expect(limitCall).toHaveBeenCalledWith(200);
    });

    it('defaults to limit 50 when not specified', async () => {
      const chain = chainMock({ data: [], error: null }).chain;
      mockFrom.mockReturnValue(chain);

      const req = makeGetRequest('/api/admin/agents/status', { view: 'detailed' });
      await GET(req);

      const limitCall = vi.mocked(chain.limit);
      expect(limitCall).toHaveBeenCalledWith(50);
    });

    it('combines multiple filters in detailed view', async () => {
      const event = createMockAgentEvent({
        agent_name: 'scout',
        event_type: 'blocked',
      });
      const chain = chainMock({ data: [event], error: null }).chain;
      mockFrom.mockReturnValue(chain);

      const timestamp = '2026-07-15T00:00:00Z';
      const req = makeGetRequest('/api/admin/agents/status', {
        view: 'detailed',
        agent: 'scout',
        event_type: 'blocked',
        since: timestamp,
        limit: '75',
      });
      await GET(req);

      const eqCalls = vi.mocked(chain.eq).mock.calls;
      expect(eqCalls).toContainEqual(['agent_name', 'scout']);
      expect(eqCalls).toContainEqual(['event_type', 'blocked']);

      const gteCalls = vi.mocked(chain.gte).mock.calls;
      expect(gteCalls).toContainEqual(['created_at', timestamp]);

      const limitCall = vi.mocked(chain.limit);
      expect(limitCall).toHaveBeenCalledWith(75);
    });

    it('returns empty events array when no events match filters', async () => {
      const chain = chainMock({ data: [], error: null }).chain;
      mockFrom.mockReturnValue(chain);

      const req = makeGetRequest('/api/admin/agents/status', {
        view: 'detailed',
        agent: 'nonexistent',
      });
      const res = await GET(req);
      const body = await res.json();

      expect(body.events).toEqual([]);
    });
  });

  describe('error handling', () => {
    it('returns 200 with agents even when squad view query has error (route does not check error field)', async () => {
      // NOTE: This is a bug in the route — it should check latestResult.error and countsResult.error
      // but currently it silently treats errors as empty results
      const dbError = new Error('Database error');
      const latestChain = chainMock({ data: null, error: dbError }).chain;
      const countsChain = chainMock({ data: [], error: null }).chain;

      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount += 1;
        return callCount === 1 ? latestChain : countsChain;
      });

      const req = makeGetRequest('/api/admin/agents/status');
      const res = await GET(req);
      const body = await res.json();

      // Route does not validate error field, returns 200 with agents
      expect(res.status).toBe(200);
      expect(Array.isArray(body.agents)).toBe(true);
    });

    it('returns 500 when detailed view query fails', async () => {
      const dbError = new Error('Database error');
      const chain = chainMock({ data: null, error: dbError }).chain;
      mockFrom.mockReturnValue(chain);

      const req = makeGetRequest('/api/admin/agents/status', { view: 'detailed' });
      const res = await GET(req);
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body.error).toBe('Failed to fetch events');
    });

    it('returns 500 when exception is thrown', async () => {
      mockFrom.mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      const req = makeGetRequest('/api/admin/agents/status');
      const res = await GET(req);
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body.error).toBe('Internal server error');
    });

    it('logs error to logger.error on exception', async () => {
      const { logger } = await import('@/lib/logger');
      mockFrom.mockImplementation(() => {
        throw new Error('Query failed');
      });

      await GET(makeGetRequest('/api/admin/agents/status'));

      expect(vi.mocked(logger.error)).toHaveBeenCalledWith(
        'Agent status error:',
        expect.any(Error),
      );
    });

    it('logs detailed error on query error', async () => {
      const { logger } = await import('@/lib/logger');
      const dbError = new Error('Connection timeout');
      const chain = chainMock({ data: null, error: dbError }).chain;
      mockFrom.mockReturnValue(chain);

      await GET(makeGetRequest('/api/admin/agents/status', { view: 'detailed' }));

      expect(vi.mocked(logger.error)).toHaveBeenCalledWith('Agent events query error:', dbError);
    });

    it('does not expose sensitive error details in response', async () => {
      const sensitiveError = new Error('Password: secret123, host: db.internal');
      mockFrom.mockImplementation(() => {
        throw sensitiveError;
      });

      const req = makeGetRequest('/api/admin/agents/status');
      const res = await GET(req);
      const body = await res.json();

      expect(body.error).toBe('Internal server error');
      expect(body.details).toBeUndefined();
      expect(JSON.stringify(body)).not.toContain('secret123');
      expect(JSON.stringify(body)).not.toContain('db.internal');
    });
  });

  describe('response structure', () => {
    it('squad view response has correct shape', async () => {
      const latestChain = chainMock({ data: [], error: null }).chain;
      const countsChain = chainMock({ data: [], error: null }).chain;

      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount += 1;
        return callCount === 1 ? latestChain : countsChain;
      });

      const req = makeGetRequest('/api/admin/agents/status');
      const res = await GET(req);
      const body = await res.json();

      expect(body).toHaveProperty('agents');
      expect(body.agents).toBeInstanceOf(Array);
      expect(body.error).toBeUndefined();
      expect(body.events).toBeUndefined();
    });

    it('detailed view response has correct shape', async () => {
      const chain = chainMock({ data: [], error: null }).chain;
      mockFrom.mockReturnValue(chain);

      const req = makeGetRequest('/api/admin/agents/status', { view: 'detailed' });
      const res = await GET(req);
      const body = await res.json();

      expect(body).toHaveProperty('events');
      expect(body.events).toBeInstanceOf(Array);
      expect(body.error).toBeUndefined();
      expect(body.agents).toBeUndefined();
    });

    it('error response has correct shape', async () => {
      mockGetSessionData.mockResolvedValue(mockUnauthenticatedSession());

      const req = makeGetRequest('/api/admin/agents/status');
      const res = await GET(req);
      const body = await res.json();

      expect(body).toHaveProperty('error');
      expect(body.agents).toBeUndefined();
      expect(body.events).toBeUndefined();
    });
  });

  describe('edge cases', () => {
    it('handles null payload in agent events', async () => {
      const event = createMockAgentEvent({
        payload: null as unknown as Record<string, unknown>,
      });
      const latestChain = chainMock({ data: [event], error: null }).chain;
      const countsChain = chainMock({ data: [event], error: null }).chain;

      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount += 1;
        return callCount === 1 ? latestChain : countsChain;
      });

      const req = makeGetRequest('/api/admin/agents/status');
      const res = await GET(req);

      expect(res.status).toBe(200);
    });

    it('handles missing summary in agent events', async () => {
      const event = createMockAgentEvent({
        event_type: 'task_started',
        summary: null,
      });
      const latestChain = chainMock({ data: [event], error: null }).chain;
      const countsChain = chainMock({ data: [event], error: null }).chain;

      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount += 1;
        return callCount === 1 ? latestChain : countsChain;
      });

      const req = makeGetRequest('/api/admin/agents/status');
      const res = await GET(req);
      const body = await res.json();

      const agent = body.agents[0];
      expect(agent.current_task).toBeNull();
    });

    it('handles invalid limit parameter gracefully', async () => {
      const chain = chainMock({ data: [], error: null }).chain;
      mockFrom.mockReturnValue(chain);

      const req = makeGetRequest('/api/admin/agents/status', {
        view: 'detailed',
        limit: 'not-a-number',
      });
      await GET(req);

      // NaN behavior: Math.min(NaN, 200) = NaN, but route uses Number() which parses to NaN
      // The implementation calls Math.min(Number('not-a-number'), 200) = Math.min(NaN, 200) = NaN
      // Then limit(NaN) is called. This tests the actual behavior.
      const limitCall = vi.mocked(chain.limit);
      expect(limitCall).toHaveBeenCalled();
    });

    it('handles empty events array from counts query', async () => {
      const event = createMockAgentEvent({ agent_name: 'zoe' });
      const latestChain = chainMock({ data: [event], error: null }).chain;
      const countsChain = chainMock({ data: [], error: null }).chain;

      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount += 1;
        return callCount === 1 ? latestChain : countsChain;
      });

      const req = makeGetRequest('/api/admin/agents/status');
      const res = await GET(req);
      const body = await res.json();

      const zoeAgent = body.agents.find((a: (typeof AGENTS)[0]) => a.name === 'zoe');
      expect(zoeAgent.events_24h).toBe(0);
    });

    it('handles multiple events for same agent, uses first (most recent)', async () => {
      const now = new Date();
      const event1 = createMockAgentEvent({
        agent_name: 'zoe',
        created_at: now.toISOString(),
        event_type: 'task_started',
        summary: 'Task 1',
      });
      const event2 = createMockAgentEvent({
        agent_name: 'zoe',
        created_at: new Date(now.getTime() - 60 * 60 * 1000).toISOString(),
        event_type: 'task_completed',
        summary: 'Task 2',
      });

      const latestChain = chainMock({ data: [event1, event2], error: null }).chain;
      const countsChain = chainMock({ data: [event1, event2], error: null }).chain;

      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount += 1;
        return callCount === 1 ? latestChain : countsChain;
      });

      const req = makeGetRequest('/api/admin/agents/status');
      const res = await GET(req);
      const body = await res.json();

      const zoeAgent = body.agents.find((a: (typeof AGENTS)[0]) => a.name === 'zoe');
      expect(zoeAgent.last_event).toEqual(event1);
      expect(zoeAgent.current_task).toBe('Task 1');
      expect(zoeAgent.status).toBe('active');
    });
  });
});
