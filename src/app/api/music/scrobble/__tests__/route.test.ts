import { beforeEach, describe, expect, it, vi } from 'vitest';
import { chainMock, makePostRequest, mockAuthenticatedSession } from '@/test-utils/api-helpers';

// ── Hoisted mocks ────────────────────────────────────────────────────────────
const {
  mockGetSession,
  mockGetSupabaseAdmin,
  mockScrobble,
  mockUpdateNowPlaying,
  mockSubmitListen,
  mockSubmitNowPlaying,
} = vi.hoisted(() => ({
  mockGetSession: vi.fn(),
  mockGetSupabaseAdmin: vi.fn(),
  mockScrobble: vi.fn(),
  mockUpdateNowPlaying: vi.fn(),
  mockSubmitListen: vi.fn(),
  mockSubmitNowPlaying: vi.fn(),
}));

vi.mock('@/lib/auth/session', () => ({
  getSession: () => mockGetSession(),
}));

vi.mock('@/lib/db/supabase', () => ({
  getSupabaseAdmin: () => mockGetSupabaseAdmin(),
}));

vi.mock('@/lib/music/lastfm', () => ({
  scrobble: (...args: unknown[]) => mockScrobble(...args),
  updateNowPlaying: (...args: unknown[]) => mockUpdateNowPlaying(...args),
}));

vi.mock('@/lib/music/listenbrainz', () => ({
  submitListen: (...args: unknown[]) => mockSubmitListen(...args),
  submitNowPlaying: (...args: unknown[]) => mockSubmitNowPlaying(...args),
}));

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

import { POST } from '../route';

