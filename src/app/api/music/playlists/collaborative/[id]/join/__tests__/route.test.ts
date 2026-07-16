import { beforeEach, describe, expect, it, vi } from 'vitest';

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
    info: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

// ── Route import ─────────────────────────────────────────────────────────────
import { POST } from '@/app/api/music/playlists/collaborative/[id]/join/route';

// ── Test constants ───────────────────────────────────────────────────────────
const PLAYLIST_ID = '123e4567-e89b-12d3-a456-426614174000';

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Create a Supabase chain mock that resolves to `result`.
 * Note: intentionally uses thenable pattern for mock.
 */
function chainMock(result: { data?: unknown; error?: unknown }) {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {};

  // Chainable methods
  const chainable = ['select', 'eq', 'from', 'upsert', 'order', 'limit', 'single', 'maybeSingle'];

  for (const method of chainable) {
    chain[method] = vi.fn().mockReturnValue(chain);
  }

  // Terminal — .single() resolves the query
  chain.single = vi.fn().mockResolvedValue(result);

  // Allow the chain to be awaited directly
  // biome-ignore lint/suspicious/noThenProperty: intentional thenable for mock
  chain.then = vi.fn((resolve: (val: unknown) => void) => resolve(result));

  return chain;
}

/**
 * Build a mock authenticated session.
 */
