import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  chainMock,
  makePostRequest,
  mockAuthenticatedSession,
  mockUnauthenticatedSession,
} from '@/test-utils/api-helpers';

// ── Hoisted mocks ────────────────────────────────────────────────────────────

const { mockGetSessionData, mockFrom } = vi.hoisted(() => ({
  mockGetSessionData: vi.fn(),
  mockFrom: vi.fn(),
}));

const { mockCreateInAppNotification } = vi.hoisted(() => ({
  mockCreateInAppNotification: vi.fn(),
}));

vi.mock('@/lib/auth/session', () => ({
  getSessionData: () => mockGetSessionData(),
}));

vi.mock('@/lib/db/supabase', () => ({
  supabaseAdmin: { from: mockFrom },
}));

vi.mock('@/lib/notifications', () => ({
  createInAppNotification: mockCreateInAppNotification,
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock('@/lib/env', () => ({
  ENV: {
    NEYNAR_API_KEY: 'test-neynar-api-key',
  },
}));

import { DELETE, POST } from '../route';

// Mock global fetch for Neynar API calls
global.fetch = vi.fn() as unknown as typeof fetch;

// ── Test fixtures ────────────────────────────────────────────────────────────

const VALID_CAST_HASH = '0x1234567890abcdef1234567890abcdef12345678';
const VALID_CAST_HASH_2 = '0x0fedcba9876543210fedcba9876543210fedcba9';

describe('POST /api/chat/react', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn() as unknown as typeof fetch;
  });

  // ────────────────────────────────────────────────────────────────────────────
  // Authentication tests
  // ────────────────────────────────────────────────────────────────────────────

  it('returns 401 when no session is present', async () => {
    mockGetSessionData.mockResolvedValue(null);

    const res = await POST(
      makePostRequest('/api/chat/react', {
        type: 'like',
        hash: VALID_CAST_HASH,
      }),
    );

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Unauthorized');
  });

  it('returns 401 when session is unauthenticated', async () => {
    mockGetSessionData.mockResolvedValue(mockUnauthenticatedSession());

    const res = await POST(
      makePostRequest('/api/chat/react', {
        type: 'like',
        hash: VALID_CAST_HASH,
      }),
    );

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Unauthorized');
  });

  it('returns 400 when session has no signerUuid', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ signerUuid: undefined }));

    const res = await POST(
      makePostRequest('/api/chat/react', {
        type: 'like',
        hash: VALID_CAST_HASH,
      }),
    );

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('No signer. Connect write access first.');
  });

  // ────────────────────────────────────────────────────────────────────────────
  // Validation tests (Zod parsing)
  // ────────────────────────────────────────────────────────────────────────────

  it('returns 400 when type is invalid', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ signerUuid: 'valid-uuid' }));

    const res = await POST(
      makePostRequest('/api/chat/react', {
        type: 'invalid-type',
        hash: VALID_CAST_HASH,
      }),
    );

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid input');
  });

  it('returns 400 when type is missing', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ signerUuid: 'valid-uuid' }));

    const res = await POST(
      makePostRequest('/api/chat/react', {
        hash: VALID_CAST_HASH,
      }),
    );

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid input');
  });

  it('returns 400 when hash is invalid (malformed)', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ signerUuid: 'valid-uuid' }));

    const res = await POST(
      makePostRequest('/api/chat/react', {
        type: 'like',
        hash: 'not-a-valid-hash',
      }),
    );

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid input');
  });

  it('returns 400 when hash is too short', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ signerUuid: 'valid-uuid' }));

    const res = await POST(
      makePostRequest('/api/chat/react', {
        type: 'like',
        hash: '0x1234',
      }),
    );

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid input');
  });

  it('returns 400 when hash is missing', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ signerUuid: 'valid-uuid' }));

    const res = await POST(
      makePostRequest('/api/chat/react', {
        type: 'like',
      }),
    );

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid input');
  });

  it('returns 400 when body is not JSON', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ signerUuid: 'valid-uuid' }));

    // Manually create a request with invalid JSON
    const invalidReq = new Request('http://localhost:3000/api/chat/react', {
      method: 'POST',
      body: 'not json',
    });
    const res = await POST(invalidReq as unknown as Parameters<typeof POST>[0]);

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid input');
  });

  // ────────────────────────────────────────────────────────────────────────────
  // Success paths (like and recast)
  // ────────────────────────────────────────────────────────────────────────────

  it('returns 200 on successful like reaction', async () => {
    const sessionData = mockAuthenticatedSession({
      signerUuid: 'test-signer-uuid',
      fid: 123,
      displayName: 'Test User',
      pfpUrl: 'https://example.com/pfp.jpg',
    });
    mockGetSessionData.mockResolvedValue(sessionData);

    // Mock Neynar API success
    const mockFetchResponse = {
      ok: true,
      json: vi.fn().mockResolvedValue({ success: true }),
    };
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(mockFetchResponse);

    // Mock Supabase query (fire-and-forget notification)
    const mockChain = chainMock({
      data: {
        fid: 456,
        author_display: 'Cast Author',
      },
    });
    mockFrom.mockImplementation(mockChain.handler);

    const res = await POST(
      makePostRequest('/api/chat/react', {
        type: 'like',
        hash: VALID_CAST_HASH,
      }),
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);

    // Verify Neynar was called correctly
    expect(global.fetch).toHaveBeenCalledWith('https://api.neynar.com/v2/farcaster/reaction', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': 'test-neynar-api-key',
      },
      body: JSON.stringify({
        signer_uuid: 'test-signer-uuid',
        reaction_type: 'like',
        target: VALID_CAST_HASH,
      }),
    });
  });

  it('returns 200 on successful recast reaction', async () => {
    const sessionData = mockAuthenticatedSession({
      signerUuid: 'test-signer-uuid-recast',
      fid: 789,
      displayName: 'Recaster',
      pfpUrl: 'https://example.com/pfp2.jpg',
    });
    mockGetSessionData.mockResolvedValue(sessionData);

    // Mock Neynar API success
    const mockFetchResponse = {
      ok: true,
      json: vi.fn().mockResolvedValue({ success: true }),
    };
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(mockFetchResponse);

    // Mock Supabase query
    const mockChain = chainMock({
      data: {
        fid: 999,
        author_display: 'Another Author',
      },
    });
    mockFrom.mockImplementation(mockChain.handler);

    const res = await POST(
      makePostRequest('/api/chat/react', {
        type: 'recast',
        hash: VALID_CAST_HASH_2,
      }),
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);

    // Verify Neynar was called with recast type
    expect(global.fetch).toHaveBeenCalledWith('https://api.neynar.com/v2/farcaster/reaction', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': 'test-neynar-api-key',
      },
      body: JSON.stringify({
        signer_uuid: 'test-signer-uuid-recast',
        reaction_type: 'recast',
        target: VALID_CAST_HASH_2,
      }),
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  // Notification flow
  // ────────────────────────────────────────────────────────────────────────────

  it('creates notification when author is different from reactor', async () => {
    const sessionData = mockAuthenticatedSession({
      signerUuid: 'reactor-uuid',
      fid: 100,
      displayName: 'Reactor',
      pfpUrl: 'https://example.com/reactor.jpg',
    });
    mockGetSessionData.mockResolvedValue(sessionData);

    // Mock Neynar API success
    const mockFetchResponse = {
      ok: true,
      json: vi.fn().mockResolvedValue({ success: true }),
    };
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(mockFetchResponse);

    // Mock Supabase query with different author
    const mockChain = chainMock({
      data: {
        fid: 200,
        author_display: 'Author Name',
      },
    });
    mockFrom.mockImplementation(mockChain.handler);

    await POST(
      makePostRequest('/api/chat/react', {
        type: 'like',
        hash: VALID_CAST_HASH,
      }),
    );

    // Wait a tick for fire-and-forget promise
    await new Promise((resolve) => setTimeout(resolve, 10));

    // Verify notification was created
    expect(mockCreateInAppNotification).toHaveBeenCalledWith({
      recipientFids: [200],
      type: 'message',
      title: 'Reactor liked your post',
      body: '',
      href: '/chat',
      actorFid: 100,
      actorDisplayName: 'Reactor',
      actorPfpUrl: 'https://example.com/reactor.jpg',
    });
  });

  it('does not create notification when author is same as reactor', async () => {
    const sessionData = mockAuthenticatedSession({
      signerUuid: 'author-uuid',
      fid: 300,
      displayName: 'Self Reactor',
      pfpUrl: 'https://example.com/self.jpg',
    });
    mockGetSessionData.mockResolvedValue(sessionData);

    // Mock Neynar API success
    const mockFetchResponse = {
      ok: true,
      json: vi.fn().mockResolvedValue({ success: true }),
    };
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(mockFetchResponse);

    // Mock Supabase query with same author
    const mockChain = chainMock({
      data: {
        fid: 300,
        author_display: 'Self Reactor',
      },
    });
    mockFrom.mockImplementation(mockChain.handler);

    await POST(
      makePostRequest('/api/chat/react', {
        type: 'like',
        hash: VALID_CAST_HASH,
      }),
    );

    // Wait a tick for fire-and-forget promise
    await new Promise((resolve) => setTimeout(resolve, 10));

    // Verify notification was NOT created
    expect(mockCreateInAppNotification).not.toHaveBeenCalled();
  });

  it('includes correct reaction type in notification title (recast)', async () => {
    const sessionData = mockAuthenticatedSession({
      signerUuid: 'recaster-uuid',
      fid: 400,
      displayName: 'Recaster User',
      pfpUrl: 'https://example.com/recast.jpg',
    });
    mockGetSessionData.mockResolvedValue(sessionData);

    // Mock Neynar API success
    const mockFetchResponse = {
      ok: true,
      json: vi.fn().mockResolvedValue({ success: true }),
    };
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(mockFetchResponse);

    // Mock Supabase query with different author
    const mockChain = chainMock({
      data: {
        fid: 500,
        author_display: 'Post Author',
      },
    });
    mockFrom.mockImplementation(mockChain.handler);

    await POST(
      makePostRequest('/api/chat/react', {
        type: 'recast',
        hash: VALID_CAST_HASH,
      }),
    );

    // Wait a tick for fire-and-forget promise
    await new Promise((resolve) => setTimeout(resolve, 10));

    // Verify notification includes "recasted" in title
    expect(mockCreateInAppNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Recaster User recasted your post',
      }),
    );
  });

  // ────────────────────────────────────────────────────────────────────────────
  // Neynar error handling
  // ────────────────────────────────────────────────────────────────────────────

  it('returns 502 when Neynar API returns error', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ signerUuid: 'valid-uuid' }));

    // Mock Neynar API error
    const mockFetchResponse = {
      ok: false,
      status: 400,
      json: vi.fn().mockResolvedValue({ error: 'Invalid signer' }),
    };
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(mockFetchResponse);

    const res = await POST(
      makePostRequest('/api/chat/react', {
        type: 'like',
        hash: VALID_CAST_HASH,
      }),
    );

    expect(res.status).toBe(502);
    const body = await res.json();
    expect(body.error).toBe('Reaction failed');
  });

  it('returns 502 when Neynar API throws error', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ signerUuid: 'valid-uuid' }));

    // Mock fetch throwing an error
    (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Network error'));

    const res = await POST(
      makePostRequest('/api/chat/react', {
        type: 'like',
        hash: VALID_CAST_HASH,
      }),
    );

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('Failed to react');
  });

  it('handles Neynar error response that fails to parse JSON', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ signerUuid: 'valid-uuid' }));

    // Mock Neynar API error with unparseable JSON
    const mockFetchResponse = {
      ok: false,
      status: 500,
      json: vi.fn().mockRejectedValue(new Error('Invalid JSON')),
    };
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(mockFetchResponse);

    const res = await POST(
      makePostRequest('/api/chat/react', {
        type: 'like',
        hash: VALID_CAST_HASH,
      }),
    );

    expect(res.status).toBe(502);
    const body = await res.json();
    expect(body.error).toBe('Reaction failed');
  });

  // ────────────────────────────────────────────────────────────────────────────
  // Supabase error handling
  // ────────────────────────────────────────────────────────────────────────────

  it('handles Supabase query error gracefully (fire-and-forget)', async () => {
    mockGetSessionData.mockResolvedValue(
      mockAuthenticatedSession({ signerUuid: 'valid-uuid', fid: 123 }),
    );

    // Mock Neynar API success
    const mockFetchResponse = {
      ok: true,
      json: vi.fn().mockResolvedValue({ success: true }),
    };
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(mockFetchResponse);

    // Mock Supabase query error (fire-and-forget, so doesn't affect response)
    const mockChain = chainMock({
      data: null,
      error: new Error('Database error'),
    });
    mockFrom.mockImplementation(mockChain.handler);

    const res = await POST(
      makePostRequest('/api/chat/react', {
        type: 'like',
        hash: VALID_CAST_HASH,
      }),
    );

    // Even though Supabase fails, the POST should succeed (fire-and-forget)
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });
});

