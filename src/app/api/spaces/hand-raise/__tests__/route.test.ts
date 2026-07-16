import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  chainMock,
  makeGetRequest,
  makePostRequest,
  mockAuthenticatedSession,
  mockUnauthenticatedSession,
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
  getSupabaseAdmin: () => ({
    from: mockFrom,
  }),
}));

vi.mock('@/lib/logger', () => ({
  logger: mockLogger,
}));

// ── Route imports ────────────────────────────────────────────────────────────
import { GET, POST } from '@/app/api/spaces/hand-raise/route';

// ── Test constants ───────────────────────────────────────────────────────────
const TEST_ROOM_ID = VALID_UUID;
const TEST_USER_FID = 123;
const TEST_TARGET_FID = 456;

// ──────────────────────────────────────────────────────────────────────────────
// GET TESTS
// ──────────────────────────────────────────────────────────────────────────────

describe('GET /api/spaces/hand-raise', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when session is missing', async () => {
    mockGetSessionData.mockResolvedValue(mockUnauthenticatedSession());
    const req = makeGetRequest('/api/spaces/hand-raise', { roomId: TEST_ROOM_ID });

    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe('Unauthorized');
  });

  it('returns 400 when roomId query param is missing', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());
    const req = makeGetRequest('/api/spaces/hand-raise', {});

    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe('roomId required');
  });

  it('returns raised hands when query succeeds', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());

    const mockRaises = [
      {
        room_id: TEST_ROOM_ID,
        fid: TEST_USER_FID,
        username: 'testuser',
        status: 'raised',
        created_at: '2026-01-01T00:00:00Z',
      },
    ];

    const mock = chainMock({ data: mockRaises, error: null });
    mockFrom.mockReturnValue(mock.chain);

    const req = makeGetRequest('/api/spaces/hand-raise', { roomId: TEST_ROOM_ID });
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.raises).toEqual(mockRaises);
    expect(mockFrom).toHaveBeenCalledWith('room_hand_raises');
  });

  it('filters to raised and invited statuses', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());

    const mock = chainMock({ data: [], error: null });
    mockFrom.mockReturnValue(mock.chain);

    const req = makeGetRequest('/api/spaces/hand-raise', { roomId: TEST_ROOM_ID });
    await GET(req);

    expect(mockFrom).toHaveBeenCalledWith('room_hand_raises');
    // Verify the chain calls for filtering
    expect(mock.chain.select).toHaveBeenCalledWith('*');
    expect(mock.chain.eq).toHaveBeenCalledWith('room_id', TEST_ROOM_ID);
    expect(mock.chain.in).toHaveBeenCalledWith('status', ['raised', 'invited']);
    expect(mock.chain.order).toHaveBeenCalledWith('created_at', { ascending: true });
  });

  it('returns 500 when database error occurs', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());

    const dbError = new Error('Connection failed');
    const mock = chainMock({ data: null, error: dbError });
    mockFrom.mockReturnValue(mock.chain);

    const req = makeGetRequest('/api/spaces/hand-raise', { roomId: TEST_ROOM_ID });
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBe('Database error');
    expect(mockLogger.error).toHaveBeenCalledWith('GET hand-raise error:', dbError);
  });

  it('returns 500 when unexpected error is thrown', async () => {
    mockGetSessionData.mockRejectedValue(new Error('Session error'));

    const req = makeGetRequest('/api/spaces/hand-raise', { roomId: TEST_ROOM_ID });
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBe('Internal server error');
    expect(mockLogger.error).toHaveBeenCalled();
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// POST TESTS
// ──────────────────────────────────────────────────────────────────────────────

describe('POST /api/spaces/hand-raise', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Auth guard tests ──────────────────────────────────────────────────────
  it('returns 401 when session is missing', async () => {
    mockGetSessionData.mockResolvedValue(mockUnauthenticatedSession());
    const req = makePostRequest('/api/spaces/hand-raise', {
      roomId: TEST_ROOM_ID,
      action: 'raise',
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe('Unauthorized');
  });

  // ── Zod validation tests ──────────────────────────────────────────────────
  describe('input validation', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());
    });

    it('returns 400 when roomId is invalid', async () => {
      const req = makePostRequest('/api/spaces/hand-raise', {
        roomId: 'not-a-uuid',
        action: 'raise',
      });

      const res = await POST(req);
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid input');
      expect(body.details).toBeDefined();
    });

    it('returns 400 when action is invalid', async () => {
      const req = makePostRequest('/api/spaces/hand-raise', {
        roomId: TEST_ROOM_ID,
        action: 'invalid',
      });

      const res = await POST(req);
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid input');
      expect(body.details).toBeDefined();
    });

    it('returns 500 when body is not valid JSON (caught by try/catch)', async () => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());
      // Manually create request with invalid JSON
      const invalidReq = new (require('next/server').NextRequest)(
        new URL('/api/spaces/hand-raise', 'http://localhost:3000'),
        {
          method: 'POST',
          body: 'not json',
        },
      );

      const res = await POST(invalidReq);
      expect(res.status).toBe(500);
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  // ── Raise action tests ────────────────────────────────────────────────────
  describe('action: raise', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(
        mockAuthenticatedSession({
          fid: TEST_USER_FID,
          username: 'testuser',
          pfpUrl: 'https://example.com/pfp.jpg',
        }),
      );
    });

    it('successfully raises hand', async () => {
      const mock = chainMock({ data: null, error: null });
      mockFrom.mockReturnValue(mock.chain);

      const req = makePostRequest('/api/spaces/hand-raise', {
        roomId: TEST_ROOM_ID,
        action: 'raise',
      });

      const res = await POST(req);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.ok).toBe(true);
      expect(mockFrom).toHaveBeenCalledWith('room_hand_raises');
      expect(mock.chain.upsert).toHaveBeenCalledWith(
        {
          room_id: TEST_ROOM_ID,
          fid: TEST_USER_FID,
          username: 'testuser',
          pfp_url: 'https://example.com/pfp.jpg',
          status: 'raised',
        },
        { onConflict: 'room_id,fid' },
      );
    });

    it('returns 500 when upsert fails', async () => {
      const dbError = new Error('Upsert failed');
      const mock = chainMock({ data: null, error: dbError });
      mockFrom.mockReturnValue(mock.chain);

      const req = makePostRequest('/api/spaces/hand-raise', {
        roomId: TEST_ROOM_ID,
        action: 'raise',
      });

      const res = await POST(req);
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body.error).toBe('Database error');
      expect(mockLogger.error).toHaveBeenCalledWith('raise error:', dbError);
    });
  });

  // ── Lower action tests ────────────────────────────────────────────────────
  describe('action: lower', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: TEST_USER_FID }));
    });

    it('successfully lowers hand', async () => {
      const mock = chainMock({ data: null, error: null });
      mockFrom.mockReturnValue(mock.chain);

      const req = makePostRequest('/api/spaces/hand-raise', {
        roomId: TEST_ROOM_ID,
        action: 'lower',
      });

      const res = await POST(req);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.ok).toBe(true);
      expect(mockFrom).toHaveBeenCalledWith('room_hand_raises');
      expect(mock.chain.update).toHaveBeenCalledWith({ status: 'lowered' });
      expect(mock.chain.eq).toHaveBeenCalledWith('fid', TEST_USER_FID);
    });

    it('targets the correct room and user in lower', async () => {
      const mock = chainMock({ data: null, error: null });
      mockFrom.mockReturnValue(mock.chain);

      const req = makePostRequest('/api/spaces/hand-raise', {
        roomId: TEST_ROOM_ID,
        action: 'lower',
      });

      await POST(req);

      const eqCalls = mock.chain.eq.mock.calls;
      expect(eqCalls).toContainEqual(['room_id', TEST_ROOM_ID]);
      expect(eqCalls).toContainEqual(['fid', TEST_USER_FID]);
    });
  });

  // ── Invite action tests ───────────────────────────────────────────────────
  describe('action: invite', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: TEST_USER_FID }));
    });

    it('returns 400 when targetFid is missing', async () => {
      const req = makePostRequest('/api/spaces/hand-raise', {
        roomId: TEST_ROOM_ID,
        action: 'invite',
      });

      const res = await POST(req);
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('targetFid required');
    });

    it('returns 403 when user is not room host', async () => {
      const mock = chainMock({
        data: { host_fid: TEST_TARGET_FID },
        error: null,
      });
      mockFrom.mockReturnValue(mock.chain);

      const req = makePostRequest('/api/spaces/hand-raise', {
        roomId: TEST_ROOM_ID,
        action: 'invite',
        targetFid: TEST_TARGET_FID,
      });

      const res = await POST(req);
      const body = await res.json();

      expect(res.status).toBe(403);
      expect(body.error).toBe('Only the host can invite or dismiss');
    });

    it('returns 403 when room does not exist', async () => {
      const mock = chainMock({ data: null, error: null });
      mockFrom.mockReturnValue(mock.chain);

      const req = makePostRequest('/api/spaces/hand-raise', {
        roomId: TEST_ROOM_ID,
        action: 'invite',
        targetFid: TEST_TARGET_FID,
      });

      const res = await POST(req);
      const body = await res.json();

      expect(res.status).toBe(403);
      expect(body.error).toBe('Only the host can invite or dismiss');
    });

    it('successfully invites when user is host', async () => {
      const mockChainForRoom = chainMock({
        data: { host_fid: TEST_USER_FID },
        error: null,
      });

      const mockChainForUpdate = chainMock({ data: null, error: null });

      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount++;
        return callCount === 1 ? mockChainForRoom.chain : mockChainForUpdate.chain;
      });

      const req = makePostRequest('/api/spaces/hand-raise', {
        roomId: TEST_ROOM_ID,
        action: 'invite',
        targetFid: TEST_TARGET_FID,
      });

      const res = await POST(req);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.ok).toBe(true);
      expect(mockChainForUpdate.chain.update).toHaveBeenCalledWith({
        status: 'invited',
      });
    });
  });

  // ── Dismiss action tests ──────────────────────────────────────────────────
  describe('action: dismiss', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: TEST_USER_FID }));
    });

    it('returns 400 when targetFid is missing', async () => {
      const req = makePostRequest('/api/spaces/hand-raise', {
        roomId: TEST_ROOM_ID,
        action: 'dismiss',
      });

      const res = await POST(req);
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('targetFid required');
    });

    it('returns 403 when user is not room host', async () => {
      const mock = chainMock({
        data: { host_fid: TEST_TARGET_FID },
        error: null,
      });
      mockFrom.mockReturnValue(mock.chain);

      const req = makePostRequest('/api/spaces/hand-raise', {
        roomId: TEST_ROOM_ID,
        action: 'dismiss',
        targetFid: TEST_TARGET_FID,
      });

      const res = await POST(req);
      const body = await res.json();

      expect(res.status).toBe(403);
      expect(body.error).toBe('Only the host can invite or dismiss');
    });

    it('successfully dismisses when user is host', async () => {
      const mockChainForRoom = chainMock({
        data: { host_fid: TEST_USER_FID },
        error: null,
      });

      const mockChainForUpdate = chainMock({ data: null, error: null });

      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount++;
        return callCount === 1 ? mockChainForRoom.chain : mockChainForUpdate.chain;
      });

      const req = makePostRequest('/api/spaces/hand-raise', {
        roomId: TEST_ROOM_ID,
        action: 'dismiss',
        targetFid: TEST_TARGET_FID,
      });

      const res = await POST(req);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.ok).toBe(true);
      expect(mockChainForUpdate.chain.update).toHaveBeenCalledWith({
        status: 'dismissed',
      });
    });
  });

  // ── General error handling ────────────────────────────────────────────────
  it('returns 500 on unexpected error', async () => {
    mockGetSessionData.mockRejectedValue(new Error('Unknown error'));

    const req = makePostRequest('/api/spaces/hand-raise', {
      roomId: TEST_ROOM_ID,
      action: 'raise',
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBe('Internal server error');
    expect(mockLogger.error).toHaveBeenCalled();
  });
});
