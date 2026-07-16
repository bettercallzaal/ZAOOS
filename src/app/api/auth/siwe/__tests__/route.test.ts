import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { chainMock, makePostRequest } from '@/test-utils/api-helpers';

// Create hoisted mocks for viem functions
const { mockParseSiweMessage, mockValidateSiweMessage, mockVerifyMessage } = vi.hoisted(() => {
  const mockVerifyMessage = vi.fn();
  return {
    mockParseSiweMessage: vi.fn(),
    mockValidateSiweMessage: vi.fn(),
    mockVerifyMessage,
  };
});

// Mock viem — the publicClient is created at module load, so we must
// provide a working mock that returns an object with verifyMessage
vi.mock('viem', () => ({
  createPublicClient: vi.fn(() => ({
    verifyMessage: mockVerifyMessage,
  })),
  http: vi.fn(),
}));

// Mock viem/chains — no network
vi.mock('viem/chains', () => ({
  mainnet: { id: 1 },
}));

// Mock viem/siwe
vi.mock('viem/siwe', () => ({
  parseSiweMessage: mockParseSiweMessage,
  validateSiweMessage: mockValidateSiweMessage,
}));

// Mock all dependency modules
const { mockCheckAllowlist } = vi.hoisted(() => ({
  mockCheckAllowlist: vi.fn(),
}));

const { mockGetUserByAddress } = vi.hoisted(() => ({
  mockGetUserByAddress: vi.fn(),
}));

const { mockSaveWalletSession } = vi.hoisted(() => ({
  mockSaveWalletSession: vi.fn(),
}));

const { mockSupabaseAdmin } = vi.hoisted(() => ({
  mockSupabaseAdmin: {
    from: vi.fn(),
  },
}));

vi.mock('@/lib/gates/allowlist', () => ({
  checkAllowlist: mockCheckAllowlist,
}));

vi.mock('@/lib/farcaster/neynar', () => ({
  getUserByAddress: mockGetUserByAddress,
}));

vi.mock('@/lib/auth/session', () => ({
  saveWalletSession: mockSaveWalletSession,
}));

vi.mock('@/lib/db/supabase', () => ({
  supabaseAdmin: mockSupabaseAdmin,
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}));

// Import route handlers after mocks
import { GET, POST } from '../route';

describe('GET /api/auth/siwe', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('generates a nonce and stores it in Supabase', async () => {
    const insertChain = chainMock({ data: { nonce: 'test-nonce-1234' }, error: null });
    const deleteChain = chainMock({ data: null, error: null });

    let callCount = 0;
    mockSupabaseAdmin.from.mockImplementation(() => {
      callCount++;
      // First call is insert, second is delete
      return callCount === 1 ? insertChain.chain : deleteChain.chain;
    });

    const res = await GET();

    expect(res.status).toBe(200);
    const body = (await res.json()) as { nonce?: string };
    expect(body.nonce).toBeDefined();
    expect(typeof body.nonce).toBe('string');
    expect(body.nonce.length).toBeGreaterThan(0);
  });

  it('returns JSON with proper Content-Type header', async () => {
    const insertChain = chainMock({ data: { nonce: 'test-nonce' }, error: null });
    const deleteChain = chainMock({ data: null, error: null });

    let callCount = 0;
    mockSupabaseAdmin.from.mockImplementation(() => {
      callCount++;
      return callCount === 1 ? insertChain.chain : deleteChain.chain;
    });

    const res = await GET();

    expect(res.headers.get('content-type')).toContain('application/json');
  });

  it('inserts nonce with expiration timestamp', async () => {
    const insertChain = chainMock({ data: { nonce: 'nonce-123' }, error: null });
    const deleteChain = chainMock({ data: null, error: null });

    let callCount = 0;
    mockSupabaseAdmin.from.mockImplementation(() => {
      callCount++;
      return callCount === 1 ? insertChain.chain : deleteChain.chain;
    });

    await GET();

    expect(mockSupabaseAdmin.from).toHaveBeenCalledWith('auth_nonces');
  });
});

