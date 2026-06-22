import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const { mockFrom } = vi.hoisted(() => ({ mockFrom: vi.fn() }));
vi.mock('@/lib/db/supabase', () => ({ supabaseAdmin: { from: mockFrom } }));

import { GET } from '@/app/api/members/directory/route';

const req = (q = '') => new NextRequest(`http://localhost:3000/api/members/directory${q}`);

/** users query chain: any builder returns the chain; .range() resolves the page. */
function usersChain(result: { data: unknown[]; count: number; error: unknown }) {
  const chain: Record<string, unknown> = {};
  for (const m of ['select', 'eq', 'or', 'ilike', 'gte', 'lte', 'order', 'not', 'in']) {
    chain[m] = vi.fn().mockReturnValue(chain);
  }
  chain.range = vi.fn().mockResolvedValue(result);
  return chain;
}
/** join chain: terminal builder resolves to { data }. */
function joinChain() {
  const chain: Record<string, unknown> = {};
  for (const m of ['select', 'eq', 'in']) chain[m] = vi.fn().mockReturnValue(chain);
  chain.or = vi.fn().mockResolvedValue({ data: [] });
  chain.then = vi.fn((r: (v: unknown) => void) => r({ data: [] }));
  return chain;
}

const user = {
  fid: 100,
  username: 'alice',
  display_name: 'Alice',
  pfp_url: null,
  primary_wallet: '0xaaa',
  member_tier: 'community',
  location: null,
  is_active: true,
  created_at: '2026-01-01T00:00:00Z',
  last_active_at: '2026-06-01T00:00:00Z',
};

describe('GET /api/members/directory', () => {
  beforeEach(() => vi.clearAllMocks());

  it('400 on an invalid tier enum', async () => {
    const res = await GET(req('?tier=bogus'));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe('Invalid params');
  });

  it('400 on an invalid sort enum', async () => {
    const res = await GET(req('?sort=sideways'));
    expect(res.status).toBe(400);
  });

  it('400 when min_respect is not a number', async () => {
    const res = await GET(req('?min_respect=lots'));
    expect(res.status).toBe(400);
  });

  it('returns a directory page on the happy path', async () => {
    mockFrom.mockImplementation((table: string) =>
      table === 'users' ? usersChain({ data: [user], count: 1, error: null }) : joinChain(),
    );
    const res = await GET(req('?tier=community'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.members)).toBe(true);
    expect(body.total).toBe(1);
    expect(body.pagination).toBeDefined();
  });
});
