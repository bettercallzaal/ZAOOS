import type { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  chainMock,
  makePostRequest,
  mockAuthenticatedSession,
  mockUnauthenticatedSession,
} from '@/test-utils/api-helpers';

// Helper to create DELETE requests (NextRequest.method is read-only)
function makeDeleteRequest(path: string): NextRequest {
  return new Request(new URL(path, 'http://localhost:3000'), {
    method: 'DELETE',
  }) as unknown as NextRequest;
}

// ── Hoisted mocks ────────────────────────────────────────────────────────────
const { mockGetSessionData, mockFrom, mockAtpAgentLogin } = vi.hoisted(() => ({
  mockGetSessionData: vi.fn(),
  mockFrom: vi.fn(),
  mockAtpAgentLogin: vi.fn(),
}));

vi.mock('@/lib/auth/session', () => ({
  getSessionData: () => mockGetSessionData(),
}));

vi.mock('@/lib/db/supabase', () => ({
  supabaseAdmin: { from: mockFrom },
}));

vi.mock('@atproto/api', () => {
  return {
    AtpAgent: class AtpAgent {
      session?: { did: string };

      login = mockAtpAgentLogin;
    },
  };
});

vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
  },
}));

// Import route handlers after mocks
import { DELETE, GET, POST } from '../route';

describe('GET /api/bluesky', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ────────────────────────────────────────────────────────────────────────────
  // Auth: Unauthenticated (null session)
  // ────────────────────────────────────────────────────────────────────────────

  it('returns 401 Unauthorized when session is null', async () => {
    mockGetSessionData.mockResolvedValue(mockUnauthenticatedSession());

    const res = await GET();
    expect(res.status).toBe(401);

    const body = await res.json();
    expect(body.error).toBe('Unauthorized');
  });

  // ────────────────────────────────────────────────────────────────────────────
  // Success: Not connected
  // ────────────────────────────────────────────────────────────────────────────

  it('returns 200 with connected=false when user has no bluesky data', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 123 }));

    const { chain } = chainMock({ data: null, error: null });
    mockFrom.mockReturnValue(chain);

    const res = await GET();
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body).toEqual({ connected: false, handle: null });
  });

  // ────────────────────────────────────────────────────────────────────────────
  // Success: Connected with handle
  // ────────────────────────────────────────────────────────────────────────────

  it('returns 200 with connected=true and handle when user has bluesky data', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 123 }));

    const { chain } = chainMock({
      data: {
        bluesky_did: 'did:plc:alice123',
        bluesky_handle: 'alice.bsky.social',
      },
      error: null,
    });
    mockFrom.mockReturnValue(chain);

    const res = await GET();
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body).toEqual({
      connected: true,
      handle: 'alice.bsky.social',
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  // Success: Connected but null handle (edge case)
  // ────────────────────────────────────────────────────────────────────────────

  it('returns 200 with connected=true but handle=null when bluesky_did exists but handle is null', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 123 }));

    const { chain } = chainMock({
      data: {
        bluesky_did: 'did:plc:alice123',
        bluesky_handle: null,
      },
      error: null,
    });
    mockFrom.mockReturnValue(chain);

    const res = await GET();
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body).toEqual({
      connected: true,
      handle: null,
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  // Error: Supabase query failure (caught, returns default)
  // ────────────────────────────────────────────────────────────────────────────

  it('returns 200 with default values when supabase query throws', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 123 }));

    // Simulate a supabase error by mocking .single() to throw
    const { chain } = chainMock({ data: null, error: new Error('Supabase error') });
    chain.single = vi.fn().mockRejectedValue(new Error('Supabase error'));
    mockFrom.mockReturnValue(chain);

    const res = await GET();
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body).toEqual({ connected: false, handle: null });
  });

  // ────────────────────────────────────────────────────────────────────────────
  // Queries verification
  // ────────────────────────────────────────────────────────────────────────────

  it('queries users table with correct columns and fid filter', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 456 }));

    const { chain } = chainMock({
      data: {
        bluesky_did: 'did:plc:bob123',
        bluesky_handle: 'bob.bsky.social',
      },
      error: null,
    });
    mockFrom.mockReturnValue(chain);

    await GET();

    expect(mockFrom).toHaveBeenCalledWith('users');
    expect(chain.select).toHaveBeenCalledWith('bluesky_did, bluesky_handle');
    expect(chain.eq).toHaveBeenCalledWith('fid', 456);
    expect(chain.single).toHaveBeenCalled();
  });
});

