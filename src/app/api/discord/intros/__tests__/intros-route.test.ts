import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const { mockFrom } = vi.hoisted(() => ({ mockFrom: vi.fn() }));

vi.mock('@/lib/db/supabase', () => ({
  getSupabaseAdmin: () => ({ from: mockFrom }),
}));

import { GET } from '@/app/api/discord/intros/route';

function singleChain(result: { data?: unknown; error?: unknown }) {
  const chain: Record<string, unknown> = {};
  for (const m of ['select', 'eq', 'order', 'limit']) chain[m] = vi.fn().mockReturnValue(chain);
  chain.maybeSingle = vi.fn().mockResolvedValue(result);
  return chain;
}
function listChain(result: { data?: unknown; error?: unknown }) {
  const chain: Record<string, unknown> = {};
  chain.select = vi.fn().mockReturnValue(chain);
  chain.order = vi.fn().mockReturnValue(chain);
  chain.then = vi.fn((resolve: (v: unknown) => void) => resolve(result));
  return chain;
}
const req = (q = '') => new NextRequest(`http://localhost:3000/api/discord/intros${q}`);
const intro = { discord_id: '123', discord_username: 'bob', intro_text: 'hi', posted_at: '2026-01-01' };

describe('GET /api/discord/intros', () => {
  beforeEach(() => vi.clearAllMocks());

  it('400 on a non-numeric discord_id', async () => {
    const res = await GET(req('?discord_id=not-a-snowflake'));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe('Invalid query parameters');
  });

  it('400 when neither discord_id nor all is provided', async () => {
    const res = await GET(req());
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe('Provide discord_id or all=true');
  });

  it('returns a single intro by discord_id', async () => {
    mockFrom.mockReturnValue(singleChain({ data: intro, error: null }));
    const res = await GET(req('?discord_id=123'));
    expect(res.status).toBe(200);
    expect((await res.json()).intro.discordId).toBe('123');
  });

  it('returns null intro when none found', async () => {
    mockFrom.mockReturnValue(singleChain({ data: null, error: null }));
    const res = await GET(req('?discord_id=999'));
    expect(res.status).toBe(200);
    expect((await res.json()).intro).toBeNull();
  });

  it('returns all intros with all=true', async () => {
    mockFrom.mockReturnValue(listChain({ data: [intro], error: null }));
    const res = await GET(req('?all=true'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.total).toBe(1);
    expect(body.intros[0].discordUsername).toBe('bob');
  });
});
