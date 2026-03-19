import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

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

vi.mock('@/lib/notifications', () => ({
  createInAppNotification: vi.fn().mockResolvedValue(undefined),
  sendNotification: vi.fn().mockResolvedValue(undefined),
}));

import { GET, POST, PATCH } from '@/app/api/proposals/route';

function makeRequest(url: string, options?: RequestInit) {
  return new NextRequest(new URL(url, 'http://localhost:3000'), options);
}

// Helper to build Supabase chain mocks
function chainMock(result: { data?: unknown; error?: unknown; count?: number }) {
  const chain: Record<string, unknown> = {};
  const handler = () => chain;
  chain.select = vi.fn().mockReturnValue(chain);
  chain.insert = vi.fn().mockReturnValue(chain);
  chain.update = vi.fn().mockReturnValue(chain);
  chain.upsert = vi.fn().mockReturnValue(chain);
  chain.eq = vi.fn().mockReturnValue(chain);
  chain.neq = vi.fn().mockReturnValue(chain);
  chain.order = vi.fn().mockReturnValue(chain);
  chain.range = vi.fn().mockReturnValue(chain);
  chain.single = vi.fn().mockResolvedValue(result);
  // For queries that resolve without .single()
  chain.then = vi.fn((resolve: (val: unknown) => void) => resolve(result));
  return { chain, handler };
}

describe('GET /api/proposals', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when not authenticated', async () => {
    mockGetSessionData.mockResolvedValue(null);
    const req = makeRequest('/api/proposals');
    const res = await GET(req);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Unauthorized');
  });

  it('returns proposals when authenticated', async () => {
    mockGetSessionData.mockResolvedValue({ fid: 123, isAdmin: false });

    const mockData = [
      {
        id: 'p1',
        title: 'Test Proposal',
        description: 'Desc',
        status: 'open',
        category: 'general',
        author: { display_name: 'User', username: 'user1', pfp_url: '', fid: 123, zid: null },
        created_at: '2026-01-01T00:00:00Z',
        closes_at: null,
        votes: [
          { vote: 'for', respect_weight: 10 },
          { vote: 'against', respect_weight: 5 },
        ],
        comment_count: [{ count: 3 }],
      },
    ];

    const { chain } = chainMock({ data: mockData, error: null, count: 1 });
    // Override .range to resolve the query directly (no .single)
    chain.range = vi.fn().mockResolvedValue({ data: mockData, error: null, count: 1 });
    mockFrom.mockReturnValue(chain);

    const req = makeRequest('/api/proposals');
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.proposals).toHaveLength(1);
    expect(body.proposals[0].tally.for.count).toBe(1);
    expect(body.proposals[0].tally.for.weight).toBe(10);
    expect(body.proposals[0].tally.against.count).toBe(1);
    expect(body.proposals[0].commentCount).toBe(3);
  });

  it('returns 500 when supabase query fails', async () => {
    mockGetSessionData.mockResolvedValue({ fid: 123, isAdmin: false });

    const { chain } = chainMock({ data: null, error: { message: 'db error' }, count: 0 });
    chain.range = vi.fn().mockResolvedValue({ data: null, error: { message: 'db error' }, count: 0 });
    mockFrom.mockReturnValue(chain);

    const req = makeRequest('/api/proposals');
    const res = await GET(req);
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('Failed to fetch proposals');
  });
});

describe('POST /api/proposals', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when not authenticated', async () => {
    mockGetSessionData.mockResolvedValue(null);
    const req = makeRequest('/api/proposals', {
      method: 'POST',
      body: JSON.stringify({ title: 'Test', description: 'Desc' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('returns 400 for invalid input', async () => {
    mockGetSessionData.mockResolvedValue({ fid: 123, isAdmin: false });
    const req = makeRequest('/api/proposals', {
      method: 'POST',
      body: JSON.stringify({ title: '', description: '' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Validation failed');
    expect(body.details).toBeDefined();
  });

  it('returns 404 when user not found in database', async () => {
    mockGetSessionData.mockResolvedValue({ fid: 999, isAdmin: false });

    const userChain = chainMock({ data: null, error: null });
    mockFrom.mockReturnValue(userChain.chain);

    const req = makeRequest('/api/proposals', {
      method: 'POST',
      body: JSON.stringify({ title: 'Valid', description: 'Valid description' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toBe('User not found');
  });

  it('returns 400 for missing required fields', async () => {
    mockGetSessionData.mockResolvedValue({ fid: 123, isAdmin: false });
    const req = makeRequest('/api/proposals', {
      method: 'POST',
      body: JSON.stringify({}),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('returns 400 for invalid category', async () => {
    mockGetSessionData.mockResolvedValue({ fid: 123, isAdmin: false });
    const req = makeRequest('/api/proposals', {
      method: 'POST',
      body: JSON.stringify({
        title: 'Valid title',
        description: 'Valid description',
        category: 'not_a_category',
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});

describe('PATCH /api/proposals', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 403 when not admin', async () => {
    mockGetSessionData.mockResolvedValue({ fid: 123, isAdmin: false });
    const req = makeRequest('/api/proposals', {
      method: 'PATCH',
      body: JSON.stringify({
        id: '550e8400-e29b-41d4-a716-446655440000',
        status: 'approved',
      }),
    });
    const res = await PATCH(req);
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toBe('Forbidden');
  });

  it('returns 403 when not authenticated', async () => {
    mockGetSessionData.mockResolvedValue(null);
    const req = makeRequest('/api/proposals', {
      method: 'PATCH',
      body: JSON.stringify({
        id: '550e8400-e29b-41d4-a716-446655440000',
        status: 'approved',
      }),
    });
    const res = await PATCH(req);
    expect(res.status).toBe(403);
  });

  it('returns 400 for invalid status value', async () => {
    mockGetSessionData.mockResolvedValue({ fid: 123, isAdmin: true });
    const req = makeRequest('/api/proposals', {
      method: 'PATCH',
      body: JSON.stringify({
        id: '550e8400-e29b-41d4-a716-446655440000',
        status: 'invalid_status',
      }),
    });
    const res = await PATCH(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid input');
  });

  it('returns 400 for non-UUID id', async () => {
    mockGetSessionData.mockResolvedValue({ fid: 123, isAdmin: true });
    const req = makeRequest('/api/proposals', {
      method: 'PATCH',
      body: JSON.stringify({ id: 'bad-id', status: 'approved' }),
    });
    const res = await PATCH(req);
    expect(res.status).toBe(400);
  });

  it('returns success when admin updates status', async () => {
    mockGetSessionData.mockResolvedValue({ fid: 123, isAdmin: true });

    const { chain } = chainMock({ data: null, error: null });
    chain.eq = vi.fn().mockResolvedValue({ data: null, error: null });
    mockFrom.mockReturnValue(chain);

    const req = makeRequest('/api/proposals', {
      method: 'PATCH',
      body: JSON.stringify({
        id: '550e8400-e29b-41d4-a716-446655440000',
        status: 'approved',
      }),
    });
    const res = await PATCH(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });
});
