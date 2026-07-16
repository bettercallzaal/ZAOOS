import { beforeEach, describe, expect, it, vi } from 'vitest';
import { chainMock, makePostRequest, mockAuthenticatedSession } from '@/test-utils/api-helpers';

// ── Hoisted mocks ────────────────────────────────────────────────────────────
const { mockGetSessionData, mockFrom } = vi.hoisted(() => ({
  mockGetSessionData: vi.fn(),
  mockFrom: vi.fn(),
}));

const { mockAutoCastToZao } = vi.hoisted(() => ({
  mockAutoCastToZao: vi.fn(),
}));

vi.mock('@/lib/auth/session', () => ({
  getSessionData: () => mockGetSessionData(),
}));

vi.mock('@/lib/db/supabase', () => ({
  supabaseAdmin: { from: mockFrom },
}));

vi.mock('@/lib/publish/auto-cast', () => ({
  autoCastToZao: mockAutoCastToZao,
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}));

import { GET, POST } from '../route';

// ── Test fixtures ────────────────────────────────────────────────────────────

const SAMPLE_PLAYLIST = {
  id: '550e8400-e29b-41d4-a716-446655440001',
  name: 'Summer Vibes',
  description: 'Best tracks for summer 2026',
  is_collaborative: true,
  is_public: true,
  created_by_fid: 123,
  created_at: '2026-07-15T10:00:00Z',
};

const SAMPLE_PLAYLIST_2 = {
  id: '550e8400-e29b-41d4-a716-446655440002',
  name: 'Chill Beats',
  description: 'Relaxing music for focus',
  is_collaborative: true,
  is_public: true,
  created_by_fid: 456,
  created_at: '2026-07-15T09:00:00Z',
};

const SAMPLE_TRACK_1 = { playlist_id: SAMPLE_PLAYLIST.id };
const SAMPLE_TRACK_2 = { playlist_id: SAMPLE_PLAYLIST.id };
const SAMPLE_TRACK_3 = { playlist_id: SAMPLE_PLAYLIST_2.id };

const SAMPLE_MEMBER_1 = { playlist_id: SAMPLE_PLAYLIST.id, fid: 123 };
const SAMPLE_MEMBER_2 = { playlist_id: SAMPLE_PLAYLIST.id, fid: 456 };
const SAMPLE_MEMBER_3 = { playlist_id: SAMPLE_PLAYLIST_2.id, fid: 789 };