function mockSession(overrides?: { fid?: number; username?: string }) {
  return {
    fid: overrides?.fid ?? 123,
    username: overrides?.username ?? 'testuser',
    displayName: 'Test User',
    isAdmin: false,
  };
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('POST /api/music/playlists/collaborative/[id]/join', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Authentication tests
  // ──────────────────────────────────────────────────────────────────────────

  it('returns 401 if session is missing', async () => {
    mockGetSessionData.mockResolvedValue(null);

    const req = new Request('http://localhost:3000/api/music/playlists/collaborative/123/join', {
      method: 'POST',
    });

    const res = await POST(req, {
      params: Promise.resolve({ id: PLAYLIST_ID }),
    });

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Unauthorized');
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Validation & Playlist existence tests
  // ──────────────────────────────────────────────────────────────────────────

  it('returns 404 if playlist does not exist', async () => {
    const session = mockSession();
    mockGetSessionData.mockResolvedValue(session);

    // Mock playlist query returning null
    const playlistChain = chainMock({ data: null });
    mockFrom.mockReturnValue(playlistChain);

    const req = new Request('http://localhost:3000/api/music/playlists/collaborative/123/join', {
      method: 'POST',
    });

    const res = await POST(req, {
      params: Promise.resolve({ id: PLAYLIST_ID }),
    });

    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toBe('Playlist not found');
  });

  it('returns 403 if playlist is not collaborative', async () => {
    const session = mockSession();
    mockGetSessionData.mockResolvedValue(session);

    // Mock playlist query returning non-collaborative playlist
    const playlistChain = chainMock({
      data: {
        id: PLAYLIST_ID,
        is_collaborative: false,
      },
    });
    mockFrom.mockReturnValue(playlistChain);

    const req = new Request('http://localhost:3000/api/music/playlists/collaborative/123/join', {
      method: 'POST',
    });

    const res = await POST(req, {
      params: Promise.resolve({ id: PLAYLIST_ID }),
    });

    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toBe('This playlist is not collaborative');
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Join operation tests
  // ──────────────────────────────────────────────────────────────────────────

  it('successfully joins an existing collaborative playlist (first join)', async () => {
    const session = mockSession({ fid: 456 });
    mockGetSessionData.mockResolvedValue(session);

    // Mock playlist query
    const playlistChain = chainMock({
      data: {
        id: PLAYLIST_ID,
        is_collaborative: true,
      },
    });

    // Mock membership upsert
    const membershipChain = chainMock({ error: null });

    // Set up mocks to return different chains for different .from() calls
    let callCount = 0;
    mockFrom.mockImplementation((_table: string) => {
      callCount++;
      if (callCount === 1) {
        // First .from('playlists')
        return playlistChain;
      }
      // Second .from('playlist_members')
      return membershipChain;
    });

    const req = new Request('http://localhost:3000/api/music/playlists/collaborative/123/join', {
      method: 'POST',
    });

    const res = await POST(req, {
      params: Promise.resolve({ id: PLAYLIST_ID }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.role).toBe('contributor');
  });

  it('successfully joins via upsert (idempotent when already a member)', async () => {
    const session = mockSession({ fid: 789 });
    mockGetSessionData.mockResolvedValue(session);

    // Mock playlist query
    const playlistChain = chainMock({
      data: {
        id: PLAYLIST_ID,
        is_collaborative: true,
      },
    });

    // Mock upsert (idempotent — no error even if row exists)
    const membershipChain = chainMock({ error: null });

    let callCount = 0;
    mockFrom.mockImplementation((_table: string) => {
      callCount++;
      if (callCount === 1) {
        return playlistChain;
      }
      return membershipChain;
    });

    const req = new Request('http://localhost:3000/api/music/playlists/collaborative/123/join', {
      method: 'POST',
    });

    const res = await POST(req, {
      params: Promise.resolve({ id: PLAYLIST_ID }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.role).toBe('contributor');
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Error handling tests
  // ──────────────────────────────────────────────────────────────────────────

  it('returns 500 if upsert fails with a database error', async () => {
    const session = mockSession({ fid: 101 });
    mockGetSessionData.mockResolvedValue(session);

    // Mock successful playlist query
    const playlistChain = chainMock({
      data: {
        id: PLAYLIST_ID,
        is_collaborative: true,
      },
    });

    // Mock membership upsert with error
    const membershipChain = chainMock({
      error: new Error('Unique constraint violation'),
    });

    let callCount = 0;
    mockFrom.mockImplementation((_table: string) => {
      callCount++;
      if (callCount === 1) {
        return playlistChain;
      }
      return membershipChain;
    });

    const req = new Request('http://localhost:3000/api/music/playlists/collaborative/123/join', {
      method: 'POST',
    });

    const res = await POST(req, {
      params: Promise.resolve({ id: PLAYLIST_ID }),
    });

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('Failed to join playlist');
  });

  it('returns 500 if playlist query throws an error', async () => {
    const session = mockSession({ fid: 102 });
    mockGetSessionData.mockResolvedValue(session);

    // Mock playlist query throwing an error
    const playlistChain = chainMock({
      data: null,
      error: new Error('Network error'),
    });

    // Make .single() throw
    playlistChain.single = vi.fn().mockRejectedValue(new Error('Network error'));

    mockFrom.mockReturnValue(playlistChain);

    const req = new Request('http://localhost:3000/api/music/playlists/collaborative/123/join', {
      method: 'POST',
    });

    const res = await POST(req, {
      params: Promise.resolve({ id: PLAYLIST_ID }),
    });

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('Failed to join playlist');
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Context params resolution tests
  // ──────────────────────────────────────────────────────────────────────────

  it('correctly resolves the params Promise from RouteContext', async () => {
    const session = mockSession();
    mockGetSessionData.mockResolvedValue(session);

    const customPlaylistId = '999e9999-e89b-12d3-a456-999999999999';

    const playlistChain = chainMock({
      data: {
        id: customPlaylistId,
        is_collaborative: true,
      },
    });

    const membershipChain = chainMock({ error: null });

    let callCount = 0;
    mockFrom.mockImplementation((_table: string) => {
      callCount++;
      if (callCount === 1) {
        // Verify .eq was called with the resolved ID
        expect(playlistChain.eq).toBeDefined();
        return playlistChain;
      }
      return membershipChain;
    });

    const req = new Request(
      `http://localhost:3000/api/music/playlists/collaborative/${customPlaylistId}/join`,
      { method: 'POST' },
    );

    const res = await POST(req, {
      params: Promise.resolve({ id: customPlaylistId }),
    });

    expect(res.status).toBe(200);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Supabase call verification tests
  // ──────────────────────────────────────────────────────────────────────────

  it('calls Supabase with correct playlist query parameters', async () => {
    const session = mockSession();
    mockGetSessionData.mockResolvedValue(session);

    const playlistChain = chainMock({
      data: {
        id: PLAYLIST_ID,
        is_collaborative: true,
      },
    });

    const membershipChain = chainMock({ error: null });

    let callCount = 0;
    mockFrom.mockImplementation((_table: string) => {
      if (callCount === 0) {
        callCount++;
        return playlistChain;
      }
      return membershipChain;
    });

    const req = new Request('http://localhost:3000/api/music/playlists/collaborative/123/join', {
      method: 'POST',
    });

    const res = await POST(req, {
      params: Promise.resolve({ id: PLAYLIST_ID }),
    });

    // Verify Supabase was called correctly
    expect(mockFrom).toHaveBeenCalledWith('playlists');
    expect(playlistChain.select).toHaveBeenCalledWith('id, is_collaborative');
    expect(playlistChain.eq).toHaveBeenCalledWith('id', PLAYLIST_ID);
    expect(res.status).toBe(200);
  });

  it('calls Supabase upsert with correct membership parameters', async () => {
    const session = mockSession({ fid: 555 });
    mockGetSessionData.mockResolvedValue(session);

    const playlistChain = chainMock({
      data: {
        id: PLAYLIST_ID,
        is_collaborative: true,
      },
    });

    const membershipChain = chainMock({ error: null });

    let callCount = 0;
    mockFrom.mockImplementation((_table: string) => {
      if (callCount === 0) {
        callCount++;
        return playlistChain;
      }
      return membershipChain;
    });

    const req = new Request('http://localhost:3000/api/music/playlists/collaborative/123/join', {
      method: 'POST',
    });

    await POST(req, {
      params: Promise.resolve({ id: PLAYLIST_ID }),
    });

    // Verify upsert was called with correct parameters
    expect(membershipChain.upsert).toHaveBeenCalledWith(
      { playlist_id: PLAYLIST_ID, fid: 555, role: 'contributor' },
      { onConflict: 'playlist_id,fid' },
    );
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Response shape tests
  // ──────────────────────────────────────────────────────────────────────────

  it('returns correct success response shape', async () => {
    const session = mockSession();
    mockGetSessionData.mockResolvedValue(session);

    const playlistChain = chainMock({
      data: {
        id: PLAYLIST_ID,
        is_collaborative: true,
      },
    });

    const membershipChain = chainMock({ error: null });

    let callCount = 0;
    mockFrom.mockImplementation((_table: string) => {
      callCount++;
      if (callCount === 1) {
        return playlistChain;
      }
      return membershipChain;
    });

    const req = new Request('http://localhost:3000/api/music/playlists/collaborative/123/join', {
      method: 'POST',
    });

    const res = await POST(req, {
      params: Promise.resolve({ id: PLAYLIST_ID }),
    });

    const body = await res.json();
    expect(body).toEqual({
      success: true,
      role: 'contributor',
    });
  });

  it('returns error response for 404 with correct shape', async () => {
    mockGetSessionData.mockResolvedValue(mockSession());

    const playlistChain = chainMock({ data: null });
    mockFrom.mockReturnValue(playlistChain);

    const req = new Request('http://localhost:3000/api/music/playlists/collaborative/123/join', {
      method: 'POST',
    });

    const res = await POST(req, {
      params: Promise.resolve({ id: PLAYLIST_ID }),
    });

    const body = await res.json();
    expect(body).toEqual({ error: 'Playlist not found' });
    expect(body.success).toBeUndefined();
  });
});
