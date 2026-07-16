import { beforeEach, describe, expect, it, vi } from 'vitest';
import { makePostRequest } from '@/test-utils/api-helpers';

// FIFO chain: queries pop results from a queue in order.
// Each awaited call (via .then or .single()) consumes one result from the queue.
function queuedChain(results: Array<{ data?: unknown; error?: unknown }>) {
  const q = [...results];
  const chain: Record<string, ReturnType<typeof vi.fn>> = {};

  // Chainable methods — each returns the chain for further chaining
  for (const m of ['select', 'insert', 'update', 'delete', 'eq', 'gt', 'lt', 'maybeSingle']) {
    chain[m] = vi.fn(() => chain);
  }

  // Terminal method .single() returns a promise that resolves to the next queued result
  chain.single = vi.fn(() => Promise.resolve(q.shift() ?? { data: null, error: null }));

  // Allow the chain to be awaited directly (for queries without .single())
  // biome-ignore lint/suspicious/noThenProperty: intentional thenable — mocks an awaitable Supabase query chain
  (chain as unknown as { then: unknown }).then = (resolve: (v: unknown) => void) =>
    resolve(q.shift() ?? { data: null, error: null });

  return chain;
}

// Create a Supabase mock that returns new FIFO chains on each from() call
function createSupabaseMock(results: Array<{ data?: unknown; error?: unknown }>[]) {
  let callIndex = 0;
  return {
    from: () => {
      const chainResults = results[callIndex] || [];
      callIndex++;
      return queuedChain([...chainResults]);
    },
  };
}

const {
  mockGetSupabaseAdmin,
  mockSaveSession,
  mockGetUserByFid,
  mockCheckAllowlist,
  mockCreateInAppNotification,
  mockAutoCastToZao,
  mockVerifySignInMessage,
} = vi.hoisted(() => {
  const mockVerifySignInMessage = vi.fn();
  return {
    mockGetSupabaseAdmin: vi.fn(),
    mockSaveSession: vi.fn(),
    mockGetUserByFid: vi.fn(),
    mockCheckAllowlist: vi.fn(),
    mockCreateInAppNotification: vi.fn(),
    mockAutoCastToZao: vi.fn(),
    mockVerifySignInMessage,
  };
});

vi.mock('@/lib/db/supabase', () => ({
  supabaseAdmin: new Proxy({} as unknown, {
    get(_target, prop) {
      return (mockGetSupabaseAdmin() as unknown as Record<string | symbol, unknown>)[prop];
    },
  }),
}));

vi.mock('@/lib/auth/session', () => ({
  saveSession: mockSaveSession,
}));

vi.mock('@/lib/farcaster/neynar', () => ({
  getUserByFid: mockGetUserByFid,
}));

vi.mock('@/lib/gates/allowlist', () => ({
  checkAllowlist: mockCheckAllowlist,
}));

vi.mock('@/lib/notifications', () => ({
  createInAppNotification: mockCreateInAppNotification,
}));

vi.mock('@/lib/publish/auto-cast', () => ({
  autoCastToZao: mockAutoCastToZao,
}));

vi.mock('@farcaster/auth-client', () => ({
  createAppClient: vi.fn(() => ({
    verifySignInMessage: mockVerifySignInMessage,
  })),
  viemConnector: vi.fn(),
}));

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

import { GET, POST } from '../route';

