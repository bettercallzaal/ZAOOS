import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { chainMock, mockAuthenticatedSession, VALID_UUID } from '@/test-utils/api-helpers';

// ── Hoisted mocks ────────────────────────────────────────────────────────────
const { mockGetSessionData, mockFrom, mockLogger } = vi.hoisted(() => ({
  mockGetSessionData: vi.fn(),
  mockFrom: vi.fn(),
  mockLogger: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock('@/lib/auth/session', () => ({
  getSessionData: () => mockGetSessionData(),
}));

vi.mock('@/lib/db/supabase', () => ({
  supabaseAdmin: { from: mockFrom },
}));

vi.mock('@/lib/logger', () => ({
  logger: mockLogger,
}));

// ── Route imports ────────────────────────────────────────────────────────────
import { DELETE, POST } from '@/app/api/music/playlists/collaborative/[id]/tracks/route';

// ── Test constants ───────────────────────────────────────────────────────────
const playlistId = VALID_UUID;
const trackId = VALID_UUID;
const addedTrackId = '660f9400-e29b-41d4-a716-446655440001';
const fid = 123;
const otherFid = 456;

// ── Helper: create RouteContext ──────────────────────────────────────────────
function makeRouteContext(id: string = playlistId) {
  return {
    params: Promise.resolve({ id }),
  };
}

// ── Helper: create POST request ──────────────────────────────────────────────
function makeTrackAddRequest(body: Record<string, unknown>) {
  return new NextRequest(
    new URL('/api/music/playlists/collaborative/test/tracks', 'http://localhost:3000'),
    {
      method: 'POST',
      body: JSON.stringify(body),
      headers: {
        'content-type': 'application/json',
      },
    },
  );
}

// ── Helper: create DELETE request ────────────────────────────────────────────
function makeTrackDeleteRequest(body: Record<string, unknown>) {
  return new NextRequest(
    new URL('/api/music/playlists/collaborative/test/tracks', 'http://localhost:3000'),
    {
      method: 'DELETE',
      body: JSON.stringify(body),
      headers: {
        'content-type': 'application/json',
      },
    },
  );
}

describe('POST /api/music/playlists/collaborative/[id]/tracks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('authentication', () => {
    it('returns 401 when user is not authenticated', async () => {
      mockGetSessionData.mockResolvedValue(null);

      const req = makeTrackAddRequest({
        song_url: 'https://open.spotify.com/track/123',
      });

      const res = await POST(req, makeRouteContext());
      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.error).toBe('Unauthorized');
    });
  });

  describe('input validation', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid }));
    });

    it('returns 400 when song_url is missing', async () => {
      const req = makeTrackAddRequest({
        song_title: 'Test Track',
      });

      const res = await POST(req, makeRouteContext());
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe('Invalid input');
      expect(body.details).toBeDefined();
    });

    it('returns 400 when song_url is not a valid URL', async () => {
      const req = makeTrackAddRequest({
        song_url: 'not-a-url',
      });

      const res = await POST(req, makeRouteContext());
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe('Invalid input');
    });

    it('returns 400 when song_url exceeds max length (500)', async () => {
      const req = makeTrackAddRequest({
        song_url: `https://example.com/${'x'.repeat(500)}`,
      });

      const res = await POST(req, makeRouteContext());
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe('Invalid input');
    });

    it('returns 400 when song_title exceeds max length (200)', async () => {
      const req = makeTrackAddRequest({
        song_url: 'https://open.spotify.com/track/123',
        song_title: 'x'.repeat(201),
      });

      const res = await POST(req, makeRouteContext());
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe('Invalid input');
    });

    it('accepts valid input without optional fields', async () => {
      const memberChain = chainMock({ data: { role: 'contributor' } });
      const lastTrackChain = chainMock({ data: { position: 0 } });
      const insertChain = chainMock({ data: { id: addedTrackId, position: 1 } });

      let callCount = 0;
      mockFrom.mockImplementation(() => {
        const chains = [memberChain.chain, lastTrackChain.chain, insertChain.chain];
        const chain = chains[callCount++];
        return chain;
      });

      const req = makeTrackAddRequest({
        song_url: 'https://open.spotify.com/track/123',
      });

      const res = await POST(req, makeRouteContext());
      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.track).toBeDefined();
    });
  });

  describe('authorization', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid }));
    });

    it('returns 403 when user is not a playlist member', async () => {
      const memberChain = chainMock({ data: null });
      mockFrom.mockReturnValue(memberChain.chain);

      const req = makeTrackAddRequest({
        song_url: 'https://open.spotify.com/track/123',
      });

      const res = await POST(req, makeRouteContext());
      expect(res.status).toBe(403);
      const body = await res.json();
      expect(body.error).toBe('You must be a contributor to add tracks');
    });

    it('returns 403 when user is a viewer (read-only member)', async () => {
      const memberChain = chainMock({ data: { role: 'viewer' } });
      mockFrom.mockReturnValue(memberChain.chain);

      const req = makeTrackAddRequest({
        song_url: 'https://open.spotify.com/track/123',
      });

      const res = await POST(req, makeRouteContext());
      expect(res.status).toBe(403);
      const body = await res.json();
      expect(body.error).toBe('You must be a contributor to add tracks');
    });

    it('allows request when user is a contributor', async () => {
      const memberChain = chainMock({ data: { role: 'contributor' } });
      const lastTrackChain = chainMock({ data: { position: 5 } });
      const insertChain = chainMock({ data: { id: addedTrackId, position: 6 } });

      let callCount = 0;
      mockFrom.mockImplementation(() => {
        const chains = [memberChain.chain, lastTrackChain.chain, insertChain.chain];
        const chain = chains[callCount++];
        return chain;
      });

      const req = makeTrackAddRequest({
        song_url: 'https://open.spotify.com/track/123',
        song_title: 'Test Track',
        song_artist: 'Test Artist',
      });

      const res = await POST(req, makeRouteContext());
      expect(res.status).toBe(201);
    });

    it('allows request when user is an editor', async () => {
      const memberChain = chainMock({ data: { role: 'editor' } });
      const lastTrackChain = chainMock({ data: { position: 2 } });
      const insertChain = chainMock({ data: { id: addedTrackId, position: 3 } });

      let callCount = 0;
      mockFrom.mockImplementation(() => {
        const chains = [memberChain.chain, lastTrackChain.chain, insertChain.chain];
        const chain = chains[callCount++];
        return chain;
      });

      const req = makeTrackAddRequest({
        song_url: 'https://open.spotify.com/track/789',
      });

      const res = await POST(req, makeRouteContext());
      expect(res.status).toBe(201);
    });
  });

  describe('track insertion', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid }));
    });

    it('successfully adds a track with minimal fields', async () => {
      const memberChain = chainMock({ data: { role: 'contributor' } });
      const lastTrackChain = chainMock({ data: { position: 10 } });
      const insertChain = chainMock({ data: { id: addedTrackId, position: 11 } });

      let callCount = 0;
      mockFrom.mockImplementation(() => {
        const chains = [memberChain.chain, lastTrackChain.chain, insertChain.chain];
        const chain = chains[callCount++];
        return chain;
      });

      const req = makeTrackAddRequest({
        song_url: 'https://open.spotify.com/track/abc123',
      });

      const res = await POST(req, makeRouteContext());
      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.track).toBeDefined();
      expect(body.track.id).toBe(addedTrackId);
      expect(body.track.position).toBe(11);
    });

    it('successfully adds a track with all fields', async () => {
      const memberChain = chainMock({ data: { role: 'contributor' } });
      const lastTrackChain = chainMock({ data: { position: 0 } });
      const insertChain = chainMock({
        data: {
          id: addedTrackId,
          position: 1,
          song_url: 'https://open.spotify.com/track/xyz',
          song_title: 'Full Details Track',
          song_artist: 'Artist Name',
          song_artwork_url: 'https://example.com/artwork.jpg',
          song_platform: 'spotify',
          song_stream_url: 'https://open.spotify.com/track/xyz',
          added_by_fid: fid,
        },
      });

      let callCount = 0;
      mockFrom.mockImplementation(() => {
        const chains = [memberChain.chain, lastTrackChain.chain, insertChain.chain];
        const chain = chains[callCount++];
        return chain;
      });

      const req = makeTrackAddRequest({
        song_url: 'https://open.spotify.com/track/xyz',
        song_title: 'Full Details Track',
        song_artist: 'Artist Name',
        song_artwork_url: 'https://example.com/artwork.jpg',
        song_platform: 'spotify',
        song_stream_url: 'https://open.spotify.com/track/xyz',
      });

      const res = await POST(req, makeRouteContext());
      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.track.song_title).toBe('Full Details Track');
      expect(body.track.song_artist).toBe('Artist Name');
    });

    it('correctly calculates next position when no tracks exist', async () => {
      const memberChain = chainMock({ data: { role: 'contributor' } });
      const lastTrackChain = chainMock({ data: null });
      const insertChain = chainMock({ data: { id: addedTrackId, position: 0 } });

      let callCount = 0;
      mockFrom.mockImplementation(() => {
        const chains = [memberChain.chain, lastTrackChain.chain, insertChain.chain];
        const chain = chains[callCount++];
        return chain;
      });

      const req = makeTrackAddRequest({
        song_url: 'https://open.spotify.com/track/first',
      });

      const res = await POST(req, makeRouteContext());
      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.track.position).toBe(0);
    });

    it('returns 409 on duplicate track constraint violation', async () => {
      const memberChain = chainMock({ data: { role: 'contributor' } });
      const lastTrackChain = chainMock({ data: { position: 5 } });
      const insertChain = chainMock({
        error: { code: '23505', message: 'duplicate key' },
        data: null,
      });

      let callCount = 0;
      mockFrom.mockImplementation(() => {
        const chains = [memberChain.chain, lastTrackChain.chain, insertChain.chain];
        const chain = chains[callCount++];
        return chain;
      });

      const req = makeTrackAddRequest({
        song_url: 'https://open.spotify.com/track/duplicate',
      });

      const res = await POST(req, makeRouteContext());
      expect(res.status).toBe(409);
      const body = await res.json();
      expect(body.error).toBe('Track already in playlist');
    });

    it('returns 500 on database error', async () => {
      const memberChain = chainMock({ data: { role: 'contributor' } });
      const lastTrackChain = chainMock({ data: { position: 3 } });
      const insertChain = chainMock({
        error: { code: '42P01', message: 'table does not exist' },
        data: null,
      });

      let callCount = 0;
      mockFrom.mockImplementation(() => {
        const chains = [memberChain.chain, lastTrackChain.chain, insertChain.chain];
        const chain = chains[callCount++];
        return chain;
      });

      const req = makeTrackAddRequest({
        song_url: 'https://open.spotify.com/track/error',
      });

      const res = await POST(req, makeRouteContext());
      expect(res.status).toBe(500);
      const body = await res.json();
      expect(body.error).toBe('Failed to add track');
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });
});

