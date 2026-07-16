import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  chainMock,
  makeGetRequest,
  makePostRequest,
  mockAuthenticatedSession,
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
  getSupabaseAdmin: () => ({
    from: mockFrom,
  }),
}));

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

import { GET, POST } from '../route';

describe('/api/spaces/chat', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── GET /api/spaces/chat ──────────────────────────────────────────────────

  describe('GET /api/spaces/chat', () => {
    describe('authentication', () => {
      it('returns 401 when no session exists', async () => {
        mockGetSessionData.mockResolvedValue(null);

        const req = makeGetRequest('/api/spaces/chat', { roomId: VALID_UUID });
        const res = await GET(req);
        const body = await res.json();

        expect(res.status).toBe(401);
        expect(body.error).toBe('Unauthorized');
      });

      it('accepts a valid session', async () => {
        mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());
        const { chain } = chainMock({ data: [], error: null });
        mockFrom.mockReturnValue(chain);

        const req = makeGetRequest('/api/spaces/chat', { roomId: VALID_UUID });
        const res = await GET(req);

        expect(res.status).toBe(200);
      });
    });

    describe('roomId validation', () => {
      beforeEach(() => {
        mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());
      });

      it('returns 400 when roomId is missing', async () => {
        const req = makeGetRequest('/api/spaces/chat');
        const res = await GET(req);
        const body = await res.json();

        expect(res.status).toBe(400);
        expect(body.error).toBe('Valid roomId (UUID) required');
      });

      it('returns 400 when roomId is not a valid UUID', async () => {
        const req = makeGetRequest('/api/spaces/chat', { roomId: 'not-a-uuid' });
        const res = await GET(req);
        const body = await res.json();

        expect(res.status).toBe(400);
        expect(body.error).toBe('Valid roomId (UUID) required');
      });

      it('returns 400 when roomId is empty string', async () => {
        const req = makeGetRequest('/api/spaces/chat', { roomId: '' });
        const res = await GET(req);
        const body = await res.json();

        expect(res.status).toBe(400);
        expect(body.error).toBe('Valid roomId (UUID) required');
      });

      it('accepts a valid UUID roomId', async () => {
        const { chain } = chainMock({ data: [], error: null });
        mockFrom.mockReturnValue(chain);

        const req = makeGetRequest('/api/spaces/chat', { roomId: VALID_UUID });
        const res = await GET(req);

        expect(res.status).toBe(200);
        expect(mockFrom).toHaveBeenCalledWith('room_messages');
      });
    });

    describe('database query', () => {
      beforeEach(() => {
        mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());
      });

      it('selects all fields from room_messages', async () => {
        const { chain } = chainMock({ data: [], error: null });
        mockFrom.mockReturnValue(chain);

        const req = makeGetRequest('/api/spaces/chat', { roomId: VALID_UUID });
        await GET(req);

        expect(chain.select).toHaveBeenCalledWith('*');
      });

      it('filters by room_id', async () => {
        const { chain } = chainMock({ data: [], error: null });
        mockFrom.mockReturnValue(chain);

        const req = makeGetRequest('/api/spaces/chat', { roomId: VALID_UUID });
        await GET(req);

        expect(chain.eq).toHaveBeenCalledWith('room_id', VALID_UUID);
      });

      it('orders by created_at ascending', async () => {
        const { chain } = chainMock({ data: [], error: null });
        mockFrom.mockReturnValue(chain);

        const req = makeGetRequest('/api/spaces/chat', { roomId: VALID_UUID });
        await GET(req);

        expect(chain.order).toHaveBeenCalledWith('created_at', { ascending: true });
      });

      it('limits results to 100', async () => {
        const { chain } = chainMock({ data: [], error: null });
        mockFrom.mockReturnValue(chain);

        const req = makeGetRequest('/api/spaces/chat', { roomId: VALID_UUID });
        await GET(req);

        expect(chain.limit).toHaveBeenCalledWith(100);
      });

      it('returns messages when query succeeds', async () => {
        const messages = [
          {
            id: '1',
            room_id: VALID_UUID,
            fid: 123,
            username: 'alice',
            pfp_url: 'https://example.com/1.jpg',
            message: 'hello',
            created_at: '2026-07-15T10:00:00Z',
          },
          {
            id: '2',
            room_id: VALID_UUID,
            fid: 124,
            username: 'bob',
            pfp_url: 'https://example.com/2.jpg',
            message: 'hi alice',
            created_at: '2026-07-15T10:01:00Z',
          },
        ];
        const { chain } = chainMock({ data: messages, error: null });
        mockFrom.mockReturnValue(chain);

        const req = makeGetRequest('/api/spaces/chat', { roomId: VALID_UUID });
        const res = await GET(req);
        const body = await res.json();

        expect(res.status).toBe(200);
        expect(body.messages).toEqual(messages);
      });

      it('returns empty array when no messages exist', async () => {
        const { chain } = chainMock({ data: [], error: null });
        mockFrom.mockReturnValue(chain);

        const req = makeGetRequest('/api/spaces/chat', { roomId: VALID_UUID });
        const res = await GET(req);
        const body = await res.json();

        expect(res.status).toBe(200);
        expect(body.messages).toEqual([]);
      });

      it('returns 500 on database error', async () => {
        const { chain } = chainMock({ data: null, error: { message: 'db error' } });
        mockFrom.mockReturnValue(chain);

        const req = makeGetRequest('/api/spaces/chat', { roomId: VALID_UUID });
        const res = await GET(req);
        const body = await res.json();

        expect(res.status).toBe(500);
        expect(body.error).toBe('Database error');
      });
    });

    describe('error handling', () => {
      beforeEach(() => {
        mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());
      });

      it('returns 500 when an unexpected error is thrown', async () => {
        mockFrom.mockImplementation(() => {
          throw new Error('unexpected error');
        });

        const req = makeGetRequest('/api/spaces/chat', { roomId: VALID_UUID });
        const res = await GET(req);
        const body = await res.json();

        expect(res.status).toBe(500);
        expect(body.error).toBe('Internal server error');
      });
    });
  });

  // ── POST /api/spaces/chat ─────────────────────────────────────────────────

  describe('POST /api/spaces/chat', () => {
    describe('authentication', () => {
      it('returns 401 when no session exists', async () => {
        mockGetSessionData.mockResolvedValue(null);

        const req = makePostRequest('/api/spaces/chat', {
          roomId: VALID_UUID,
          message: 'hello',
        });
        const res = await POST(req);
        const body = await res.json();

        expect(res.status).toBe(401);
        expect(body.error).toBe('Unauthorized');
      });

      it('accepts a valid session', async () => {
        mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());
        const { chain } = chainMock({ data: null, error: null });
        mockFrom.mockReturnValue(chain);

        const req = makePostRequest('/api/spaces/chat', {
          roomId: VALID_UUID,
          message: 'hello',
        });
        const res = await POST(req);

        expect(res.status).toBe(200);
      });
    });

    describe('body validation', () => {
      beforeEach(() => {
        mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());
      });

      it('returns 500 when body is not valid JSON (caught by try-catch)', async () => {
        const url = new URL('/api/spaces/chat', 'http://localhost:3000');
        const invalidReq = new Request(url, {
          method: 'POST',
          body: '{not json',
          // biome-ignore lint/suspicious/noExplicitAny: NextRequest constructor requires any cast
        }) as any;
        const res = await POST(invalidReq);
        const body = await res.json();

        expect(res.status).toBe(500);
        expect(body.error).toBe('Internal server error');
      });

      it('returns 400 when roomId is missing', async () => {
        const req = makePostRequest('/api/spaces/chat', { message: 'hello' });
        const res = await POST(req);
        const body = await res.json();

        expect(res.status).toBe(400);
        expect(body.error).toBe('Invalid input');
        expect(body.details).toBeDefined();
      });

      it('returns 400 when roomId is not a UUID', async () => {
        const req = makePostRequest('/api/spaces/chat', {
          roomId: 'not-a-uuid',
          message: 'hello',
        });
        const res = await POST(req);
        const body = await res.json();

        expect(res.status).toBe(400);
        expect(body.error).toBe('Invalid input');
      });

      it('returns 400 when message is missing', async () => {
        const req = makePostRequest('/api/spaces/chat', { roomId: VALID_UUID });
        const res = await POST(req);
        const body = await res.json();

        expect(res.status).toBe(400);
        expect(body.error).toBe('Invalid input');
      });

      it('returns 400 when message is empty string', async () => {
        const req = makePostRequest('/api/spaces/chat', {
          roomId: VALID_UUID,
          message: '',
        });
        const res = await POST(req);
        const body = await res.json();

        expect(res.status).toBe(400);
        expect(body.error).toBe('Invalid input');
      });

      it('returns 400 when message exceeds 500 chars', async () => {
        const longMessage = 'x'.repeat(501);
        const req = makePostRequest('/api/spaces/chat', {
          roomId: VALID_UUID,
          message: longMessage,
        });
        const res = await POST(req);
        const body = await res.json();

        expect(res.status).toBe(400);
        expect(body.error).toBe('Invalid input');
      });

      it('accepts message exactly 1 character', async () => {
        const { chain } = chainMock({ data: null, error: null });
        mockFrom.mockReturnValue(chain);

        const req = makePostRequest('/api/spaces/chat', {
          roomId: VALID_UUID,
          message: 'x',
        });
        const res = await POST(req);

        expect(res.status).toBe(200);
      });

      it('accepts message exactly 500 characters', async () => {
        const { chain } = chainMock({ data: null, error: null });
        mockFrom.mockReturnValue(chain);

        const req = makePostRequest('/api/spaces/chat', {
          roomId: VALID_UUID,
          message: 'x'.repeat(500),
        });
        const res = await POST(req);

        expect(res.status).toBe(200);
      });
    });

    describe('database insert', () => {
      const session = mockAuthenticatedSession({
        fid: 456,
        username: 'testuser',
        pfpUrl: 'https://example.com/pfp.jpg',
      });

      beforeEach(() => {
        mockGetSessionData.mockResolvedValue(session);
      });

      it('inserts message with correct fields', async () => {
        const { chain } = chainMock({ data: null, error: null });
        mockFrom.mockReturnValue(chain);

        const messageText = 'hello world';
        const req = makePostRequest('/api/spaces/chat', {
          roomId: VALID_UUID,
          message: messageText,
        });
        await POST(req);

        expect(chain.insert).toHaveBeenCalledWith({
          room_id: VALID_UUID,
          fid: 456,
          username: 'testuser',
          pfp_url: 'https://example.com/pfp.jpg',
          message: messageText,
        });
      });

      it('inserts into room_messages table', async () => {
        const { chain } = chainMock({ data: null, error: null });
        mockFrom.mockReturnValue(chain);

        const req = makePostRequest('/api/spaces/chat', {
          roomId: VALID_UUID,
          message: 'hello',
        });
        await POST(req);

        expect(mockFrom).toHaveBeenCalledWith('room_messages');
      });

      it('returns 200 with ok: true on success', async () => {
        const { chain } = chainMock({ data: null, error: null });
        mockFrom.mockReturnValue(chain);

        const req = makePostRequest('/api/spaces/chat', {
          roomId: VALID_UUID,
          message: 'hello',
        });
        const res = await POST(req);
        const body = await res.json();

        expect(res.status).toBe(200);
        expect(body.ok).toBe(true);
      });

      it('returns 500 on database error', async () => {
        const { chain } = chainMock({ data: null, error: { message: 'insert failed' } });
        mockFrom.mockReturnValue(chain);

        const req = makePostRequest('/api/spaces/chat', {
          roomId: VALID_UUID,
          message: 'hello',
        });
        const res = await POST(req);
        const body = await res.json();

        expect(res.status).toBe(500);
        expect(body.error).toBe('Database error');
      });
    });

    describe('error handling', () => {
      beforeEach(() => {
        mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());
      });

      it('returns 500 when an unexpected error is thrown', async () => {
        mockFrom.mockImplementation(() => {
          throw new Error('unexpected error');
        });

        const req = makePostRequest('/api/spaces/chat', {
          roomId: VALID_UUID,
          message: 'hello',
        });
        const res = await POST(req);
        const body = await res.json();

        expect(res.status).toBe(500);
        expect(body.error).toBe('Internal server error');
      });

      it('returns 500 when req.json() throws (caught by try-catch)', async () => {
        mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());

        const url = new URL('/api/spaces/chat', 'http://localhost:3000');
        const invalidReq = new Request(url, {
          method: 'POST',
          body: '{not json',
          // biome-ignore lint/suspicious/noExplicitAny: NextRequest constructor requires any cast
        }) as any;
        const res = await POST(invalidReq);
        const body = await res.json();

        expect(res.status).toBe(500);
        expect(body.error).toBe('Internal server error');
      });
    });

    describe('session data integration', () => {
      it('uses fid from session when inserting', async () => {
        mockGetSessionData.mockResolvedValue(
          mockAuthenticatedSession({ fid: 999, username: 'alice' }),
        );
        const { chain } = chainMock({ data: null, error: null });
        mockFrom.mockReturnValue(chain);

        const req = makePostRequest('/api/spaces/chat', {
          roomId: VALID_UUID,
          message: 'test',
        });
        await POST(req);

        expect(chain.insert).toHaveBeenCalledWith(expect.objectContaining({ fid: 999 }));
      });

      it('uses username from session when inserting', async () => {
        mockGetSessionData.mockResolvedValue(
          mockAuthenticatedSession({ username: 'bob', fid: 888 }),
        );
        const { chain } = chainMock({ data: null, error: null });
        mockFrom.mockReturnValue(chain);

        const req = makePostRequest('/api/spaces/chat', {
          roomId: VALID_UUID,
          message: 'test',
        });
        await POST(req);

        expect(chain.insert).toHaveBeenCalledWith(expect.objectContaining({ username: 'bob' }));
      });

      it('uses pfpUrl from session when inserting', async () => {
        mockGetSessionData.mockResolvedValue(
          mockAuthenticatedSession({ pfpUrl: 'https://example.com/custom.jpg' }),
        );
        const { chain } = chainMock({ data: null, error: null });
        mockFrom.mockReturnValue(chain);

        const req = makePostRequest('/api/spaces/chat', {
          roomId: VALID_UUID,
          message: 'test',
        });
        await POST(req);

        expect(chain.insert).toHaveBeenCalledWith(
          expect.objectContaining({ pfp_url: 'https://example.com/custom.jpg' }),
        );
      });
    });
  });
});