describe('DELETE /api/chat/react', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn() as unknown as typeof fetch;
  });

  // ────────────────────────────────────────────────────────────────────────────
  // Authentication tests
  // ────────────────────────────────────────────────────────────────────────────

  it('returns 401 when no session is present', async () => {
    mockGetSessionData.mockResolvedValue(null);

    const res = await DELETE(
      makePostRequest('/api/chat/react', {
        type: 'like',
        hash: VALID_CAST_HASH,
      }),
    );

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Unauthorized');
  });

  it('returns 400 when session has no signerUuid', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ signerUuid: undefined }));

    const res = await DELETE(
      makePostRequest('/api/chat/react', {
        type: 'like',
        hash: VALID_CAST_HASH,
      }),
    );

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('No signer');
  });

  // ────────────────────────────────────────────────────────────────────────────
  // Validation tests (Zod parsing)
  // ────────────────────────────────────────────────────────────────────────────

  it('returns 400 when type is invalid', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ signerUuid: 'valid-uuid' }));

    const res = await DELETE(
      makePostRequest('/api/chat/react', {
        type: 'invalid',
        hash: VALID_CAST_HASH,
      }),
    );

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid input');
  });

  it('returns 400 when hash is invalid', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ signerUuid: 'valid-uuid' }));

    const res = await DELETE(
      makePostRequest('/api/chat/react', {
        type: 'like',
        hash: 'bad-hash',
      }),
    );

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid input');
  });

  // ────────────────────────────────────────────────────────────────────────────
  // Success path
  // ────────────────────────────────────────────────────────────────────────────

  it('returns 200 on successful unreaction (like)', async () => {
    mockGetSessionData.mockResolvedValue(
      mockAuthenticatedSession({ signerUuid: 'test-signer-uuid' }),
    );

    // Mock Neynar API success
    const mockFetchResponse = {
      ok: true,
      json: vi.fn().mockResolvedValue({ success: true }),
    };
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(mockFetchResponse);

    const res = await DELETE(
      makePostRequest('/api/chat/react', {
        type: 'like',
        hash: VALID_CAST_HASH,
      }),
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);

    // Verify Neynar was called with DELETE method
    expect(global.fetch).toHaveBeenCalledWith('https://api.neynar.com/v2/farcaster/reaction', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': 'test-neynar-api-key',
      },
      body: JSON.stringify({
        signer_uuid: 'test-signer-uuid',
        reaction_type: 'like',
        target: VALID_CAST_HASH,
      }),
    });
  });

  it('returns 200 on successful unreaction (recast)', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ signerUuid: 'recast-signer' }));

    // Mock Neynar API success
    const mockFetchResponse = {
      ok: true,
      json: vi.fn().mockResolvedValue({ success: true }),
    };
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(mockFetchResponse);

    const res = await DELETE(
      makePostRequest('/api/chat/react', {
        type: 'recast',
        hash: VALID_CAST_HASH_2,
      }),
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  // ────────────────────────────────────────────────────────────────────────────
  // Error handling
  // ────────────────────────────────────────────────────────────────────────────

  it('returns 502 when Neynar API returns error', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ signerUuid: 'valid-uuid' }));

    // Mock Neynar API error
    const mockFetchResponse = {
      ok: false,
      status: 404,
      json: vi.fn().mockResolvedValue({ error: 'Reaction not found' }),
    };
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(mockFetchResponse);

    const res = await DELETE(
      makePostRequest('/api/chat/react', {
        type: 'like',
        hash: VALID_CAST_HASH,
      }),
    );

    expect(res.status).toBe(502);
    const body = await res.json();
    expect(body.error).toBe('Reaction failed');
  });

  it('returns 500 when fetch throws an error', async () => {
    mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ signerUuid: 'valid-uuid' }));

    // Mock fetch throwing an error
    (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Network error'));

    const res = await DELETE(
      makePostRequest('/api/chat/react', {
        type: 'like',
        hash: VALID_CAST_HASH,
      }),
    );

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('Failed to unreact');
  });
});