describe('DELETE /api/music/playlists/collaborative/[id]/tracks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('authentication', () => {
    it('returns 401 when user is not authenticated', async () => {
      mockGetSessionData.mockResolvedValue(null);

      const req = makeTrackDeleteRequest({
        track_id: trackId,
      });

      const res = await DELETE(req, makeRouteContext());
      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.error).toBe('Unauthorized');
    });
  });

  describe('input validation', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid }));
    });

    it('returns 400 when track_id is missing', async () => {
      const req = makeTrackDeleteRequest({});

      const res = await DELETE(req, makeRouteContext());
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe('Invalid input');
      expect(body.details).toBeDefined();
    });

    it('returns 400 when track_id is not a valid UUID', async () => {
      const req = makeTrackDeleteRequest({
        track_id: 'not-a-uuid',
      });

      const res = await DELETE(req, makeRouteContext());
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe('Invalid input');
    });
  });

  describe('authorization', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid }));
    });

    it('returns 404 when track does not exist', async () => {
      const trackChain = chainMock({ data: null });
      const playlistChain = chainMock({ data: { created_by_fid: otherFid } });

      let callCount = 0;
      mockFrom.mockImplementation(() => {
        const chains = [trackChain.chain, playlistChain.chain];
        const chain = chains[callCount++];
        return chain;
      });

      const req = makeTrackDeleteRequest({
        track_id: trackId,
      });

      const res = await DELETE(req, makeRouteContext());
      expect(res.status).toBe(404);
      const body = await res.json();
      expect(body.error).toBe('Track not found');
    });

    it('returns 403 when user is neither owner nor adder', async () => {
      const trackChain = chainMock({ data: { added_by_fid: otherFid } });
      const playlistChain = chainMock({ data: { created_by_fid: otherFid } });

      let callCount = 0;
      mockFrom.mockImplementation(() => {
        const chains = [trackChain.chain, playlistChain.chain];
        const chain = chains[callCount++];
        return chain;
      });

      const req = makeTrackDeleteRequest({
        track_id: trackId,
      });

      const res = await DELETE(req, makeRouteContext());
      expect(res.status).toBe(403);
      const body = await res.json();
      expect(body.error).toBe(
        'Only the playlist owner or the person who added the track can remove it',
      );
    });

    it('allows deletion when user is the track adder', async () => {
      const trackChain = chainMock({ data: { added_by_fid: fid } });
      const playlistChain = chainMock({ data: { created_by_fid: otherFid } });
      const deleteChain = chainMock({ error: null });

      let callCount = 0;
      mockFrom.mockImplementation(() => {
        const chains = [trackChain.chain, playlistChain.chain, deleteChain.chain];
        const chain = chains[callCount++];
        return chain;
      });

      const req = makeTrackDeleteRequest({
        track_id: trackId,
      });

      const res = await DELETE(req, makeRouteContext());
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
    });

    it('allows deletion when user is the playlist owner', async () => {
      const trackChain = chainMock({ data: { added_by_fid: otherFid } });
      const playlistChain = chainMock({ data: { created_by_fid: fid } });
      const deleteChain = chainMock({ error: null });

      let callCount = 0;
      mockFrom.mockImplementation(() => {
        const chains = [trackChain.chain, playlistChain.chain, deleteChain.chain];
        const chain = chains[callCount++];
        return chain;
      });

      const req = makeTrackDeleteRequest({
        track_id: trackId,
      });

      const res = await DELETE(req, makeRouteContext());
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
    });
  });

  describe('track deletion', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid }));
    });

    it('successfully deletes a track when user is the adder', async () => {
      const trackChain = chainMock({ data: { added_by_fid: fid } });
      const playlistChain = chainMock({ data: { created_by_fid: otherFid } });
      const deleteChain = chainMock({ error: null });

      let callCount = 0;
      mockFrom.mockImplementation(() => {
        const chains = [trackChain.chain, playlistChain.chain, deleteChain.chain];
        const chain = chains[callCount++];
        return chain;
      });

      const req = makeTrackDeleteRequest({
        track_id: trackId,
      });

      const res = await DELETE(req, makeRouteContext());
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
    });

    it('successfully deletes a track when user is the owner', async () => {
      const trackChain = chainMock({ data: { added_by_fid: otherFid } });
      const playlistChain = chainMock({ data: { created_by_fid: fid } });
      const deleteChain = chainMock({ error: null });

      let callCount = 0;
      mockFrom.mockImplementation(() => {
        const chains = [trackChain.chain, playlistChain.chain, deleteChain.chain];
        const chain = chains[callCount++];
        return chain;
      });

      const req = makeTrackDeleteRequest({
        track_id: trackId,
      });

      const res = await DELETE(req, makeRouteContext());
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
    });

    it('returns 500 on database error during deletion', async () => {
      const trackChain = chainMock({ data: { added_by_fid: fid } });
      const playlistChain = chainMock({ data: { created_by_fid: otherFid } });
      const deleteChain = chainMock({
        error: { code: '42P01', message: 'table does not exist' },
      });

      let callCount = 0;
      mockFrom.mockImplementation(() => {
        const chains = [trackChain.chain, playlistChain.chain, deleteChain.chain];
        const chain = chains[callCount++];
        return chain;
      });

      const req = makeTrackDeleteRequest({
        track_id: trackId,
      });

      const res = await DELETE(req, makeRouteContext());
      expect(res.status).toBe(500);
      const body = await res.json();
      expect(body.error).toBe('Failed to remove track');
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('parallel queries with Promise.allSettled', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid }));
    });

    it('handles track query rejection gracefully', async () => {
      const trackChain = chainMock({ data: null });
      const playlistChain = chainMock({ data: { created_by_fid: fid } });

      let callCount = 0;
      mockFrom.mockImplementation(() => {
        const chains = [trackChain.chain, playlistChain.chain];
        const chain = chains[callCount++];
        return chain;
      });

      const req = makeTrackDeleteRequest({
        track_id: trackId,
      });

      const res = await DELETE(req, makeRouteContext());
      expect(res.status).toBe(404);
      const body = await res.json();
      expect(body.error).toBe('Track not found');
    });

    it('proceeds with deletion authorization when playlist query fails', async () => {
      const trackChain = chainMock({ data: { added_by_fid: fid } });
      const playlistChain = chainMock({ data: null });
      const deleteChain = chainMock({ error: null });

      let callCount = 0;
      mockFrom.mockImplementation(() => {
        const chains = [trackChain.chain, playlistChain.chain, deleteChain.chain];
        const chain = chains[callCount++];
        return chain;
      });

      const req = makeTrackDeleteRequest({
        track_id: trackId,
      });

      const res = await DELETE(req, makeRouteContext());
      // User is the adder, so should be allowed even if playlist query fails
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
    });
  });
});
