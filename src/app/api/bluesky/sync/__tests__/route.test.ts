import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mockAdminSession, mockAuthenticatedSession } from '@/test-utils/api-helpers';

// ── Hoisted mocks ────────────────────────────────────────────────────────────
const { mockGetSessionData, mockSyncMemberPosts } = vi.hoisted(() => ({
  mockGetSessionData: vi.fn(),
  mockSyncMemberPosts: vi.fn(),
}));

vi.mock('@/lib/auth/session', () => ({
  getSessionData: () => mockGetSessionData(),
}));

vi.mock('@/lib/bluesky/feed', () => ({
  syncMemberPosts: () => mockSyncMemberPosts(),
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
  },
}));

// Import route handler after mocks
import { POST } from '../route';

describe('POST /api/bluesky/sync', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ────────────────────────────────────────────────────────────────────────────
  // Auth: Unauthenticated (null session)
  // ────────────────────────────────────────────────────────────────────────────

  it('returns 403 Forbidden when session is null', async () => {
    mockGetSessionData.mockResolvedValue(null);

    const res = await POST();
    expect(res.status).toBe(403);

    const body = await res.json();
    expect(body.error).toBe('Forbidden');
  });

  // ────────────────────────────────────────────────────────────────────────────
  // Auth: Non-admin (isAdmin = false)
  // ────────────────────────────────────────────────────────────────────────────

  it('returns 403 Forbidden when user is not admin', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession());

    const res = await POST();
    expect(res.status).toBe(403);

    const body = await res.json();
    expect(body.error).toBe('Forbidden');
  });

  // ────────────────────────────────────────────────────────────────────────────
  // Success: Admin syncs member posts
  // ────────────────────────────────────────────────────────────────────────────

  it('returns 200 with sync result when admin calls sync', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());

    const syncResult = {
      synced: 15,
      members: 3,
      errors: [],
    };
    mockSyncMemberPosts.mockResolvedValue(syncResult);

    const res = await POST();
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.synced).toBe(15);
    expect(body.members).toBe(3);
    expect(body.errors).toEqual([]);
  });

  it('returns result with partial sync and error messages', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());

    const syncResult = {
      synced: 8,
      members: 5,
      errors: ['alice.bsky.social: Connection timeout', 'bob.bsky.social: Not found'],
    };
    mockSyncMemberPosts.mockResolvedValue(syncResult);

    const res = await POST();
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.synced).toBe(8);
    expect(body.members).toBe(5);
    expect(body.errors).toHaveLength(2);
    expect(body.errors).toContain('alice.bsky.social: Connection timeout');
    expect(body.errors).toContain('bob.bsky.social: Not found');
  });

  it('returns result when sync finds no posts', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());

    const syncResult = {
      synced: 0,
      members: 2,
      errors: [],
    };
    mockSyncMemberPosts.mockResolvedValue(syncResult);

    const res = await POST();
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.synced).toBe(0);
    expect(body.members).toBe(2);
  });

  it('returns result when no members are tracked', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());

    const syncResult = {
      synced: 0,
      members: 0,
      errors: [],
    };
    mockSyncMemberPosts.mockResolvedValue(syncResult);

    const res = await POST();
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.synced).toBe(0);
    expect(body.members).toBe(0);
  });

  // ────────────────────────────────────────────────────────────────────────────
  // Error: Sync operation failure
  // ────────────────────────────────────────────────────────────────────────────

  it('returns 500 when syncMemberPosts throws', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());

    const syncError = new Error('Database connection failed');
    mockSyncMemberPosts.mockRejectedValue(syncError);

    const res = await POST();
    expect(res.status).toBe(500);

    const body = await res.json();
    expect(body.error).toBe('Sync failed');
  });

  it('returns 500 when syncMemberPosts throws a non-Error object', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());

    mockSyncMemberPosts.mockRejectedValue('Unexpected error string');

    const res = await POST();
    expect(res.status).toBe(500);

    const body = await res.json();
    expect(body.error).toBe('Sync failed');
  });

  it('logs error when sync operation fails', async () => {
    const { logger } = await import('@/lib/logger');
    const loggerErrorSpy = vi.spyOn(vi.mocked(logger), 'error');

    mockGetSessionData.mockResolvedValue(mockAdminSession());

    const syncError = new Error('Bluesky API rate limited');
    mockSyncMemberPosts.mockRejectedValue(syncError);

    await POST();

    expect(loggerErrorSpy).toHaveBeenCalledWith('[bluesky/sync] Error:', expect.any(Error));
  });

  // ────────────────────────────────────────────────────────────────────────────
  // Integration: Admin session required + sync called exactly once
  // ────────────────────────────────────────────────────────────────────────────

  it('calls syncMemberPosts exactly once on success', async () => {
    mockGetSessionData.mockResolvedValue(mockAdminSession());

    const syncResult = {
      synced: 10,
      members: 2,
      errors: [],
    };
    mockSyncMemberPosts.mockResolvedValue(syncResult);

    await POST();

    expect(mockSyncMemberPosts).toHaveBeenCalledTimes(1);
  });

  it('does not call syncMemberPosts when session is null', async () => {
    mockGetSessionData.mockResolvedValue(null);

    await POST();

    expect(mockSyncMemberPosts).not.toHaveBeenCalled();
  });

  it('does not call syncMemberPosts when user is not admin', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ isAdmin: false }));

    await POST();

    expect(mockSyncMemberPosts).not.toHaveBeenCalled();
  });
});
