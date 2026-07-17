// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';
import { makeGetRequest } from '@/test-utils/api-helpers';

const mockFrom = vi.hoisted(() => vi.fn());
vi.mock('@/lib/db/supabase', () => ({ supabaseAdmin: { from: mockFrom } }));

import { GET } from '../route';

function makeChain(result: { data: unknown; error: unknown }) {
  const chain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    contains: vi.fn().mockReturnThis(),
    then: vi.fn((resolve: (v: unknown) => void) => resolve(result)),
  };
  return chain;
}

afterEach(() => vi.clearAllMocks());

describe('GET /api/nexus/links', () => {
  it('returns links and count on success', async () => {
    const mockLinks = [{ id: '1', title: 'ZAO Site', portal_group: 'MUSIC' }];
    mockFrom.mockReturnValue(makeChain({ data: mockLinks, error: null }));
    const req = makeGetRequest('/api/nexus/links');
    const res = await GET(req);
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.links).toHaveLength(1);
    expect(body.count).toBe(1);
  });

  it('returns 400 for an overlong portal_group param', async () => {
    const req = makeGetRequest('/api/nexus/links', { portal_group: 'x'.repeat(101) });
    const res = await GET(req);
    expect(res.status).toBe(400);
  });

  it('returns 500 when Supabase returns an error', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: { message: 'DB error' } }));
    const req = makeGetRequest('/api/nexus/links');
    const res = await GET(req);
    expect(res.status).toBe(500);
  });

  it('returns empty links array when data is null (no error)', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: null }));
    const req = makeGetRequest('/api/nexus/links');
    const res = await GET(req);
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.links).toEqual([]);
    expect(body.count).toBe(0);
  });
});
