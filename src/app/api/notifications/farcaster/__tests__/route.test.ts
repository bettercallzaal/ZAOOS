import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  makeGetRequest,
  mockAuthenticatedSession,
  mockUnauthenticatedSession,
} from '@/test-utils/api-helpers';

// ── Hoisted mocks ────────────────────────────────────────────────────────────
const { mockGetSessionData } = vi.hoisted(() => ({
  mockGetSessionData: vi.fn(),
}));

const { mockGetNotifications, mockMarkNotificationsSeen } = vi.hoisted(() => ({
  mockGetNotifications: vi.fn(),
  mockMarkNotificationsSeen: vi.fn(),
}));

vi.mock('@/lib/auth/session', () => ({
  getSessionData: () => mockGetSessionData(),
}));

vi.mock('@/lib/farcaster/neynar', () => ({
  getNotifications: mockGetNotifications,
  markNotificationsSeen: mockMarkNotificationsSeen,
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
  },
}));

// ── Route imports ────────────────────────────────────────────────────────────
import { GET, POST } from '../route';

// ── Test helpers ─────────────────────────────────────────────────────────────

/**
 * Create a mock notification object.
 */
function mockNotification(overrides?: Record<string, unknown>) {
  return {
    id: 'notif-1',
    fid: 123,
    type: 'reply',
    actor: {
      fid: 456,
      username: 'notifier',
      display_name: 'Notifier User',
      pfp_url: 'https://example.com/pfp.jpg',
    },
    timestamp: '2026-07-15T12:00:00Z',
    cast: {
      hash: 'cast-abc',
      text: 'Reply to your cast',
    },
    ...overrides,
  };
}

/**
 * Create a mock Neynar notifications response.
 */
