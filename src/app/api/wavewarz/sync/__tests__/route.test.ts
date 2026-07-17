// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

// Empty wallets list so the scrape loop is a no-op
vi.mock('@/lib/wavewarz/constants', () => ({
  WAVEWARZ_WALLETS: [],
}));
vi.mock('@/lib/wavewarz/scraper', () => ({ scrapeArtistStats: vi.fn() }));
vi.mock('@/lib/wavewarz/proposals', () => ({
  createLeaderboardProposal: vi.fn().mockResolvedValue(null),
  createSessionReminderProposal: vi.fn().mockResolvedValue(null),
  createSpotlightProposal: vi.fn().mockResolvedValue(null),
  getNewSpotlightTier: vi.fn().mockReturnValue(null),
}));

const mockSingle = vi.hoisted(() => vi.fn());
const mockFrom = vi.hoisted(() =>
  vi.fn().mockReturnValue({
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: mockSingle,
  }),
);
vi.mock('@/lib/db/supabase', () => ({ supabaseAdmin: { from: mockFrom } }));

import { NextRequest } from 'next/server';
import { POST } from '../route';

afterEach(() => vi.clearAllMocks());

function makeRequest(authHeader?: string) {
  return new NextRequest(new URL('/api/wavewarz/sync', 'http://localhost:3000'), {
    method: 'POST',
    headers: authHeader ? { authorization: authHeader } : {},
  });
}

beforeEach(() => {
  process.env.CRON_SECRET = 'test-cron-secret';
});

describe('POST /api/wavewarz/sync', () => {
  it('returns 401 when authorization header is missing', async () => {
    const res = await POST(makeRequest());
    expect(res.status).toBe(401);
  });

  it('returns 401 when authorization header is wrong', async () => {
    const res = await POST(makeRequest('Bearer wrong-secret'));
    expect(res.status).toBe(401);
  });

  it('returns 500 when no admin user exists', async () => {
    mockSingle.mockResolvedValue({ data: null, error: null });
    const res = await POST(makeRequest('Bearer test-cron-secret'));
    expect(res.status).toBe(500);
  });

  it('returns ok:true with zero-count results when wallets list is empty', async () => {
    mockSingle.mockResolvedValue({ data: { id: 'admin-id' }, error: null });
    const res = await POST(makeRequest('Bearer test-cron-secret'));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.scraped).toBe(0);
    expect(body.failed).toBe(0);
  });
});
