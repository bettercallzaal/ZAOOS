import { beforeEach, describe, expect, it, vi } from 'vitest';
import { makeRequest } from '@/test-utils/api-helpers';
import { GET } from '../route';

// ── Hoisted mocks ────────────────────────────────────────────────────────────
const { mockVerifyJwt } = vi.hoisted(() => ({
  mockVerifyJwt: vi.fn(),
}));

const { mockGetUserByFid } = vi.hoisted(() => ({
  mockGetUserByFid: vi.fn(),
}));

const { mockCheckAllowlist } = vi.hoisted(() => ({
  mockCheckAllowlist: vi.fn(),
}));

const { mockSaveSession } = vi.hoisted(() => ({
  mockSaveSession: vi.fn(),
}));

const { mockLogger } = vi.hoisted(() => ({
  mockLogger: { error: vi.fn() },
}));

vi.mock('@farcaster/quick-auth', () => ({
  createClient: vi.fn(() => ({
    verifyJwt: mockVerifyJwt,
  })),
}));

vi.mock('@/lib/farcaster/neynar', () => ({
  getUserByFid: mockGetUserByFid,
}));

vi.mock('@/lib/gates/allowlist', () => ({
  checkAllowlist: mockCheckAllowlist,
}));

vi.mock('@/lib/auth/session', () => ({
  saveSession: mockSaveSession,
}));

vi.mock('@/lib/logger', () => ({
  logger: mockLogger,
}));

vi.mock('@/lib/env', () => ({
  ENV: {
    NEXT_PUBLIC_SIWF_DOMAIN: undefined,
  },
}));

// ── Tests ────────────────────────────────────────────────────────────────────

