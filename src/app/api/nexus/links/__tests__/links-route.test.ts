import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockFrom } = vi.hoisted(() => ({
  mockFrom: vi.fn(),
}));

vi.mock('@/lib/db/supabase', () => ({
  supabaseAdmin: { from: mockFrom },
}));

import { GET } from '@/app/api/nexus/links/route';

/** Thenable Supabase query chain that resolves to the given result. */
function chainMock(result: { data?: unknown; error?: unknown }) {
  const chain: Record<string, unknown> = {};
  chain.select = vi.fn().mockReturnValue(chain);
  chain.eq = vi.fn().mockReturnValue(chain);
  chain.order = vi.fn().mockReturnValue(chain);
  chain.contains = vi.fn().mockReturnValue(chain);
  chain.then = vi.fn((resolve: (val: unknown) => void) => resolve(result));
  return chain;
}

function makeReq(query = '') {
  return new NextRequest(`http://localhost:3000/api/nexus/links${query}`);
}

const sampleLink = {
  id: 'l1',
  title: 'ZAO Site',
  url: 'https://thezao.com',
  portal_group: 'MUSIC',
  category: 'ZAO Projects',
  is_active: true,
  is_featured: false,
};

describe('GET /api/nexus/links', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns active links with a count (no filters)', async () => {
    mockFrom.mockReturnValue(chainMock({ data: [sampleLink], error: null }));
    const res = await GET(makeReq());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.links).toEqual([sampleLink]);
    expect(body.count).toBe(1);
  });

  it('accepts valid filter params', async () => {
    mockFrom.mockReturnValue(chainMock({ data: [], error: null }));
    const res = await GET(makeReq('?portal_group=MUSIC&category=ZAO%20Projects&featured=true'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.count).toBe(0);
  });

  it('rejects an over-long filter param with 400', async () => {
    const tooLong = 'a'.repeat(101);
    const res = await GET(makeReq(`?portal_group=${tooLong}`));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid query parameters');
  });

  it('returns 500 when the query errors', async () => {
    mockFrom.mockReturnValue(chainMock({ data: null, error: { message: 'db down' } }));
    const res = await GET(makeReq());
    expect(res.status).toBe(500);
  });
});
