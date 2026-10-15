// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { makeGetRequest } from '@/test-utils/api-helpers';

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

const mockGetSessionData = vi.hoisted(() => vi.fn());
const mockGetFollowingFeed = vi.hoisted(() => vi.fn());

vi.mock('@/lib/auth/session', () => ({ getSessionData: mockGetSessionData }));
vi.mock('@/lib/farcaster/neynar', () => ({ getFollowingFeed: mockGetFollowingFeed }));

import { GET } from '../route';

const SESSION = { fid: 42, signerUuid: null, isAdmin: false };
const RAW_CAST = {
  hash: '0xabc',
  author: { fid: 7, username: 'artist', display_name: 'Artist', pfp_url: 'https://x/p.png' },
  text: 'new track out',
  timestamp: '2026-10-15T12:00:00.000Z',
  replies: { count: 2 },
  reactions: { likes_count: 5, recasts_count: 1, likes: [], recasts: [] },
  parent_hash: null,
  embeds: [],
};

beforeEach(() => vi.stubEnv('NEXT_PUBLIC_FARCASTER_FOLLOWING_FEED', '1'));
afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

describe('GET /api/chat/following', () => {
  it.each([
    undefined,
    '',
    '0',
    'true',
  ])('returns 404 and calls nothing when the flag is %s', async (flag) => {
    if (flag === undefined)
      vi.stubEnv('NEXT_PUBLIC_FARCASTER_FOLLOWING_FEED', undefined as unknown as string);
    else vi.stubEnv('NEXT_PUBLIC_FARCASTER_FOLLOWING_FEED', flag);
    const res = await GET(makeGetRequest('/api/chat/following'));
    expect(res.status).toBe(404);
    expect(mockGetSessionData).not.toHaveBeenCalled();
    expect(mockGetFollowingFeed).not.toHaveBeenCalled();
  });

  it('returns 401 without a session and does not reach Neynar', async () => {
    mockGetSessionData.mockResolvedValue(null);
    const res = await GET(makeGetRequest('/api/chat/following'));
    expect(res.status).toBe(401);
    expect(mockGetFollowingFeed).not.toHaveBeenCalled();
  });

  it('returns 400 for a wallet-only session with no FID', async () => {
    mockGetSessionData.mockResolvedValue({ ...SESSION, fid: 0 });
    const res = await GET(makeGetRequest('/api/chat/following'));
    expect(res.status).toBe(400);
    expect(mockGetFollowingFeed).not.toHaveBeenCalled();
  });

  it.each([
    { limit: '0' },
    { limit: '51' },
    { limit: 'abc' },
    { cursor: 'a b' },
    { cursor: 'x'.repeat(513) },
  ])('returns 400 for invalid query %o', async (params) => {
    mockGetSessionData.mockResolvedValue(SESSION);
    const res = await GET(makeGetRequest('/api/chat/following', params));
    expect(res.status).toBe(400);
    expect(mockGetFollowingFeed).not.toHaveBeenCalled();
  });

  it('fetches the session FID feed and maps casts plus the next cursor', async () => {
    mockGetSessionData.mockResolvedValue(SESSION);
    mockGetFollowingFeed.mockResolvedValue({
      casts: [RAW_CAST],
      next: { cursor: 'eyJwYWdlIjoyfQ==' },
    });
    const res = await GET(makeGetRequest('/api/chat/following', { limit: '10', cursor: 'abc123' }));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(mockGetFollowingFeed).toHaveBeenCalledWith(42, 'abc123', 10);
    expect(body.nextCursor).toBe('eyJwYWdlIjoyfQ==');
    expect(body.casts).toHaveLength(1);
    expect(body.casts[0]).toMatchObject({
      hash: '0xabc',
      author: { fid: 7, username: 'artist' },
      replies: { count: 2 },
      reactions: { likes_count: 5 },
    });
  });

  it('returns a null cursor on the last page', async () => {
    mockGetSessionData.mockResolvedValue(SESSION);
    mockGetFollowingFeed.mockResolvedValue({ casts: [], next: { cursor: null } });
    const res = await GET(makeGetRequest('/api/chat/following'));
    expect((await res.json()).nextCursor).toBeNull();
    expect(mockGetFollowingFeed).toHaveBeenCalledWith(42, undefined, 25);
  });

  it('returns 502 when Neynar throws, without leaking the error', async () => {
    mockGetSessionData.mockResolvedValue(SESSION);
    mockGetFollowingFeed.mockRejectedValue(
      new Error('Neynar following feed error 500: secret detail'),
    );
    const res = await GET(makeGetRequest('/api/chat/following'));
    const body = await res.json();
    expect(res.status).toBe(502);
    expect(JSON.stringify(body)).not.toContain('secret detail');
  });

  it('returns 502 on an unexpected response shape', async () => {
    mockGetSessionData.mockResolvedValue(SESSION);
    mockGetFollowingFeed.mockResolvedValue({ result: 'nope' });
    const res = await GET(makeGetRequest('/api/chat/following'));
    expect(res.status).toBe(502);
  });
});