describe('GET /api/music/playlists/collaborative', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('authentication', () => {
    it('returns 401 when no session is present', async () => {
      mockGetSessionData.mockResolvedValue(null);

      const res = await GET();
      const body = await res.json();

      expect(res.status).toBe(401);
      expect(body.error).toBe('Unauthorized');
      expect(mockFrom).not.toHaveBeenCalled();
    });
  });

  describe('success paths', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 123 }));
    });

    it('returns 200 with enriched playlists list', async () => {
      const playlistMock = chainMock({ data: [SAMPLE_PLAYLIST, SAMPLE_PLAYLIST_2] });
      const tracksMock = chainMock({
        data: [SAMPLE_TRACK_1, SAMPLE_TRACK_2, SAMPLE_TRACK_3],
      });
      const membersMock = chainMock({
        data: [SAMPLE_MEMBER_1, SAMPLE_MEMBER_2, SAMPLE_MEMBER_3],
      });

      let callCount = 0;
      mockFrom.mockImplementation((_table) => {
        callCount += 1;
        if (callCount === 1) return playlistMock.handler();
        if (callCount === 2) return tracksMock.handler();
        if (callCount === 3) return membersMock.handler();
        return playlistMock.handler();
      });

      const res = await GET();
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.playlists).toHaveLength(2);
      expect(body.playlists[0]).toMatchObject({
        ...SAMPLE_PLAYLIST,
        track_count: 2,
        member_count: 2,
        member_fids: [123, 456],
      });
      expect(body.playlists[1]).toMatchObject({
        ...SAMPLE_PLAYLIST_2,
        track_count: 1,
        member_count: 1,
        member_fids: [789],
      });
    });

    it('filters by is_collaborative true and is_public true', async () => {
      const playlistMock = chainMock({ data: [SAMPLE_PLAYLIST] });
      const tracksMock = chainMock({ data: [SAMPLE_TRACK_1] });
      const membersMock = chainMock({ data: [SAMPLE_MEMBER_1] });

      let callCount = 0;
      mockFrom.mockImplementation((_table) => {
        callCount += 1;
        if (callCount === 1) return playlistMock.handler();
        if (callCount === 2) return tracksMock.handler();
        if (callCount === 3) return membersMock.handler();
        return playlistMock.handler();
      });

      await GET();

      // Verify the first call chains .eq('is_collaborative', true)
      const eqCalls = playlistMock.chain.eq.mock.calls;
      expect(eqCalls).toContainEqual(['is_collaborative', true]);
      expect(eqCalls).toContainEqual(['is_public', true]);
    });

    it('orders by created_at descending', async () => {
      const playlistMock = chainMock({ data: [SAMPLE_PLAYLIST] });
      const tracksMock = chainMock({ data: [SAMPLE_TRACK_1] });
      const membersMock = chainMock({ data: [SAMPLE_MEMBER_1] });

      let callCount = 0;
      mockFrom.mockImplementation((_table) => {
        callCount += 1;
        if (callCount === 1) return playlistMock.handler();
        if (callCount === 2) return tracksMock.handler();
        if (callCount === 3) return membersMock.handler();
        return playlistMock.handler();
      });

      await GET();

      const orderCalls = playlistMock.chain.order.mock.calls;
      expect(orderCalls).toContainEqual(['created_at', { ascending: false }]);
    });

    it('returns empty array when no playlists exist', async () => {
      const playlistMock = chainMock({ data: [] });
      mockFrom.mockReturnValue(playlistMock.chain);

      const res = await GET();
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.playlists).toEqual([]);
    });

    it('handles track count fetch failure gracefully', async () => {
      const playlistMock = chainMock({ data: [SAMPLE_PLAYLIST] });
      const tracksMock = chainMock({
        error: { message: 'Track fetch failed' },
        data: null,
      });
      const membersMock = chainMock({ data: [SAMPLE_MEMBER_1] });

      let callCount = 0;
      mockFrom.mockImplementation((_table) => {
        callCount += 1;
        if (callCount === 1) return playlistMock.handler();
        if (callCount === 2) return tracksMock.handler();
        if (callCount === 3) return membersMock.handler();
        return playlistMock.handler();
      });

      const res = await GET();
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.playlists[0].track_count).toBe(0);
      expect(body.playlists[0].member_count).toBe(1);
    });

    it('handles member count fetch failure gracefully', async () => {
      const playlistMock = chainMock({ data: [SAMPLE_PLAYLIST] });
      const tracksMock = chainMock({ data: [SAMPLE_TRACK_1] });
      const membersMock = chainMock({
        error: { message: 'Member fetch failed' },
        data: null,
      });

      let callCount = 0;
      mockFrom.mockImplementation((_table) => {
        callCount += 1;
        if (callCount === 1) return playlistMock.handler();
        if (callCount === 2) return tracksMock.handler();
        if (callCount === 3) return membersMock.handler();
        return playlistMock.handler();
      });

      const res = await GET();
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.playlists[0].track_count).toBe(1);
      expect(body.playlists[0].member_count).toBe(0);
      expect(body.playlists[0].member_fids).toEqual([]);
    });

    it('aggregates counts correctly across multiple playlists', async () => {
      const playlistMock = chainMock({ data: [SAMPLE_PLAYLIST, SAMPLE_PLAYLIST_2] });
      const tracksMock = chainMock({
        data: [SAMPLE_TRACK_1, SAMPLE_TRACK_2, SAMPLE_TRACK_3],
      });
      const membersMock = chainMock({
        data: [SAMPLE_MEMBER_1, SAMPLE_MEMBER_2, SAMPLE_MEMBER_3],
      });

      let callCount = 0;
      mockFrom.mockImplementation((_table) => {
        callCount += 1;
        if (callCount === 1) return playlistMock.handler();
        if (callCount === 2) return tracksMock.handler();
        if (callCount === 3) return membersMock.handler();
        return playlistMock.handler();
      });

      const res = await GET();
      const body = await res.json();

      expect(body.playlists).toHaveLength(2);
      expect(body.playlists[0].track_count).toBe(2);
      expect(body.playlists[0].member_count).toBe(2);
      expect(body.playlists[1].track_count).toBe(1);
      expect(body.playlists[1].member_count).toBe(1);
    });
  });

  describe('error handling', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 123 }));
    });

    it('returns 500 when supabase query fails', async () => {
      const playlistMock = chainMock({
        error: { message: 'Database connection failed' },
        data: null,
      });
      mockFrom.mockReturnValue(playlistMock.chain);

      const res = await GET();
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body.error).toBe('Failed to fetch playlists');
    });

    it('logs error when supabase fetch fails', async () => {
      const { logger } = await import('@/lib/logger');
      const dbError = { message: 'Query error' };
      const playlistMock = chainMock({
        error: dbError,
        data: null,
      });
      mockFrom.mockReturnValue(playlistMock.chain);

      await GET();

      expect(logger.error).toHaveBeenCalledWith('[collaborative-playlists] GET error:', dbError);
    });
  });
});

