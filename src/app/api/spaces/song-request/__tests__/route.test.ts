import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  chainMock,
  makeGetRequest,
  makePostRequest,
  makeRequest,
  mockAuthenticatedSession,
  mockUnauthenticatedSession,
  VALID_UUID,
} from '@/test-utils/api-helpers';

// ── Hoisted mocks ────────────────────────────────────────────────────────────
const { mockGetSessionData, mockFrom } = vi.hoisted(() => ({
  mockGetSessionData: vi.fn(),
  mockFrom: vi.fn(),
}));

vi.mock('@/lib/auth/session', () => ({
  getSessionData: () => mockGetSessionData(),
}));

vi.mock('@/lib/db/supabase', () => ({
  getSupabaseAdmin: () => ({ from: mockFrom }),
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}));

import { GET, PATCH, POST } from '../route';

// ── Constants ────────────────────────────────────────────────────────────────
const ROOM_ID = VALID_UUID;
const REQUEST_ID = VALID_UUID;
const HOST_FID = 999;
const REQUESTER_FID = 456;

const MOCK_SONG_REQUEST = {
  id: REQUEST_ID,
  room_id: ROOM_ID,
  requester_fid: REQUESTER_FID,
  requester_name: 'Test Requester',
  song_url: 'https://open.spotify.com/track/123',
  song_title: 'Test Song',
  song_artist: 'Test Artist',
  song_artwork: 'https://example.com/artwork.jpg',
  status: 'pending',
  created_at: '2026-01-01T00:00:00Z',
};

// ── Test Suites ──────────────────────────────────────────────────────────────
describe('GET /api/spaces/song-request', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('authentication', () => {
    it('returns 401 when no session is present', async () => {
      mockGetSessionData.mockResolvedValue(mockUnauthenticatedSession());
      const res = await GET(makeGetRequest('/api/spaces/song-request', { roomId: ROOM_ID }));
      const body = await res.json();

      expect(res.status).toBe(401);
      expect(body.error).toBe('Unauthorized');
      expect(mockFrom).not.toHaveBeenCalled();
    });
  });

  describe('validation', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());
    });

    it('returns 400 when roomId query param is missing', async () => {
      const res = await GET(makeGetRequest('/api/spaces/song-request'));
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('roomId required');
      expect(mockFrom).not.toHaveBeenCalled();
    });
  });

  describe('success', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());
    });

    it('returns 200 with list of pending and accepted requests', async () => {
      const { chain } = chainMock({
        data: [MOCK_SONG_REQUEST],
        error: null,
      });
      mockFrom.mockReturnValue(chain);

      const res = await GET(makeGetRequest('/api/spaces/song-request', { roomId: ROOM_ID }));
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.requests).toEqual([MOCK_SONG_REQUEST]);
      // Verify chain was constructed correctly
      expect(chain.select).toHaveBeenCalledWith('*');
      expect(chain.eq).toHaveBeenCalledWith('room_id', ROOM_ID);
      expect(chain.in).toHaveBeenCalledWith('status', ['pending', 'accepted']);
      expect(chain.order).toHaveBeenCalledWith('created_at', { ascending: true });
      expect(chain.limit).toHaveBeenCalledWith(50);
    });

    it('returns empty array when no requests exist', async () => {
      const { chain } = chainMock({
        data: [],
        error: null,
      });
      mockFrom.mockReturnValue(chain);

      const res = await GET(makeGetRequest('/api/spaces/song-request', { roomId: ROOM_ID }));
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.requests).toEqual([]);
    });
  });

  describe('errors', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());
    });

    it('returns 500 when Supabase returns an error', async () => {
      const { chain } = chainMock({
        data: null,
        error: { message: 'Database connection failed' },
      });
      mockFrom.mockReturnValue(chain);

      const res = await GET(makeGetRequest('/api/spaces/song-request', { roomId: ROOM_ID }));
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body.error).toBe('Database error');
    });
  });
});

