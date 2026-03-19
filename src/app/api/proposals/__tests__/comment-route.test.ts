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

import { GET, POST } from '@/app/api/proposals/comment/route';

const validUuid = '550e8400-e29b-41d4-a716-446655440000';

function makeGetRequest(params?: Record<string, string>) {
  const url = new URL('/api/proposals/comment', 'http://localhost:3000');
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  }
  return new NextRequest(url);
}

function makePostRequest(body: unknown) {
  return new NextRequest(new URL('/api/proposals/comment', 'http://localhost:3000'), {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

describe('GET /api/proposals/comment', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when not authenticated', async () => {
    mockGetSessionData.mockResolvedValue(null);
    const res = await GET(makeGetRequest({ proposal_id: validUuid }));
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Unauthorized');
  });

  it('returns 400 when proposal_id is missing', async () => {
    mockGetSessionData.mockResolvedValue({ fid: 123 });
    const res = await GET(makeGetRequest());
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('proposal_id is required');
  });

  it('returns comments when authenticated with valid proposal_id', async () => {
    mockGetSessionData.mockResolvedValue({ fid: 123 });

    const mockComments = [
      { id: 'c1', body: 'Great idea!', author: { display_name: 'User1' } },
    ];
    const chain: Record<string, unknown> = {};
    chain.select = vi.fn().mockReturnValue(chain);
    chain.eq = vi.fn().mockReturnValue(chain);
    chain.order = vi.fn().mockResolvedValue({ data: mockComments, error: null });
    mockFrom.mockReturnValue(chain);

    const res = await GET(makeGetRequest({ proposal_id: validUuid }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.comments).toHaveLength(1);
    expect(body.comments[0].body).toBe('Great idea!');
  });

  it('returns 500 when supabase query fails', async () => {
    mockGetSessionData.mockResolvedValue({ fid: 123 });

    const chain: Record<string, unknown> = {};
    chain.select = vi.fn().mockReturnValue(chain);
    chain.eq = vi.fn().mockReturnValue(chain);
    chain.order = vi.fn().mockResolvedValue({ data: null, error: { message: 'db error' } });
    mockFrom.mockReturnValue(chain);

    const res = await GET(makeGetRequest({ proposal_id: validUuid }));
    expect(res.status).toBe(500);
  });
});

describe('POST /api/proposals/comment', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when not authenticated', async () => {
    mockGetSessionData.mockResolvedValue(null);
    const res = await POST(makePostRequest({ proposal_id: validUuid, body: 'Comment' }));
    expect(res.status).toBe(401);
  });

  it('returns 400 for empty body', async () => {
    mockGetSessionData.mockResolvedValue({ fid: 123 });
    const res = await POST(makePostRequest({ proposal_id: validUuid, body: '' }));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe('Validation failed');
  });

  it('returns 400 for body over 2000 characters', async () => {
    mockGetSessionData.mockResolvedValue({ fid: 123 });
    const res = await POST(makePostRequest({ proposal_id: validUuid, body: 'x'.repeat(2001) }));
    expect(res.status).toBe(400);
  });

  it('returns 400 for non-UUID proposal_id', async () => {
    mockGetSessionData.mockResolvedValue({ fid: 123 });
    const res = await POST(makePostRequest({ proposal_id: 'not-uuid', body: 'Valid' }));
    expect(res.status).toBe(400);
  });

  it('returns 400 for missing fields', async () => {
    mockGetSessionData.mockResolvedValue({ fid: 123 });
    const res = await POST(makePostRequest({}));
    expect(res.status).toBe(400);
  });

  it('returns 404 when user not found', async () => {
    mockGetSessionData.mockResolvedValue({ fid: 999 });

    const chain: Record<string, unknown> = {};
    chain.select = vi.fn().mockReturnValue(chain);
    chain.eq = vi.fn().mockReturnValue(chain);
    chain.single = vi.fn().mockResolvedValue({ data: null, error: null });
    mockFrom.mockReturnValue(chain);

    const res = await POST(makePostRequest({ proposal_id: validUuid, body: 'Comment text' }));
    expect(res.status).toBe(404);
    const json = await res.json();
    expect(json.error).toBe('User not found');
  });
});
