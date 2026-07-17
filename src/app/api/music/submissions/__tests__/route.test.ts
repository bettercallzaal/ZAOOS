// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';
import { makeGetRequest, makePostRequest } from '@/test-utils/api-helpers';

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));
vi.mock('@/../community.config', () => ({
  communityConfig: { farcaster: { channels: ['zao', 'music'] } },
}));
vi.mock('@/lib/music/library', () => ({ upsertSong: vi.fn().mockResolvedValue(undefined) }));

const mockGetSessionData = vi.hoisted(() => vi.fn());
vi.mock('@/lib/auth/session', () => ({ getSessionData: mockGetSessionData }));

const mockIsMusicUrl = vi.hoisted(() => vi.fn());
vi.mock('@/lib/music/isMusicUrl', () => ({ isMusicUrl: mockIsMusicUrl }));

// Supabase mock: chainable with both thenable and method calls
function makeChain(result: { data: unknown; error: unknown }) {
  const chain: Record<string, unknown> = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(result),
    then: (resolve: (v: unknown) => void) => resolve(result),
  };
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

const MOCK_SESSION = { fid: 10, username: 'zabal', displayName: 'ZAO', isAdmin: false };
const VALID_SUBMIT_BODY = { url: 'https://open.spotify.com/track/abc', title: 'ZAO Anthem', artist: 'ZAO' };

describe('GET /api/music/submissions', () => {
  it('returns 401 when no session', async () => {
    mockGetSessionData.mockResolvedValue(null);
    const req = makeGetRequest('/api/music/submissions');
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it('returns empty submissions array when none exist', async () => {
    mockGetSessionData.mockResolvedValue(MOCK_SESSION);
    mockFrom.mockReturnValue(makeChain({ data: [], error: null }));
    const req = makeGetRequest('/api/music/submissions');
    const res = await GET(req);
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.submissions).toEqual([]);
  });

  it('returns enriched submissions with vote counts', async () => {
    mockGetSessionData.mockResolvedValue(MOCK_SESSION);
    const mockSubs = [{ id: 'sub-1', url: 'https://spotify.com/x' }];
    let fromCount = 0;
    mockFrom.mockImplementation(() => {
      fromCount++;
      if (fromCount === 1) return makeChain({ data: mockSubs, error: null });
      return makeChain({ data: [{ submission_id: 'sub-1' }], error: null });
    });
    const req = makeGetRequest('/api/music/submissions');
    const res = await GET(req);
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.submissions).toHaveLength(1);
    expect(body.submissions[0].vote_count).toBeDefined();
  });
});

describe('POST /api/music/submissions', () => {
  it('returns 401 when no session', async () => {
    mockGetSessionData.mockResolvedValue(null);
    const req = makePostRequest('/api/music/submissions', VALID_SUBMIT_BODY);
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('returns 400 for invalid payload (missing url)', async () => {
    mockGetSessionData.mockResolvedValue(MOCK_SESSION);
    const req = makePostRequest('/api/music/submissions', { title: 'No URL' });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('returns 400 when URL is not a recognized music URL', async () => {
    mockGetSessionData.mockResolvedValue(MOCK_SESSION);
    mockIsMusicUrl.mockReturnValue(null);
    const req = makePostRequest('/api/music/submissions', VALID_SUBMIT_BODY);
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('returns success:true with submission data', async () => {
    mockGetSessionData.mockResolvedValue(MOCK_SESSION);
    mockIsMusicUrl.mockReturnValue('spotify');
    const mockSub = { id: 'sub-new', url: VALID_SUBMIT_BODY.url, status: 'pending' };
    let fromCount = 0;
    mockFrom.mockImplementation(() => {
      fromCount++;
      if (fromCount === 1) return makeChain({ data: [], error: null }); // duplicate check
      return makeChain({ data: mockSub, error: null }); // insert
    });
    const req = makePostRequest('/api/music/submissions', VALID_SUBMIT_BODY);
    const res = await POST(req);
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.submission.id).toBe('sub-new');
  });
});
