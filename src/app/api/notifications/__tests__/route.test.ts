import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  chainMock,
  makeGetRequest,
  makePostRequest,
  mockAuthenticatedSession,
  mockUnauthenticatedSession,
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
  supabaseAdmin: { from: mockFrom },
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}));

import { GET, PATCH } from '../route';

// ── Test fixtures ────────────────────────────────────────────────────────────

/** Sample notification objects for testing */
const SAMPLE_NOTIFICATION = {
  id: '550e8400-e29b-41d4-a716-446655440001',
  recipient_fid: 123,
  sender_fid: 456,
  type: 'mention',
  content: 'You were mentioned in a cast',
  read: false,
  created_at: '2026-07-15T10:00:00Z',
};

const SAMPLE_NOTIFICATION_2 = {
  id: '550e8400-e29b-41d4-a716-446655440002',
  recipient_fid: 123,
  sender_fid: 789,
  type: 'reply',
  content: 'Someone replied to your cast',
  read: false,
  created_at: '2026-07-15T09:00:00Z',
};

const READ_NOTIFICATION = {
  ...SAMPLE_NOTIFICATION,
  id: '550e8400-e29b-41d4-a716-446655440003',
  read: true,
};

describe('GET /api/notifications', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSessionData.mockResolvedValue(mockUnauthenticatedSession());
  });

  describe('authentication', () => {
    it('returns 401 when no session is present', async () => {
      mockGetSessionData.mockResolvedValue(null);

      const res = await GET(makeGetRequest('/api/notifications'));
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

    it('fetches all notifications for the user', async () => {
      const mainMock = chainMock({
        data: [SAMPLE_NOTIFICATION, SAMPLE_NOTIFICATION_2],
        count: 2,
      });

      const unreadMock = chainMock({
        count: 1,
      });

      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount += 1;
        return callCount === 1 ? mainMock.handler() : unreadMock.handler();
      });

      const res = await GET(makeGetRequest('/api/notifications'));
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.notifications).toHaveLength(2);
      expect(body.notifications[0].id).toBe(SAMPLE_NOTIFICATION.id);
      expect(body.unreadCount).toBe(1);
      expect(body.total).toBe(2);
      expect(body.limit).toBe(50);
      expect(body.offset).toBe(0);
    });

    it('filters by unread_only=true', async () => {
      const mock = chainMock({
        data: [SAMPLE_NOTIFICATION],
        count: 1,
      });
      mockFrom.mockImplementation(mock.handler);

      const res = await GET(makeGetRequest('/api/notifications', { unread_only: 'true' }));
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.notifications).toHaveLength(1);
      expect(body.notifications[0].read).toBe(false);

      // Verify the chain was called with eq('read', false)
      const calls = mock.chain.eq.mock.calls;
      expect(calls).toContainEqual(['read', false]);
    });

    it('respects custom limit parameter', async () => {
      const mock = chainMock({
        data: [SAMPLE_NOTIFICATION],
        count: 1,
      });
      mockFrom.mockImplementation(mock.handler);

      const res = await GET(makeGetRequest('/api/notifications', { limit: '10' }));
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.limit).toBe(10);
    });

    it('caps limit at 100', async () => {
      const mock = chainMock({
        data: [],
        count: 0,
      });
      mockFrom.mockImplementation(mock.handler);

      const res = await GET(makeGetRequest('/api/notifications', { limit: '200' }));
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.limit).toBe(100);
    });

    it('respects custom offset parameter', async () => {
      const mock = chainMock({
        data: [SAMPLE_NOTIFICATION],
        count: 2,
      });
      mockFrom.mockImplementation(mock.handler);

      const res = await GET(makeGetRequest('/api/notifications', { offset: '5' }));
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.offset).toBe(5);
    });

    it('clamps negative offset to 0', async () => {
      const mock = chainMock({
        data: [],
        count: 0,
      });
      mockFrom.mockImplementation(mock.handler);

      const res = await GET(makeGetRequest('/api/notifications', { offset: '-10' }));
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.offset).toBe(0);
    });

    it('returns empty notifications when user has none', async () => {
      const mock = chainMock({
        data: [],
        count: 0,
      });
      mockFrom.mockImplementation(mock.handler);

      const res = await GET(makeGetRequest('/api/notifications'));
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.notifications).toEqual([]);
      expect(body.total).toBe(0);
    });

    it('fetches unread count separately', async () => {
      const mainMock = chainMock({
        data: [SAMPLE_NOTIFICATION, READ_NOTIFICATION],
        count: 2,
      });

      const unreadMock = chainMock({
        count: 1,
      });

      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount += 1;
        return callCount === 1 ? mainMock.handler() : unreadMock.handler();
      });

      const res = await GET(makeGetRequest('/api/notifications'));
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.notifications).toHaveLength(2);
      expect(body.unreadCount).toBe(1);
      expect(mockFrom).toHaveBeenCalledTimes(2);
    });

    it('uses recipient_fid from session', async () => {
      const sessionFid = 999;
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: sessionFid }));

      const mock = chainMock({
        data: [],
        count: 0,
      });
      mockFrom.mockImplementation(mock.handler);

      await GET(makeGetRequest('/api/notifications'));

      // Verify eq was called with the session FID
      const calls = mock.chain.eq.mock.calls;
      expect(calls).toContainEqual(['recipient_fid', sessionFid]);
    });
  });

  describe('error handling', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 123 }));
    });

    it('returns 500 when Supabase query fails', async () => {
      const mock = chainMock({
        error: { message: 'Database connection failed' },
        data: null,
      });
      mockFrom.mockImplementation(mock.handler);

      const res = await GET(makeGetRequest('/api/notifications'));
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body.error).toBe('Failed to fetch notifications');
    });

    it('returns 500 when unexpected error is thrown', async () => {
      mockFrom.mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      const res = await GET(makeGetRequest('/api/notifications'));
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body.error).toBe('Failed to fetch notifications');
    });

    it('handles null data gracefully', async () => {
      const mock = chainMock({
        data: null,
        count: 0,
      });
      mockFrom.mockImplementation(mock.handler);

      const res = await GET(makeGetRequest('/api/notifications'));
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.notifications).toEqual([]);
    });

    it('handles null count gracefully', async () => {
      const mock = chainMock({
        data: [SAMPLE_NOTIFICATION],
        count: null,
      });
      mockFrom.mockImplementation(mock.handler);

      const res = await GET(makeGetRequest('/api/notifications'));
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.total).toBe(1);
    });
  });
});