describe('POST /api/spaces/song-request', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('authentication', () => {
    it('returns 401 when no session is present', async () => {
      mockGetSessionData.mockResolvedValue(mockUnauthenticatedSession());
      const res = await POST(
        makePostRequest('/api/spaces/song-request', {
          roomId: ROOM_ID,
          songUrl: 'https://open.spotify.com/track/123',
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(401);
      expect(body.error).toBe('Unauthorized');
      expect(mockFrom).not.toHaveBeenCalled();
    });
  });

  describe('validation', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());
    });

    it('returns 400 when roomId is not a valid UUID', async () => {
      const res = await POST(
        makePostRequest('/api/spaces/song-request', {
          roomId: 'not-a-uuid',
          songUrl: 'https://open.spotify.com/track/123',
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid input');
      expect(body.details).toBeDefined();
    });

    it('returns 400 when songUrl is not a valid URL', async () => {
      const res = await POST(
        makePostRequest('/api/spaces/song-request', {
          roomId: ROOM_ID,
          songUrl: 'not-a-url',
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid input');
      expect(body.details).toBeDefined();
    });

    it('returns 400 when roomId is missing', async () => {
      const res = await POST(
        makePostRequest('/api/spaces/song-request', {
          songUrl: 'https://open.spotify.com/track/123',
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid input');
      expect(body.details).toBeDefined();
    });

    it('returns 400 when songUrl is missing', async () => {
      const res = await POST(
        makePostRequest('/api/spaces/song-request', {
          roomId: ROOM_ID,
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid input');
      expect(body.details).toBeDefined();
    });

    it('returns 400 when songTitle exceeds 200 chars', async () => {
      const longTitle = 'a'.repeat(201);
      const res = await POST(
        makePostRequest('/api/spaces/song-request', {
          roomId: ROOM_ID,
          songUrl: 'https://open.spotify.com/track/123',
          songTitle: longTitle,
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid input');
      expect(body.details).toBeDefined();
    });

    it('returns 400 when songArtist exceeds 200 chars', async () => {
      const longArtist = 'a'.repeat(201);
      const res = await POST(
        makePostRequest('/api/spaces/song-request', {
          roomId: ROOM_ID,
          songUrl: 'https://open.spotify.com/track/123',
          songArtist: longArtist,
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid input');
      expect(body.details).toBeDefined();
    });

    it('returns 400 when songArtwork is not a valid URL', async () => {
      const res = await POST(
        makePostRequest('/api/spaces/song-request', {
          roomId: ROOM_ID,
          songUrl: 'https://open.spotify.com/track/123',
          songArtwork: 'not-a-url',
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid input');
      expect(body.details).toBeDefined();
    });

    it('returns 500 when body is invalid JSON', async () => {
      const res = await POST(
        makeRequest('/api/spaces/song-request', {
          method: 'POST',
          body: '{not valid json',
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body.error).toBe('Internal server error');
    });
  });

  describe('success', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(
        mockAuthenticatedSession({
          fid: REQUESTER_FID,
          username: 'testuser',
          displayName: 'Test User',
        }),
      );
    });

    it('creates a song request with required fields only', async () => {
      const { chain } = chainMock({
        data: {
          ...MOCK_SONG_REQUEST,
          song_title: null,
          song_artist: null,
          song_artwork: null,
        },
        error: null,
      });
      mockFrom.mockReturnValue(chain);

      const res = await POST(
        makePostRequest('/api/spaces/song-request', {
          roomId: ROOM_ID,
          songUrl: 'https://open.spotify.com/track/123',
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.request).toBeDefined();
      // Verify insert was called with correct data
      expect(chain.insert).toHaveBeenCalledWith({
        room_id: ROOM_ID,
        requester_fid: REQUESTER_FID,
        requester_name: 'Test User',
        song_url: 'https://open.spotify.com/track/123',
        song_title: null,
        song_artist: null,
        song_artwork: null,
      });
    });

    it('creates a song request with all optional fields', async () => {
      const { chain } = chainMock({
        data: MOCK_SONG_REQUEST,
        error: null,
      });
      mockFrom.mockReturnValue(chain);

      const res = await POST(
        makePostRequest('/api/spaces/song-request', {
          roomId: ROOM_ID,
          songUrl: 'https://open.spotify.com/track/123',
          songTitle: 'Test Song',
          songArtist: 'Test Artist',
          songArtwork: 'https://example.com/artwork.jpg',
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.request).toEqual(MOCK_SONG_REQUEST);
      expect(chain.insert).toHaveBeenCalledWith({
        room_id: ROOM_ID,
        requester_fid: REQUESTER_FID,
        requester_name: 'Test User',
        song_url: 'https://open.spotify.com/track/123',
        song_title: 'Test Song',
        song_artist: 'Test Artist',
        song_artwork: 'https://example.com/artwork.jpg',
      });
    });

    it('falls back to username when displayName is not available', async () => {
      mockGetSessionData.mockResolvedValue(
        mockAuthenticatedSession({
          fid: REQUESTER_FID,
          username: 'testuser',
          displayName: null,
        }),
      );

      const { chain } = chainMock({
        data: MOCK_SONG_REQUEST,
        error: null,
      });
      mockFrom.mockReturnValue(chain);

      const res = await POST(
        makePostRequest('/api/spaces/song-request', {
          roomId: ROOM_ID,
          songUrl: 'https://open.spotify.com/track/123',
        }),
      );
      const _body = await res.json();

      expect(res.status).toBe(200);
      expect(chain.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          requester_name: 'testuser',
        }),
      );
    });
  });

  describe('errors', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());
    });

    it('returns 500 when Supabase insert fails', async () => {
      const { chain } = chainMock({
        data: null,
        error: { message: 'Constraint violation' },
      });
      mockFrom.mockReturnValue(chain);

      const res = await POST(
        makePostRequest('/api/spaces/song-request', {
          roomId: ROOM_ID,
          songUrl: 'https://open.spotify.com/track/123',
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body.error).toBe('Database error');
    });

    it('returns 500 when an unexpected error is thrown', async () => {
      mockFrom.mockImplementation(() => {
        throw new Error('Connection lost');
      });

      const res = await POST(
        makePostRequest('/api/spaces/song-request', {
          roomId: ROOM_ID,
          songUrl: 'https://open.spotify.com/track/123',
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body.error).toBe('Internal server error');
    });
  });
});

describe('PATCH /api/spaces/song-request', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('authentication', () => {
    it('returns 401 when no session is present', async () => {
      mockGetSessionData.mockResolvedValue(mockUnauthenticatedSession());
      const res = await PATCH(
        makePostRequest('/api/spaces/song-request', {
          requestId: REQUEST_ID,
          status: 'accepted',
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(401);
      expect(body.error).toBe('Unauthorized');
    });
  });

  describe('validation', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());
    });

    it('returns 400 when requestId is not a valid UUID', async () => {
      const res = await PATCH(
        makePostRequest('/api/spaces/song-request', {
          requestId: 'not-a-uuid',
          status: 'accepted',
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid input');
      expect(body.details).toBeDefined();
    });

    it('returns 400 when status is not a valid enum', async () => {
      const res = await PATCH(
        makePostRequest('/api/spaces/song-request', {
          requestId: REQUEST_ID,
          status: 'invalid',
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid input');
      expect(body.details).toBeDefined();
    });

    it('returns 400 when requestId is missing', async () => {
      const res = await PATCH(
        makePostRequest('/api/spaces/song-request', {
          status: 'accepted',
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid input');
      expect(body.details).toBeDefined();
    });

    it('returns 400 when status is missing', async () => {
      const res = await PATCH(
        makePostRequest('/api/spaces/song-request', {
          requestId: REQUEST_ID,
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid input');
      expect(body.details).toBeDefined();
    });

    it('returns 500 when body is invalid JSON', async () => {
      const res = await PATCH(
        makeRequest('/api/spaces/song-request', {
          method: 'PATCH',
          body: '{not valid json',
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body.error).toBe('Internal server error');
    });
  });

  describe('authorization', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: REQUESTER_FID }));
    });

    it('returns 404 when song request does not exist', async () => {
      const selectChain = chainMock({
        data: null,
        error: null,
      });
      mockFrom.mockReturnValueOnce(selectChain.chain);

      const res = await PATCH(
        makePostRequest('/api/spaces/song-request', {
          requestId: REQUEST_ID,
          status: 'accepted',
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(404);
      expect(body.error).toBe('Song request not found');
    });

    it('returns 403 when caller is not the host', async () => {
      const selectReqChain = chainMock({
        data: { room_id: ROOM_ID },
        error: null,
      });
      const selectRoomChain = chainMock({
        data: { host_fid: HOST_FID },
        error: null,
      });
      mockFrom.mockReturnValueOnce(selectReqChain.chain).mockReturnValueOnce(selectRoomChain.chain);

      const res = await PATCH(
        makePostRequest('/api/spaces/song-request', {
          requestId: REQUEST_ID,
          status: 'accepted',
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(403);
      expect(body.error).toBe('Only the host can accept or reject requests');
    });

    it('returns 403 when room is not found', async () => {
      const selectReqChain = chainMock({
        data: { room_id: ROOM_ID },
        error: null,
      });
      const selectRoomChain = chainMock({
        data: null,
        error: null,
      });
      mockFrom.mockReturnValueOnce(selectReqChain.chain).mockReturnValueOnce(selectRoomChain.chain);

      const res = await PATCH(
        makePostRequest('/api/spaces/song-request', {
          requestId: REQUEST_ID,
          status: 'accepted',
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(403);
      expect(body.error).toBe('Only the host can accept or reject requests');
    });
  });

  describe('success', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: HOST_FID }));
    });

    it('accepts a song request', async () => {
      const selectReqChain = chainMock({
        data: { room_id: ROOM_ID },
        error: null,
      });
      const selectRoomChain = chainMock({
        data: { host_fid: HOST_FID },
        error: null,
      });
      const updateChain = chainMock({
        data: { ...MOCK_SONG_REQUEST, status: 'accepted' },
        error: null,
      });
      mockFrom
        .mockReturnValueOnce(selectReqChain.chain)
        .mockReturnValueOnce(selectRoomChain.chain)
        .mockReturnValueOnce(updateChain.chain);

      const res = await PATCH(
        makePostRequest('/api/spaces/song-request', {
          requestId: REQUEST_ID,
          status: 'accepted',
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.request.status).toBe('accepted');
      // Verify update was called with correct status
      expect(updateChain.chain.update).toHaveBeenCalledWith({ status: 'accepted' });
    });

    it('rejects a song request', async () => {
      const selectReqChain = chainMock({
        data: { room_id: ROOM_ID },
        error: null,
      });
      const selectRoomChain = chainMock({
        data: { host_fid: HOST_FID },
        error: null,
      });
      const updateChain = chainMock({
        data: { ...MOCK_SONG_REQUEST, status: 'rejected' },
        error: null,
      });
      mockFrom
        .mockReturnValueOnce(selectReqChain.chain)
        .mockReturnValueOnce(selectRoomChain.chain)
        .mockReturnValueOnce(updateChain.chain);

      const res = await PATCH(
        makePostRequest('/api/spaces/song-request', {
          requestId: REQUEST_ID,
          status: 'rejected',
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.request.status).toBe('rejected');
      expect(updateChain.chain.update).toHaveBeenCalledWith({ status: 'rejected' });
    });

    it('marks a song request as played', async () => {
      const selectReqChain = chainMock({
        data: { room_id: ROOM_ID },
        error: null,
      });
      const selectRoomChain = chainMock({
        data: { host_fid: HOST_FID },
        error: null,
      });
      const updateChain = chainMock({
        data: { ...MOCK_SONG_REQUEST, status: 'played' },
        error: null,
      });
      mockFrom
        .mockReturnValueOnce(selectReqChain.chain)
        .mockReturnValueOnce(selectRoomChain.chain)
        .mockReturnValueOnce(updateChain.chain);

      const res = await PATCH(
        makePostRequest('/api/spaces/song-request', {
          requestId: REQUEST_ID,
          status: 'played',
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.request.status).toBe('played');
      expect(updateChain.chain.update).toHaveBeenCalledWith({ status: 'played' });
    });
  });

  describe('errors', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: HOST_FID }));
    });

    it('returns 500 when Supabase update fails', async () => {
      const selectReqChain = chainMock({
        data: { room_id: ROOM_ID },
        error: null,
      });
      const selectRoomChain = chainMock({
        data: { host_fid: HOST_FID },
        error: null,
      });
      const updateChain = chainMock({
        data: null,
        error: { message: 'Constraint violation' },
      });
      mockFrom
        .mockReturnValueOnce(selectReqChain.chain)
        .mockReturnValueOnce(selectRoomChain.chain)
        .mockReturnValueOnce(updateChain.chain);

      const res = await PATCH(
        makePostRequest('/api/spaces/song-request', {
          requestId: REQUEST_ID,
          status: 'accepted',
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body.error).toBe('Database error');
    });

    it('returns 500 when an unexpected error is thrown', async () => {
      const selectReqChain = chainMock({
        data: { room_id: ROOM_ID },
        error: null,
      });
      mockFrom.mockReturnValueOnce(selectReqChain.chain).mockImplementationOnce(() => {
        throw new Error('Connection lost');
      });

      const res = await PATCH(
        makePostRequest('/api/spaces/song-request', {
          requestId: REQUEST_ID,
          status: 'accepted',
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body.error).toBe('Internal server error');
    });
  });
});
