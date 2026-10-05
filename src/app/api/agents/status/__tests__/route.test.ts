import { beforeEach, describe, expect, it, vi } from 'vitest';
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

describe('GET /api/agents/status', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 123 }));
  });

  it('returns 401 when unauthenticated', async () => {
    mockGetSessionData.mockResolvedValue(mockUnauthenticatedSession());

    const req = makeGetRequest('/api/agents/status');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe('Unauthorized');
  });

  it('allows authenticated non-admin members and returns squad status with isAdmin: false', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 456 }));

    const latestChain = chainMock({ data: [], error: null }).chain;
    const countsChain = chainMock({ data: [], error: null }).chain;
    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount += 1;
      return callCount === 1 ? latestChain : countsChain;
    });

    const req = makeGetRequest('/api/agents/status');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.isAdmin).toBe(false);
    expect(body.agents).toBeDefined();
    expect(body.agents.length).toBeGreaterThan(0);
    expect(body.agents.find((a: { name: string }) => a.name === 'zoe')).toBeDefined();
  });

  it('returns isAdmin: true for admin sessions', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession({ fid: 1 }));

    const latestChain = chainMock({ data: [], error: null }).chain;
    const countsChain = chainMock({ data: [], error: null }).chain;
    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount += 1;
      return callCount === 1 ? latestChain : countsChain;
    });

    const req = makeGetRequest('/api/agents/status');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.isAdmin).toBe(true);
  });

  it('returns events feed when view=feed', async () => {
    const mockEvents = [
      {
        id: 'ev-1',
        agent_name: 'zoe',
        event_type: 'task_started',
        summary: 'Planning sprint',
        payload: {},
        dispatched_by: null,
        notified_at: null,
        created_at: new Date().toISOString(),
      },
    ];

    const feedChain = chainMock({ data: mockEvents, error: null }).chain;
    mockFrom.mockImplementation(() => feedChain);

    const req = makeGetRequest('/api/agents/status', { view: 'feed' });
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.events).toHaveLength(1);
    expect(body.events[0].agent_name).toBe('zoe');
  });
});