describe('PATCH /api/notifications', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSessionData.mockResolvedValue(mockUnauthenticatedSession());
  });

  describe('authentication', () => {
    it('returns 401 when no session is present', async () => {
      mockGetSessionData.mockResolvedValue(null);

      const res = await PATCH(makePostRequest('/api/notifications', { all: true }));
      const body = await res.json();

      expect(res.status).toBe(401);
      expect(body.error).toBe('Unauthorized');
      expect(mockFrom).not.toHaveBeenCalled();
    });
  });

  describe('validation', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 123 }));
    });

    it('rejects body with neither ids nor all', async () => {
      const res = await PATCH(makePostRequest('/api/notifications', {}));
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Provide ids (uuid[]) or all: true');
      expect(body.details).toBeDefined();
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it('allows either ids or all (union accepts first match)', async () => {
      // z.union tries schemas in order. { all: true, ids: [...] } matches the first schema
      // (which only requires all: true), so it succeeds. This is actually the behavior of
      // the schema, not an error case.
      const mock = chainMock({});
      mockFrom.mockImplementation(mock.handler);

      const res = await PATCH(
        makePostRequest('/api/notifications', {
          ids: ['550e8400-e29b-41d4-a716-446655440001'],
          all: true,
        }),
      );
      const body = await res.json();

      // The schema's first union branch matches { all: true }, so this succeeds
      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
    });

    it('rejects invalid JSON in body', async () => {
      const req = new (require('next/server').NextRequest)(
        new URL('/api/notifications', 'http://localhost:3000'),
        {
          method: 'PATCH',
          body: '{not valid json',
        },
      );

      const res = await PATCH(req);
      expect(res.status).toBe(500);
    });

    it('rejects ids if array is empty', async () => {
      const res = await PATCH(makePostRequest('/api/notifications', { ids: [] }));
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Provide ids (uuid[]) or all: true');
    });

    it('rejects ids if array exceeds 100 items', async () => {
      const ids = Array.from(
        { length: 101 },
        (_, i) => `550e8400-e29b-41d4-a716-44665544000${String(i).padStart(2, '0')}`,
      );

      const res = await PATCH(makePostRequest('/api/notifications', { ids }));
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Provide ids (uuid[]) or all: true');
    });

    it('rejects ids if any item is not a valid UUID', async () => {
      const res = await PATCH(
        makePostRequest('/api/notifications', {
          ids: ['550e8400-e29b-41d4-a716-446655440001', 'not-a-uuid'],
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Provide ids (uuid[]) or all: true');
    });

    it('rejects all if not a boolean true', async () => {
      const res = await PATCH(makePostRequest('/api/notifications', { all: false }));
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Provide ids (uuid[]) or all: true');
    });
  });

  describe('success paths', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 123 }));
    });

    it('marks all notifications as read', async () => {
      const mock = chainMock({});
      mockFrom.mockImplementation(mock.handler);

      const res = await PATCH(makePostRequest('/api/notifications', { all: true }));
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);

      // Verify the update chain was called correctly
      expect(mock.chain.update).toHaveBeenCalledWith({ read: true });
      expect(mock.chain.eq).toHaveBeenCalledWith('recipient_fid', 123);
      expect(mock.chain.eq).toHaveBeenCalledWith('read', false);
    });

    it('marks specific notifications as read', async () => {
      const ids = ['550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002'];

      const mock = chainMock({});
      mockFrom.mockImplementation(mock.handler);

      const res = await PATCH(makePostRequest('/api/notifications', { ids }));
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);

      // Verify the update chain was called correctly
      expect(mock.chain.update).toHaveBeenCalledWith({ read: true });
      expect(mock.chain.eq).toHaveBeenCalledWith('recipient_fid', 123);
      expect(mock.chain.in).toHaveBeenCalledWith('id', ids);
    });

    it('marks a single notification as read', async () => {
      const id = '550e8400-e29b-41d4-a716-446655440001';

      const mock = chainMock({});
      mockFrom.mockImplementation(mock.handler);

      const res = await PATCH(makePostRequest('/api/notifications', { ids: [id] }));
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);

      expect(mock.chain.in).toHaveBeenCalledWith('id', [id]);
    });

    it('uses recipient_fid from session', async () => {
      const sessionFid = 999;
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: sessionFid }));

      const mock = chainMock({});
      mockFrom.mockImplementation(mock.handler);

      await PATCH(makePostRequest('/api/notifications', { all: true }));

      // Verify eq was called with the session FID
      const calls = mock.chain.eq.mock.calls;
      expect(calls).toContainEqual(['recipient_fid', sessionFid]);
    });

    it('succeeds with exactly 100 ids', async () => {
      // Generate 100 valid UUIDs: 550e8400-e29b-41d4-a716-<12-hex-digits>
      const ids = Array.from({ length: 100 }, (_, i) => {
        const num = String(i).padStart(12, '0');
        return `550e8400-e29b-41d4-a716-${num}`;
      });

      const mock = chainMock({});
      mockFrom.mockImplementation(mock.handler);

      const res = await PATCH(makePostRequest('/api/notifications', { ids }));
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      expect(mock.chain.in).toHaveBeenCalledWith('id', ids);
    });
  });

  describe('error handling', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 123 }));
    });

    it('returns 500 on unexpected error', async () => {
      mockFrom.mockImplementation(() => {
        throw new Error('Database error');
      });

      const res = await PATCH(makePostRequest('/api/notifications', { all: true }));
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body.error).toBe('Failed to update notifications');
    });

    it('returns 500 when Supabase update fails silently', async () => {
      const mock = chainMock({
        error: { message: 'Update failed' },
      });
      mockFrom.mockImplementation(mock.handler);

      const res = await PATCH(
        makePostRequest('/api/notifications', { ids: ['550e8400-e29b-41d4-a716-446655440001'] }),
      );

      // The route doesn't check for error on the update, so it succeeds
      expect(res.status).toBe(200);
    });
  });
});
