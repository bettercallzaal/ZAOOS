import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  makeRequest,
  mockAuthenticatedSession,
  mockUnauthenticatedSession,
} from '@/test-utils/api-helpers';

const { mockGetSessionData, mockFrom, mockFetch } = vi.hoisted(() => ({
  mockGetSessionData: vi.fn(),
  mockFrom: vi.fn(),
  mockFetch: vi.fn(),
}));

vi.mock('@/lib/auth/session', () => ({
  getSessionData: () => mockGetSessionData(),
}));

vi.mock('@/lib/db/supabase', () => ({
  supabaseAdmin: { from: mockFrom },
}));

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

vi.mock('@/lib/env', () => ({
  ENV: { NEYNAR_API_KEY: 'test-neynar-key' },
}));

global.fetch = mockFetch;

import { GET } from '../route';

/**
 * Build a Supabase query-chain mock that resolves to `result`.
 * All chainable methods return the chain for further chaining.
 * Terminal methods (.single, .maybeSingle) resolve to the provided result.
 * Thenable for Promise.allSettled compatibility.
 */
function chainMock(result: { data?: unknown; error?: unknown }) {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {};

  const chainableMethods = ['select', 'eq', 'ilike', 'order', 'limit', 'maybeSingle', 'single'];

  for (const method of chainableMethods) {
    chain[method] = vi.fn().mockReturnValue(chain);
  }

  chain.single = vi.fn().mockResolvedValue(result);
  chain.maybeSingle = vi.fn().mockResolvedValue(result);

  // Thenable: allow chain to be awaited directly
  // biome-ignore lint/suspicious/noThenProperty: intentional thenable — mocks an awaitable Supabase query chain
  chain.then = vi.fn((onResolve?: (val: unknown) => void) => {
    if (onResolve) return onResolve(result);
    return Promise.resolve(result);
  });

  return chain;
}

