import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  chainMock,
  makePostRequest,
  mockAuthenticatedSession,
  VALID_UUID,
} from '@/test-utils/api-helpers';

// ── Hoisted mocks ────────────────────────────────────────────────────────────
const { mockGetSessionData, mockFrom } = vi.hoisted(() => ({
  mockGetSessionData: vi.fn(),
  mockFrom: vi.fn(),
}));

const mockLogger = vi.hoisted(() => ({
  error: vi.fn(),
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

// ── Route import ─────────────────────────────────────────────────────────────
import { POST } from '@/app/api/music/track-of-day/vote/route';

// ── Tests ────────────────────────────────────────────────────────────────────

describe('POST /api/music/track-of-day/vote', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Auth guard ───────────────────────────────────────────────────────────

  describe('Authentication', () => {
    it('returns 401 when no session', async () => {
      mockGetSessionData.mockResolvedValue(null);
      const req = makePostRequest('/api/music/track-of-day/vote', { trackId: VALID_UUID });
      const res = await POST(req);

      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.error).toBe('Unauthorized');
    });
  });

  // ── Input validation ─────────────────────────────────────────────────────

  describe('Input validation (Zod)', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());
    });

    it('returns 400 with details when trackId is missing', async () => {
      const req = makePostRequest('/api/music/track-of-day/vote', {});
      const res = await POST(req);

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe('Invalid input');
      expect(body.details).toBeDefined();
    });

    it('returns 400 with details when trackId is not a UUID', async () => {
      const req = makePostRequest('/api/music/track-of-day/vote', { trackId: 'not-a-uuid' });
      const res = await POST(req);

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe('Invalid input');
      expect(body.details).toBeDefined();
    });

    it('returns 400 with details when trackId is an empty string', async () => {
      const req = makePostRequest('/api/music/track-of-day/vote', { trackId: '' });
      const res = await POST(req);

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe('Invalid input');
      expect(body.details).toBeDefined();
    });
  });

  // ── Track lookup errors ──────────────────────────────────────────────────

  describe('Track lookup', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 123 }));
    });

    it('returns 404 when track does not exist', async () => {
      const trackLookup = chainMock({ data: null, error: null });
      mockFrom.mockReturnValue(trackLookup.chain);

      const req = makePostRequest('/api/music/track-of-day/vote', { trackId: VALID_UUID });
      const res = await POST(req);

      expect(res.status).toBe(404);
      const body = await res.json();
      expect(body.error).toBe('Nomination not found');
    });

    it('throws on Supabase error during track lookup', async () => {
      const trackLookup = chainMock({ data: null, error: new Error('Database error') });
      mockFrom.mockReturnValue(trackLookup.chain);

      const req = makePostRequest('/api/music/track-of-day/vote', { trackId: VALID_UUID });
      const res = await POST(req);

      expect(res.status).toBe(500);
      const body = await res.json();
      expect(body.error).toBe('Failed to process vote');
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('returns 400 when track has already been selected', async () => {
      const trackLookup = chainMock({
        data: { id: VALID_UUID, selected_date: '2026-07-15' },
        error: null,
      });
      mockFrom.mockReturnValue(trackLookup.chain);

      const req = makePostRequest('/api/music/track-of-day/vote', { trackId: VALID_UUID });
      const res = await POST(req);

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe('Cannot vote on an already-selected track');
    });
  });

  // ── Vote toggle: add vote (success path) ──────────────────────────────────

  describe('Vote toggle: add vote (success)', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 123 }));
    });

    it('adds a vote when no existing vote and returns voted=true', async () => {
      // Chain 1: track lookup
      const trackLookup = chainMock({
        data: { id: VALID_UUID, selected_date: null },
        error: null,
      });

      // Chain 2: existing vote check
      const checkVote = chainMock({ data: null, error: null });

      // Chain 3: insert vote
      const insertVote = chainMock({ error: null });

      // Chain 4: get vote count
      const countVotes = chainMock({ data: [], count: 5, error: null });

      // Chain 5: update denormalized count (no result expected)
      const updateCount = chainMock({ error: null });

      // Queue chains in FIFO order
      mockFrom
        .mockReturnValueOnce(trackLookup.chain)
        .mockReturnValueOnce(checkVote.chain)
        .mockReturnValueOnce(insertVote.chain)
        .mockReturnValueOnce(countVotes.chain)
        .mockReturnValueOnce(updateCount.chain);

      const req = makePostRequest('/api/music/track-of-day/vote', { trackId: VALID_UUID });
      const res = await POST(req);

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.voted).toBe(true);
      expect(body.voteCount).toBe(5);
    });

    it('inserts vote with correct track_id and voter_fid', async () => {
      const trackLookup = chainMock({
        data: { id: VALID_UUID, selected_date: null },
        error: null,
      });
      const checkVote = chainMock({ data: null, error: null });
      const insertVote = chainMock({ error: null });
      const countVotes = chainMock({ data: [], count: 1, error: null });
      const updateCount = chainMock({ error: null });

      mockFrom
        .mockReturnValueOnce(trackLookup.chain)
        .mockReturnValueOnce(checkVote.chain)
        .mockReturnValueOnce(insertVote.chain)
        .mockReturnValueOnce(countVotes.chain)
        .mockReturnValueOnce(updateCount.chain);

      const req = makePostRequest('/api/music/track-of-day/vote', { trackId: VALID_UUID });
      await POST(req);

      // Verify insert was called with correct data
      expect(insertVote.chain.insert).toHaveBeenCalledWith({
        track_id: VALID_UUID,
        voter_fid: 123,
      });
    });

    it('throws on Supabase error during insert', async () => {
      const trackLookup = chainMock({
        data: { id: VALID_UUID, selected_date: null },
        error: null,
      });
      const checkVote = chainMock({ data: null, error: null });
      const insertVote = chainMock({ error: new Error('Insert failed') });

      mockFrom
        .mockReturnValueOnce(trackLookup.chain)
        .mockReturnValueOnce(checkVote.chain)
        .mockReturnValueOnce(insertVote.chain);

      const req = makePostRequest('/api/music/track-of-day/vote', { trackId: VALID_UUID });
      const res = await POST(req);

      expect(res.status).toBe(500);
      const body = await res.json();
      expect(body.error).toBe('Failed to process vote');
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  // ── Vote toggle: remove vote (success path) ──────────────────────────────

  describe('Vote toggle: remove vote (success)', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 123 }));
    });

    it('removes a vote when existing vote and returns voted=false', async () => {
      // Chain 1: track lookup
      const trackLookup = chainMock({
        data: { id: VALID_UUID, selected_date: null },
        error: null,
      });

      // Chain 2: existing vote check
      const checkVote = chainMock({
        data: { id: 'vote-id-456' },
        error: null,
      });

      // Chain 3: delete vote
      const deleteVote = chainMock({ error: null });

      // Chain 4: get vote count
      const countVotes = chainMock({ data: [], count: 3, error: null });

      // Chain 5: update denormalized count
      const updateCount = chainMock({ error: null });

      mockFrom
        .mockReturnValueOnce(trackLookup.chain)
        .mockReturnValueOnce(checkVote.chain)
        .mockReturnValueOnce(deleteVote.chain)
        .mockReturnValueOnce(countVotes.chain)
        .mockReturnValueOnce(updateCount.chain);

      const req = makePostRequest('/api/music/track-of-day/vote', { trackId: VALID_UUID });
      const res = await POST(req);

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.voted).toBe(false);
      expect(body.voteCount).toBe(3);
    });

    it('deletes vote with correct vote id', async () => {
      const trackLookup = chainMock({
        data: { id: VALID_UUID, selected_date: null },
        error: null,
      });
      const checkVote = chainMock({
        data: { id: 'vote-id-456' },
        error: null,
      });
      const deleteVote = chainMock({ error: null });
      const countVotes = chainMock({ data: [], count: 0, error: null });
      const updateCount = chainMock({ error: null });

      mockFrom
        .mockReturnValueOnce(trackLookup.chain)
        .mockReturnValueOnce(checkVote.chain)
        .mockReturnValueOnce(deleteVote.chain)
        .mockReturnValueOnce(countVotes.chain)
        .mockReturnValueOnce(updateCount.chain);

      const req = makePostRequest('/api/music/track-of-day/vote', { trackId: VALID_UUID });
      await POST(req);

      // Verify delete was called with correct vote id
      expect(deleteVote.chain.eq).toHaveBeenCalledWith('id', 'vote-id-456');
    });

    it('throws on Supabase error during delete', async () => {
      const trackLookup = chainMock({
        data: { id: VALID_UUID, selected_date: null },
        error: null,
      });
      const checkVote = chainMock({
        data: { id: 'vote-id-456' },
        error: null,
      });
      const deleteVote = chainMock({ error: new Error('Delete failed') });

      mockFrom
        .mockReturnValueOnce(trackLookup.chain)
        .mockReturnValueOnce(checkVote.chain)
        .mockReturnValueOnce(deleteVote.chain);

      const req = makePostRequest('/api/music/track-of-day/vote', { trackId: VALID_UUID });
      const res = await POST(req);

      expect(res.status).toBe(500);
      const body = await res.json();
      expect(body.error).toBe('Failed to process vote');
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  // ── Vote count errors ────────────────────────────────────────────────────

  describe('Vote count retrieval', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 123 }));
    });

    it('throws on Supabase error during vote count', async () => {
      const trackLookup = chainMock({
        data: { id: VALID_UUID, selected_date: null },
        error: null,
      });
      const checkVote = chainMock({ data: null, error: null });
      const insertVote = chainMock({ error: null });
      const countVotes = chainMock({ error: new Error('Count failed') });

      mockFrom
        .mockReturnValueOnce(trackLookup.chain)
        .mockReturnValueOnce(checkVote.chain)
        .mockReturnValueOnce(insertVote.chain)
        .mockReturnValueOnce(countVotes.chain);

      const req = makePostRequest('/api/music/track-of-day/vote', { trackId: VALID_UUID });
      const res = await POST(req);

      expect(res.status).toBe(500);
      const body = await res.json();
      expect(body.error).toBe('Failed to process vote');
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('handles null count gracefully (defaults to 0)', async () => {
      const trackLookup = chainMock({
        data: { id: VALID_UUID, selected_date: null },
        error: null,
      });
      const checkVote = chainMock({ data: null, error: null });
      const insertVote = chainMock({ error: null });
      const countVotes = chainMock({ data: [], count: null, error: null });
      const updateCount = chainMock({ error: null });

      mockFrom
        .mockReturnValueOnce(trackLookup.chain)
        .mockReturnValueOnce(checkVote.chain)
        .mockReturnValueOnce(insertVote.chain)
        .mockReturnValueOnce(countVotes.chain)
        .mockReturnValueOnce(updateCount.chain);

      const req = makePostRequest('/api/music/track-of-day/vote', { trackId: VALID_UUID });
      const res = await POST(req);

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.voteCount).toBe(0);
    });
  });

  // ── Denormalized count update ────────────────────────────────────────────

  describe('Denormalized vote count sync', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 123 }));
    });

    it('updates votes_count on track_of_the_day after vote add', async () => {
      const trackLookup = chainMock({
        data: { id: VALID_UUID, selected_date: null },
        error: null,
      });
      const checkVote = chainMock({ data: null, error: null });
      const insertVote = chainMock({ error: null });
      const countVotes = chainMock({ data: [], count: 42, error: null });
      const updateCount = chainMock({ error: null });

      mockFrom
        .mockReturnValueOnce(trackLookup.chain)
        .mockReturnValueOnce(checkVote.chain)
        .mockReturnValueOnce(insertVote.chain)
        .mockReturnValueOnce(countVotes.chain)
        .mockReturnValueOnce(updateCount.chain);

      const req = makePostRequest('/api/music/track-of-day/vote', { trackId: VALID_UUID });
      await POST(req);

      // Verify update was called with correct count
      expect(updateCount.chain.update).toHaveBeenCalledWith({ votes_count: 42 });
      expect(updateCount.chain.eq).toHaveBeenCalledWith('id', VALID_UUID);
    });

    it('does not fail if denormalized count update returns error', async () => {
      // Note: the route does NOT check for updateError, so errors here are swallowed.
      // This test verifies that behavior.
      const trackLookup = chainMock({
        data: { id: VALID_UUID, selected_date: null },
        error: null,
      });
      const checkVote = chainMock({ data: null, error: null });
      const insertVote = chainMock({ error: null });
      const countVotes = chainMock({ data: [], count: 1, error: null });
      const updateCount = chainMock({ error: new Error('Update failed') });

      mockFrom
        .mockReturnValueOnce(trackLookup.chain)
        .mockReturnValueOnce(checkVote.chain)
        .mockReturnValueOnce(insertVote.chain)
        .mockReturnValueOnce(countVotes.chain)
        .mockReturnValueOnce(updateCount.chain);

      const req = makePostRequest('/api/music/track-of-day/vote', { trackId: VALID_UUID });
      const res = await POST(req);

      // Route succeeds anyway (no error check on updateError)
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.voted).toBe(true);
    });
  });

  // ── Edge cases ───────────────────────────────────────────────────────────

  describe('Edge cases', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 999 }));
    });

    it('handles check existing vote error', async () => {
      const trackLookup = chainMock({
        data: { id: VALID_UUID, selected_date: null },
        error: null,
      });
      const checkVote = chainMock({ data: null, error: new Error('Check failed') });

      mockFrom.mockReturnValueOnce(trackLookup.chain).mockReturnValueOnce(checkVote.chain);

      const req = makePostRequest('/api/music/track-of-day/vote', { trackId: VALID_UUID });
      const res = await POST(req);

      expect(res.status).toBe(500);
      const body = await res.json();
      expect(body.error).toBe('Failed to process vote');
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('correctly uses voter FID from session', async () => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 777 }));

      const trackLookup = chainMock({
        data: { id: VALID_UUID, selected_date: null },
        error: null,
      });
      const checkVote = chainMock({ data: null, error: null });
      const insertVote = chainMock({ error: null });
      const countVotes = chainMock({ data: [], count: 1, error: null });
      const updateCount = chainMock({ error: null });

      mockFrom
        .mockReturnValueOnce(trackLookup.chain)
        .mockReturnValueOnce(checkVote.chain)
        .mockReturnValueOnce(insertVote.chain)
        .mockReturnValueOnce(countVotes.chain)
        .mockReturnValueOnce(updateCount.chain);

      const req = makePostRequest('/api/music/track-of-day/vote', { trackId: VALID_UUID });
      await POST(req);

      // Verify second eq call for voter_fid check
      const checkVoteEqCalls = checkVote.chain.eq.mock.calls;
      expect(checkVoteEqCalls).toContainEqual(['voter_fid', 777]);
    });

    it('responds with correct JSON shape', async () => {
      const trackLookup = chainMock({
        data: { id: VALID_UUID, selected_date: null },
        error: null,
      });
      const checkVote = chainMock({ data: null, error: null });
      const insertVote = chainMock({ error: null });
      const countVotes = chainMock({ data: [], count: 10, error: null });
      const updateCount = chainMock({ error: null });

      mockFrom
        .mockReturnValueOnce(trackLookup.chain)
        .mockReturnValueOnce(checkVote.chain)
        .mockReturnValueOnce(insertVote.chain)
        .mockReturnValueOnce(countVotes.chain)
        .mockReturnValueOnce(updateCount.chain);

      const req = makePostRequest('/api/music/track-of-day/vote', { trackId: VALID_UUID });
      const res = await POST(req);

      const body = await res.json();
      expect(body).toHaveProperty('voted');
      expect(body).toHaveProperty('voteCount');
      expect(typeof body.voted).toBe('boolean');
      expect(typeof body.voteCount).toBe('number');
    });
  });
});