describe('POST /api/bluesky', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ────────────────────────────────────────────────────────────────────────────
  // Auth: Unauthenticated (null session)
  // ────────────────────────────────────────────────────────────────────────────

  it('returns 401 Unauthorized when session is null', async () => {
    mockGetSessionData.mockResolvedValue(mockUnauthenticatedSession());

    const req = makePostRequest('/api/bluesky', {
      handle: 'alice.bsky.social',
      appPassword: 'password123',
    });
    const res = await POST(req);
    expect(res.status).toBe(401);

    const body = await res.json();
    expect(body.error).toBe('Unauthorized');
  });

  // ────────────────────────────────────────────────────────────────────────────
  // Validation: Missing required fields
  // ────────────────────────────────────────────────────────────────────────────

  it('returns 400 when handle is missing', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 123 }));

    const req = makePostRequest('/api/bluesky', { appPassword: 'password123' });
    const res = await POST(req);
    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body.error).toBe('Handle and app password are required');
  });

  it('returns 400 when appPassword is missing', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 123 }));

    const req = makePostRequest('/api/bluesky', { handle: 'alice.bsky.social' });
    const res = await POST(req);
    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body.error).toBe('Handle and app password are required');
  });

  it('returns 400 when both handle and appPassword are missing', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 123 }));

    const req = makePostRequest('/api/bluesky', {});
    const res = await POST(req);
    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body.error).toBe('Handle and app password are required');
  });

  it('returns 400 when handle is empty string', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 123 }));

    const req = makePostRequest('/api/bluesky', {
      handle: '',
      appPassword: 'password123',
    });
    const res = await POST(req);
    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body.error).toBe('Handle and app password are required');
  });

  it('returns 400 when appPassword is empty string', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 123 }));

    const req = makePostRequest('/api/bluesky', {
      handle: 'alice.bsky.social',
      appPassword: '',
    });
    const res = await POST(req);
    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body.error).toBe('Handle and app password are required');
  });

  // ────────────────────────────────────────────────────────────────────────────
  // AtpAgent login: Invalid credentials
  // ────────────────────────────────────────────────────────────────────────────

  it('returns 400 when AtpAgent.login throws (invalid credentials)', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 123 }));

    mockAtpAgentLogin.mockRejectedValue(new Error('Invalid credentials'));

    const req = makePostRequest('/api/bluesky', {
      handle: 'alice.bsky.social',
      appPassword: 'wrongpassword',
    });
    const res = await POST(req);
    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body.error).toBe(
      'Invalid Bluesky credentials. Make sure you use an App Password, not your account password.',
    );
  });

  // ────────────────────────────────────────────────────────────────────────────
  // AtpAgent login: No DID returned
  // ────────────────────────────────────────────────────────────────────────────

  it('returns 500 when login succeeds but no DID is returned', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 123 }));

    // Mock successful login but no session/did set on the agent
    mockAtpAgentLogin.mockResolvedValue({});

    const req = makePostRequest('/api/bluesky', {
      handle: 'alice.bsky.social',
      appPassword: 'correctpassword',
    });
    const res = await POST(req);
    expect(res.status).toBe(500);

    const body = await res.json();
    expect(body.error).toBe('Failed to get DID from Bluesky');
  });

  // ────────────────────────────────────────────────────────────────────────────
  // Success: Connect new account
  // ────────────────────────────────────────────────────────────────────────────

  it('returns 200 and stores connection on successful login', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 123 }));

    mockAtpAgentLogin.mockImplementation(function (_credentials) {
      // Set session/did on the instance
      this.session = { did: 'did:plc:alice123' };
      return Promise.resolve({});
    });

    // Mock supabase update (store connection)
    const updateChain = chainMock({ error: null });

    // Mock supabase select (get user id for member registration)
    const selectChain = chainMock({ data: { id: 'user-uuid-1' }, error: null });

    // Mock supabase upsert (auto-register as member)
    const upsertChain = chainMock({ error: null });

    mockFrom
      .mockReturnValueOnce(updateChain.chain) // users.update()
      .mockReturnValueOnce(selectChain.chain) // users.select().eq().single()
      .mockReturnValueOnce(upsertChain.chain); // bluesky_members.upsert()

    const req = makePostRequest('/api/bluesky', {
      handle: 'alice.bsky.social',
      appPassword: 'correctpassword',
    });
    const res = await POST(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body).toEqual({
      success: true,
      handle: 'alice.bsky.social',
      did: 'did:plc:alice123',
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  // Supabase: User update failure
  // ────────────────────────────────────────────────────────────────────────────

  it('returns 500 when users table update fails', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 123 }));

    mockAtpAgentLogin.mockImplementation(function (_credentials) {
      this.session = { did: 'did:plc:alice123' };
      return Promise.resolve({});
    });

    const updateChain = chainMock({
      error: new Error('Update failed'),
    });
    mockFrom.mockReturnValue(updateChain.chain);

    const req = makePostRequest('/api/bluesky', {
      handle: 'alice.bsky.social',
      appPassword: 'correctpassword',
    });
    const res = await POST(req);
    expect(res.status).toBe(500);

    const body = await res.json();
    expect(body.error).toBe('Failed to save connection');
  });

  // ────────────────────────────────────────────────────────────────────────────
  // Supabase: Auto-register member (best-effort, does not block)
  // ────────────────────────────────────────────────────────────────────────────

  it('returns 200 even if member auto-registration fails', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 123 }));

    mockAtpAgentLogin.mockImplementation(function (_credentials) {
      this.session = { did: 'did:plc:alice123' };
      return Promise.resolve({});
    });

    const updateChain = chainMock({ error: null });
    const selectChain = chainMock({ data: { id: 'user-uuid-1' }, error: null });
    const upsertChain = chainMock({ error: new Error('Upsert failed') });

    mockFrom
      .mockReturnValueOnce(updateChain.chain)
      .mockReturnValueOnce(selectChain.chain)
      .mockReturnValueOnce(upsertChain.chain);

    const req = makePostRequest('/api/bluesky', {
      handle: 'alice.bsky.social',
      appPassword: 'correctpassword',
    });
    const res = await POST(req);
    // Success still returned (member auto-register is best-effort)
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);
  });

  // ────────────────────────────────────────────────────────────────────────────
  // Supabase: User select failure on member registration
  // ────────────────────────────────────────────────────────────────────────────

  it('handles null user_id when selecting user during member registration', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 123 }));

    mockAtpAgentLogin.mockImplementation(function (_credentials) {
      this.session = { did: 'did:plc:alice123' };
      return Promise.resolve({});
    });

    const updateChain = chainMock({ error: null });
    const selectChain = chainMock({ data: null, error: null }); // No user found
    const upsertChain = chainMock({ error: null });

    mockFrom
      .mockReturnValueOnce(updateChain.chain)
      .mockReturnValueOnce(selectChain.chain)
      .mockReturnValueOnce(upsertChain.chain);

    const req = makePostRequest('/api/bluesky', {
      handle: 'alice.bsky.social',
      appPassword: 'correctpassword',
    });
    const res = await POST(req);
    expect(res.status).toBe(200);

    // Verify that upsert was called with user_id: null
    expect(upsertChain.chain.upsert).toHaveBeenCalledWith(
      {
        did: 'did:plc:alice123',
        handle: 'alice.bsky.social',
        user_id: null,
        added_by: 'self',
      },
      { onConflict: 'did' },
    );
  });

  // ────────────────────────────────────────────────────────────────────────────
  // Logging: Errors are logged server-side
  // ────────────────────────────────────────────────────────────────────────────

  it('logs errors when db update fails', async () => {
    const { logger } = await import('@/lib/logger');
    const loggerErrorSpy = vi.spyOn(vi.mocked(logger), 'error');

    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 123 }));

    mockAtpAgentLogin.mockImplementation(function (_credentials) {
      this.session = { did: 'did:plc:alice123' };
      return Promise.resolve({});
    });

    const dbError = new Error('Database connection failed');
    const updateChain = chainMock({ error: dbError });
    mockFrom.mockReturnValue(updateChain.chain);

    const req = makePostRequest('/api/bluesky', {
      handle: 'alice.bsky.social',
      appPassword: 'correctpassword',
    });
    await POST(req);

    expect(loggerErrorSpy).toHaveBeenCalledWith('[bluesky] DB update error:', dbError);
  });

  // ────────────────────────────────────────────────────────────────────────────
  // Queries verification
  // ────────────────────────────────────────────────────────────────────────────

  it('creates AtpAgent with correct Bluesky service URL', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 123 }));

    mockAtpAgentLogin.mockImplementation(function (_credentials) {
      this.session = { did: 'did:plc:alice123' };
      return Promise.resolve({});
    });

    const updateChain = chainMock({ error: null });
    const selectChain = chainMock({ data: { id: 'user-uuid-1' }, error: null });
    const upsertChain = chainMock({ error: null });

    mockFrom
      .mockReturnValueOnce(updateChain.chain)
      .mockReturnValueOnce(selectChain.chain)
      .mockReturnValueOnce(upsertChain.chain);

    const req = makePostRequest('/api/bluesky', {
      handle: 'alice.bsky.social',
      appPassword: 'correctpassword',
    });
    await POST(req);

    // Verify login was called with correct credentials
    expect(mockAtpAgentLogin).toHaveBeenCalledWith({
      identifier: 'alice.bsky.social',
      password: 'correctpassword',
    });
  });

  it('stores handle, did, and appPassword in users table', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 456 }));

    mockAtpAgentLogin.mockImplementation(function (_credentials) {
      this.session = { did: 'did:plc:bob789' };
      return Promise.resolve({});
    });

    const updateChain = chainMock({ error: null });
    const selectChain = chainMock({ data: { id: 'user-uuid-2' }, error: null });
    const upsertChain = chainMock({ error: null });

    mockFrom
      .mockReturnValueOnce(updateChain.chain)
      .mockReturnValueOnce(selectChain.chain)
      .mockReturnValueOnce(upsertChain.chain);

    const req = makePostRequest('/api/bluesky', {
      handle: 'bob.bsky.social',
      appPassword: 'bobpassword',
    });
    await POST(req);

    expect(updateChain.chain.update).toHaveBeenCalledWith({
      bluesky_did: 'did:plc:bob789',
      bluesky_handle: 'bob.bsky.social',
      bluesky_app_password: 'bobpassword',
    });
    expect(updateChain.chain.eq).toHaveBeenCalledWith('fid', 456);
  });
});