describe('/api/music/scrobble', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Authentication ──────────────────────────────────────────────────────

  describe('authentication', () => {
    it('returns 401 when no session exists', async () => {
      mockGetSession.mockResolvedValue(null);

      const req = makePostRequest('/api/music/scrobble', {
        artist: 'Test Artist',
        track: 'Test Track',
        action: 'scrobble',
      });
      const res = await POST(req);
      const body = (await res.json()) as unknown;

      expect(res.status).toBe(401);
      expect(body).toEqual({ error: 'Unauthorized' });
    });

    it('returns 401 when session has no fid', async () => {
      mockGetSession.mockResolvedValue({ username: 'testuser' });

      const req = makePostRequest('/api/music/scrobble', {
        artist: 'Test Artist',
        track: 'Test Track',
        action: 'scrobble',
      });
      const res = await POST(req);
      const body = (await res.json()) as unknown;

      expect(res.status).toBe(401);
      expect(body).toEqual({ error: 'Unauthorized' });
    });

    it('allows request with valid session containing fid', async () => {
      const session = mockAuthenticatedSession();
      mockGetSession.mockResolvedValue(session);

      const { chain } = chainMock({
        data: { lastfm_session_key: 'test-key' },
      });
      mockGetSupabaseAdmin.mockReturnValue({ from: vi.fn().mockReturnValue(chain) });
      mockScrobble.mockResolvedValue({ success: true });

      const req = makePostRequest('/api/music/scrobble', {
        artist: 'Test Artist',
        track: 'Test Track',
        action: 'scrobble',
      });
      const res = await POST(req);

      expect(res.status).toBe(200);
    });
  });

  // ── Input Validation (Zod) ──────────────────────────────────────────────

  describe('input validation', () => {
    beforeEach(() => {
      mockGetSession.mockResolvedValue(mockAuthenticatedSession());
    });

    it('returns 400 when artist is missing', async () => {
      const req = makePostRequest('/api/music/scrobble', {
        track: 'Test Track',
        action: 'scrobble',
      });
      const res = await POST(req);
      const body = (await res.json()) as unknown;

      expect(res.status).toBe(400);
      expect(body).toHaveProperty('error');
    });

    it('returns 400 when artist is empty string', async () => {
      const req = makePostRequest('/api/music/scrobble', {
        artist: '',
        track: 'Test Track',
        action: 'scrobble',
      });
      const res = await POST(req);
      const body = (await res.json()) as unknown;

      expect(res.status).toBe(400);
      expect(body).toHaveProperty('error');
    });

    it('returns 400 when track is missing', async () => {
      const req = makePostRequest('/api/music/scrobble', {
        artist: 'Test Artist',
        action: 'scrobble',
      });
      const res = await POST(req);
      const body = (await res.json()) as unknown;

      expect(res.status).toBe(400);
      expect(body).toHaveProperty('error');
    });

    it('returns 400 when track is empty string', async () => {
      const req = makePostRequest('/api/music/scrobble', {
        artist: 'Test Artist',
        track: '',
        action: 'scrobble',
      });
      const res = await POST(req);
      const body = (await res.json()) as unknown;

      expect(res.status).toBe(400);
      expect(body).toHaveProperty('error');
    });

    it('returns 400 when action is missing', async () => {
      const req = makePostRequest('/api/music/scrobble', {
        artist: 'Test Artist',
        track: 'Test Track',
      });
      const res = await POST(req);
      const body = (await res.json()) as unknown;

      expect(res.status).toBe(400);
      expect(body).toHaveProperty('error');
    });

    it('returns 400 when action is invalid enum value', async () => {
      const req = makePostRequest('/api/music/scrobble', {
        artist: 'Test Artist',
        track: 'Test Track',
        action: 'invalid_action',
      });
      const res = await POST(req);
      const body = (await res.json()) as unknown;

      expect(res.status).toBe(400);
      expect(body).toHaveProperty('error');
    });

    it('returns 400 when body is not JSON', async () => {
      const req = new Request(new URL('/api/music/scrobble', 'http://localhost:3000'), {
        method: 'POST',
        body: 'not json',
      });
      const res = await POST(req as unknown as Parameters<typeof POST>[0]);

      expect(res.status).toBeGreaterThanOrEqual(400);
    });

    it('allows album field to be optional', async () => {
      const { chain } = chainMock({
        data: { lastfm_session_key: 'test-key' },
      });
      mockGetSupabaseAdmin.mockReturnValue({ from: vi.fn().mockReturnValue(chain) });
      mockScrobble.mockResolvedValue({ success: true });

      const req = makePostRequest('/api/music/scrobble', {
        artist: 'Test Artist',
        track: 'Test Track',
        action: 'scrobble',
      });
      const res = await POST(req);

      expect(res.status).toBe(200);
    });

    it('allows album field when provided', async () => {
      const { chain } = chainMock({
        data: { lastfm_session_key: 'test-key' },
      });
      mockGetSupabaseAdmin.mockReturnValue({ from: vi.fn().mockReturnValue(chain) });
      mockScrobble.mockResolvedValue({ success: true });

      const req = makePostRequest('/api/music/scrobble', {
        artist: 'Test Artist',
        track: 'Test Track',
        album: 'Test Album',
        action: 'scrobble',
      });
      const res = await POST(req);

      expect(res.status).toBe(200);
    });
  });

  // ── Service Connection Check ────────────────────────────────────────────

  describe('service connection check', () => {
    beforeEach(() => {
      mockGetSession.mockResolvedValue(mockAuthenticatedSession());
    });

    it('returns skipped when no services are connected', async () => {
      const { chain } = chainMock({
        data: { lastfm_session_key: null, listenbrainz_token: null },
      });
      mockGetSupabaseAdmin.mockReturnValue({ from: vi.fn().mockReturnValue(chain) });

      const req = makePostRequest('/api/music/scrobble', {
        artist: 'Test Artist',
        track: 'Test Track',
        action: 'scrobble',
      });
      const res = await POST(req);
      const body = (await res.json()) as unknown;

      expect(res.status).toBe(200);
      expect(body).toEqual({ skipped: true, reason: 'No scrobbling service connected' });
    });

    it('queries user_settings for scrobbling credentials', async () => {
      const { chain } = chainMock({
        data: { lastfm_session_key: 'test-key', listenbrainz_token: null },
      });
      const mockFrom = vi.fn().mockReturnValue(chain);
      mockGetSupabaseAdmin.mockReturnValue({ from: mockFrom });
      mockScrobble.mockResolvedValue({ success: true });

      const req = makePostRequest('/api/music/scrobble', {
        artist: 'Test Artist',
        track: 'Test Track',
        action: 'scrobble',
      });
      await POST(req);

      expect(mockFrom).toHaveBeenCalledWith('user_settings');
    });

    it('filters settings by fid', async () => {
      const session = mockAuthenticatedSession({ fid: 999 });
      mockGetSession.mockResolvedValue(session);

      const { chain } = chainMock({
        data: { lastfm_session_key: 'test-key' },
      });
      const mockSelect = vi.fn().mockReturnValue(chain);
      mockGetSupabaseAdmin.mockReturnValue({
        from: vi.fn().mockReturnValue({ select: mockSelect }),
      });
      mockScrobble.mockResolvedValue({ success: true });

      const req = makePostRequest('/api/music/scrobble', {
        artist: 'Test Artist',
        track: 'Test Track',
        action: 'scrobble',
      });
      await POST(req);

      expect(mockSelect).toHaveBeenCalledWith('lastfm_session_key, listenbrainz_token');
    });
  });

  // ── Scrobble Action ─────────────────────────────────────────────────────

  describe('scrobble action', () => {
    beforeEach(() => {
      mockGetSession.mockResolvedValue(mockAuthenticatedSession());
    });

    it('calls lastfm scrobble when action is "scrobble" and lastfm is connected', async () => {
      const { chain } = chainMock({
        data: { lastfm_session_key: 'session-key-123', listenbrainz_token: null },
      });
      mockGetSupabaseAdmin.mockReturnValue({ from: vi.fn().mockReturnValue(chain) });
      mockScrobble.mockResolvedValue({ success: true });

      const req = makePostRequest('/api/music/scrobble', {
        artist: 'Daft Punk',
        track: 'One More Time',
        album: 'Discovery',
        action: 'scrobble',
      });
      await POST(req);

      expect(mockScrobble).toHaveBeenCalledWith(
        expect.objectContaining({
          artist: 'Daft Punk',
          track: 'One More Time',
          album: 'Discovery',
          sk: 'session-key-123',
          timestamp: expect.any(Number),
        }),
      );
    });

    it('includes timestamp in scrobble call', async () => {
      const { chain } = chainMock({
        data: { lastfm_session_key: 'session-key-123' },
      });
      mockGetSupabaseAdmin.mockReturnValue({ from: vi.fn().mockReturnValue(chain) });
      mockScrobble.mockResolvedValue({ success: true });

      const req = makePostRequest('/api/music/scrobble', {
        artist: 'Test Artist',
        track: 'Test Track',
        action: 'scrobble',
      });
      await POST(req);

      const callArgs = mockScrobble.mock.calls[0][0] as { timestamp: number };
      expect(callArgs.timestamp).toBeGreaterThan(0);
      expect(typeof callArgs.timestamp).toBe('number');
    });

    it('returns success when scrobble completes', async () => {
      const { chain } = chainMock({
        data: { lastfm_session_key: 'session-key-123' },
      });
      mockGetSupabaseAdmin.mockReturnValue({ from: vi.fn().mockReturnValue(chain) });
      mockScrobble.mockResolvedValue({ success: true });

      const req = makePostRequest('/api/music/scrobble', {
        artist: 'Test Artist',
        track: 'Test Track',
        action: 'scrobble',
      });
      const res = await POST(req);
      const body = (await res.json()) as unknown;

      expect(res.status).toBe(200);
      expect(body).toEqual({ success: true });
    });

    it('does not call updateNowPlaying when action is scrobble', async () => {
      const { chain } = chainMock({
        data: { lastfm_session_key: 'session-key-123' },
      });
      mockGetSupabaseAdmin.mockReturnValue({ from: vi.fn().mockReturnValue(chain) });
      mockScrobble.mockResolvedValue({ success: true });

      const req = makePostRequest('/api/music/scrobble', {
        artist: 'Test Artist',
        track: 'Test Track',
        action: 'scrobble',
      });
      await POST(req);

      expect(mockUpdateNowPlaying).not.toHaveBeenCalled();
    });
  });

  // ── Now Playing Action ───────────────────────────────────────────────────

  describe('nowplaying action', () => {
    beforeEach(() => {
      mockGetSession.mockResolvedValue(mockAuthenticatedSession());
    });

    it('calls lastfm updateNowPlaying when action is "nowplaying" and lastfm is connected', async () => {
      const { chain } = chainMock({
        data: { lastfm_session_key: 'session-key-456', listenbrainz_token: null },
      });
      mockGetSupabaseAdmin.mockReturnValue({ from: vi.fn().mockReturnValue(chain) });
      mockUpdateNowPlaying.mockResolvedValue({ success: true });

      const req = makePostRequest('/api/music/scrobble', {
        artist: 'The Weeknd',
        track: 'Blinding Lights',
        album: 'After Hours',
        action: 'nowplaying',
      });
      await POST(req);

      expect(mockUpdateNowPlaying).toHaveBeenCalledWith(
        expect.objectContaining({
          artist: 'The Weeknd',
          track: 'Blinding Lights',
          album: 'After Hours',
          sk: 'session-key-456',
        }),
      );
    });

    it('does not include timestamp in updateNowPlaying call', async () => {
      const { chain } = chainMock({
        data: { lastfm_session_key: 'session-key-456' },
      });
      mockGetSupabaseAdmin.mockReturnValue({ from: vi.fn().mockReturnValue(chain) });
      mockUpdateNowPlaying.mockResolvedValue({ success: true });

      const req = makePostRequest('/api/music/scrobble', {
        artist: 'Test Artist',
        track: 'Test Track',
        action: 'nowplaying',
      });
      await POST(req);

      const callArgs = mockUpdateNowPlaying.mock.calls[0][0] as { timestamp?: number };
      expect(callArgs.timestamp).toBeUndefined();
    });

    it('returns success when nowplaying completes', async () => {
      const { chain } = chainMock({
        data: { lastfm_session_key: 'session-key-456' },
      });
      mockGetSupabaseAdmin.mockReturnValue({ from: vi.fn().mockReturnValue(chain) });
      mockUpdateNowPlaying.mockResolvedValue({ success: true });

      const req = makePostRequest('/api/music/scrobble', {
        artist: 'Test Artist',
        track: 'Test Track',
        action: 'nowplaying',
      });
      const res = await POST(req);
      const body = (await res.json()) as unknown;

      expect(res.status).toBe(200);
      expect(body).toEqual({ success: true });
    });

    it('does not call scrobble when action is nowplaying', async () => {
      const { chain } = chainMock({
        data: { lastfm_session_key: 'session-key-456' },
      });
      mockGetSupabaseAdmin.mockReturnValue({ from: vi.fn().mockReturnValue(chain) });
      mockUpdateNowPlaying.mockResolvedValue({ success: true });

      const req = makePostRequest('/api/music/scrobble', {
        artist: 'Test Artist',
        track: 'Test Track',
        action: 'nowplaying',
      });
      await POST(req);

      expect(mockScrobble).not.toHaveBeenCalled();
    });
  });

  // ── ListenBrainz Integration ────────────────────────────────────────────

  describe('ListenBrainz integration', () => {
    beforeEach(() => {
      mockGetSession.mockResolvedValue(mockAuthenticatedSession());
    });

    it('calls submitListen when action is "scrobble" and listenbrainz is connected', async () => {
      const { chain } = chainMock({
        data: { lastfm_session_key: null, listenbrainz_token: 'token-123' },
      });
      mockGetSupabaseAdmin.mockReturnValue({ from: vi.fn().mockReturnValue(chain) });
      mockSubmitListen.mockResolvedValue({ success: true });

      const req = makePostRequest('/api/music/scrobble', {
        artist: 'Adele',
        track: 'Hello',
        album: '25',
        action: 'scrobble',
      });
      await POST(req);

      expect(mockSubmitListen).toHaveBeenCalledWith(
        expect.objectContaining({
          artist: 'Adele',
          track: 'Hello',
          album: '25',
          userToken: 'token-123',
          timestamp: expect.any(Number),
        }),
      );
    });

    it('calls submitNowPlaying when action is "nowplaying" and listenbrainz is connected', async () => {
      const { chain } = chainMock({
        data: { lastfm_session_key: null, listenbrainz_token: 'token-456' },
      });
      mockGetSupabaseAdmin.mockReturnValue({ from: vi.fn().mockReturnValue(chain) });
      mockSubmitNowPlaying.mockResolvedValue({ success: true });

      const req = makePostRequest('/api/music/scrobble', {
        artist: 'Drake',
        track: "God's Plan",
        album: 'Scorpion',
        action: 'nowplaying',
      });
      await POST(req);

      expect(mockSubmitNowPlaying).toHaveBeenCalledWith(
        expect.objectContaining({
          artist: 'Drake',
          track: "God's Plan",
          album: 'Scorpion',
          userToken: 'token-456',
        }),
      );
    });

    it('does not include timestamp in submitNowPlaying call', async () => {
      const { chain } = chainMock({
        data: { lastfm_session_key: null, listenbrainz_token: 'token-456' },
      });
      mockGetSupabaseAdmin.mockReturnValue({ from: vi.fn().mockReturnValue(chain) });
      mockSubmitNowPlaying.mockResolvedValue({ success: true });

      const req = makePostRequest('/api/music/scrobble', {
        artist: 'Test Artist',
        track: 'Test Track',
        action: 'nowplaying',
      });
      await POST(req);

      const callArgs = mockSubmitNowPlaying.mock.calls[0][0] as { timestamp?: number };
      expect(callArgs.timestamp).toBeUndefined();
    });

    it('tolerates ListenBrainz errors via fire-and-forget', async () => {
      const { chain } = chainMock({
        data: { lastfm_session_key: 'session-key', listenbrainz_token: 'token-123' },
      });
      mockGetSupabaseAdmin.mockReturnValue({ from: vi.fn().mockReturnValue(chain) });
      mockScrobble.mockResolvedValue({ success: true });
      mockSubmitListen.mockRejectedValue(new Error('ListenBrainz error'));

      const req = makePostRequest('/api/music/scrobble', {
        artist: 'Test Artist',
        track: 'Test Track',
        action: 'scrobble',
      });
      const res = await POST(req);

      // Despite ListenBrainz error, should still return success
      expect(res.status).toBe(200);
      const body = (await res.json()) as unknown;
      expect(body).toEqual({ success: true });
    });

    it('calls both services when both are connected', async () => {
      const { chain } = chainMock({
        data: { lastfm_session_key: 'session-key', listenbrainz_token: 'token-123' },
      });
      mockGetSupabaseAdmin.mockReturnValue({ from: vi.fn().mockReturnValue(chain) });
      mockScrobble.mockResolvedValue({ success: true });
      mockSubmitListen.mockResolvedValue({ success: true });

      const req = makePostRequest('/api/music/scrobble', {
        artist: 'Test Artist',
        track: 'Test Track',
        action: 'scrobble',
      });
      await POST(req);

      expect(mockScrobble).toHaveBeenCalled();
      expect(mockSubmitListen).toHaveBeenCalled();
    });

    it('skips ListenBrainz when not connected', async () => {
      const { chain } = chainMock({
        data: { lastfm_session_key: 'session-key', listenbrainz_token: null },
      });
      mockGetSupabaseAdmin.mockReturnValue({ from: vi.fn().mockReturnValue(chain) });
      mockScrobble.mockResolvedValue({ success: true });

      const req = makePostRequest('/api/music/scrobble', {
        artist: 'Test Artist',
        track: 'Test Track',
        action: 'scrobble',
      });
      await POST(req);

      expect(mockSubmitListen).not.toHaveBeenCalled();
    });
  });

  // ── Both Services Connected ─────────────────────────────────────────────

  describe('both services connected', () => {
    beforeEach(() => {
      mockGetSession.mockResolvedValue(mockAuthenticatedSession());
    });

    it('calls both lastfm and listenbrainz for scrobble action', async () => {
      const { chain } = chainMock({
        data: { lastfm_session_key: 'lfm-key', listenbrainz_token: 'lb-token' },
      });
      mockGetSupabaseAdmin.mockReturnValue({ from: vi.fn().mockReturnValue(chain) });
      mockScrobble.mockResolvedValue({ success: true });
      mockSubmitListen.mockResolvedValue({ success: true });

      const req = makePostRequest('/api/music/scrobble', {
        artist: 'Billie Eilish',
        track: 'Bad Guy',
        album: 'When We All Fall Asleep, Where Do We Go?',
        action: 'scrobble',
      });
      const res = await POST(req);

      expect(res.status).toBe(200);
      expect(mockScrobble).toHaveBeenCalled();
      expect(mockSubmitListen).toHaveBeenCalled();
    });

    it('calls both lastfm and listenbrainz for nowplaying action', async () => {
      const { chain } = chainMock({
        data: { lastfm_session_key: 'lfm-key', listenbrainz_token: 'lb-token' },
      });
      mockGetSupabaseAdmin.mockReturnValue({ from: vi.fn().mockReturnValue(chain) });
      mockUpdateNowPlaying.mockResolvedValue({ success: true });
      mockSubmitNowPlaying.mockResolvedValue({ success: true });

      const req = makePostRequest('/api/music/scrobble', {
        artist: 'Test Artist',
        track: 'Test Track',
        action: 'nowplaying',
      });
      const res = await POST(req);

      expect(res.status).toBe(200);
      expect(mockUpdateNowPlaying).toHaveBeenCalled();
      expect(mockSubmitNowPlaying).toHaveBeenCalled();
    });
  });

  // ── Error Handling ───────────────────────────────────────────────────────

  describe('error handling', () => {
    beforeEach(() => {
      mockGetSession.mockResolvedValue(mockAuthenticatedSession());
    });

    it('returns 500 when lastfm scrobble fails', async () => {
      const { chain } = chainMock({
        data: { lastfm_session_key: 'session-key' },
      });
      mockGetSupabaseAdmin.mockReturnValue({ from: vi.fn().mockReturnValue(chain) });
      mockScrobble.mockRejectedValue(new Error('Last.fm API error'));

      const req = makePostRequest('/api/music/scrobble', {
        artist: 'Test Artist',
        track: 'Test Track',
        action: 'scrobble',
      });
      const res = await POST(req);
      const body = (await res.json()) as unknown;

      expect(res.status).toBe(500);
      expect(body).toEqual({ error: 'Scrobble failed' });
    });

    it('returns 500 when lastfm updateNowPlaying fails', async () => {
      const { chain } = chainMock({
        data: { lastfm_session_key: 'session-key' },
      });
      mockGetSupabaseAdmin.mockReturnValue({ from: vi.fn().mockReturnValue(chain) });
      mockUpdateNowPlaying.mockRejectedValue(new Error('Last.fm API error'));

      const req = makePostRequest('/api/music/scrobble', {
        artist: 'Test Artist',
        track: 'Test Track',
        action: 'nowplaying',
      });
      const res = await POST(req);
      const body = (await res.json()) as unknown;

      expect(res.status).toBe(500);
      expect(body).toEqual({ error: 'Scrobble failed' });
    });

    it('returns skipped when supabase returns no settings', async () => {
      const { chain } = chainMock({
        data: null,
      });
      mockGetSupabaseAdmin.mockReturnValue({ from: vi.fn().mockReturnValue(chain) });

      const req = makePostRequest('/api/music/scrobble', {
        artist: 'Test Artist',
        track: 'Test Track',
        action: 'scrobble',
      });
      const res = await POST(req);
      const body = (await res.json()) as unknown;

      // When settings is null, !settings?.lastfm_session_key && !settings?.listenbrainz_token is true
      expect(res.status).toBe(200);
      expect(body).toEqual({ skipped: true, reason: 'No scrobbling service connected' });
    });

    it('returns 500 when getSession throws', async () => {
      mockGetSession.mockRejectedValue(new Error('Session error'));

      const req = makePostRequest('/api/music/scrobble', {
        artist: 'Test Artist',
        track: 'Test Track',
        action: 'scrobble',
      });
      const res = await POST(req);
      const body = (await res.json()) as unknown;

      expect(res.status).toBe(500);
      expect(body).toEqual({ error: 'Scrobble failed' });
    });

    it('returns 500 when request body is invalid JSON', async () => {
      mockGetSession.mockResolvedValue(mockAuthenticatedSession());

      const req = new Request(new URL('/api/music/scrobble', 'http://localhost:3000'), {
        method: 'POST',
        body: 'invalid json{',
      });
      const res = await POST(req as unknown as Parameters<typeof POST>[0]);

      expect(res.status).toBeGreaterThanOrEqual(400);
    });
  });

  // ── Optional Album Field ────────────────────────────────────────────────

  describe('optional album field', () => {
    beforeEach(() => {
      mockGetSession.mockResolvedValue(mockAuthenticatedSession());
    });

    it('passes album to lastfm when provided', async () => {
      const { chain } = chainMock({
        data: { lastfm_session_key: 'session-key' },
      });
      mockGetSupabaseAdmin.mockReturnValue({ from: vi.fn().mockReturnValue(chain) });
      mockScrobble.mockResolvedValue({ success: true });

      const req = makePostRequest('/api/music/scrobble', {
        artist: 'Test Artist',
        track: 'Test Track',
        album: 'Test Album',
        action: 'scrobble',
      });
      await POST(req);

      expect(mockScrobble).toHaveBeenCalledWith(
        expect.objectContaining({
          album: 'Test Album',
        }),
      );
    });

    it('works without album for lastfm', async () => {
      const { chain } = chainMock({
        data: { lastfm_session_key: 'session-key' },
      });
      mockGetSupabaseAdmin.mockReturnValue({ from: vi.fn().mockReturnValue(chain) });
      mockScrobble.mockResolvedValue({ success: true });

      const req = makePostRequest('/api/music/scrobble', {
        artist: 'Test Artist',
        track: 'Test Track',
        action: 'scrobble',
      });
      const res = await POST(req);

      expect(res.status).toBe(200);
      expect(mockScrobble).toHaveBeenCalled();
    });

    it('passes album to listenbrainz when provided', async () => {
      const { chain } = chainMock({
        data: { lastfm_session_key: null, listenbrainz_token: 'token' },
      });
      mockGetSupabaseAdmin.mockReturnValue({ from: vi.fn().mockReturnValue(chain) });
      mockSubmitListen.mockResolvedValue({ success: true });

      const req = makePostRequest('/api/music/scrobble', {
        artist: 'Test Artist',
        track: 'Test Track',
        album: 'Test Album',
        action: 'scrobble',
      });
      await POST(req);

      expect(mockSubmitListen).toHaveBeenCalledWith(
        expect.objectContaining({
          album: 'Test Album',
        }),
      );
    });

    it('works without album for listenbrainz', async () => {
      const { chain } = chainMock({
        data: { lastfm_session_key: null, listenbrainz_token: 'token' },
      });
      mockGetSupabaseAdmin.mockReturnValue({ from: vi.fn().mockReturnValue(chain) });
      mockSubmitListen.mockResolvedValue({ success: true });

      const req = makePostRequest('/api/music/scrobble', {
        artist: 'Test Artist',
        track: 'Test Track',
        action: 'scrobble',
      });
      const res = await POST(req);

      expect(res.status).toBe(200);
      expect(mockSubmitListen).toHaveBeenCalled();
    });
  });

  // ── Response Shape ───────────────────────────────────────────────────────

  describe('response shape', () => {
    beforeEach(() => {
      mockGetSession.mockResolvedValue(mockAuthenticatedSession());
    });

    it('returns { success: true } on successful scrobble', async () => {
      const { chain } = chainMock({
        data: { lastfm_session_key: 'session-key' },
      });
      mockGetSupabaseAdmin.mockReturnValue({ from: vi.fn().mockReturnValue(chain) });
      mockScrobble.mockResolvedValue({ success: true });

      const req = makePostRequest('/api/music/scrobble', {
        artist: 'Test Artist',
        track: 'Test Track',
        action: 'scrobble',
      });
      const res = await POST(req);
      const body = (await res.json()) as unknown;

      expect(body).toEqual({ success: true });
    });

    it('returns { skipped: true, reason } when no services connected', async () => {
      const { chain } = chainMock({
        data: null,
      });
      mockGetSupabaseAdmin.mockReturnValue({ from: vi.fn().mockReturnValue(chain) });

      const req = makePostRequest('/api/music/scrobble', {
        artist: 'Test Artist',
        track: 'Test Track',
        action: 'scrobble',
      });
      const res = await POST(req);
      const body = (await res.json()) as unknown;

      expect(body).toEqual({
        skipped: true,
        reason: 'No scrobbling service connected',
      });
    });

    it('returns { error: string } on server error', async () => {
      const { chain } = chainMock({
        data: { lastfm_session_key: 'session-key' },
      });
      mockGetSupabaseAdmin.mockReturnValue({ from: vi.fn().mockReturnValue(chain) });
      mockScrobble.mockRejectedValue(new Error('API error'));

      const req = makePostRequest('/api/music/scrobble', {
        artist: 'Test Artist',
        track: 'Test Track',
        action: 'scrobble',
      });
      const res = await POST(req);
      const body = (await res.json()) as unknown;

      expect(body).toEqual({ error: 'Scrobble failed' });
    });
  });
});