describe('GET /api/miniapp/auth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Authorization header validation', () => {
    it('returns 401 when Authorization header is missing', async () => {
      const req = makeRequest('/api/miniapp/auth', { method: 'GET' });
      const res = await GET(req);

      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body).toEqual({ error: 'Unauthorized' });
      expect(mockVerifyJwt).not.toHaveBeenCalled();
    });

    it('returns 401 when Authorization header does not start with Bearer', async () => {
      const req = makeRequest('/api/miniapp/auth', {
        method: 'GET',
        headers: { Authorization: 'Basic xyz' },
      });
      const res = await GET(req);

      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body).toEqual({ error: 'Unauthorized' });
      expect(mockVerifyJwt).not.toHaveBeenCalled();
    });

    it('returns 401 when Authorization header is empty Bearer', async () => {
      const req = makeRequest('/api/miniapp/auth', {
        method: 'GET',
        headers: { Authorization: 'Bearer ' },
      });
      const res = await GET(req);

      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body).toEqual({ error: 'Unauthorized' });
    });

    it('returns 401 when Authorization header is just "Bearer"', async () => {
      const req = makeRequest('/api/miniapp/auth', {
        method: 'GET',
        headers: { Authorization: 'Bearer' },
      });
      const res = await GET(req);

      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body).toEqual({ error: 'Unauthorized' });
    });
  });

  describe('JWT verification', () => {
    it('extracts Bearer token and passes to verifyJwt with domain', async () => {
      mockVerifyJwt.mockResolvedValue({ sub: '123' });
      mockGetUserByFid.mockResolvedValue(null);
      mockCheckAllowlist.mockResolvedValue({ allowed: false });

      const req = makeRequest('/api/miniapp/auth', {
        method: 'GET',
        headers: { Authorization: 'Bearer test-token-123' },
      });
      const res = await GET(req);

      expect(res.status).toBe(200);
      expect(mockVerifyJwt).toHaveBeenCalledWith({
        token: 'test-token-123',
        domain: 'zaoos.com',
      });
    });

    it('uses fallback zaoos.com domain when NEXT_PUBLIC_SIWF_DOMAIN is undefined', async () => {
      mockVerifyJwt.mockResolvedValue({ sub: '456' });
      mockGetUserByFid.mockResolvedValue(null);
      mockCheckAllowlist.mockResolvedValue({ allowed: false });

      const req = makeRequest('/api/miniapp/auth', {
        method: 'GET',
        headers: { Authorization: 'Bearer token' },
      });

      const res = await GET(req);
      expect(res.status).toBe(200);
      // Verify the fallback domain is used when ENV var is undefined
      expect(mockVerifyJwt).toHaveBeenCalledWith({
        token: 'token',
        domain: 'zaoos.com',
      });
    });

    it('returns 401 when verifyJwt throws an error', async () => {
      mockVerifyJwt.mockRejectedValue(new Error('Invalid JWT'));

      const req = makeRequest('/api/miniapp/auth', {
        method: 'GET',
        headers: { Authorization: 'Bearer bad-token' },
      });
      const res = await GET(req);

      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body).toEqual({ error: 'Invalid token' });
      expect(mockLogger.error).toHaveBeenCalledWith('Mini app auth error:', expect.any(Error));
    });

    it('returns 401 when verifyJwt throws with an arbitrary value', async () => {
      mockVerifyJwt.mockRejectedValue('unknown error');

      const req = makeRequest('/api/miniapp/auth', {
        method: 'GET',
        headers: { Authorization: 'Bearer bad-token' },
      });
      const res = await GET(req);

      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body).toEqual({ error: 'Invalid token' });
    });

    it('extracts fid from payload.sub and converts to number', async () => {
      mockVerifyJwt.mockResolvedValue({ sub: '789' });
      mockGetUserByFid.mockResolvedValue({
        username: 'testuser',
        display_name: 'Test User',
        pfp_url: 'https://example.com/pfp.jpg',
      });
      mockCheckAllowlist.mockResolvedValue({ allowed: true });
      mockSaveSession.mockResolvedValue(undefined);

      const req = makeRequest('/api/miniapp/auth', {
        method: 'GET',
        headers: { Authorization: 'Bearer valid-token' },
      });
      const res = await GET(req);

      expect(res.status).toBe(200);
      // Verify getUserByFid was called with numeric fid
      expect(mockGetUserByFid).toHaveBeenCalledWith(789);
      // Verify saveSession received numeric fid
      expect(mockSaveSession).toHaveBeenCalledWith({
        fid: 789,
        username: 'testuser',
        displayName: 'Test User',
        pfpUrl: 'https://example.com/pfp.jpg',
      });
    });
  });

  describe('FID allowlist check', () => {
    it('checks allowlist by FID when user exists', async () => {
      mockVerifyJwt.mockResolvedValue({ sub: '100' });
      mockGetUserByFid.mockResolvedValue({
        username: 'user1',
        display_name: 'User One',
        pfp_url: '',
      });
      mockCheckAllowlist.mockResolvedValue({ allowed: true });
      mockSaveSession.mockResolvedValue(undefined);

      const req = makeRequest('/api/miniapp/auth', {
        method: 'GET',
        headers: { Authorization: 'Bearer token' },
      });
      const res = await GET(req);

      expect(res.status).toBe(200);
      expect(mockCheckAllowlist).toHaveBeenCalledWith(100);
      expect(mockSaveSession).toHaveBeenCalled();
    });

    it('returns hasAccess:false when FID is not in allowlist and no wallet fallback', async () => {
      mockVerifyJwt.mockResolvedValue({ sub: '200' });
      mockGetUserByFid.mockResolvedValue({
        username: 'notallowed',
        display_name: 'Not Allowed',
        pfp_url: 'https://example.com/pfp2.jpg',
        verified_addresses: undefined,
      });
      mockCheckAllowlist.mockResolvedValue({ allowed: false });
      mockSaveSession.mockResolvedValue(undefined);

      const req = makeRequest('/api/miniapp/auth', {
        method: 'GET',
        headers: { Authorization: 'Bearer token' },
      });
      const res = await GET(req);

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.hasAccess).toBe(false);
      expect(body.fid).toBe(200);
      expect(mockSaveSession).not.toHaveBeenCalled();
    });
  });

  describe('Wallet address fallback', () => {
    it('checks wallet addresses when FID allowlist fails', async () => {
      mockVerifyJwt.mockResolvedValue({ sub: '300' });
      mockGetUserByFid.mockResolvedValue({
        username: 'user3',
        display_name: 'User Three',
        pfp_url: '',
        verified_addresses: {
          eth_addresses: ['0x1111111111111111111111111111111111111111'],
        },
      });
      // First call (FID check) returns false
      // Second call (wallet check) returns true
      mockCheckAllowlist
        .mockResolvedValueOnce({ allowed: false })
        .mockResolvedValueOnce({ allowed: true });
      mockSaveSession.mockResolvedValue(undefined);

      const req = makeRequest('/api/miniapp/auth', {
        method: 'GET',
        headers: { Authorization: 'Bearer token' },
      });
      const res = await GET(req);

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.hasAccess).toBe(true);
      // Should have called checkAllowlist twice: first with fid, then with wallet
      expect(mockCheckAllowlist).toHaveBeenCalledTimes(2);
      expect(mockCheckAllowlist).toHaveBeenNthCalledWith(1, 300);
      expect(mockCheckAllowlist).toHaveBeenNthCalledWith(
        2,
        undefined,
        '0x1111111111111111111111111111111111111111',
      );
      expect(mockSaveSession).toHaveBeenCalled();
    });

    it('checks all wallet addresses until one is allowed', async () => {
      mockVerifyJwt.mockResolvedValue({ sub: '301' });
      mockGetUserByFid.mockResolvedValue({
        username: 'user301',
        display_name: 'User 301',
        pfp_url: '',
        verified_addresses: {
          eth_addresses: [
            '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
            '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
            '0xcccccccccccccccccccccccccccccccccccccccc',
          ],
        },
      });
      // FID check fails, first wallet check fails, second wallet check passes
      mockCheckAllowlist
        .mockResolvedValueOnce({ allowed: false })
        .mockResolvedValueOnce({ allowed: false })
        .mockResolvedValueOnce({ allowed: true });
      mockSaveSession.mockResolvedValue(undefined);

      const req = makeRequest('/api/miniapp/auth', {
        method: 'GET',
        headers: { Authorization: 'Bearer token' },
      });
      const res = await GET(req);

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.hasAccess).toBe(true);
      // Should have checked FID, first wallet, second wallet (then stopped)
      expect(mockCheckAllowlist).toHaveBeenCalledTimes(3);
      expect(mockCheckAllowlist).toHaveBeenNthCalledWith(
        2,
        undefined,
        '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      );
      expect(mockCheckAllowlist).toHaveBeenNthCalledWith(
        3,
        undefined,
        '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
      );
      expect(mockSaveSession).toHaveBeenCalled();
    });

    it('does not check wallets when no verified_addresses', async () => {
      mockVerifyJwt.mockResolvedValue({ sub: '302' });
      mockGetUserByFid.mockResolvedValue({
        username: 'nowallets',
        display_name: 'No Wallets',
        pfp_url: '',
        verified_addresses: undefined,
      });
      mockCheckAllowlist.mockResolvedValue({ allowed: false });
      mockSaveSession.mockResolvedValue(undefined);

      const req = makeRequest('/api/miniapp/auth', {
        method: 'GET',
        headers: { Authorization: 'Bearer token' },
      });
      const res = await GET(req);

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.hasAccess).toBe(false);
      // Only one call for FID, no wallet checks
      expect(mockCheckAllowlist).toHaveBeenCalledTimes(1);
      expect(mockCheckAllowlist).toHaveBeenCalledWith(302);
    });

    it('does not check wallets when eth_addresses is empty', async () => {
      mockVerifyJwt.mockResolvedValue({ sub: '303' });
      mockGetUserByFid.mockResolvedValue({
        username: 'emptywallets',
        display_name: 'Empty Wallets',
        pfp_url: '',
        verified_addresses: {
          eth_addresses: [],
        },
      });
      mockCheckAllowlist.mockResolvedValue({ allowed: false });
      mockSaveSession.mockResolvedValue(undefined);

      const req = makeRequest('/api/miniapp/auth', {
        method: 'GET',
        headers: { Authorization: 'Bearer token' },
      });
      const res = await GET(req);

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.hasAccess).toBe(false);
      // Only one call for FID
      expect(mockCheckAllowlist).toHaveBeenCalledTimes(1);
    });
  });

  describe('Session saving', () => {
    it('calls saveSession when allowlist check passes via FID', async () => {
      mockVerifyJwt.mockResolvedValue({ sub: '400' });
      mockGetUserByFid.mockResolvedValue({
        username: 'alloweduser',
        display_name: 'Allowed User',
        pfp_url: 'https://example.com/pfp400.jpg',
      });
      mockCheckAllowlist.mockResolvedValue({ allowed: true });
      mockSaveSession.mockResolvedValue(undefined);

      const req = makeRequest('/api/miniapp/auth', {
        method: 'GET',
        headers: { Authorization: 'Bearer token' },
      });
      const res = await GET(req);

      expect(res.status).toBe(200);
      expect(mockSaveSession).toHaveBeenCalledWith({
        fid: 400,
        username: 'alloweduser',
        displayName: 'Allowed User',
        pfpUrl: 'https://example.com/pfp400.jpg',
      });
    });

    it('calls saveSession when allowlist check passes via wallet', async () => {
      mockVerifyJwt.mockResolvedValue({ sub: '401' });
      mockGetUserByFid.mockResolvedValue({
        username: 'walletuser',
        display_name: 'Wallet User',
        pfp_url: 'https://example.com/pfp401.jpg',
        verified_addresses: {
          eth_addresses: ['0xdddddddddddddddddddddddddddddddddddddddd'],
        },
      });
      mockCheckAllowlist
        .mockResolvedValueOnce({ allowed: false })
        .mockResolvedValueOnce({ allowed: true });
      mockSaveSession.mockResolvedValue(undefined);

      const req = makeRequest('/api/miniapp/auth', {
        method: 'GET',
        headers: { Authorization: 'Bearer token' },
      });
      const res = await GET(req);

      expect(res.status).toBe(200);
      expect(mockSaveSession).toHaveBeenCalledWith({
        fid: 401,
        username: 'walletuser',
        displayName: 'Wallet User',
        pfpUrl: 'https://example.com/pfp401.jpg',
      });
    });

    it('does not call saveSession when allowlist check fails', async () => {
      mockVerifyJwt.mockResolvedValue({ sub: '402' });
      mockGetUserByFid.mockResolvedValue({
        username: 'notallowed',
        display_name: 'Not Allowed',
        pfp_url: '',
      });
      mockCheckAllowlist.mockResolvedValue({ allowed: false });

      const req = makeRequest('/api/miniapp/auth', {
        method: 'GET',
        headers: { Authorization: 'Bearer token' },
      });
      const res = await GET(req);

      expect(res.status).toBe(200);
      expect(mockSaveSession).not.toHaveBeenCalled();
    });
  });

  describe('User profile fallback', () => {
    it('uses empty strings when getUserByFid returns null', async () => {
      mockVerifyJwt.mockResolvedValue({ sub: '500' });
      mockGetUserByFid.mockResolvedValue(null);
      mockCheckAllowlist.mockResolvedValue({ allowed: false });

      const req = makeRequest('/api/miniapp/auth', {
        method: 'GET',
        headers: { Authorization: 'Bearer token' },
      });
      const res = await GET(req);

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.fid).toBe(500);
      expect(body.username).toBe('');
      expect(body.displayName).toBe('');
      expect(body.pfpUrl).toBe('');
    });

    it('uses empty strings for missing profile fields', async () => {
      mockVerifyJwt.mockResolvedValue({ sub: '501' });
      mockGetUserByFid.mockResolvedValue({
        username: undefined,
        display_name: undefined,
        pfp_url: undefined,
      });
      mockCheckAllowlist.mockResolvedValue({ allowed: false });

      const req = makeRequest('/api/miniapp/auth', {
        method: 'GET',
        headers: { Authorization: 'Bearer token' },
      });
      const res = await GET(req);

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.username).toBe('');
      expect(body.displayName).toBe('');
      expect(body.pfpUrl).toBe('');
    });
  });

  describe('Response shape', () => {
    it('returns correct response when allowed', async () => {
      mockVerifyJwt.mockResolvedValue({ sub: '600' });
      mockGetUserByFid.mockResolvedValue({
        username: 'testuser',
        display_name: 'Test User',
        pfp_url: 'https://example.com/test.jpg',
      });
      mockCheckAllowlist.mockResolvedValue({ allowed: true });
      mockSaveSession.mockResolvedValue(undefined);

      const req = makeRequest('/api/miniapp/auth', {
        method: 'GET',
        headers: { Authorization: 'Bearer token' },
      });
      const res = await GET(req);

      expect(res.status).toBe(200);
      expect(res.headers.get('content-type')).toContain('application/json');
      const body = await res.json();
      expect(body).toEqual({
        fid: 600,
        hasAccess: true,
        username: 'testuser',
        displayName: 'Test User',
        pfpUrl: 'https://example.com/test.jpg',
      });
    });

    it('returns correct response when not allowed', async () => {
      mockVerifyJwt.mockResolvedValue({ sub: '601' });
      mockGetUserByFid.mockResolvedValue({
        username: 'denied',
        display_name: 'Denied User',
        pfp_url: '',
      });
      mockCheckAllowlist.mockResolvedValue({ allowed: false });

      const req = makeRequest('/api/miniapp/auth', {
        method: 'GET',
        headers: { Authorization: 'Bearer token' },
      });
      const res = await GET(req);

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual({
        fid: 601,
        hasAccess: false,
        username: 'denied',
        displayName: 'Denied User',
        pfpUrl: '',
      });
    });

    it('returns JSON error response on auth failure', async () => {
      const req = makeRequest('/api/miniapp/auth', {
        method: 'GET',
        headers: { Authorization: 'Bearer bad' },
      });
      mockVerifyJwt.mockRejectedValue(new Error('JWT expired'));

      const res = await GET(req);

      expect(res.status).toBe(401);
      expect(res.headers.get('content-type')).toContain('application/json');
      const body = await res.json();
      expect(body).toEqual({ error: 'Invalid token' });
    });
  });

  describe('Error handling', () => {
    it('catches and logs errors during verification', async () => {
      mockVerifyJwt.mockRejectedValue(new Error('JWT verification failed'));

      const req = makeRequest('/api/miniapp/auth', {
        method: 'GET',
        headers: { Authorization: 'Bearer token' },
      });
      const res = await GET(req);

      expect(res.status).toBe(401);
      expect(mockLogger.error).toHaveBeenCalledWith('Mini app auth error:', expect.any(Error));
    });

    it('catches and logs getUserByFid errors', async () => {
      mockVerifyJwt.mockResolvedValue({ sub: '700' });
      mockGetUserByFid.mockRejectedValue(new Error('Neynar API error'));

      const req = makeRequest('/api/miniapp/auth', {
        method: 'GET',
        headers: { Authorization: 'Bearer token' },
      });
      const res = await GET(req);

      expect(res.status).toBe(401);
      expect(mockLogger.error).toHaveBeenCalledWith('Mini app auth error:', expect.any(Error));
    });

    it('catches and logs checkAllowlist errors', async () => {
      mockVerifyJwt.mockResolvedValue({ sub: '701' });
      mockGetUserByFid.mockResolvedValue({
        username: 'user',
        display_name: 'User',
        pfp_url: '',
      });
      mockCheckAllowlist.mockRejectedValue(new Error('Supabase error'));

      const req = makeRequest('/api/miniapp/auth', {
        method: 'GET',
        headers: { Authorization: 'Bearer token' },
      });
      const res = await GET(req);

      expect(res.status).toBe(401);
      expect(mockLogger.error).toHaveBeenCalledWith('Mini app auth error:', expect.any(Error));
    });

    it('catches and logs saveSession errors', async () => {
      mockVerifyJwt.mockResolvedValue({ sub: '702' });
      mockGetUserByFid.mockResolvedValue({
        username: 'user',
        display_name: 'User',
        pfp_url: '',
      });
      mockCheckAllowlist.mockResolvedValue({ allowed: true });
      mockSaveSession.mockRejectedValue(new Error('Session save failed'));

      const req = makeRequest('/api/miniapp/auth', {
        method: 'GET',
        headers: { Authorization: 'Bearer token' },
      });
      const res = await GET(req);

      expect(res.status).toBe(401);
      expect(mockLogger.error).toHaveBeenCalledWith('Mini app auth error:', expect.any(Error));
    });
  });

  describe('Edge cases', () => {
    it('extracts token correctly with single space', async () => {
      mockVerifyJwt.mockResolvedValue({ sub: '800' });
      mockGetUserByFid.mockResolvedValue({
        username: 'user',
        display_name: 'User',
        pfp_url: '',
      });
      mockCheckAllowlist.mockResolvedValue({ allowed: false });

      const req = makeRequest('/api/miniapp/auth', {
        method: 'GET',
        headers: { Authorization: 'Bearer valid-token-abc123' },
      });
      const res = await GET(req);

      expect(res.status).toBe(200);
      expect(mockVerifyJwt).toHaveBeenCalledWith({
        token: 'valid-token-abc123',
        domain: 'zaoos.com',
      });
    });

    it('handles sub as a string number', async () => {
      mockVerifyJwt.mockResolvedValue({ sub: '12345' });
      mockGetUserByFid.mockResolvedValue({
        username: 'user',
        display_name: 'User',
        pfp_url: '',
      });
      mockCheckAllowlist.mockResolvedValue({ allowed: true });
      mockSaveSession.mockResolvedValue(undefined);

      const req = makeRequest('/api/miniapp/auth', {
        method: 'GET',
        headers: { Authorization: 'Bearer token' },
      });
      const res = await GET(req);

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.fid).toBe(12345);
      expect(typeof body.fid).toBe('number');
    });

    it('handles large FID values', async () => {
      mockVerifyJwt.mockResolvedValue({ sub: '999999999' });
      mockGetUserByFid.mockResolvedValue({
        username: 'bigfid',
        display_name: 'Big FID',
        pfp_url: '',
      });
      mockCheckAllowlist.mockResolvedValue({ allowed: true });
      mockSaveSession.mockResolvedValue(undefined);

      const req = makeRequest('/api/miniapp/auth', {
        method: 'GET',
        headers: { Authorization: 'Bearer token' },
      });
      const res = await GET(req);

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.fid).toBe(999999999);
    });

    it('handles profile with special characters', async () => {
      mockVerifyJwt.mockResolvedValue({ sub: '850' });
      mockGetUserByFid.mockResolvedValue({
        username: 'user_with_emoji_🚀',
        display_name: 'Дисплей Имя',
        pfp_url: 'https://example.com/pfp?size=256&fmt=png',
      });
      mockCheckAllowlist.mockResolvedValue({ allowed: true });
      mockSaveSession.mockResolvedValue(undefined);

      const req = makeRequest('/api/miniapp/auth', {
        method: 'GET',
        headers: { Authorization: 'Bearer token' },
      });
      const res = await GET(req);

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.username).toBe('user_with_emoji_🚀');
      expect(body.displayName).toBe('Дисплей Имя');
      expect(body.pfpUrl).toBe('https://example.com/pfp?size=256&fmt=png');
    });
  });
});