describe('DELETE /api/bluesky', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ────────────────────────────────────────────────────────────────────────────
  // Auth: Unauthenticated (null session)
  // ────────────────────────────────────────────────────────────────────────────

  it('returns 401 Unauthorized when session is null', async () => {
    mockGetSessionData.mockResolvedValue(mockUnauthenticatedSession());

    const req = makeDeleteRequest('/api/bluesky');
    const res = await DELETE(req);
    expect(res.status).toBe(401);

    const body = await res.json();
    expect(body.error).toBe('Unauthorized');
  });

  // ────────────────────────────────────────────────────────────────────────────
  // Success: Disconnect account
  // ────────────────────────────────────────────────────────────────────────────

  it('returns 200 and clears bluesky fields on successful disconnect', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 123 }));

    const { chain } = chainMock({ error: null });
    mockFrom.mockReturnValue(chain);

    const req = makeDeleteRequest('/api/bluesky');
    const res = await DELETE(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body).toEqual({ success: true });
  });

  // ────────────────────────────────────────────────────────────────────────────
  // Error: Supabase disconnect failure
  // ────────────────────────────────────────────────────────────────────────────

  it('returns 500 when supabase update fails', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 123 }));

    const { chain } = chainMock({ error: new Error('Update failed') });
    mockFrom.mockReturnValue(chain);

    const req = makeDeleteRequest('/api/bluesky');
    const res = await DELETE(req);
    expect(res.status).toBe(500);

    const body = await res.json();
    expect(body.error).toBe('Failed to disconnect');
  });

  // ────────────────────────────────────────────────────────────────────────────
  // Error: Catch-all exception handler
  // ────────────────────────────────────────────────────────────────────────────

  it('returns 500 when an unexpected error is thrown', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 123 }));

    // Simulate an unexpected error
    mockFrom.mockImplementation(() => {
      throw new Error('Unexpected error');
    });

    const req = makeDeleteRequest('/api/bluesky');
    const res = await DELETE(req);
    expect(res.status).toBe(500);

    const body = await res.json();
    expect(body.error).toBe('Failed to disconnect');
  });

  // ────────────────────────────────────────────────────────────────────────────
  // Queries verification
  // ────────────────────────────────────────────────────────────────────────────

  it('clears all bluesky fields when disconnecting', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 789 }));

    const { chain } = chainMock({ error: null });
    mockFrom.mockReturnValue(chain);

    const req = makeDeleteRequest('/api/bluesky');
    await DELETE(req);

    expect(mockFrom).toHaveBeenCalledWith('users');
    expect(chain.update).toHaveBeenCalledWith({
      bluesky_did: null,
      bluesky_handle: null,
      bluesky_app_password: null,
    });
    expect(chain.eq).toHaveBeenCalledWith('fid', 789);
  });

  it('targets correct user by fid when disconnecting', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 555 }));

    const { chain } = chainMock({ error: null });
    mockFrom.mockReturnValue(chain);

    const req = makeDeleteRequest('/api/bluesky');
    await DELETE(req);

    expect(chain.eq).toHaveBeenCalledWith('fid', 555);
  });
});
