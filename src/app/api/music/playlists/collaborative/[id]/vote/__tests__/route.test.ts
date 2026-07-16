import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  chainMock,
  makePostRequest,
  mockAuthenticatedSession,
  mockUnauthenticatedSession,
  VALID_UUID,
} from '@/test-utils/api-helpers';

const { mockGetSessionData, mockFrom } = vi.hoisted(() => ({
  mockGetSessionData: vi.fn(),
  mockFrom: vi.fn(),
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

import { POST } from '../route';

const playlistId = 'playlist-1';
const trackId = VALID_UUID;
const userId = 123;

const ctx = { params: Promise.resolve({ id: playlistId }) };

describe('POST /api/music/playlists/collaborative/[id]/vote', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('authentication', () => {
    it('returns 401 when unauthenticated', async () => {
      mockGetSessionData.mockResolvedValue(mockUnauthenticatedSession());

      const res = await POST(makePostRequest('/x', { trackId, vote: 1 }), ctx);
      const body = await res.json();

      expect(res.status).toBe(401);
      expect(body.error).toBe('Unauthorized');
    });

    it('proceeds when authenticated', async () => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: userId }));
      const trackChain = chainMock({ data: { id: trackId, votes: 10 }, error: null });
      mockFrom.mockReturnValue(trackChain.chain);

      const res = await POST(makePostRequest('/x', { trackId, vote: 1 }), ctx);

      expect(res.status).toBe(200);
      expect(mockFrom).toHaveBeenCalled();
    });
  });

  describe('input validation', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: userId }));
    });

    it('returns 400 when trackId is not a UUID', async () => {
      const res = await POST(makePostRequest('/x', { trackId: 'not-a-uuid', vote: 1 }), ctx);
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid input');
      expect(body.details).toBeDefined();
    });

    it('returns 400 when vote is not 1 or -1', async () => {
      const res = await POST(makePostRequest('/x', { trackId, vote: 0 }), ctx);
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid input');
    });

    it('returns 400 when vote is missing', async () => {
      const res = await POST(makePostRequest('/x', { trackId }), ctx);
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid input');
    });

    it('returns 500 when body is invalid JSON (falls through to catch)', async () => {
      const req = new (require('next/server').NextRequest)(new URL('http://localhost:3000/x'), {
        method: 'POST',
        body: '{bad json',
      });
      const res = await POST(req, ctx);
      const body = await res.json();

      // Invalid JSON throws in req.json(), which is caught and returns 500
      expect(res.status).toBe(500);
      expect(body.error).toBe('Failed to vote');
    });
  });

  describe('track lookup', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: userId }));
    });

    it('returns 404 when track not found in playlist', async () => {
      const trackChain = chainMock({ data: null, error: null });
      mockFrom.mockReturnValue(trackChain.chain);

      const res = await POST(makePostRequest('/x', { trackId, vote: 1 }), ctx);
      const body = await res.json();

      expect(res.status).toBe(404);
      expect(body.error).toBe('Track not found in this playlist');
    });

    it('queries playlist_tracks with trackId and playlist_id', async () => {
      const trackChain = chainMock({ data: { id: trackId, votes: 10 }, error: null });
      const voteChain = chainMock({ data: null, error: null });
      const updateChain = chainMock({ data: {}, error: null });
      const finalChain = chainMock({ data: {}, error: null });

      let callIndex = 0;
      mockFrom.mockImplementation(() => {
        callIndex++;
        if (callIndex === 1) return trackChain.chain;
        if (callIndex === 2) return voteChain.chain;
        if (callIndex === 3) return updateChain.chain;
        return finalChain.chain;
      });

      await POST(makePostRequest('/x', { trackId, vote: 1 }), ctx);

      expect(mockFrom).toHaveBeenCalledWith('playlist_tracks');
      expect(trackChain.chain.select).toHaveBeenCalledWith('id, votes');
      expect(trackChain.chain.eq).toHaveBeenCalledWith('id', trackId);
      expect(trackChain.chain.eq).toHaveBeenCalledWith('playlist_id', playlistId);
    });
  });

  describe('new vote (no existing vote)', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: userId }));
    });

    it('inserts a new vote with upvote', async () => {
      const trackChain = chainMock({ data: { id: trackId, votes: 10 }, error: null });
      const voteChain = chainMock({ data: null, error: null });
      const insertChain = chainMock({ data: {}, error: null });
      const updateChain = chainMock({ data: {}, error: null });

      let callIndex = 0;
      mockFrom.mockImplementation(() => {
        callIndex++;
        if (callIndex === 1) return trackChain.chain;
        if (callIndex === 2) return voteChain.chain;
        if (callIndex === 3) return insertChain.chain;
        return updateChain.chain;
      });

      const res = await POST(makePostRequest('/x', { trackId, vote: 1 }), ctx);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.votes).toBe(11); // 10 + 1
      expect(body.user_vote).toBe(1);
      expect(insertChain.chain.insert).toHaveBeenCalledWith({
        playlist_track_id: trackId,
        fid: userId,
        vote: 1,
      });
    });

    it('inserts a new vote with downvote', async () => {
      const trackChain = chainMock({ data: { id: trackId, votes: 10 }, error: null });
      const voteChain = chainMock({ data: null, error: null });
      const insertChain = chainMock({ data: {}, error: null });
      const updateChain = chainMock({ data: {}, error: null });

      let callIndex = 0;
      mockFrom.mockImplementation(() => {
        callIndex++;
        if (callIndex === 1) return trackChain.chain;
        if (callIndex === 2) return voteChain.chain;
        if (callIndex === 3) return insertChain.chain;
        return updateChain.chain;
      });

      const res = await POST(makePostRequest('/x', { trackId, vote: -1 }), ctx);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.votes).toBe(9); // 10 - 1
      expect(body.user_vote).toBe(-1);
    });

    it('updates track votes after new vote', async () => {
      const trackChain = chainMock({ data: { id: trackId, votes: 5 }, error: null });
      const voteChain = chainMock({ data: null, error: null });
      const insertChain = chainMock({ data: {}, error: null });
      const updateChain = chainMock({ data: {}, error: null });

      let callIndex = 0;
      mockFrom.mockImplementation(() => {
        callIndex++;
        if (callIndex === 1) return trackChain.chain;
        if (callIndex === 2) return voteChain.chain;
        if (callIndex === 3) return insertChain.chain;
        return updateChain.chain;
      });

      await POST(makePostRequest('/x', { trackId, vote: 1 }), ctx);

      expect(updateChain.chain.update).toHaveBeenCalledWith({ votes: 6 });
      expect(updateChain.chain.eq).toHaveBeenCalledWith('id', trackId);
    });
  });

  describe('existing vote - same vote (toggle off)', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: userId }));
    });

    it('deletes existing upvote when voting again on +1', async () => {
      const trackChain = chainMock({ data: { id: trackId, votes: 10 }, error: null });
      const voteChain = chainMock({ data: { id: 'vote-1', vote: 1 }, error: null });
      const deleteChain = chainMock({ data: {}, error: null });
      const updateChain = chainMock({ data: {}, error: null });

      let callIndex = 0;
      mockFrom.mockImplementation(() => {
        callIndex++;
        if (callIndex === 1) return trackChain.chain;
        if (callIndex === 2) return voteChain.chain;
        if (callIndex === 3) return deleteChain.chain;
        return updateChain.chain;
      });

      const res = await POST(makePostRequest('/x', { trackId, vote: 1 }), ctx);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.votes).toBe(9); // 10 - 1 (voteDelta = -1)
      expect(body.user_vote).toBe(0); // Removed
      expect(deleteChain.chain.delete).toHaveBeenCalled();
      expect(deleteChain.chain.eq).toHaveBeenCalledWith('id', 'vote-1');
    });

    it('deletes existing downvote when voting again on -1', async () => {
      const trackChain = chainMock({ data: { id: trackId, votes: 5 }, error: null });
      const voteChain = chainMock({ data: { id: 'vote-1', vote: -1 }, error: null });
      const deleteChain = chainMock({ data: {}, error: null });
      const updateChain = chainMock({ data: {}, error: null });

      let callIndex = 0;
      mockFrom.mockImplementation(() => {
        callIndex++;
        if (callIndex === 1) return trackChain.chain;
        if (callIndex === 2) return voteChain.chain;
        if (callIndex === 3) return deleteChain.chain;
        return updateChain.chain;
      });

      const res = await POST(makePostRequest('/x', { trackId, vote: -1 }), ctx);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.votes).toBe(6); // 5 + 1 (voteDelta = 1)
      expect(body.user_vote).toBe(0);
    });
  });

  describe('existing vote - different vote (flip)', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: userId }));
    });

    it('flips from upvote to downvote (swing -2)', async () => {
      const trackChain = chainMock({ data: { id: trackId, votes: 10 }, error: null });
      const voteChain = chainMock({ data: { id: 'vote-1', vote: 1 }, error: null });
      const updateVoteChain = chainMock({ data: {}, error: null });
      const updateTrackChain = chainMock({ data: {}, error: null });

      let callIndex = 0;
      mockFrom.mockImplementation(() => {
        callIndex++;
        if (callIndex === 1) return trackChain.chain;
        if (callIndex === 2) return voteChain.chain;
        if (callIndex === 3) return updateVoteChain.chain;
        return updateTrackChain.chain;
      });

      const res = await POST(makePostRequest('/x', { trackId, vote: -1 }), ctx);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.votes).toBe(8); // 10 - 2
      expect(body.user_vote).toBe(-1);
      expect(updateVoteChain.chain.update).toHaveBeenCalledWith({ vote: -1 });
      expect(updateVoteChain.chain.eq).toHaveBeenCalledWith('id', 'vote-1');
    });

    it('flips from downvote to upvote (swing +2)', async () => {
      const trackChain = chainMock({ data: { id: trackId, votes: 5 }, error: null });
      const voteChain = chainMock({ data: { id: 'vote-1', vote: -1 }, error: null });
      const updateVoteChain = chainMock({ data: {}, error: null });
      const updateTrackChain = chainMock({ data: {}, error: null });

      let callIndex = 0;
      mockFrom.mockImplementation(() => {
        callIndex++;
        if (callIndex === 1) return trackChain.chain;
        if (callIndex === 2) return voteChain.chain;
        if (callIndex === 3) return updateVoteChain.chain;
        return updateTrackChain.chain;
      });

      const res = await POST(makePostRequest('/x', { trackId, vote: 1 }), ctx);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.votes).toBe(7); // 5 + 2
      expect(body.user_vote).toBe(1);
    });
  });

  describe('track votes (null edge case)', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: userId }));
    });

    it('treats null votes as 0 when adding new vote', async () => {
      const trackChain = chainMock({ data: { id: trackId, votes: null }, error: null });
      const voteChain = chainMock({ data: null, error: null });
      const insertChain = chainMock({ data: {}, error: null });
      const updateChain = chainMock({ data: {}, error: null });

      let callIndex = 0;
      mockFrom.mockImplementation(() => {
        callIndex++;
        if (callIndex === 1) return trackChain.chain;
        if (callIndex === 2) return voteChain.chain;
        if (callIndex === 3) return insertChain.chain;
        return updateChain.chain;
      });

      const res = await POST(makePostRequest('/x', { trackId, vote: 1 }), ctx);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.votes).toBe(1); // (null || 0) + 1
      expect(updateChain.chain.update).toHaveBeenCalledWith({ votes: 1 });
    });
  });

  describe('error handling', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: userId }));
    });

    it('returns 500 when track query throws', async () => {
      mockFrom.mockImplementation(() => {
        throw new Error('DB error');
      });

      const res = await POST(makePostRequest('/x', { trackId, vote: 1 }), ctx);
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body.error).toBe('Failed to vote');
    });

    it('returns 500 when vote insert throws', async () => {
      const trackChain = chainMock({ data: { id: trackId, votes: 10 }, error: null });
      const voteChain = chainMock({ data: null, error: null });

      let callIndex = 0;
      mockFrom.mockImplementation(() => {
        callIndex++;
        if (callIndex === 1) return trackChain.chain;
        if (callIndex === 2) return voteChain.chain;
        throw new Error('Insert failed');
      });

      const res = await POST(makePostRequest('/x', { trackId, vote: 1 }), ctx);
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body.error).toBe('Failed to vote');
    });

    it('catches errors from any operation and returns 500', async () => {
      const trackChain = chainMock({ data: { id: trackId, votes: 10 }, error: null });

      let callIndex = 0;
      mockFrom.mockImplementation(() => {
        callIndex++;
        if (callIndex === 1) return trackChain.chain;
        // Throw on second call (playlist_votes query)
        throw new Error('Boom');
      });

      const res = await POST(makePostRequest('/x', { trackId, vote: 1 }), ctx);
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body.error).toBe('Failed to vote');
    });
  });

  describe('supabase chain construction', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: userId }));
    });

    it('builds correct chain for playlist_votes query', async () => {
      const trackChain = chainMock({ data: { id: trackId, votes: 10 }, error: null });
      const voteChain = chainMock({ data: null, error: null });
      const insertChain = chainMock({ data: {}, error: null });
      const updateChain = chainMock({ data: {}, error: null });

      let callIndex = 0;
      mockFrom.mockImplementation(() => {
        callIndex++;
        if (callIndex === 1) return trackChain.chain;
        if (callIndex === 2) return voteChain.chain;
        if (callIndex === 3) return insertChain.chain;
        return updateChain.chain;
      });

      await POST(makePostRequest('/x', { trackId, vote: 1 }), ctx);

      expect(mockFrom).toHaveBeenCalledWith('playlist_votes');
      expect(voteChain.chain.select).toHaveBeenCalledWith('id, vote');
      expect(voteChain.chain.eq).toHaveBeenCalledWith('playlist_track_id', trackId);
      expect(voteChain.chain.eq).toHaveBeenCalledWith('fid', userId);
    });

    it('queries playlist_tracks with select and filters', async () => {
      const trackChain = chainMock({ data: { id: trackId, votes: 10 }, error: null });
      const voteChain = chainMock({ data: null, error: null });
      const insertChain = chainMock({ data: {}, error: null });
      const updateChain = chainMock({ data: {}, error: null });

      let callIndex = 0;
      mockFrom.mockImplementation(() => {
        callIndex++;
        if (callIndex === 1) return trackChain.chain;
        if (callIndex === 2) return voteChain.chain;
        if (callIndex === 3) return insertChain.chain;
        return updateChain.chain;
      });

      await POST(makePostRequest('/x', { trackId, vote: 1 }), ctx);

      expect(mockFrom).toHaveBeenCalledWith('playlist_tracks');
      expect(trackChain.chain.single).toHaveBeenCalled();
    });
  });
});
