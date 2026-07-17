// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

const mockSweepStale100msRooms = vi.hoisted(() => vi.fn());
vi.mock('@/lib/social/sweep100msRooms', () => ({
  sweepStale100msRooms: mockSweepStale100msRooms,
}));

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
  return new NextRequest(new URL('/api/cron/100ms-stale-rooms', 'http://localhost:3000'), {
    headers: authHeader ? { authorization: authHeader } : {},
  });
}

describe('GET /api/cron/100ms-stale-rooms', () => {
  it('returns 401 when authorization header is missing', async () => {
    const res = await GET(makeRequest());
    expect(res.status).toBe(401);
  });

  it('returns 401 when authorization header is wrong', async () => {
    const res = await GET(makeRequest('Bearer wrong-secret'));
    expect(res.status).toBe(401);
  });

  it('returns 500 when sweep throws', async () => {
    mockSweepStale100msRooms.mockRejectedValue(new Error('Sweep error'));
    const res = await GET(makeRequest('Bearer test-cron-secret'));
    expect(res.status).toBe(500);
  });

  it('returns ok:true with sweep result on success', async () => {
    mockSweepStale100msRooms.mockResolvedValue({ endedIds: ['room-1', 'room-2'], count: 2 });
    const res = await GET(makeRequest('Bearer test-cron-secret'));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.ended_ids).toEqual(['room-1', 'room-2']);
  });
});