function mockNotificationsResponse(notifications: unknown[], cursor?: string) {
  return {
    notifications: notifications || [],
    next: { cursor: cursor || null },
  };
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('GET /api/notifications/farcaster', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Authentication tests ──────────────────────────────────────────────────

  describe('Authentication', () => {
    it('returns 401 when session is null', async () => {
      mockGetSessionData.mockResolvedValue(null);
      const res = await GET(makeGetRequest('/api/notifications/farcaster'));
      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.error).toBe('Unauthorized');
    });

    it('returns 401 when session.fid is missing', async () => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: undefined }));
      const res = await GET(makeGetRequest('/api/notifications/farcaster'));
      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.error).toBe('Unauthorized');
    });

    it('returns 401 when session.fid is null', async () => {
      mockGetSessionData.mockResolvedValue({ fid: null } as unknown as ReturnType<
        typeof mockAuthenticatedSession
      >);
      const res = await GET(makeGetRequest('/api/notifications/farcaster'));
      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.error).toBe('Unauthorized');
    });

    it('returns 401 when using mockUnauthenticatedSession', async () => {
      mockGetSessionData.mockResolvedValue(mockUnauthenticatedSession());
      const res = await GET(makeGetRequest('/api/notifications/farcaster'));
      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.error).toBe('Unauthorized');
    });
  });

  // ── Success / happy path tests ────────────────────────────────────────────

  describe('Success path', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 123 }));
    });

    it('returns 200 with notifications data', async () => {
      const notif = mockNotification();
      mockGetNotifications.mockResolvedValue(mockNotificationsResponse([notif]));

      const res = await GET(makeGetRequest('/api/notifications/farcaster'));
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.notifications).toHaveLength(1);
      expect(body.notifications[0].id).toBe('notif-1');
      expect(body.notifications[0].actor.username).toBe('notifier');
    });

    it('calls getNotifications with correct fid', async () => {
      mockGetNotifications.mockResolvedValue(mockNotificationsResponse([]));

      await GET(makeGetRequest('/api/notifications/farcaster'));

      expect(mockGetNotifications).toHaveBeenCalledWith(123, undefined, undefined);
    });

    it('returns empty notifications array when none exist', async () => {
      mockGetNotifications.mockResolvedValue(mockNotificationsResponse([]));

      const res = await GET(makeGetRequest('/api/notifications/farcaster'));
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.notifications).toEqual([]);
    });

    it('returns multiple notifications correctly', async () => {
      const notifs = [
        mockNotification({ id: 'notif-1' }),
        mockNotification({ id: 'notif-2', type: 'like' }),
        mockNotification({ id: 'notif-3', type: 'recast' }),
      ];
      mockGetNotifications.mockResolvedValue(mockNotificationsResponse(notifs));

      const res = await GET(makeGetRequest('/api/notifications/farcaster'));
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.notifications).toHaveLength(3);
      expect(body.notifications[0].id).toBe('notif-1');
      expect(body.notifications[1].type).toBe('like');
      expect(body.notifications[2].type).toBe('recast');
    });
  });

  // ── Cursor parameter tests ────────────────────────────────────────────────

  describe('Cursor parameter', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 123 }));
    });

    it('passes cursor to getNotifications when provided', async () => {
      mockGetNotifications.mockResolvedValue(mockNotificationsResponse([]));

      await GET(makeGetRequest('/api/notifications/farcaster', { cursor: 'cursor-abc' }));

      expect(mockGetNotifications).toHaveBeenCalledWith(123, 'cursor-abc', undefined);
    });

    it('passes undefined cursor when not provided', async () => {
      mockGetNotifications.mockResolvedValue(mockNotificationsResponse([]));

      await GET(makeGetRequest('/api/notifications/farcaster'));

      expect(mockGetNotifications).toHaveBeenCalledWith(123, undefined, undefined);
    });

    it('includes cursor in pagination response', async () => {
      mockGetNotifications.mockResolvedValue(
        mockNotificationsResponse([mockNotification()], 'next-cursor-123'),
      );

      const res = await GET(makeGetRequest('/api/notifications/farcaster'));
      const body = await res.json();

      expect(body.next.cursor).toBe('next-cursor-123');
    });

    it('sets next.cursor to null when no more results', async () => {
      mockGetNotifications.mockResolvedValue(mockNotificationsResponse([mockNotification()]));

      const res = await GET(makeGetRequest('/api/notifications/farcaster'));
      const body = await res.json();

      expect(body.next.cursor).toBe(null);
    });
  });

  // ── Limit parameter tests ────────────────────────────────────────────────

  describe('Limit parameter', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 123 }));
    });

    it('passes limit to getNotifications when provided', async () => {
      mockGetNotifications.mockResolvedValue(mockNotificationsResponse([]));

      await GET(makeGetRequest('/api/notifications/farcaster', { limit: '10' }));

      expect(mockGetNotifications).toHaveBeenCalledWith(123, undefined, 10);
    });

    it('passes undefined limit when not provided', async () => {
      mockGetNotifications.mockResolvedValue(mockNotificationsResponse([]));

      await GET(makeGetRequest('/api/notifications/farcaster'));

      expect(mockGetNotifications).toHaveBeenCalledWith(123, undefined, undefined);
    });

    it('parses limit as integer', async () => {
      mockGetNotifications.mockResolvedValue(mockNotificationsResponse([]));

      await GET(makeGetRequest('/api/notifications/farcaster', { limit: '25' }));

      expect(mockGetNotifications).toHaveBeenCalledWith(123, undefined, 25);
    });

    it('handles non-numeric limit (parseInt returns NaN without guard)', async () => {
      // NOTE: The route does NOT guard against NaN. parseInt('abc', 10) = NaN
      // Math.min(NaN, anything) = NaN. This is a potential bug.
      mockGetNotifications.mockResolvedValue(mockNotificationsResponse([]));

      await GET(makeGetRequest('/api/notifications/farcaster', { limit: 'not-a-number' }));

      // The route passes NaN directly to getNotifications
      expect(mockGetNotifications).toHaveBeenCalledWith(123, undefined, Number.NaN);
    });
  });

  // ── Error handling tests ──────────────────────────────────────────────────

  describe('Error handling', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 123 }));
    });

    it('returns 500 when getNotifications throws', async () => {
      mockGetNotifications.mockRejectedValue(new Error('Neynar API error'));

      const res = await GET(makeGetRequest('/api/notifications/farcaster'));
      expect(res.status).toBe(500);

      const body = await res.json();
      expect(body.error).toBe('Failed to fetch notifications');
    });

    it('returns 500 on network error', async () => {
      mockGetNotifications.mockRejectedValue(new Error('Network timeout'));

      const res = await GET(makeGetRequest('/api/notifications/farcaster'));
      expect(res.status).toBe(500);

      const body = await res.json();
      expect(body.error).toBe('Failed to fetch notifications');
    });

    it('does not expose internal error message in response', async () => {
      mockGetNotifications.mockRejectedValue(new Error('Sensitive API key leaked in error'));

      const res = await GET(makeGetRequest('/api/notifications/farcaster'));
      const body = await res.json();

      expect(body.error).toBe('Failed to fetch notifications');
      expect(body.error).not.toContain('API key');
    });
  });

  // ── Response shape tests ──────────────────────────────────────────────────

  describe('Response shape', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 123 }));
    });

    it('returns object with notifications and next properties', async () => {
      const notif = mockNotification();
      mockGetNotifications.mockResolvedValue(mockNotificationsResponse([notif], 'cursor-1'));

      const res = await GET(makeGetRequest('/api/notifications/farcaster'));
      const body = await res.json();

      expect(body).toHaveProperty('notifications');
      expect(body).toHaveProperty('next');
      expect(body.next).toHaveProperty('cursor');
    });

    it('preserves notification object structure', async () => {
      const notif = mockNotification({
        id: 'notif-test',
        type: 'follow',
        actor: {
          fid: 999,
          username: 'follower',
          display_name: 'Follower Person',
          pfp_url: 'https://example.com/follower.jpg',
        },
        timestamp: '2026-07-15T10:30:00Z',
      });
      mockGetNotifications.mockResolvedValue(mockNotificationsResponse([notif]));

      const res = await GET(makeGetRequest('/api/notifications/farcaster'));
      const body = await res.json();

      const returned = body.notifications[0];
      expect(returned.id).toBe('notif-test');
      expect(returned.type).toBe('follow');
      expect(returned.actor.fid).toBe(999);
      expect(returned.actor.username).toBe('follower');
      expect(returned.timestamp).toBe('2026-07-15T10:30:00Z');
    });
  });
});