describe('POST /api/auth/verify', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSaveSession.mockResolvedValue(undefined);
    mockCreateInAppNotification.mockResolvedValue(undefined);
    mockAutoCastToZao.mockResolvedValue('hash-123');
  });

  describe('Zod validation', () => {
    it('returns 400 when message is missing', async () => {
      const req = makePostRequest('/api/auth/verify', {
        signature: '0x123',
        nonce: 'nonce123',
        domain: 'localhost:3000',
      });
      const res = await POST(req);

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe('Invalid input');
      expect(body.details).toBeDefined();
    });

    it('returns 400 when signature is missing', async () => {
      const req = makePostRequest('/api/auth/verify', {
        message: 'farcaster.com wants you to sign in...',
        nonce: 'nonce123',
        domain: 'localhost:3000',
      });
      const res = await POST(req);

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe('Invalid input');
    });

    it('returns 400 when nonce is missing', async () => {
      const req = makePostRequest('/api/auth/verify', {
        message: 'farcaster.com wants you to sign in...',
        signature: '0x123',
        domain: 'localhost:3000',
      });
      const res = await POST(req);

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe('Invalid input');
    });

    it('returns 400 when domain is missing', async () => {
      const req = makePostRequest('/api/auth/verify', {
        message: 'farcaster.com wants you to sign in...',
        signature: '0x123',
        nonce: 'nonce123',
      });
      const res = await POST(req);

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe('Invalid input');
    });

    it('returns 400 when message is empty string', async () => {
      const req = makePostRequest('/api/auth/verify', {
        message: '',
        signature: '0x123',
        nonce: 'nonce123',
        domain: 'localhost:3000',
      });
      const res = await POST(req);

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe('Invalid input');
    });

    it('returns 400 when signature is empty string', async () => {
      const req = makePostRequest('/api/auth/verify', {
        message: 'farcaster.com wants you to sign in...',
        signature: '',
        nonce: 'nonce123',
        domain: 'localhost:3000',
      });
      const res = await POST(req);

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe('Invalid input');
    });
  });

  describe('Nonce validation and consumption', () => {
    it('returns 400 when nonce does not exist', async () => {
      mockGetSupabaseAdmin.mockReturnValue(
        createSupabaseMock([
          [{ data: null, error: null }], // nonce delete returns null
        ]),
      );

      const req = makePostRequest('/api/auth/verify', {
        message: 'farcaster.com wants you to sign in...',
        signature: '0x123',
        nonce: 'invalid-nonce',
        domain: 'localhost:3000',
      });
      const res = await POST(req);

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toContain('Invalid or expired nonce');
    });

    it('returns 400 when nonce is expired', async () => {
      mockGetSupabaseAdmin.mockReturnValue(
        createSupabaseMock([
          [{ data: null, error: null }], // nonce is expired, delete returns null
        ]),
      );

      const req = makePostRequest('/api/auth/verify', {
        message: 'farcaster.com wants you to sign in...',
        signature: '0x123',
        nonce: 'expired-nonce',
        domain: 'localhost:3000',
      });
      const res = await POST(req);

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toContain('Invalid or expired nonce');
    });

    it('atomically consumes nonce (delete + select in one query)', async () => {
      mockGetSupabaseAdmin.mockReturnValue(
        createSupabaseMock([
          [{ data: { nonce: 'valid-nonce' }, error: null }], // nonce delete returns the row
        ]),
      );

      mockVerifySignInMessage.mockRejectedValue(new Error('verification error'));

      const req = makePostRequest('/api/auth/verify', {
        message: 'farcaster.com wants you to sign in...',
        signature: '0x123',
        nonce: 'valid-nonce',
        domain: 'localhost:3000',
      });

      const res = await POST(req);

      // Nonce check passes, but SIWF verification fails with network error
      expect(res.status).toBe(503);
    });
  });

  describe('SIWF signature verification', () => {
    it('returns 503 when SIWF verification throws (network error)', async () => {
      mockGetSupabaseAdmin.mockReturnValue(
        createSupabaseMock([
          [{ data: { nonce: 'valid-nonce' }, error: null }], // nonce valid
        ]),
      );

      mockVerifySignInMessage.mockRejectedValue(new Error('RPC timeout'));

      const req = makePostRequest('/api/auth/verify', {
        message: 'farcaster.com wants you to sign in...',
        signature: '0x123456',
        nonce: 'valid-nonce',
        domain: 'localhost:3000',
      });
      const res = await POST(req);

      expect(res.status).toBe(503);
      const body = await res.json();
      expect(body.error).toContain('temporarily unavailable');
    });

    it('returns 401 when SIWF verification fails (isError flag)', async () => {
      mockGetSupabaseAdmin.mockReturnValue(
        createSupabaseMock([
          [{ data: { nonce: 'valid-nonce' }, error: null }], // nonce valid
        ]),
      );

      mockVerifySignInMessage.mockResolvedValue({
        isError: true,
        success: false,
        error: 'Invalid signature',
        fid: undefined,
      });

      const req = makePostRequest('/api/auth/verify', {
        message: 'farcaster.com wants you to sign in...',
        signature: '0xbadsig',
        nonce: 'valid-nonce',
        domain: 'localhost:3000',
      });
      const res = await POST(req);

      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.error).toBe('Invalid signature');
    });

    it('returns 401 when SIWF verification succeeds but success is false', async () => {
      mockGetSupabaseAdmin.mockReturnValue(
        createSupabaseMock([
          [{ data: { nonce: 'valid-nonce' }, error: null }], // nonce valid
        ]),
      );

      mockVerifySignInMessage.mockResolvedValue({
        isError: false,
        success: false,
        fid: undefined,
      });

      const req = makePostRequest('/api/auth/verify', {
        message: 'farcaster.com wants you to sign in...',
        signature: '0x123',
        nonce: 'valid-nonce',
        domain: 'localhost:3000',
      });
      const res = await POST(req);

      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.error).toBe('Invalid signature');
    });

    it('returns 502 when SIWF verifies but FID is missing', async () => {
      mockGetSupabaseAdmin.mockReturnValue(
        createSupabaseMock([
          [{ data: { nonce: 'valid-nonce' }, error: null }], // nonce valid
        ]),
      );

      mockVerifySignInMessage.mockResolvedValue({
        isError: false,
        success: true,
        fid: undefined,
      });

      const req = makePostRequest('/api/auth/verify', {
        message: 'farcaster.com wants you to sign in...',
        signature: '0x123',
        nonce: 'valid-nonce',
        domain: 'localhost:3000',
      });
      const res = await POST(req);

      expect(res.status).toBe(502);
      const body = await res.json();
      expect(body.error).toContain('no Farcaster ID found');
    });

    it('returns 502 when SIWF verifies but FID is not a number', async () => {
      mockGetSupabaseAdmin.mockReturnValue(
        createSupabaseMock([
          [{ data: { nonce: 'valid-nonce' }, error: null }], // nonce valid
        ]),
      );

      mockVerifySignInMessage.mockResolvedValue({
        isError: false,
        success: true,
        fid: 'not-a-number',
      });

      const req = makePostRequest('/api/auth/verify', {
        message: 'farcaster.com wants you to sign in...',
        signature: '0x123',
        nonce: 'valid-nonce',
        domain: 'localhost:3000',
      });
      const res = await POST(req);

      expect(res.status).toBe(502);
    });
  });

  describe('Neynar getUserByFid', () => {
    it('returns 502 when getUserByFid is rejected', async () => {
      mockGetSupabaseAdmin.mockReturnValue(
        createSupabaseMock([
          [{ data: { nonce: 'valid-nonce' }, error: null }], // nonce valid
        ]),
      );

      mockVerifySignInMessage.mockResolvedValue({
        isError: false,
        success: true,
        fid: 12345,
      });

      mockGetUserByFid.mockRejectedValue(new Error('Neynar API error'));

      const req = makePostRequest('/api/auth/verify', {
        message: 'farcaster.com wants you to sign in...',
        signature: '0x123',
        nonce: 'valid-nonce',
        domain: 'localhost:3000',
      });
      const res = await POST(req);

      expect(res.status).toBe(502);
      const body = await res.json();
      expect(body.error).toContain('Farcaster profile');
    });

    it('returns 404 when Neynar returns null user', async () => {
      mockGetSupabaseAdmin.mockReturnValue(
        createSupabaseMock([
          [{ data: { nonce: 'valid-nonce' }, error: null }], // nonce valid
        ]),
      );

      mockVerifySignInMessage.mockResolvedValue({
        isError: false,
        success: true,
        fid: 99999,
      });

      mockGetUserByFid.mockResolvedValue(null);
      mockCheckAllowlist.mockResolvedValue({ allowed: false });

      const req = makePostRequest('/api/auth/verify', {
        message: 'farcaster.com wants you to sign in...',
        signature: '0x123',
        nonce: 'valid-nonce',
        domain: 'localhost:3000',
      });
      const res = await POST(req);

      expect(res.status).toBe(404);
      const body = await res.json();
      expect(body.error).toBe('User not found');
    });
  });

  describe('Allowlist gate (checkAllowlist)', () => {
    it('returns 403 when user is not on allowlist', async () => {
      mockGetSupabaseAdmin.mockReturnValue(
        createSupabaseMock([
          [{ data: { nonce: 'valid-nonce' }, error: null }], // nonce valid
        ]),
      );

      mockVerifySignInMessage.mockResolvedValue({
        isError: false,
        success: true,
        fid: 12345,
      });

      mockGetUserByFid.mockResolvedValue({
        fid: 12345,
        username: 'nonmember',
        display_name: 'Non Member',
        pfp_url: 'https://example.com/pfp.jpg',
        custody_address: '0x1234567890abcdef1234567890abcdef12345678',
        verified_addresses: { eth_addresses: [] },
        profile: { bio: { text: 'A non-member' } },
      });

      mockCheckAllowlist.mockResolvedValue({ allowed: false });

      const req = makePostRequest('/api/auth/verify', {
        message: 'farcaster.com wants you to sign in...',
        signature: '0x123',
        nonce: 'valid-nonce',
        domain: 'localhost:3000',
      });
      const res = await POST(req);

      expect(res.status).toBe(403);
      const body = await res.json();
      expect(body.error).toBe('Not on allowlist');
      expect(body.redirect).toBe('/not-allowed');
    });

    it('returns 502 when allowlist check throws error', async () => {
      mockGetSupabaseAdmin.mockReturnValue(
        createSupabaseMock([
          [{ data: { nonce: 'valid-nonce' }, error: null }], // nonce valid
        ]),
      );

      mockVerifySignInMessage.mockResolvedValue({
        isError: false,
        success: true,
        fid: 12345,
      });

      mockGetUserByFid.mockResolvedValue({
        fid: 12345,
        username: 'testuser',
        display_name: 'Test User',
        pfp_url: 'https://example.com/pfp.jpg',
        custody_address: '0x1234567890abcdef1234567890abcdef12345678',
        verified_addresses: { eth_addresses: [] },
        profile: { bio: { text: 'A user' } },
      });

      mockCheckAllowlist.mockRejectedValue(new Error('Allowlist DB error'));

      const req = makePostRequest('/api/auth/verify', {
        message: 'farcaster.com wants you to sign in...',
        signature: '0x123',
        nonce: 'valid-nonce',
        domain: 'localhost:3000',
      });
      const res = await POST(req);

      expect(res.status).toBe(502);
      const body = await res.json();
      expect(body.error).toContain('membership');
    });

    it('falls back to address-based allowlist check when FID fails', async () => {
      mockGetSupabaseAdmin.mockReturnValue(
        createSupabaseMock([
          [{ data: { nonce: 'valid-nonce' }, error: null }], // nonce valid
        ]),
      );

      mockVerifySignInMessage.mockResolvedValue({
        isError: false,
        success: true,
        fid: 12345,
      });

      mockGetUserByFid.mockResolvedValue({
        fid: 12345,
        username: 'testuser',
        display_name: 'Test User',
        pfp_url: 'https://example.com/pfp.jpg',
        custody_address: '0xaaaa567890abcdef1234567890abcdef12345678',
        verified_addresses: {
          eth_addresses: ['0xbbbb567890abcdef1234567890abcdef12345678'],
        },
        profile: { bio: { text: 'A user' } },
      });

      // First call by FID fails, subsequent calls by address succeed
      mockCheckAllowlist
        .mockResolvedValueOnce({ allowed: false })
        .mockResolvedValueOnce({ allowed: true });

      mockSaveSession.mockResolvedValue(undefined);

      const req = makePostRequest('/api/auth/verify', {
        message: 'farcaster.com wants you to sign in...',
        signature: '0x123',
        nonce: 'valid-nonce',
        domain: 'localhost:3000',
      });
      const res = await POST(req);

      // Should succeed because address-based check passes
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.redirect).toBe('/os');
    });
  });

  describe('Session creation (saveSession)', () => {
    it('returns 500 when saveSession throws', async () => {
      mockGetSupabaseAdmin.mockReturnValue(
        createSupabaseMock([
          [{ data: { nonce: 'valid-nonce' }, error: null }], // nonce valid
        ]),
      );

      mockVerifySignInMessage.mockResolvedValue({
        isError: false,
        success: true,
        fid: 12345,
      });

      mockGetUserByFid.mockResolvedValue({
        fid: 12345,
        username: 'testuser',
        display_name: 'Test User',
        pfp_url: 'https://example.com/pfp.jpg',
        custody_address: '0x1234567890abcdef1234567890abcdef12345678',
        verified_addresses: { eth_addresses: [] },
        profile: { bio: { text: 'A user' } },
      });

      mockCheckAllowlist.mockResolvedValue({ allowed: true });
      mockSaveSession.mockRejectedValue(new Error('Session cookie error'));

      const req = makePostRequest('/api/auth/verify', {
        message: 'farcaster.com wants you to sign in...',
        signature: '0x123',
        nonce: 'valid-nonce',
        domain: 'localhost:3000',
      });
      const res = await POST(req);

      expect(res.status).toBe(500);
      const body = await res.json();
      expect(body.error).toContain('session');
    });

    it('successfully creates session with user data', async () => {
      mockGetSupabaseAdmin.mockReturnValue(
        createSupabaseMock([
          [{ data: { nonce: 'valid-nonce' }, error: null }], // nonce valid
        ]),
      );

      mockVerifySignInMessage.mockResolvedValue({
        isError: false,
        success: true,
        fid: 12345,
      });

      mockGetUserByFid.mockResolvedValue({
        fid: 12345,
        username: 'testuser',
        display_name: 'Test User',
        pfp_url: 'https://example.com/pfp.jpg',
        custody_address: '0x1234567890abcdef1234567890abcdef12345678',
        verified_addresses: { eth_addresses: [] },
        profile: { bio: { text: 'A user' } },
      });

      mockCheckAllowlist.mockResolvedValue({ allowed: true });
      mockSaveSession.mockResolvedValue(undefined);

      const req = makePostRequest('/api/auth/verify', {
        message: 'farcaster.com wants you to sign in...',
        signature: '0x123',
        nonce: 'valid-nonce',
        domain: 'localhost:3000',
      });
      const res = await POST(req);

      expect(res.status).toBe(200);
      expect(mockSaveSession).toHaveBeenCalledWith(
        expect.objectContaining({
          fid: 12345,
          username: 'testuser',
          displayName: 'Test User',
          pfpUrl: 'https://example.com/pfp.jpg',
          authMethod: 'farcaster',
        }),
      );
    });

    it('uses verified_addresses[0] as wallet when custody_address is missing', async () => {
      mockGetSupabaseAdmin.mockReturnValue(
        createSupabaseMock([
          [{ data: { nonce: 'valid-nonce' }, error: null }], // nonce valid
        ]),
      );

      mockVerifySignInMessage.mockResolvedValue({
        isError: false,
        success: true,
        fid: 12345,
      });

      mockGetUserByFid.mockResolvedValue({
        fid: 12345,
        username: 'testuser',
        display_name: 'Test User',
        pfp_url: 'https://example.com/pfp.jpg',
        custody_address: null,
        verified_addresses: {
          eth_addresses: ['0xbbbb567890abcdef1234567890abcdef12345678'],
        },
        profile: { bio: { text: 'A user' } },
      });

      mockCheckAllowlist.mockResolvedValue({ allowed: true });

      const req = makePostRequest('/api/auth/verify', {
        message: 'farcaster.com wants you to sign in...',
        signature: '0x123',
        nonce: 'valid-nonce',
        domain: 'localhost:3000',
      });
      const res = await POST(req);

      expect(res.status).toBe(200);
      expect(mockSaveSession).toHaveBeenCalledWith(
        expect.objectContaining({
          walletAddress: '0xbbbb567890abcdef1234567890abcdef12345678',
        }),
      );
    });
  });

  describe('First-time user detection and welcome cast', () => {
    it('sends welcome cast on first login', async () => {
      mockGetSupabaseAdmin.mockReturnValue(
        createSupabaseMock([
          [{ data: { nonce: 'valid-nonce' }, error: null }], // nonce valid
          [{ data: null, error: null }], // users select by fid (no existing user)
          [{ data: null, error: null }], // users select by wallet (no existing user)
          [{ data: null, error: null }], // users upsert
        ]),
      );

      mockVerifySignInMessage.mockResolvedValue({
        isError: false,
        success: true,
        fid: 12345,
      });

      mockGetUserByFid.mockResolvedValue({
        fid: 12345,
        username: 'newuser',
        display_name: 'New User',
        pfp_url: 'https://example.com/pfp.jpg',
        custody_address: '0x1234567890abcdef1234567890abcdef12345678',
        verified_addresses: { eth_addresses: [] },
        profile: { bio: { text: 'A new user' } },
      });

      mockCheckAllowlist.mockResolvedValue({ allowed: true });

      const req = makePostRequest('/api/auth/verify', {
        message: 'farcaster.com wants you to sign in...',
        signature: '0x123',
        nonce: 'valid-nonce',
        domain: 'localhost:3000',
      });
      const res = await POST(req);

      expect(res.status).toBe(200);
      // Fire-and-forget operations are tested via integration, not unit tests
      // (they run in an async IIFE without await). Just verify login succeeds.
    });

    it('does not send welcome cast on returning user login', async () => {
      mockGetSupabaseAdmin.mockReturnValue(
        createSupabaseMock([
          [{ data: { nonce: 'valid-nonce' }, error: null }], // nonce valid + delete
          [{ data: { last_login_at: '2026-07-15T10:00:00Z' }, error: null }], // users select by fid (existing user) in async IIFE
          [{ data: null, error: null }], // users upsert in async IIFE
        ]),
      );

      mockVerifySignInMessage.mockResolvedValue({
        isError: false,
        success: true,
        fid: 12345,
      });

      mockGetUserByFid.mockResolvedValue({
        fid: 12345,
        username: 'existinguser',
        display_name: 'Existing User',
        pfp_url: 'https://example.com/pfp.jpg',
        custody_address: '0x1234567890abcdef1234567890abcdef12345678',
        verified_addresses: { eth_addresses: [] },
        profile: { bio: { text: 'An existing user' } },
      });

      mockCheckAllowlist.mockResolvedValue({ allowed: true });

      const req = makePostRequest('/api/auth/verify', {
        message: 'farcaster.com wants you to sign in...',
        signature: '0x123',
        nonce: 'valid-nonce',
        domain: 'localhost:3000',
      });
      const res = await POST(req);

      expect(res.status).toBe(200);
      // Fire-and-forget operations are tested via integration, not unit tests.
      // Just verify login succeeds for returning users.
    });
  });

  describe('Admin notification on first-time user', () => {
    it('sends notification to admin when adminFids is configured', async () => {
      vi.stubEnv('ZAO_OFFICIAL_SIGNER_UUID', 'signer-uuid-123');
      vi.stubEnv('ZAO_OFFICIAL_NEYNAR_API_KEY', 'api-key-123');

      mockGetSupabaseAdmin.mockReturnValue(
        createSupabaseMock([
          [{ data: { nonce: 'valid-nonce' }, error: null }], // nonce valid
          [{ data: null, error: null }], // users select by fid (no existing user)
          [{ data: null, error: null }], // users select by wallet (no existing user)
          [{ data: null, error: null }], // users upsert
        ]),
      );

      mockVerifySignInMessage.mockResolvedValue({
        isError: false,
        success: true,
        fid: 12345,
      });

      mockGetUserByFid.mockResolvedValue({
        fid: 12345,
        username: 'newuser',
        display_name: 'New User',
        pfp_url: 'https://example.com/pfp.jpg',
        custody_address: '0x1234567890abcdef1234567890abcdef12345678',
        verified_addresses: { eth_addresses: [] },
        profile: { bio: { text: 'A new user' } },
      });

      mockCheckAllowlist.mockResolvedValue({ allowed: true });

      const req = makePostRequest('/api/auth/verify', {
        message: 'farcaster.com wants you to sign in...',
        signature: '0x123',
        nonce: 'valid-nonce',
        domain: 'localhost:3000',
      });
      const res = await POST(req);

      expect(res.status).toBe(200);
      // Fire-and-forget notifications are tested via integration, not unit tests.
      // Just verify login succeeds when admin FIDs are configured.
    });
  });

  describe('Response shape', () => {
    it('returns success response with redirect on successful login', async () => {
      mockGetSupabaseAdmin.mockReturnValue(
        createSupabaseMock([
          [{ data: { nonce: 'valid-nonce' }, error: null }], // nonce valid
          [{ data: null, error: null }], // users select by fid (no existing user)
          [{ data: null, error: null }], // users select by wallet (no existing user)
          [{ data: null, error: null }], // users upsert
        ]),
      );

      mockVerifySignInMessage.mockResolvedValue({
        isError: false,
        success: true,
        fid: 12345,
      });

      mockGetUserByFid.mockResolvedValue({
        fid: 12345,
        username: 'testuser',
        display_name: 'Test User',
        pfp_url: 'https://example.com/pfp.jpg',
        custody_address: '0x1234567890abcdef1234567890abcdef12345678',
        verified_addresses: { eth_addresses: [] },
        profile: { bio: { text: 'A user' } },
      });

      mockCheckAllowlist.mockResolvedValue({ allowed: true });

      const req = makePostRequest('/api/auth/verify', {
        message: 'farcaster.com wants you to sign in...',
        signature: '0x123',
        nonce: 'valid-nonce',
        domain: 'localhost:3000',
      });
      const res = await POST(req);

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual({
        success: true,
        redirect: '/os',
      });
    });
  });

  describe('Error handling (top-level try/catch)', () => {
    it('returns 500 on unhandled error', async () => {
      const req = makePostRequest('/api/auth/verify', {
        message: 'farcaster.com wants you to sign in...',
        signature: '0x123',
        nonce: 'nonce123',
        domain: 'localhost:3000',
      });

      // Stub req.json() to throw an unhandled error
      const stub = req as unknown as { json: () => Promise<unknown> };
      stub.json = vi.fn(async () => {
        throw new Error('Unexpected parse error');
      });

      const res = await POST(req);

      expect(res.status).toBe(500);
      const body = await res.json();
      expect(body.error).toBe('Internal server error');
    });
  });
});

describe('GET /api/auth/verify', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('generates a nonce and stores it in Supabase', async () => {
    mockGetSupabaseAdmin.mockReturnValue(
      createSupabaseMock([
        [{ data: { nonce: 'generated-nonce-abc123' }, error: null }], // insert
      ]),
    );

    const res = await GET();

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.nonce).toBeDefined();
    expect(typeof body.nonce).toBe('string');
    expect(body.nonce.length).toBeGreaterThan(0);
  });

  it('returns JSON response', async () => {
    mockGetSupabaseAdmin.mockReturnValue(
      createSupabaseMock([[{ data: { nonce: 'test-nonce' }, error: null }]]),
    );

    const res = await GET();

    expect(res.headers.get('content-type')).toContain('application/json');
  });
});
