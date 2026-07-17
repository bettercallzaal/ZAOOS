// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));
vi.mock('@/lib/env', () => ({ ENV: { JUKE_API_KEY: undefined } }));
vi.mock('@/lib/spaces/juke-api-reads', () => ({ getJukeRoomDetail: vi.fn() }));
vi.mock('@/lib/social/sweep100msRooms', () => ({
  sweepStale100msRooms: vi.fn().mockResolvedValue({ checked: 0, ended: 0, skipped: 0, endedIds: [] }),
}));

const mockOrder = vi.hoisted(() => vi.fn());
const mockFrom = vi.hoisted(() => vi.fn());
vi.mock('@/lib/db/supabase', () => ({ supabaseAdmin: { from: mockFrom } }));

import { NextRequest } from 'next/server';
import { GET } from '../route';

beforeEach(() => {
  process.env.CRON_SECRET = 'test-cron-secret';
});
afterEach(() => {
  vi.clearAllMocks();
  delete process.env.CRON_SECRET;
});

function makeRequest(authHeader?: string) {
  return new NextRequest(new URL('/api/cron/juke-stale-rooms', 'http://localhost:3000'), {
    headers: authHeader ? { authorization: authHeader } : {},
  });
}

describe('GET /api/cron/juke-stale-rooms', () => {
  it('returns 401 when authorization header is wrong', async () => {
    const res = await GET(makeRequest('Bearer wrong-secret'));
    expect(res.status).toBe(401);
  });

  it('returns 500 when candidate query fails', async () => {
    mockOrder.mockRejectedValue(new Error('DB error'));
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      lt: vi.fn().mockReturnThis(),
      order: mockOrder,
    });
    const res = await GET(makeRequest('Bearer test-cron-secret'));
    expect(res.status).toBe(500);
  });

  it('returns ok:true with zeros when no candidates found', async () => {
    mockOrder.mockReturnValue({
      limit: vi.fn().mockResolvedValue({ data: [], error: null }),
    });
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      lt: vi.fn().mockReturnThis(),
      order: mockOrder,
    });
    const res = await GET(makeRequest('Bearer test-cron-secret'));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.checked).toBe(0);
    expect(body.ended).toBe(0);
  });
});