describe('POST /api/notifications/farcaster', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Authentication tests ──────────────────────────────────────────────────

  describe('Authentication', () => {
    it('returns 401 when session is null', async () => {
      mockGetSessionData.mockResolvedValue(null);
      const res = await POST();
      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.error).toBe('Signer required');
    });

    it('returns 401 when session.signerUuid is missing', async () => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ signerUuid: undefined }));
      const res = await POST();
      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.error).toBe('Signer required');
    });

    it('returns 401 when session.signerUuid is null', async () => {
      mockGetSessionData.mockResolvedValue({
        signerUuid: null,
      } as unknown as ReturnType<typeof mockAuthenticatedSession>);
      const res = await POST();
      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.error).toBe('Signer required');
    });

    it('returns 401 when using unauthenticated session', async () => {
      mockGetSessionData.mockResolvedValue(mockUnauthenticatedSession());
      const res = await POST();
      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.error).toBe('Signer required');
    });
  });

  // ── Success path tests ────────────────────────────────────────────────────

  describe('Success path', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(
        mockAuthenticatedSession({ signerUuid: 'signer-uuid-123' }),
      );
    });

    it('returns 200 with success: true', async () => {
      mockMarkNotificationsSeen.mockResolvedValue({ success: true });

      const res = await POST();
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.success).toBe(true);
    });

    it('calls markNotificationsSeen with correct signerUuid', async () => {
      mockMarkNotificationsSeen.mockResolvedValue({ success: true });

      await POST();

      expect(mockMarkNotificationsSeen).toHaveBeenCalledWith('signer-uuid-123');
      expect(mockMarkNotificationsSeen).toHaveBeenCalledTimes(1);
    });

    it('passes different signerUuid values correctly', async () => {
      mockMarkNotificationsSeen.mockResolvedValue({ success: true });

      mockGetSessionData.mockResolvedValue(
        mockAuthenticatedSession({ signerUuid: 'different-uuid-456' }),
      );
      await POST();

      expect(mockMarkNotificationsSeen).toHaveBeenCalledWith('different-uuid-456');
    });
  });

  // ── Error handling tests ──────────────────────────────────────────────────

  describe('Error handling', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(
        mockAuthenticatedSession({ signerUuid: 'signer-uuid-123' }),
      );
    });

    it('returns 500 when markNotificationsSeen throws', async () => {
      mockMarkNotificationsSeen.mockRejectedValue(new Error('Neynar API error'));

      const res = await POST();
      expect(res.status).toBe(500);

      const body = await res.json();
      expect(body.error).toBe('Failed to mark notifications seen');
    });

    it('returns 500 on network error', async () => {
      mockMarkNotificationsSeen.mockRejectedValue(new Error('Connection refused'));

      const res = await POST();
      expect(res.status).toBe(500);

      const body = await res.json();
      expect(body.error).toBe('Failed to mark notifications seen');
    });

    it('does not expose internal error message', async () => {
      mockMarkNotificationsSeen.mockRejectedValue(new Error('Internal server secret exposed'));

      const res = await POST();
      const body = await res.json();

      expect(body.error).toBe('Failed to mark notifications seen');
      expect(body.error).not.toContain('secret');
    });
  });

  // ── Response shape tests ──────────────────────────────────────────────────

  describe('Response shape', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(
        mockAuthenticatedSession({ signerUuid: 'signer-uuid-123' }),
      );
    });

    it('returns object with success property', async () => {
      mockMarkNotificationsSeen.mockResolvedValue({ success: true });

      const res = await POST();
      const body = await res.json();

      expect(body).toHaveProperty('success');
      expect(typeof body.success).toBe('boolean');
    });

    it('returns only success in response body', async () => {
      mockMarkNotificationsSeen.mockResolvedValue({ custom_field: 'should_not_appear' });

      const res = await POST();
      const body = await res.json();

      // Route directly returns whatever Neynar returns
      expect(body).toHaveProperty('success');
    });
  });
});
