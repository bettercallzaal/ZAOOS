// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';
import { makePostRequest } from '@/test-utils/api-helpers';

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

const mockGetSessionData = vi.hoisted(() => vi.fn());
vi.mock('@/lib/auth/session', () => ({ getSessionData: mockGetSessionData }));

const mockIsMusicUrl = vi.hoisted(() => vi.fn());
vi.mock('@/lib/music/isMusicUrl', () => ({ isMusicUrl: mockIsMusicUrl }));

vi.mock('@/lib/publish/auto-cast', () => ({ autoCastToZao: vi.fn().mockResolvedValue(undefined) }));

// Shared chain builder — supports both .maybeSingle() and await-as-thenable
function makeChain(result: { data: unknown; error: unknown }) {
  const chain: Record<string, unknown> = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lt: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue(result),
    single: vi.fn().mockResolvedValue(result),
    then: (resolve: (v: unknown) => void) => resolve(result),
  };
  // insert() needs to return a chain too
  (chain.insert as ReturnType<typeof vi.fn>).mockReturnValue({
    select: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(result),
  });
  return chain;
}

const mockFrom = vi.hoisted(() => vi.fn());
vi.mock('@/lib/db/supabase', () => ({ supabaseAdmin: { from: mockFrom } }));

import { GET, POST } from '../route';

afterEach(() => vi.clearAllMocks());

const MOCK_SESSION = { fid: 10, username: 'zabal' };
const VALID_BODY = {
  url: 'https://open.spotify.com/track/abc123',
  title: 'ZAO Anthem',
  artist: 'ZAO',
};

describe('GET /api/music/track-of-day', () => {
  it('returns 401 when no session', async () => {
    mockGetSessionData.mockResolvedValue(null);
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it('returns 200 with empty nominations when no tracks exist today', async () => {
    mockGetSessionData.mockResolvedValue(MOCK_SESSION);
    mockFrom.mockReturnValue(makeChain({ data: null, error: null }));
    const res = await GET();
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.nominations).toEqual([]);
    expect(body.selected).toBeNull();
    expect(body.today).toBeDefined();
  });
});

describe('POST /api/music/track-of-day', () => {
  it('returns 401 when no session', async () => {
    mockGetSessionData.mockResolvedValue(null);
    const req = makePostRequest('/api/music/track-of-day', VALID_BODY);
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('returns 400 for invalid input (missing title)', async () => {
    mockGetSessionData.mockResolvedValue(MOCK_SESSION);
    const req = makePostRequest('/api/music/track-of-day', { url: 'https://spotify.com/x', artist: 'ZAO' });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('returns 400 when URL is not a recognized music URL', async () => {
    mockGetSessionData.mockResolvedValue(MOCK_SESSION);
    mockIsMusicUrl.mockReturnValue(null);
    const req = makePostRequest('/api/music/track-of-day', VALID_BODY);
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('returns 409 when user already nominated today', async () => {
    mockGetSessionData.mockResolvedValue(MOCK_SESSION);
    mockIsMusicUrl.mockReturnValue('spotify');
    // First from() call: check existing nomination → returns a record
    mockFrom.mockReturnValue(makeChain({ data: [{ id: 'existing-nom' }], error: null }));
    const req = makePostRequest('/api/music/track-of-day', VALID_BODY);
    const res = await POST(req);
    expect(res.status).toBe(409);
  });

  it('returns nomination on success', async () => {
    mockGetSessionData.mockResolvedValue(MOCK_SESSION);
    mockIsMusicUrl.mockReturnValue('spotify');
    const mockNomination = { id: 'nom-new', track_url: VALID_BODY.url, track_title: VALID_BODY.title };
    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      if (callCount <= 2) {
        // First two: existing nomination + dupe URL checks → empty
        return makeChain({ data: [], error: null });
      }
      // Third: insert → nomination data
      return makeChain({ data: mockNomination, error: null });
    });
    const req = makePostRequest('/api/music/track-of-day', VALID_BODY);
    const res = await POST(req);
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.nomination.id).toBe('nom-new');
  });
});
