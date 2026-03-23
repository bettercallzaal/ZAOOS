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
}));

// Must mock viem to avoid real RPC calls
vi.mock('viem', () => ({
  createPublicClient: vi.fn().mockReturnValue({
    multicall: vi.fn().mockResolvedValue([
      { status: 'success', result: BigInt(0) },
      { status: 'success', result: BigInt(0) },
    ]),
  }),
  http: vi.fn(),
  parseAbi: vi.fn().mockReturnValue([]),
  formatEther: vi.fn().mockReturnValue('0'),
}));

vi.mock('viem/chains', () => ({
  optimism: { id: 10 },
}));

import { POST } from '@/app/api/proposals/vote/route';

function makeRequest(body: unknown) {
  return new NextRequest(new URL('/api/proposals/vote', 'http://localhost:3000'), {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

const validUuid = '550e8400-e29b-41d4-a716-446655440000';

describe('POST /api/proposals/vote', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when not authenticated', async () => {
    mockGetSessionData.mockResolvedValue(null);
    const res = await POST(makeRequest({ proposal_id: validUuid, vote: 'for' }));
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Unauthorized');
  });

  it('returns 400 for invalid vote value', async () => {
    mockGetSessionData.mockResolvedValue({ fid: 123 });
    const res = await POST(makeRequest({ proposal_id: validUuid, vote: 'maybe' }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Validation failed');
  });

  it('returns 400 for non-UUID proposal_id', async () => {
    mockGetSessionData.mockResolvedValue({ fid: 123 });
    const res = await POST(makeRequest({ proposal_id: 'bad', vote: 'for' }));
    expect(res.status).toBe(400);
  });

  it('returns 400 for missing fields', async () => {
    mockGetSessionData.mockResolvedValue({ fid: 123 });
    const res = await POST(makeRequest({}));
    expect(res.status).toBe(400);
  });

  it('returns 404 when proposal not found', async () => {
    mockGetSessionData.mockResolvedValue({ fid: 123 });

    const chain: Record<string, unknown> = {};
    chain.select = vi.fn().mockReturnValue(chain);
    chain.eq = vi.fn().mockReturnValue(chain);
    chain.single = vi.fn().mockResolvedValue({ data: null, error: null });
    mockFrom.mockReturnValue(chain);

    const res = await POST(makeRequest({ proposal_id: validUuid, vote: 'for' }));
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toBe('Proposal not found');
  });

  it('returns 400 when proposal is not open', async () => {
    mockGetSessionData.mockResolvedValue({ fid: 123 });

    let callCount = 0;
    const chain: Record<string, unknown> = {};
    chain.select = vi.fn().mockReturnValue(chain);
    chain.eq = vi.fn().mockReturnValue(chain);
    chain.single = vi.fn().mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        // proposal query
        return Promise.resolve({ data: { status: 'approved', closes_at: null }, error: null });
      }
      return Promise.resolve({ data: null, error: null });
    });
    mockFrom.mockReturnValue(chain);

    const res = await POST(makeRequest({ proposal_id: validUuid, vote: 'for' }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Proposal is no longer open for voting');
  });

  it('returns warning when vote has zero respect weight', async () => {
    mockGetSessionData.mockResolvedValue({ fid: 123, displayName: 'Test', pfpUrl: '' });

    let callCount = 0;
    const chain: Record<string, unknown> = {};
    chain.select = vi.fn().mockReturnValue(chain);
    chain.eq = vi.fn().mockReturnValue(chain);
    chain.upsert = vi.fn().mockReturnValue(chain);
    chain.single = vi.fn().mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        // proposal query
        return Promise.resolve({ data: { status: 'open', closes_at: null }, error: null });
      }
      if (callCount === 2) {
        // user query
        return Promise.resolve({ data: { id: 'u1', primary_wallet: '0xabc', respect_wallet: null }, error: null });
      }
      // upsert vote
      return Promise.resolve({ data: { id: 'v1', vote: 'for', respect_weight: 0 }, error: null });
    });
    mockFrom.mockReturnValue(chain);

    const res = await POST(makeRequest({ proposal_id: validUuid, vote: 'for' }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.respectWeight).toBe(0);
    expect(body.warning).toMatch(/zero weight/);
  });

  it('returns 400 when voting period has ended', async () => {
    mockGetSessionData.mockResolvedValue({ fid: 123 });

    let callCount = 0;
    const chain: Record<string, unknown> = {};
    chain.select = vi.fn().mockReturnValue(chain);
    chain.eq = vi.fn().mockReturnValue(chain);
    chain.single = vi.fn().mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        const pastDate = new Date(Date.now() - 86400000).toISOString();
        return Promise.resolve({ data: { status: 'open', closes_at: pastDate }, error: null });
      }
      return Promise.resolve({ data: null, error: null });
    });
    mockFrom.mockReturnValue(chain);

    const res = await POST(makeRequest({ proposal_id: validUuid, vote: 'for' }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Voting period has ended');
  });
});