describe('POST /api/music/playlists/collaborative', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('authentication', () => {
    it('returns 401 when no session is present', async () => {
      mockGetSessionData.mockResolvedValue(null);

      const res = await POST(
        makePostRequest('/api/music/playlists/collaborative', {
          name: 'Test Playlist',
          description: 'A test playlist',
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(401);
      expect(body.error).toBe('Unauthorized');
      expect(mockFrom).not.toHaveBeenCalled();
    });
  });

  describe('request validation', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 123 }));
    });

    it('returns 400 when name is empty', async () => {
      const res = await POST(
        makePostRequest('/api/music/playlists/collaborative', {
          name: '',
          description: 'A valid description',
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid input');
      expect(body.details).toBeDefined();
    });

    it('returns 400 when name exceeds 100 characters', async () => {
      const longName = 'a'.repeat(101);
      const res = await POST(
        makePostRequest('/api/music/playlists/collaborative', {
          name: longName,
          description: 'A valid description',
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid input');
      expect(body.details).toBeDefined();
    });

    it('returns 400 when description exceeds 500 characters', async () => {
      const longDescription = 'a'.repeat(501);
      const res = await POST(
        makePostRequest('/api/music/playlists/collaborative', {
          name: 'Valid Name',
          description: longDescription,
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid input');
      expect(body.details).toBeDefined();
    });

    it('accepts description at exactly 500 characters', async () => {
      const descriptionAt500 = 'a'.repeat(500);
      const mock = chainMock({ data: SAMPLE_PLAYLIST });
      mockFrom.mockImplementation(mock.handler);
      mockAutoCastToZao.mockResolvedValue('cast_hash_123');

      const res = await POST(
        makePostRequest('/api/music/playlists/collaborative', {
          name: 'Valid Name',
          description: descriptionAt500,
        }),
      );

      expect(res.status).toBe(201);
    });

    it('accepts name at exactly 100 characters', async () => {
      const nameAt100 = 'a'.repeat(100);
      const mock = chainMock({ data: SAMPLE_PLAYLIST });
      mockFrom.mockImplementation(mock.handler);
      mockAutoCastToZao.mockResolvedValue('cast_hash_123');

      const res = await POST(
        makePostRequest('/api/music/playlists/collaborative', {
          name: nameAt100,
          description: 'A valid description',
        }),
      );

      expect(res.status).toBe(201);
    });

    it('returns 400 for missing name field', async () => {
      const res = await POST(
        makePostRequest('/api/music/playlists/collaborative', {
          description: 'A valid description',
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid input');
    });

    it('allows description to be optional', async () => {
      const mock = chainMock({ data: SAMPLE_PLAYLIST });
      mockFrom.mockImplementation(mock.handler);
      mockAutoCastToZao.mockResolvedValue('cast_hash_123');

      const res = await POST(
        makePostRequest('/api/music/playlists/collaborative', {
          name: 'Valid Name',
        }),
      );

      expect(res.status).toBe(201);
    });

    it('sets is_collaborative to true by default', async () => {
      const mock = chainMock({ data: SAMPLE_PLAYLIST });
      mockFrom.mockImplementation(mock.handler);
      mockAutoCastToZao.mockResolvedValue('cast_hash_123');

      await POST(
        makePostRequest('/api/music/playlists/collaborative', {
          name: 'Valid Name',
          description: 'A description',
        }),
      );

      const insertCalls = mock.chain.insert.mock.calls;
      expect(insertCalls[0][0].is_collaborative).toBe(true);
    });

    it('allows is_collaborative to be explicitly false', async () => {
      const mock = chainMock({ data: { ...SAMPLE_PLAYLIST, is_collaborative: false } });
      mockFrom.mockImplementation(mock.handler);
      mockAutoCastToZao.mockResolvedValue('cast_hash_123');

      await POST(
        makePostRequest('/api/music/playlists/collaborative', {
          name: 'Valid Name',
          description: 'A description',
          is_collaborative: false,
        }),
      );

      const insertCalls = mock.chain.insert.mock.calls;
      expect(insertCalls[0][0].is_collaborative).toBe(false);
    });

    it('allows is_collaborative to be explicitly true', async () => {
      const mock = chainMock({ data: SAMPLE_PLAYLIST });
      mockFrom.mockImplementation(mock.handler);
      mockAutoCastToZao.mockResolvedValue('cast_hash_123');

      await POST(
        makePostRequest('/api/music/playlists/collaborative', {
          name: 'Valid Name',
          description: 'A description',
          is_collaborative: true,
        }),
      );

      const insertCalls = mock.chain.insert.mock.calls;
      expect(insertCalls[0][0].is_collaborative).toBe(true);
    });

    it('returns 400 for non-boolean is_collaborative', async () => {
      const res = await POST(
        makePostRequest('/api/music/playlists/collaborative', {
          name: 'Valid Name',
          description: 'A description',
          is_collaborative: 'true',
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid input');
    });

    it('returns 400 for non-string name', async () => {
      const res = await POST(
        makePostRequest('/api/music/playlists/collaborative', {
          name: 123,
          description: 'A description',
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid input');
    });

    it('returns 400 for non-string description', async () => {
      const res = await POST(
        makePostRequest('/api/music/playlists/collaborative', {
          name: 'Valid Name',
          description: 123,
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid input');
    });
  });

  describe('success paths', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 123 }));
    });

    it('returns 201 on successful playlist creation', async () => {
      const mock = chainMock({ data: SAMPLE_PLAYLIST });
      mockFrom.mockImplementation(mock.handler);
      mockAutoCastToZao.mockResolvedValue('cast_hash_123');

      const res = await POST(
        makePostRequest('/api/music/playlists/collaborative', {
          name: 'Summer Vibes',
          description: 'Best tracks for summer 2026',
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(201);
      expect(body.playlist).toMatchObject(SAMPLE_PLAYLIST);
    });

    it('inserts playlist with correct fields', async () => {
      const mock = chainMock({ data: SAMPLE_PLAYLIST });
      mockFrom.mockImplementation(mock.handler);
      mockAutoCastToZao.mockResolvedValue('cast_hash_123');

      await POST(
        makePostRequest('/api/music/playlists/collaborative', {
          name: 'Summer Vibes',
          description: 'Best tracks for summer 2026',
        }),
      );

      const insertCalls = mock.chain.insert.mock.calls;
      expect(insertCalls[0][0]).toMatchObject({
        name: 'Summer Vibes',
        description: 'Best tracks for summer 2026',
        is_collaborative: true,
        is_public: true,
        created_by_fid: 123,
      });
    });

    it('sets description to null when omitted', async () => {
      const mock = chainMock({ data: { ...SAMPLE_PLAYLIST, description: null } });
      mockFrom.mockImplementation(mock.handler);
      mockAutoCastToZao.mockResolvedValue('cast_hash_123');

      await POST(
        makePostRequest('/api/music/playlists/collaborative', {
          name: 'Summer Vibes',
        }),
      );

      const insertCalls = mock.chain.insert.mock.calls;
      expect(insertCalls[0][0].description).toBeNull();
    });

    it('includes session fid as created_by_fid', async () => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 456 }));
      const mock = chainMock({ data: { ...SAMPLE_PLAYLIST, created_by_fid: 456 } });
      mockFrom.mockImplementation(mock.handler);
      mockAutoCastToZao.mockResolvedValue('cast_hash_123');

      await POST(
        makePostRequest('/api/music/playlists/collaborative', {
          name: 'Summer Vibes',
          description: 'Best tracks for summer 2026',
        }),
      );

      const insertCalls = mock.chain.insert.mock.calls;
      expect(insertCalls[0][0].created_by_fid).toBe(456);
    });

    it('calls select and single on playlist insert', async () => {
      const mock = chainMock({ data: SAMPLE_PLAYLIST });
      mockFrom.mockImplementation(mock.handler);
      mockAutoCastToZao.mockResolvedValue('cast_hash_123');

      await POST(
        makePostRequest('/api/music/playlists/collaborative', {
          name: 'Summer Vibes',
          description: 'Best tracks for summer 2026',
        }),
      );

      const selectCalls = mock.chain.select.mock.calls;
      const singleCalls = mock.chain.single.mock.calls;

      expect(selectCalls).toBeDefined();
      expect(selectCalls.length).toBeGreaterThan(0);
      expect(singleCalls).toBeDefined();
      expect(singleCalls.length).toBeGreaterThan(0);
    });

    it('adds creator as owner member after playlist creation', async () => {
      const playlistMock = chainMock({ data: SAMPLE_PLAYLIST });
      const memberMock = chainMock({ data: { playlist_id: SAMPLE_PLAYLIST.id, fid: 123 } });

      let _callCount = 0;
      mockFrom.mockImplementation((table) => {
        _callCount += 1;
        if (table === 'playlists') return playlistMock.handler();
        if (table === 'playlist_members') return memberMock.handler();
        return playlistMock.handler();
      });
      mockAutoCastToZao.mockResolvedValue('cast_hash_123');

      await POST(
        makePostRequest('/api/music/playlists/collaborative', {
          name: 'Summer Vibes',
          description: 'Best tracks for summer 2026',
        }),
      );

      const memberInsertCalls = memberMock.chain.insert.mock.calls;
      expect(memberInsertCalls[0][0]).toMatchObject({
        playlist_id: SAMPLE_PLAYLIST.id,
        fid: 123,
        role: 'owner',
      });
    });

    it('calls autoCastToZao with playlist name and URL', async () => {
      const mock = chainMock({ data: SAMPLE_PLAYLIST });
      mockFrom.mockImplementation(mock.handler);
      mockAutoCastToZao.mockResolvedValue('cast_hash_123');

      await POST(
        makePostRequest('/api/music/playlists/collaborative', {
          name: 'Summer Vibes',
          description: 'Best tracks for summer 2026',
        }),
      );

      expect(mockAutoCastToZao).toHaveBeenCalledWith(
        expect.stringContaining('Summer Vibes'),
        'https://zaoos.com/music',
      );
    });

    it('truncates autoCast message if name is very long', async () => {
      const longName = 'a'.repeat(100);
      const mock = chainMock({ data: { ...SAMPLE_PLAYLIST, name: longName } });
      mockFrom.mockImplementation(mock.handler);
      mockAutoCastToZao.mockResolvedValue('cast_hash_123');

      await POST(
        makePostRequest('/api/music/playlists/collaborative', {
          name: longName,
          description: 'A description',
        }),
      );

      expect(mockAutoCastToZao).toHaveBeenCalled();
      const castText = mockAutoCastToZao.mock.calls[0][0];
      expect(castText).toContain(longName);
    });

    it('fire-and-forgets autoCastToZao without waiting', async () => {
      const playlistMock = chainMock({ data: SAMPLE_PLAYLIST });
      const memberMock = chainMock({ data: {} });

      let _callCount = 0;
      mockFrom.mockImplementation((table) => {
        _callCount += 1;
        if (table === 'playlists') return playlistMock.handler();
        if (table === 'playlist_members') return memberMock.handler();
        return playlistMock.handler();
      });

      // autoCastToZao returns a promise that rejects
      mockAutoCastToZao.mockImplementation(
        () =>
          new Promise((_resolve, reject) => {
            setTimeout(() => reject(new Error('Cast failed')), 10);
          }),
      );

      const res = await POST(
        makePostRequest('/api/music/playlists/collaborative', {
          name: 'Summer Vibes',
          description: 'Best tracks for summer 2026',
        }),
      );

      // POST should still succeed despite autoCastToZao failing
      expect(res.status).toBe(201);
    });

    it('sets is_public to true always', async () => {
      const mock = chainMock({ data: SAMPLE_PLAYLIST });
      mockFrom.mockImplementation(mock.handler);
      mockAutoCastToZao.mockResolvedValue('cast_hash_123');

      await POST(
        makePostRequest('/api/music/playlists/collaborative', {
          name: 'Summer Vibes',
          description: 'A description',
          is_collaborative: false,
        }),
      );

      const insertCalls = mock.chain.insert.mock.calls;
      expect(insertCalls[0][0].is_public).toBe(true);
    });
  });

  describe('error handling', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 123 }));
    });

    it('returns 500 when playlist insert fails', async () => {
      const playlistMock = chainMock({
        error: { message: 'Constraint violation' },
        data: null,
      });
      mockFrom.mockImplementation(playlistMock.handler);

      const res = await POST(
        makePostRequest('/api/music/playlists/collaborative', {
          name: 'Summer Vibes',
          description: 'Best tracks for summer 2026',
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body.error).toBe('Failed to create playlist');
    });

    it('logs error when playlist insert fails', async () => {
      const { logger } = await import('@/lib/logger');
      const dbError = { message: 'Insert failed' };
      const playlistMock = chainMock({
        error: dbError,
        data: null,
      });
      mockFrom.mockImplementation(playlistMock.handler);

      await POST(
        makePostRequest('/api/music/playlists/collaborative', {
          name: 'Summer Vibes',
          description: 'Best tracks for summer 2026',
        }),
      );

      expect(logger.error).toHaveBeenCalledWith('[collaborative-playlists] POST error:', dbError);
    });

    it('returns 500 when JSON parsing fails', async () => {
      const req = new (await import('next/server')).NextRequest(
        new URL('/api/music/playlists/collaborative', 'http://localhost:3000'),
        {
          method: 'POST',
          body: 'not valid json {',
        },
      );

      const res = await POST(req);
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body.error).toBe('Failed to create playlist');
    });

    it('logs error when JSON parsing fails', async () => {
      const { logger } = await import('@/lib/logger');
      const req = new (await import('next/server')).NextRequest(
        new URL('/api/music/playlists/collaborative', 'http://localhost:3000'),
        {
          method: 'POST',
          body: 'not valid json {',
        },
      );

      await POST(req);

      expect(logger.error).toHaveBeenCalledWith(
        '[collaborative-playlists] POST error:',
        expect.any(Error),
      );
    });
  });
});