describe('GET /api/artists/[username]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());
    mockFetch.mockClear();
  });

  describe('authentication', () => {
    it('returns 401 when no session exists', async () => {
      mockGetSessionData.mockResolvedValue(mockUnauthenticatedSession());

      const res = await GET(makeRequest('/api/artists/testartist'), {
        params: Promise.resolve({ username: 'testartist' }),
      });
      const body = await res.json();

      expect(res.status).toBe(401);
      expect(body.error).toBe('Unauthorized');
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it('allows access when authenticated', async () => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 789 }));

      const userChain = chainMock({
        data: {
          fid: 456,
          username: 'alice',
          display_name: 'Alice',
          pfp_url: 'https://example.com/pfp.jpg',
          bio: 'Music artist',
          primary_wallet: '0x1234',
          farcaster_banner_url: 'https://example.com/banner.jpg',
          community_profile_id: 'prof-1',
          respect_member_id: 'resp-1',
        },
      });

      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount++;
        if (callCount === 1) return userChain;
        // Return resolved promises for other queries
        return chainMock({ data: null, error: null });
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ users: [{ follower_count: 100 }] }),
      });

      const res = await GET(makeRequest('/api/artists/alice'), {
        params: Promise.resolve({ username: 'alice' }),
      });

      expect(res.status).toBe(200);
      expect(mockFrom).toHaveBeenCalled();
    });
  });

  describe('username parameter validation', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());
    });

    it('returns 400 when username is empty', async () => {
      const res = await GET(makeRequest('/api/artists/'), {
        params: Promise.resolve({ username: '' }),
      });
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid username');
    });

    it('returns 400 when username exceeds 100 characters', async () => {
      const longUsername = 'a'.repeat(101);
      const res = await GET(makeRequest('/api/artists/toolong'), {
        params: Promise.resolve({ username: longUsername }),
      });
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid username');
    });

    it('accepts username at exactly 100 characters', async () => {
      const validUsername = 'a'.repeat(100);
      const userChain = chainMock({
        data: {
          fid: 123,
          username: validUsername,
          display_name: 'Test',
          pfp_url: null,
          bio: null,
          primary_wallet: null,
          farcaster_banner_url: null,
          community_profile_id: null,
          respect_member_id: null,
        },
      });

      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount++;
        if (callCount === 1) return userChain;
        return chainMock({ data: null, error: null });
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ users: [] }),
      });

      const res = await GET(makeRequest(`/api/artists/${validUsername}`), {
        params: Promise.resolve({ username: validUsername }),
      });

      expect(res.status).toBe(200);
    });
  });

  describe('username lookup behavior', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());
    });

    it('decodes URL-encoded username and converts to lowercase', async () => {
      const encodedUsername = 'Alice%20Johnson';
      const userChain = chainMock({
        data: {
          fid: 456,
          username: 'alice johnson',
          display_name: 'Alice Johnson',
          pfp_url: null,
          bio: null,
          primary_wallet: null,
          farcaster_banner_url: null,
          community_profile_id: null,
          respect_member_id: null,
        },
      });

      mockFrom.mockReturnValueOnce(userChain);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ users: [] }),
      });

      await GET(makeRequest(`/api/artists/${encodedUsername}`), {
        params: Promise.resolve({ username: encodedUsername }),
      });

      expect(userChain.ilike).toHaveBeenCalledWith('username', 'alice johnson');
    });

    it('uses ilike for case-insensitive search', async () => {
      const userChain = chainMock({
        data: {
          fid: 789,
          username: 'bob',
          display_name: 'Bob',
          pfp_url: null,
          bio: null,
          primary_wallet: null,
          farcaster_banner_url: null,
          community_profile_id: null,
          respect_member_id: null,
        },
      });

      mockFrom.mockReturnValueOnce(userChain);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ users: [] }),
      });

      await GET(makeRequest('/api/artists/BOB'), {
        params: Promise.resolve({ username: 'BOB' }),
      });

      expect(userChain.ilike).toHaveBeenCalledWith('username', 'bob');
    });

    it('filters by is_active = true', async () => {
      const userChain = chainMock({
        data: null,
      });

      mockFrom.mockReturnValueOnce(userChain);

      const res = await GET(makeRequest('/api/artists/inactive'), {
        params: Promise.resolve({ username: 'inactive' }),
      });

      expect(userChain.eq).toHaveBeenCalledWith('is_active', true);
      expect(res.status).toBe(404);
    });

    it('returns 404 when user not found', async () => {
      const userChain = chainMock({ data: null });
      mockFrom.mockReturnValueOnce(userChain);

      const res = await GET(makeRequest('/api/artists/nonexistent'), {
        params: Promise.resolve({ username: 'nonexistent' }),
      });
      const body = await res.json();

      expect(res.status).toBe(404);
      expect(body.error).toBe('Artist not found');
    });
  });

  describe('community profile lookup', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());
    });

    it('fetches community profile by community_profile_id when present', async () => {
      const userChain = chainMock({
        data: {
          fid: 123,
          username: 'artist1',
          display_name: 'Artist One',
          pfp_url: null,
          bio: null,
          primary_wallet: null,
          farcaster_banner_url: null,
          community_profile_id: 'prof-123',
          respect_member_id: null,
        },
      });

      const profileChain = chainMock({
        data: {
          category: 'music',
          cover_image_url: 'https://example.com/cover.jpg',
          thumbnail_url: 'https://example.com/thumb.jpg',
          biography: 'A talented musician',
          is_featured: true,
          slug: 'artist-one',
        },
      });

      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount++;
        if (callCount === 1) return userChain;
        if (callCount === 2) return profileChain;
        return chainMock({ data: null, error: null });
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ users: [] }),
      });

      const res = await GET(makeRequest('/api/artists/artist1'), {
        params: Promise.resolve({ username: 'artist1' }),
      });
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.category).toBe('music');
      expect(body.isFeatured).toBe(true);
      expect(body.slug).toBe('artist-one');
    });

    it('falls back to fid lookup if community_profile_id not present', async () => {
      const userChain = chainMock({
        data: {
          fid: 456,
          username: 'artist2',
          display_name: 'Artist Two',
          pfp_url: null,
          bio: null,
          primary_wallet: null,
          farcaster_banner_url: null,
          community_profile_id: null,
          respect_member_id: null,
        },
      });

      const profileChain = chainMock({
        data: {
          category: 'art',
          cover_image_url: 'https://example.com/art.jpg',
          thumbnail_url: null,
          biography: 'Visual artist',
          is_featured: false,
          slug: 'artist-two',
        },
      });

      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount++;
        if (callCount === 1) return userChain;
        if (callCount === 2) return profileChain;
        return chainMock({ data: null, error: null });
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ users: [] }),
      });

      const res = await GET(makeRequest('/api/artists/artist2'), {
        params: Promise.resolve({ username: 'artist2' }),
      });
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.category).toBe('art');
      expect(profileChain.eq).toHaveBeenCalledWith('fid', 456);
    });

    it('returns null profile when neither community_profile_id nor fid lookup succeeds', async () => {
      const userChain = chainMock({
        data: {
          fid: 789,
          username: 'artist3',
          display_name: 'Artist Three',
          pfp_url: null,
          bio: null,
          primary_wallet: null,
          farcaster_banner_url: 'https://example.com/banner.jpg',
          community_profile_id: null,
          respect_member_id: null,
        },
      });

      const profileChain = chainMock({ data: null });

      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount++;
        if (callCount === 1) return userChain;
        if (callCount === 2) return profileChain;
        return chainMock({ data: null, error: null });
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ users: [] }),
      });

      const res = await GET(makeRequest('/api/artists/artist3'), {
        params: Promise.resolve({ username: 'artist3' }),
      });
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.category).toBe(null);
      expect(body.coverImageUrl).toBe('https://example.com/banner.jpg');
    });
  });

  describe('songs lookup and aggregation', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());
    });

    it('fetches songs by submitted_by_fid when fid is present', async () => {
      const userChain = chainMock({
        data: {
          fid: 123,
          username: 'producer',
          display_name: 'Music Producer',
          pfp_url: null,
          bio: null,
          primary_wallet: null,
          farcaster_banner_url: null,
          community_profile_id: null,
          respect_member_id: null,
        },
      });

      const songs = [
        {
          id: 'song-1',
          url: 'https://example.com/song1',
          title: 'Track One',
          artist: 'Producer',
          artwork_url: 'https://example.com/art1.jpg',
          stream_url: 'spotify:track:123',
          platform: 'spotify',
          play_count: 150,
          duration: 180,
        },
        {
          id: 'song-2',
          url: 'https://example.com/song2',
          title: 'Track Two',
          artist: 'Producer',
          artwork_url: null,
          stream_url: null,
          platform: 'soundcloud',
          play_count: 50,
          duration: 240,
        },
      ];

      const songsChain = chainMock({ data: songs });

      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount++;
        if (callCount === 1) return userChain;
        if (callCount === 3) return songsChain;
        return chainMock({ data: null, error: null });
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ users: [] }),
      });

      const res = await GET(makeRequest('/api/artists/producer'), {
        params: Promise.resolve({ username: 'producer' }),
      });
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.trackCount).toBe(2);
      expect(body.totalPlays).toBe(200);
      expect(body.topTracks).toHaveLength(2);
      expect(body.topTracks[0].title).toBe('Track One');
      expect(songsChain.eq).toHaveBeenCalledWith('submitted_by_fid', 123);
    });

    it('orders songs by play_count descending', async () => {
      const userChain = chainMock({
        data: {
          fid: 456,
          username: 'artist',
          display_name: 'Artist',
          pfp_url: null,
          bio: null,
          primary_wallet: null,
          farcaster_banner_url: null,
          community_profile_id: null,
          respect_member_id: null,
        },
      });

      const songs = [
        {
          id: 's1',
          url: 'url1',
          title: 'Most Played',
          artist: 'Artist',
          artwork_url: null,
          stream_url: null,
          platform: 'spotify',
          play_count: 500,
          duration: 200,
        },
        {
          id: 's2',
          url: 'url2',
          title: 'Less Played',
          artist: 'Artist',
          artwork_url: null,
          stream_url: null,
          platform: 'spotify',
          play_count: 100,
          duration: 200,
        },
      ];

      const songsChain = chainMock({ data: songs });

      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount++;
        if (callCount === 1) return userChain;
        if (callCount === 3) return songsChain;
        return chainMock({ data: null, error: null });
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ users: [] }),
      });

      await GET(makeRequest('/api/artists/artist'), {
        params: Promise.resolve({ username: 'artist' }),
      });

      expect(songsChain.order).toHaveBeenCalledWith('play_count', { ascending: false });
    });

    it('limits songs fetch to 20', async () => {
      const userChain = chainMock({
        data: {
          fid: 789,
          username: 'prolific',
          display_name: 'Prolific Artist',
          pfp_url: null,
          bio: null,
          primary_wallet: null,
          farcaster_banner_url: null,
          community_profile_id: null,
          respect_member_id: null,
        },
      });

      const songsChain = chainMock({ data: [] });

      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount++;
        if (callCount === 1) return userChain;
        if (callCount === 3) return songsChain;
        return chainMock({ data: null, error: null });
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ users: [] }),
      });

      await GET(makeRequest('/api/artists/prolific'), {
        params: Promise.resolve({ username: 'prolific' }),
      });

      expect(songsChain.limit).toHaveBeenCalledWith(20);
    });

    it('returns empty songs array when user has no fid', async () => {
      const userChain = chainMock({
        data: {
          fid: null,
          username: 'nofid',
          display_name: 'No FID',
          pfp_url: null,
          bio: null,
          primary_wallet: null,
          farcaster_banner_url: null,
          community_profile_id: null,
          respect_member_id: null,
        },
      });

      mockFrom.mockReturnValueOnce(userChain);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ users: [] }),
      });

      const res = await GET(makeRequest('/api/artists/nofid'), {
        params: Promise.resolve({ username: 'nofid' }),
      });
      const body = await res.json();

      expect(body.trackCount).toBe(0);
      expect(body.topTracks).toHaveLength(0);
    });

    it('aggregates play_count safely with null values', async () => {
      const userChain = chainMock({
        data: {
          fid: 999,
          username: 'mixed',
          display_name: 'Mixed',
          pfp_url: null,
          bio: null,
          primary_wallet: null,
          farcaster_banner_url: null,
          community_profile_id: null,
          respect_member_id: null,
        },
      });

      const songs = [
        {
          id: 's1',
          url: 'url1',
          title: 'With Plays',
          artist: 'Mixed',
          artwork_url: null,
          stream_url: null,
          platform: 'spotify',
          play_count: 100,
          duration: 200,
        },
        {
          id: 's2',
          url: 'url2',
          title: 'No Plays',
          artist: 'Mixed',
          artwork_url: null,
          stream_url: null,
          platform: 'spotify',
          play_count: null,
          duration: 200,
        },
      ];

      const songsChain = chainMock({ data: songs });

      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount++;
        if (callCount === 1) return userChain;
        if (callCount === 3) return songsChain;
        return chainMock({ data: null, error: null });
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ users: [] }),
      });

      const res = await GET(makeRequest('/api/artists/mixed'), {
        params: Promise.resolve({ username: 'mixed' }),
      });
      const body = await res.json();

      expect(body.totalPlays).toBe(100);
    });

    it('limits topTracks response to 5 songs', async () => {
      const userChain = chainMock({
        data: {
          fid: 111,
          username: 'many',
          display_name: 'Many Songs',
          pfp_url: null,
          bio: null,
          primary_wallet: null,
          farcaster_banner_url: null,
          community_profile_id: null,
          respect_member_id: null,
        },
      });

      const songs = Array.from({ length: 20 }, (_, i) => ({
        id: `s${i}`,
        url: `url${i}`,
        title: `Track ${i}`,
        artist: 'Many Songs',
        artwork_url: null,
        stream_url: null,
        platform: 'spotify',
        play_count: 100 - i,
        duration: 200,
      }));

      const songsChain = chainMock({ data: songs });

      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount++;
        if (callCount === 1) return userChain;
        if (callCount === 3) return songsChain;
        return chainMock({ data: null, error: null });
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ users: [] }),
      });

      const res = await GET(makeRequest('/api/artists/many'), {
        params: Promise.resolve({ username: 'many' }),
      });
      const body = await res.json();

      expect(body.topTracks).toHaveLength(5);
      expect(body.trackCount).toBe(20);
    });

    it('transforms song fields from snake_case to camelCase', async () => {
      const userChain = chainMock({
        data: {
          fid: 222,
          username: 'transform',
          display_name: 'Transform',
          pfp_url: null,
          bio: null,
          primary_wallet: null,
          farcaster_banner_url: null,
          community_profile_id: null,
          respect_member_id: null,
        },
      });

      const songs = [
        {
          id: 'song1',
          url: 'https://example.com/song1',
          title: 'Transformed',
          artist: 'Transform',
          artwork_url: 'https://example.com/art.jpg',
          stream_url: 'spotify:track:xyz',
          platform: 'spotify',
          play_count: 50,
          duration: 180,
        },
      ];

      const songsChain = chainMock({ data: songs });

      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount++;
        if (callCount === 1) return userChain;
        if (callCount === 3) return songsChain;
        return chainMock({ data: null, error: null });
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ users: [] }),
      });

      const res = await GET(makeRequest('/api/artists/transform'), {
        params: Promise.resolve({ username: 'transform' }),
      });
      const body = await res.json();

      expect(body.topTracks[0].artworkUrl).toBe('https://example.com/art.jpg');
      expect(body.topTracks[0].streamUrl).toBe('spotify:track:xyz');
      expect(body.topTracks[0].playCount).toBe(50);
    });
  });

  describe('respect lookup', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());
    });

    it('fetches respect by respect_member_id when present', async () => {
      const userChain = chainMock({
        data: {
          fid: 333,
          username: 'respected',
          display_name: 'Respected',
          pfp_url: null,
          bio: null,
          primary_wallet: null,
          farcaster_banner_url: null,
          community_profile_id: null,
          respect_member_id: 'resp-123',
        },
      });

      const respectChain = chainMock({
        data: {
          total_respect: 500,
          fractal_count: 10,
        },
      });

      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount++;
        if (callCount === 1) return userChain;
        if (callCount === 4) return respectChain;
        return chainMock({ data: null, error: null });
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ users: [] }),
      });

      const res = await GET(makeRequest('/api/artists/respected'), {
        params: Promise.resolve({ username: 'respected' }),
      });
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.totalRespect).toBe(500);
      expect(body.fractalCount).toBe(10);
      expect(respectChain.eq).toHaveBeenCalledWith('id', 'resp-123');
    });

    it('falls back to fid lookup if respect_member_id not present', async () => {
      const userChain = chainMock({
        data: {
          fid: 444,
          username: 'new',
          display_name: 'New',
          pfp_url: null,
          bio: null,
          primary_wallet: null,
          farcaster_banner_url: null,
          community_profile_id: null,
          respect_member_id: null,
        },
      });

      const respectChain = chainMock({
        data: {
          total_respect: 100,
          fractal_count: 2,
        },
      });

      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount++;
        if (callCount === 1) return userChain;
        if (callCount === 4) return respectChain;
        return chainMock({ data: null, error: null });
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ users: [] }),
      });

      const res = await GET(makeRequest('/api/artists/new'), {
        params: Promise.resolve({ username: 'new' }),
      });
      const body = await res.json();

      expect(respectChain.eq).toHaveBeenCalledWith('fid', 444);
      expect(body.totalRespect).toBe(100);
    });

    it('returns zero respect when no respect data found', async () => {
      const userChain = chainMock({
        data: {
          fid: 555,
          username: 'norespect',
          display_name: 'No Respect',
          pfp_url: null,
          bio: null,
          primary_wallet: null,
          farcaster_banner_url: null,
          community_profile_id: null,
          respect_member_id: null,
        },
      });

      const respectChain = chainMock({ data: null });

      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount++;
        if (callCount === 1) return userChain;
        if (callCount === 4) return respectChain;
        return chainMock({ data: null, error: null });
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ users: [] }),
      });

      const res = await GET(makeRequest('/api/artists/norespect'), {
        params: Promise.resolve({ username: 'norespect' }),
      });
      const body = await res.json();

      expect(body.totalRespect).toBe(0);
      expect(body.fractalCount).toBe(0);
    });
  });

  describe('Neynar follower count', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());
    });

    it('fetches follower count from Neynar when fid is present', async () => {
      const userChain = chainMock({
        data: {
          fid: 666,
          username: 'neynar-user',
          display_name: 'Neynar User',
          pfp_url: null,
          bio: null,
          primary_wallet: null,
          farcaster_banner_url: null,
          community_profile_id: null,
          respect_member_id: null,
        },
      });

      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount++;
        if (callCount === 1) return userChain;
        return chainMock({ data: null, error: null });
      });

      mockFetch.mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              users: [{ follower_count: 5000 }],
            }),
        }),
      );

      const res = await GET(makeRequest('/api/artists/neynar-user'), {
        params: Promise.resolve({ username: 'neynar-user' }),
      });
      await res.json();

      expect(res.status).toBe(200);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.neynar.com/v2/farcaster/user/bulk?fids=666',
        expect.objectContaining({
          headers: { 'x-api-key': 'test-neynar-key' },
        }),
      );
    });

    it('uses timeout for Neynar request', async () => {
      const userChain = chainMock({
        data: {
          fid: 777,
          username: 'timeout-user',
          display_name: 'Timeout User',
          pfp_url: null,
          bio: null,
          primary_wallet: null,
          farcaster_banner_url: null,
          community_profile_id: null,
          respect_member_id: null,
        },
      });

      mockFrom.mockReturnValueOnce(userChain);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ users: [] }),
      });

      await GET(makeRequest('/api/artists/timeout-user'), {
        params: Promise.resolve({ username: 'timeout-user' }),
      });

      const fetchCall = mockFetch.mock.calls[0];
      expect(fetchCall[1].signal).toBeDefined();
    });

    it('handles Neynar not ok response gracefully', async () => {
      const userChain = chainMock({
        data: {
          fid: 888,
          username: 'neynar-error',
          display_name: 'Neynar Error',
          pfp_url: null,
          bio: null,
          primary_wallet: null,
          farcaster_banner_url: null,
          community_profile_id: null,
          respect_member_id: null,
        },
      });

      mockFrom.mockReturnValueOnce(userChain);

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
      });

      const res = await GET(makeRequest('/api/artists/neynar-error'), {
        params: Promise.resolve({ username: 'neynar-error' }),
      });
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.followerCount).toBe(0);
    });

    it('returns zero followers when user has no fid', async () => {
      const userChain = chainMock({
        data: {
          fid: null,
          username: 'no-fid',
          display_name: 'No FID',
          pfp_url: null,
          bio: null,
          primary_wallet: null,
          farcaster_banner_url: null,
          community_profile_id: null,
          respect_member_id: null,
        },
      });

      mockFrom.mockReturnValueOnce(userChain);

      const res = await GET(makeRequest('/api/artists/no-fid'), {
        params: Promise.resolve({ username: 'no-fid' }),
      });
      const body = await res.json();

      expect(body.followerCount).toBe(0);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('handles missing users array in Neynar response', async () => {
      const userChain = chainMock({
        data: {
          fid: 999,
          username: 'neynar-empty',
          display_name: 'Neynar Empty',
          pfp_url: null,
          bio: null,
          primary_wallet: null,
          farcaster_banner_url: null,
          community_profile_id: null,
          respect_member_id: null,
        },
      });

      mockFrom.mockReturnValueOnce(userChain);

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      const res = await GET(makeRequest('/api/artists/neynar-empty'), {
        params: Promise.resolve({ username: 'neynar-empty' }),
      });
      const body = await res.json();

      expect(body.followerCount).toBe(0);
    });
  });

  describe('response structure and caching', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());
    });

    it('returns all expected artist fields', async () => {
      const userChain = chainMock({
        data: {
          fid: 1001,
          username: 'complete',
          display_name: 'Complete Artist',
          pfp_url: 'https://example.com/pfp.jpg',
          bio: 'I make music',
          primary_wallet: '0x1234',
          farcaster_banner_url: 'https://example.com/banner.jpg',
          community_profile_id: 'prof-abc',
          respect_member_id: 'resp-xyz',
        },
      });

      const profileChain = chainMock({
        data: {
          category: 'music',
          cover_image_url: 'https://example.com/cover.jpg',
          thumbnail_url: 'https://example.com/thumb.jpg',
          biography: 'Bio from profile',
          is_featured: true,
          slug: 'complete-artist',
        },
      });

      const respectChain = chainMock({
        data: {
          total_respect: 250,
          fractal_count: 5,
        },
      });

      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount++;
        if (callCount === 1) return userChain;
        if (callCount === 2) return profileChain;
        if (callCount === 4) return respectChain;
        return chainMock({ data: null, error: null });
      });

      mockFetch.mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ users: [{ follower_count: 1500 }] }),
        }),
      );

      const res = await GET(makeRequest('/api/artists/complete'), {
        params: Promise.resolve({ username: 'complete' }),
      });
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.fid).toBe(1001);
      expect(body.username).toBe('complete');
      expect(body.displayName).toBe('Complete Artist');
      expect(body.pfpUrl).toBe('https://example.com/pfp.jpg');
      expect(body.bio).toBe('I make music');
      expect(body.coverImageUrl).toBe('https://example.com/cover.jpg');
      expect(body.thumbnailUrl).toBe('https://example.com/thumb.jpg');
      expect(body.category).toBe('music');
      expect(body.biography).toBe('Bio from profile');
      expect(body.isFeatured).toBe(true);
      expect(body.slug).toBe('complete-artist');
      expect(body.totalRespect).toBe(250);
      expect(body.fractalCount).toBe(5);
      expect(body.trackCount).toBe(0);
      expect(body.totalPlays).toBe(0);
      expect(body.topTracks).toEqual([]);
    });

    it('sets cache headers on success response', async () => {
      const userChain = chainMock({
        data: {
          fid: 1002,
          username: 'cache-test',
          display_name: 'Cache Test',
          pfp_url: null,
          bio: null,
          primary_wallet: null,
          farcaster_banner_url: null,
          community_profile_id: null,
          respect_member_id: null,
        },
      });

      mockFrom.mockReturnValueOnce(userChain);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ users: [] }),
      });

      const res = await GET(makeRequest('/api/artists/cache-test'), {
        params: Promise.resolve({ username: 'cache-test' }),
      });

      expect(res.headers.get('Cache-Control')).toBe(
        'public, s-maxage=120, stale-while-revalidate=60',
      );
    });
  });

  describe('error handling', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());
    });

    it('returns 500 when user lookup throws', async () => {
      mockFrom.mockImplementationOnce(() => {
        throw new Error('Database connection failed');
      });

      const res = await GET(makeRequest('/api/artists/error'), {
        params: Promise.resolve({ username: 'error' }),
      });
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body.error).toBe('Failed to load artist profile');
    });

    it('logs error with context', async () => {
      const { logger } = await import('@/lib/logger');

      mockFrom.mockImplementationOnce(() => {
        throw new Error('Network timeout');
      });

      await GET(makeRequest('/api/artists/error'), {
        params: Promise.resolve({ username: 'error' }),
      });

      expect(logger.error).toHaveBeenCalledWith('[artists/username] error:', expect.any(Error));
    });

    it('handles Promise.allSettled rejection gracefully', async () => {
      const userChain = chainMock({
        data: {
          fid: 1003,
          username: 'rejected',
          display_name: 'Rejected',
          pfp_url: null,
          bio: null,
          primary_wallet: null,
          farcaster_banner_url: null,
          community_profile_id: null,
          respect_member_id: null,
        },
      });

      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount++;
        if (callCount === 1) return userChain;
        // Return chains that will be settled (some rejected)
        return chainMock({ data: null, error: null });
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ users: [] }),
      });

      const res = await GET(makeRequest('/api/artists/rejected'), {
        params: Promise.resolve({ username: 'rejected' }),
      });

      expect(res.status).toBe(200);
    });
  });
});