describe('POST /api/auth/siwe', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSaveWalletSession.mockResolvedValue(undefined);
  });

  describe('Input validation (Zod schema)', () => {
    it('returns 400 when message is missing', async () => {
      const req = makePostRequest('/api/auth/siwe', {
        signature: '0x1234567890abcdef',
      });
      const res = await POST(req);

      expect(res.status).toBe(400);
      const body = (await res.json()) as { error?: string; details?: unknown };
      expect(body.error).toBe('Invalid input');
      expect(body.details).toBeDefined();
    });

    it('returns 400 when signature is missing', async () => {
      const req = makePostRequest('/api/auth/siwe', {
        message: 'example.com wants you to sign in',
      });
      const res = await POST(req);

      expect(res.status).toBe(400);
      const body = (await res.json()) as { error?: string };
      expect(body.error).toBe('Invalid input');
    });

    it('returns 400 when message is empty string', async () => {
      const req = makePostRequest('/api/auth/siwe', {
        message: '',
        signature: '0x1234567890abcdef',
      });
      const res = await POST(req);

      expect(res.status).toBe(400);
      const body = (await res.json()) as { error?: string };
      expect(body.error).toBe('Invalid input');
    });

    it('returns 400 when signature is empty string', async () => {
      const req = makePostRequest('/api/auth/siwe', {
        message: 'example.com wants you to sign in',
        signature: '',
      });
      const res = await POST(req);

      expect(res.status).toBe(400);
    });
  });

  describe('SIWE message parsing', () => {
    it('returns 400 when parsed message has no address', async () => {
      mockParseSiweMessage.mockReturnValue({
        address: null,
        nonce: 'nonce-123',
        domain: 'localhost:3000',
      });

      const req = makePostRequest('/api/auth/siwe', {
        message: 'example.com wants you to sign in',
        signature: '0x1234567890abcdef',
      });
      const res = await POST(req);

      expect(res.status).toBe(400);
      const body = (await res.json()) as { error?: string };
      expect(body.error).toBe('Invalid SIWE message');
    });

    it('catches parseSiweMessage errors in try/catch', async () => {
      mockParseSiweMessage.mockImplementation(() => {
        throw new Error('Invalid SIWE message format');
      });

      const req = makePostRequest('/api/auth/siwe', {
        message: 'malformed',
        signature: '0x1234567890abcdef',
      });
      const res = await POST(req);

      expect(res.status).toBe(500);
    });
  });

  describe('Nonce validation', () => {
    it('returns 400 when message has no nonce', async () => {
      mockParseSiweMessage.mockReturnValue({
        address: '0x1234567890abcdef1234567890abcdef12345678',
        nonce: null,
        domain: 'localhost:3000',
      });

      const req = makePostRequest('/api/auth/siwe', {
        message: 'example.com wants you to sign in',
        signature: '0x1234567890abcdef',
      });
      const res = await POST(req);

      expect(res.status).toBe(400);
      const body = (await res.json()) as { error?: string };
      expect(body.error).toBe('Missing nonce');
    });

    it('returns 400 when nonce is invalid or expired', async () => {
      mockParseSiweMessage.mockReturnValue({
        address: '0x1234567890abcdef1234567890abcdef12345678',
        nonce: 'invalid-nonce',
        domain: 'localhost:3000',
      });

      const deleteChain = chainMock({
        data: null,
        error: null,
      });
      mockSupabaseAdmin.from.mockReturnValue(deleteChain.chain);

      const req = makePostRequest('/api/auth/siwe', {
        message: 'example.com wants you to sign in',
        signature: '0x1234567890abcdef',
      });
      const res = await POST(req);

      expect(res.status).toBe(400);
      const body = (await res.json()) as { error?: string };
      expect(body.error).toContain('Invalid or expired nonce');
    });
  });

  describe('Domain validation', () => {
    it('returns 400 when domain does not match request host header', async () => {
      mockParseSiweMessage.mockReturnValue({
        address: '0x1234567890abcdef1234567890abcdef12345678',
        nonce: 'valid-nonce',
        domain: 'different.com',
      });

      const deleteChain = chainMock({
        data: [{ nonce: 'valid-nonce' }],
        error: null,
      });
      mockSupabaseAdmin.from.mockReturnValue(deleteChain.chain);

      const req = makePostRequest('/api/auth/siwe', {
        message: 'example.com wants you to sign in',
        signature: '0x1234567890abcdef',
      });

      const res = await POST(req);

      expect(res.status).toBe(400);
      const body = (await res.json()) as { error?: string };
      expect(body.error).toBe('Domain mismatch');
    });
  });

  describe('SIWE message validation', () => {
    it('returns 400 when validateSiweMessage returns false', async () => {
      const domain = 'localhost:3000';
      mockParseSiweMessage.mockReturnValue({
        address: '0x1234567890abcdef1234567890abcdef12345678',
        nonce: 'valid-nonce',
        domain,
      });

      const deleteChain = chainMock({
        data: [{ nonce: 'valid-nonce' }],
        error: null,
      });
      mockSupabaseAdmin.from.mockReturnValue(deleteChain.chain);

      mockValidateSiweMessage.mockReturnValue(false);

      const req = new NextRequest(new URL('/api/auth/siwe', `http://${domain}`), {
        method: 'POST',
        headers: { 'content-type': 'application/json', host: domain },
        body: JSON.stringify({
          message: 'localhost:3000 wants you to sign in',
          signature: '0x1234567890abcdef',
        }),
      }) as unknown as Parameters<typeof POST>[0];
      const res = await POST(req);

      expect(res.status).toBe(400);
      const body = (await res.json()) as { error?: string };
      expect(body.error).toContain('SIWE message expired or invalid');
    });
  });

  describe('Signature verification', () => {
    it('returns 401 when publicClient.verifyMessage returns false', async () => {
      const domain = 'localhost:3000';
      mockParseSiweMessage.mockReturnValue({
        address: '0x1234567890abcdef1234567890abcdef12345678',
        nonce: 'valid-nonce',
        domain,
      });

      const deleteChain = chainMock({
        data: [{ nonce: 'valid-nonce' }],
        error: null,
      });
      mockSupabaseAdmin.from.mockReturnValue(deleteChain.chain);

      mockValidateSiweMessage.mockReturnValue(true);
      mockVerifyMessage.mockResolvedValue(false);

      const req = new NextRequest(new URL('/api/auth/siwe', `http://${domain}`), {
        method: 'POST',
        headers: { 'content-type': 'application/json', host: domain },
        body: JSON.stringify({
          message: 'localhost:3000 wants you to sign in',
          signature: '0xbadsignature',
        }),
      }) as unknown as Parameters<typeof POST>[0];
      const res = await POST(req);

      expect(res.status).toBe(401);
      const body = (await res.json()) as { error?: string };
      expect(body.error).toBe('Invalid signature');
    });

    it('calls publicClient.verifyMessage with correct params', async () => {
      const domain = 'localhost:3000';
      mockParseSiweMessage.mockReturnValue({
        address: '0x1234567890abcdef1234567890abcdef12345678',
        nonce: 'valid-nonce',
        domain,
      });

      const deleteChain = chainMock({
        data: [{ nonce: 'valid-nonce' }],
        error: null,
      });

      const upsertChain = chainMock({ data: null, error: null });
      let _fromCallCount = 0;
      mockSupabaseAdmin.from.mockImplementation((table: string) => {
        _fromCallCount++;
        if (table === 'users') {
          return upsertChain.chain;
        }
        return deleteChain.chain;
      });

      mockValidateSiweMessage.mockReturnValue(true);
      mockVerifyMessage.mockResolvedValue(true);
      mockCheckAllowlist.mockResolvedValue({ allowed: true });
      mockGetUserByAddress.mockResolvedValue(null);

      const message = 'localhost:3000 wants you to sign in';
      const signature = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';

      const req = new NextRequest(new URL('/api/auth/siwe', `http://${domain}`), {
        method: 'POST',
        headers: { 'content-type': 'application/json', host: domain },
        body: JSON.stringify({
          message,
          signature,
        }),
      }) as unknown as Parameters<typeof POST>[0];
      await POST(req);

      expect(mockVerifyMessage).toHaveBeenCalledWith({
        address: '0x1234567890abcdef1234567890abcdef12345678',
        message,
        signature: signature as `0x${string}`,
      });
    });

    it('returns 500 when verifyMessage throws', async () => {
      const domain = 'localhost:3000';
      mockParseSiweMessage.mockReturnValue({
        address: '0x1234567890abcdef1234567890abcdef12345678',
        nonce: 'valid-nonce',
        domain,
      });

      const deleteChain = chainMock({
        data: [{ nonce: 'valid-nonce' }],
        error: null,
      });
      mockSupabaseAdmin.from.mockReturnValue(deleteChain.chain);

      mockValidateSiweMessage.mockReturnValue(true);
      mockVerifyMessage.mockRejectedValue(new Error('RPC error'));

      const req = new NextRequest(new URL('/api/auth/siwe', `http://${domain}`), {
        method: 'POST',
        headers: { 'content-type': 'application/json', host: domain },
        body: JSON.stringify({
          message: 'localhost:3000 wants you to sign in',
          signature: '0x1234567890abcdef',
        }),
      }) as unknown as Parameters<typeof POST>[0];
      const res = await POST(req);

      expect(res.status).toBe(500);
      const body = (await res.json()) as { error?: string };
      expect(body.error).toBe('Internal server error');
    });
  });

  describe('Allowlist gate', () => {
    it('returns 403 when allowlist check fails', async () => {
      const domain = 'localhost:3000';
      mockParseSiweMessage.mockReturnValue({
        address: '0x1234567890abcdef1234567890abcdef12345678',
        nonce: 'valid-nonce',
        domain,
      });

      const deleteChain = chainMock({
        data: [{ nonce: 'valid-nonce' }],
        error: null,
      });
      mockSupabaseAdmin.from.mockReturnValue(deleteChain.chain);

      mockValidateSiweMessage.mockReturnValue(true);
      mockVerifyMessage.mockResolvedValue(true);
      mockCheckAllowlist.mockResolvedValue({ allowed: false });

      const req = new NextRequest(new URL('/api/auth/siwe', `http://${domain}`), {
        method: 'POST',
        headers: { 'content-type': 'application/json', host: domain },
        body: JSON.stringify({
          message: 'localhost:3000 wants you to sign in',
          signature: '0x1234567890abcdef',
        }),
      }) as unknown as Parameters<typeof POST>[0];
      const res = await POST(req);

      expect(res.status).toBe(403);
      const body = (await res.json()) as { error?: string; redirect?: string };
      expect(body.error).toBe('Not on allowlist');
      expect(body.redirect).toBe('/not-allowed');
    });

    it('calls checkAllowlist with lowercased wallet address', async () => {
      const domain = 'localhost:3000';
      mockParseSiweMessage.mockReturnValue({
        address: '0xABCD567890abcdef1234567890abcdef12345678',
        nonce: 'valid-nonce',
        domain,
      });

      const deleteChain = chainMock({
        data: [{ nonce: 'valid-nonce' }],
        error: null,
      });

      const upsertChain = chainMock({ data: null, error: null });
      let _fromCallCount = 0;
      mockSupabaseAdmin.from.mockImplementation((table: string) => {
        _fromCallCount++;
        if (table === 'users') {
          return upsertChain.chain;
        }
        return deleteChain.chain;
      });

      mockValidateSiweMessage.mockReturnValue(true);
      mockVerifyMessage.mockResolvedValue(true);
      mockCheckAllowlist.mockResolvedValue({ allowed: true });
      mockGetUserByAddress.mockResolvedValue(null);

      const req = new NextRequest(new URL('/api/auth/siwe', `http://${domain}`), {
        method: 'POST',
        headers: { 'content-type': 'application/json', host: domain },
        body: JSON.stringify({
          message: 'localhost:3000 wants you to sign in',
          signature: '0x1234567890abcdef',
        }),
      }) as unknown as Parameters<typeof POST>[0];
      await POST(req);

      expect(mockCheckAllowlist).toHaveBeenCalledWith(
        undefined,
        '0xabcd567890abcdef1234567890abcdef12345678',
      );
    });
  });

  describe('Neynar user lookup', () => {
    it('resolves Farcaster identity from wallet address', async () => {
      const domain = 'localhost:3000';
      mockParseSiweMessage.mockReturnValue({
        address: '0x1234567890abcdef1234567890abcdef12345678',
        nonce: 'valid-nonce',
        domain,
      });

      const deleteChain = chainMock({
        data: [{ nonce: 'valid-nonce' }],
        error: null,
      });

      const upsertChain = chainMock({ data: null, error: null });
      let _fromCallCount = 0;
      mockSupabaseAdmin.from.mockImplementation((table: string) => {
        _fromCallCount++;
        if (table === 'users') {
          return upsertChain.chain;
        }
        return deleteChain.chain;
      });

      mockValidateSiweMessage.mockReturnValue(true);
      mockVerifyMessage.mockResolvedValue(true);
      mockCheckAllowlist.mockResolvedValue({ allowed: true });
      mockGetUserByAddress.mockResolvedValue({
        fid: 12345,
        username: 'testuser',
        display_name: 'Test User',
        pfp_url: 'https://example.com/pfp.jpg',
      });

      const req = new NextRequest(new URL('/api/auth/siwe', `http://${domain}`), {
        method: 'POST',
        headers: { 'content-type': 'application/json', host: domain },
        body: JSON.stringify({
          message: 'localhost:3000 wants you to sign in',
          signature: '0x1234567890abcdef',
        }),
      }) as unknown as Parameters<typeof POST>[0];
      await POST(req);

      expect(mockGetUserByAddress).toHaveBeenCalledWith(
        '0x1234567890abcdef1234567890abcdef12345678',
      );
    });

    it('handles getUserByAddress returning null (non-Farcaster user)', async () => {
      const domain = 'localhost:3000';
      mockParseSiweMessage.mockReturnValue({
        address: '0x1234567890abcdef1234567890abcdef12345678',
        nonce: 'valid-nonce',
        domain,
      });

      const deleteChain = chainMock({
        data: [{ nonce: 'valid-nonce' }],
        error: null,
      });

      const upsertChain = chainMock({ data: null, error: null });
      let _fromCallCount = 0;
      mockSupabaseAdmin.from.mockImplementation((table: string) => {
        _fromCallCount++;
        if (table === 'users') {
          return upsertChain.chain;
        }
        return deleteChain.chain;
      });

      mockValidateSiweMessage.mockReturnValue(true);
      mockVerifyMessage.mockResolvedValue(true);
      mockCheckAllowlist.mockResolvedValue({ allowed: true });
      mockGetUserByAddress.mockResolvedValue(null);

      const req = new NextRequest(new URL('/api/auth/siwe', `http://${domain}`), {
        method: 'POST',
        headers: { 'content-type': 'application/json', host: domain },
        body: JSON.stringify({
          message: 'localhost:3000 wants you to sign in',
          signature: '0x1234567890abcdef',
        }),
      }) as unknown as Parameters<typeof POST>[0];
      const res = await POST(req);

      expect(res.status).toBe(200);
      const body = (await res.json()) as { hasFarcaster?: boolean };
      expect(body.hasFarcaster).toBe(false);
    });

    it('gracefully handles getUserByAddress errors (non-critical)', async () => {
      const domain = 'localhost:3000';
      mockParseSiweMessage.mockReturnValue({
        address: '0x1234567890abcdef1234567890abcdef12345678',
        nonce: 'valid-nonce',
        domain,
      });

      const deleteChain = chainMock({
        data: [{ nonce: 'valid-nonce' }],
        error: null,
      });

      const upsertChain = chainMock({ data: null, error: null });
      let _fromCallCount = 0;
      mockSupabaseAdmin.from.mockImplementation((table: string) => {
        _fromCallCount++;
        if (table === 'users') {
          return upsertChain.chain;
        }
        return deleteChain.chain;
      });

      mockValidateSiweMessage.mockReturnValue(true);
      mockVerifyMessage.mockResolvedValue(true);
      mockCheckAllowlist.mockResolvedValue({ allowed: true });
      mockGetUserByAddress.mockRejectedValue(new Error('Neynar API error'));

      const req = new NextRequest(new URL('/api/auth/siwe', `http://${domain}`), {
        method: 'POST',
        headers: { 'content-type': 'application/json', host: domain },
        body: JSON.stringify({
          message: 'localhost:3000 wants you to sign in',
          signature: '0x1234567890abcdef',
        }),
      }) as unknown as Parameters<typeof POST>[0];
      const res = await POST(req);

      // Should still succeed because Neynar lookup is non-critical
      expect(res.status).toBe(200);
    });
  });

  describe('Session creation (saveWalletSession)', () => {
    it('calls saveWalletSession with wallet address and Farcaster data', async () => {
      const domain = 'localhost:3000';
      mockParseSiweMessage.mockReturnValue({
        address: '0x1234567890abcdef1234567890abcdef12345678',
        nonce: 'valid-nonce',
        domain,
      });

      const deleteChain = chainMock({
        data: [{ nonce: 'valid-nonce' }],
        error: null,
      });

      const upsertChain = chainMock({ data: null, error: null });
      let _fromCallCount = 0;
      mockSupabaseAdmin.from.mockImplementation((table: string) => {
        _fromCallCount++;
        if (table === 'users') {
          return upsertChain.chain;
        }
        return deleteChain.chain;
      });

      mockValidateSiweMessage.mockReturnValue(true);
      mockVerifyMessage.mockResolvedValue(true);
      mockCheckAllowlist.mockResolvedValue({ allowed: true });
      mockGetUserByAddress.mockResolvedValue({
        fid: 99999,
        username: 'fcuser',
        display_name: 'FC User',
        pfp_url: 'https://example.com/pfp.jpg',
      });

      const req = new NextRequest(new URL('/api/auth/siwe', `http://${domain}`), {
        method: 'POST',
        headers: { 'content-type': 'application/json', host: domain },
        body: JSON.stringify({
          message: 'localhost:3000 wants you to sign in',
          signature: '0x1234567890abcdef',
        }),
      }) as unknown as Parameters<typeof POST>[0];
      await POST(req);

      expect(mockSaveWalletSession).toHaveBeenCalledWith({
        walletAddress: '0x1234567890abcdef1234567890abcdef12345678',
        fid: 99999,
        username: 'fcuser',
        displayName: 'FC User',
        pfpUrl: 'https://example.com/pfp.jpg',
      });
    });

    it('calls saveWalletSession without Farcaster data for web3-only user', async () => {
      const domain = 'localhost:3000';
      mockParseSiweMessage.mockReturnValue({
        address: '0x1234567890abcdef1234567890abcdef12345678',
        nonce: 'valid-nonce',
        domain,
      });

      const deleteChain = chainMock({
        data: [{ nonce: 'valid-nonce' }],
        error: null,
      });

      const upsertChain = chainMock({ data: null, error: null });
      let _fromCallCount = 0;
      mockSupabaseAdmin.from.mockImplementation((table: string) => {
        _fromCallCount++;
        if (table === 'users') {
          return upsertChain.chain;
        }
        return deleteChain.chain;
      });

      mockValidateSiweMessage.mockReturnValue(true);
      mockVerifyMessage.mockResolvedValue(true);
      mockCheckAllowlist.mockResolvedValue({ allowed: true });
      mockGetUserByAddress.mockResolvedValue(null);

      const req = new NextRequest(new URL('/api/auth/siwe', `http://${domain}`), {
        method: 'POST',
        headers: { 'content-type': 'application/json', host: domain },
        body: JSON.stringify({
          message: 'localhost:3000 wants you to sign in',
          signature: '0x1234567890abcdef',
        }),
      }) as unknown as Parameters<typeof POST>[0];
      await POST(req);

      expect(mockSaveWalletSession).toHaveBeenCalledWith({
        walletAddress: '0x1234567890abcdef1234567890abcdef12345678',
      });
    });
  });

  describe('Successful authentication', () => {
    it('returns 200 with success redirect and hasFarcaster flag (with FC)', async () => {
      const domain = 'localhost:3000';
      mockParseSiweMessage.mockReturnValue({
        address: '0x1234567890abcdef1234567890abcdef12345678',
        nonce: 'valid-nonce',
        domain,
      });

      const deleteChain = chainMock({
        data: [{ nonce: 'valid-nonce' }],
        error: null,
      });

      const upsertChain = chainMock({ data: null, error: null });
      let _callCount = 0;
      mockSupabaseAdmin.from.mockImplementation((table: string) => {
        _callCount++;
        if (table === 'users') {
          return upsertChain.chain;
        }
        return deleteChain.chain;
      });

      mockValidateSiweMessage.mockReturnValue(true);
      mockVerifyMessage.mockResolvedValue(true);
      mockCheckAllowlist.mockResolvedValue({ allowed: true });
      mockGetUserByAddress.mockResolvedValue({
        fid: 12345,
        username: 'testuser',
        display_name: 'Test User',
        pfp_url: 'https://example.com/pfp.jpg',
      });

      const req = new NextRequest(new URL('/api/auth/siwe', `http://${domain}`), {
        method: 'POST',
        headers: { 'content-type': 'application/json', host: domain },
        body: JSON.stringify({
          message: 'localhost:3000 wants you to sign in',
          signature: '0x1234567890abcdef',
        }),
      }) as unknown as Parameters<typeof POST>[0];
      const res = await POST(req);

      expect(res.status).toBe(200);
      const body = (await res.json()) as {
        success?: boolean;
        redirect?: string;
        hasFarcaster?: boolean;
      };
      expect(body.success).toBe(true);
      expect(body.redirect).toBe('/os');
      expect(body.hasFarcaster).toBe(true);
    });

    it('returns 200 with hasFarcaster=false for web3-only user', async () => {
      const domain = 'localhost:3000';
      mockParseSiweMessage.mockReturnValue({
        address: '0x1234567890abcdef1234567890abcdef12345678',
        nonce: 'valid-nonce',
        domain,
      });

      const deleteChain = chainMock({
        data: [{ nonce: 'valid-nonce' }],
        error: null,
      });

      const upsertChain = chainMock({ data: null, error: null });
      let _callCount = 0;
      mockSupabaseAdmin.from.mockImplementation((table: string) => {
        _callCount++;
        if (table === 'users') {
          return upsertChain.chain;
        }
        return deleteChain.chain;
      });

      mockValidateSiweMessage.mockReturnValue(true);
      mockVerifyMessage.mockResolvedValue(true);
      mockCheckAllowlist.mockResolvedValue({ allowed: true });
      mockGetUserByAddress.mockResolvedValue(null);

      const req = new NextRequest(new URL('/api/auth/siwe', `http://${domain}`), {
        method: 'POST',
        headers: { 'content-type': 'application/json', host: domain },
        body: JSON.stringify({
          message: 'localhost:3000 wants you to sign in',
          signature: '0x1234567890abcdef',
        }),
      }) as unknown as Parameters<typeof POST>[0];
      const res = await POST(req);

      expect(res.status).toBe(200);
      const body = (await res.json()) as {
        success?: boolean;
        redirect?: string;
        hasFarcaster?: boolean;
      };
      expect(body.hasFarcaster).toBe(false);
    });
  });

  describe('Error handling (top-level try/catch)', () => {
    it('returns 500 on unhandled error in request parsing', async () => {
      const req = makePostRequest('/api/auth/siwe', {
        message: 'localhost:3000 wants you to sign in',
        signature: '0x1234567890abcdef',
      });

      // Override json() to throw
      const stub = req as unknown as { json: () => Promise<unknown> };
      stub.json = vi.fn(async () => {
        throw new Error('Unexpected error during parse');
      });

      const res = await POST(req);

      expect(res.status).toBe(500);
      const body = (await res.json()) as { error?: string };
      expect(body.error).toBe('Internal server error');
    });
  });

  describe('Edge cases', () => {
    it('handles mixed-case Ethereum address in SIWE message', async () => {
      const domain = 'localhost:3000';
      const mixedCaseAddress = '0xAbCd567890AbCdEf1234567890aBcDeF12345678';

      mockParseSiweMessage.mockReturnValue({
        address: mixedCaseAddress,
        nonce: 'valid-nonce',
        domain,
      });

      const deleteChain = chainMock({
        data: [{ nonce: 'valid-nonce' }],
        error: null,
      });

      const upsertChain = chainMock({ data: null, error: null });
      let _callCount = 0;
      mockSupabaseAdmin.from.mockImplementation((table: string) => {
        _callCount++;
        if (table === 'users') {
          return upsertChain.chain;
        }
        return deleteChain.chain;
      });

      mockValidateSiweMessage.mockReturnValue(true);
      mockVerifyMessage.mockResolvedValue(true);
      mockCheckAllowlist.mockResolvedValue({ allowed: true });
      mockGetUserByAddress.mockResolvedValue(null);

      const req = new NextRequest(new URL('/api/auth/siwe', `http://${domain}`), {
        method: 'POST',
        headers: { 'content-type': 'application/json', host: domain },
        body: JSON.stringify({
          message: 'localhost:3000 wants you to sign in',
          signature: '0x1234567890abcdef',
        }),
      }) as unknown as Parameters<typeof POST>[0];
      await POST(req);

      // Verify address was lowercased for storage and session
      expect(mockSaveWalletSession).toHaveBeenCalledWith({
        walletAddress: mixedCaseAddress.toLowerCase(),
      });
    });
  });
});
