import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const { mockFrom } = vi.hoisted(() => ({ mockFrom: vi.fn() }));

vi.mock('@/lib/db/supabase', () => ({
  supabaseAdmin: { from: mockFrom },
}));

// ENS helpers are only reached after a user is found; stub so the import resolves.
vi.mock('@/lib/ens/resolve', () => ({
  resolveENSNames: vi.fn(),
  getENSTextRecords: vi.fn(),
  getENSAvatar: vi.fn(),
  resolveBasenames: vi.fn(),
}));

import { GET } from '@/app/api/members/[username]/route';

/** users lookup chain whose maybeSingle resolves to the given result. */
function userChain(result: { data?: unknown }) {
  const chain: Record<string, unknown> = {};
  for (const m of ['select', 'ilike', 'eq']) chain[m] = vi.fn().mockReturnValue(chain);
  chain.maybeSingle = vi.fn().mockResolvedValue(result);
  return chain;
}

const ctx = (username: string) => ({ params: Promise.resolve({ username }) });
const req = () => new NextRequest('http://localhost:3000/api/members/x');

describe('GET /api/members/[username]', () => {
  beforeEach(() => vi.clearAllMocks());

  it('400 when the username exceeds the length bound', async () => {
    const res = await GET(req(), ctx('a'.repeat(101)));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe('Invalid username');
  });

  it('404 when no user matches the username', async () => {
    mockFrom.mockReturnValue(userChain({ data: null }));
    const res = await GET(req(), ctx('ghost'));
    expect(res.status).toBe(404);
    expect((await res.json()).error).toBe('Member not found');
  });

  it('404 for a numeric lookup with no matching FID', async () => {
    // username query + fid query both miss
    mockFrom.mockReturnValue(userChain({ data: null }));
    const res = await GET(req(), ctx('999999'));
    expect(res.status).toBe(404);
  });
});
