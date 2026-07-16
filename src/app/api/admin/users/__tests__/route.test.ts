import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  chainMock,
  makeGetRequest,
  makePostRequest,
  mockAdminSession,
  mockAuthenticatedSession,
  mockUnauthenticatedSession,
  VALID_UUID,
  VALID_WALLET,
} from '@/test-utils/api-helpers';

const { mockGetSessionData, mockFrom } = vi.hoisted(() => ({
  mockGetSessionData: vi.fn(),
  mockFrom: vi.fn(),
}));

const { mockGetClientIp, mockLogAuditEvent } = vi.hoisted(() => ({
  mockGetClientIp: vi.fn(),
  mockLogAuditEvent: vi.fn(),
}));

const { mockSearchUsers, mockGetUserByFid, mockGetUserByAddress } = vi.hoisted(() => ({
  mockSearchUsers: vi.fn(),
  mockGetUserByFid: vi.fn(),
  mockGetUserByAddress: vi.fn(),
}));

vi.mock('@/lib/auth/session', () => ({
  getSessionData: () => mockGetSessionData(),
}));

vi.mock('@/lib/db/supabase', () => ({
  supabaseAdmin: { from: mockFrom },
}));

vi.mock('@/lib/db/audit-log', () => ({
  getClientIp: mockGetClientIp,
  logAuditEvent: mockLogAuditEvent,
}));

vi.mock('@/lib/farcaster/neynar', () => ({
  searchUsers: mockSearchUsers,
  getUserByFid: mockGetUserByFid,
  getUserByAddress: mockGetUserByAddress,
}));

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

import { DELETE, GET, PATCH, POST } from '../route';

// ============================================================================
// GET /api/admin/users
// ============================================================================

describe('GET /api/admin/users', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSessionData.mockResolvedValue(mockAdminSession({ fid: 123 }));
  });

  describe('authentication', () => {
    it('returns 401 when unauthenticated', async () => {
      mockGetSessionData.mockResolvedValue(mockUnauthenticatedSession());

      const res = await GET(makeGetRequest('/api/admin/users'));
      const body = await res.json();

      expect(res.status).toBe(401);
      expect(body.error).toBe('Unauthorized');
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it('returns 403 when authenticated but not admin', async () => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 456, isAdmin: false }));

      const res = await GET(makeGetRequest('/api/admin/users'));
      const body = await res.json();

      expect(res.status).toBe(403);
      expect(body.error).toBe('Admin access required');
      expect(mockFrom).not.toHaveBeenCalled();
    });
  });

  describe('query parameter validation', () => {
    it('accepts empty query (returns all active users with defaults)', async () => {
      const chain = chainMock({ data: [], error: null, count: 0 }).chain;
      mockFrom.mockReturnValue(chain);

      const res = await GET(makeGetRequest('/api/admin/users'));
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.limit).toBe(200);
      expect(body.offset).toBe(0);
      expect(mockFrom).toHaveBeenCalledWith('users');
    });

    it('validates role enum parameter', async () => {
      const chain = chainMock({ data: [], error: null, count: 0 }).chain;
      mockFrom.mockReturnValue(chain);

      const res = await GET(makeGetRequest('/api/admin/users', { role: 'admin' }));
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(chain.eq).toHaveBeenCalledWith('role', 'admin');
    });

    it('rejects invalid role enum', async () => {
      const res = await GET(makeGetRequest('/api/admin/users', { role: 'invalid' }));
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid query parameters');
      expect(body.details).toBeDefined();
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it('accepts role member', async () => {
      const chain = chainMock({ data: [], error: null, count: 0 }).chain;
      mockFrom.mockReturnValue(chain);

      const res = await GET(makeGetRequest('/api/admin/users', { role: 'member' }));
      expect(res.status).toBe(200);
      expect(chain.eq).toHaveBeenCalledWith('role', 'member');
    });

    it('accepts role beta', async () => {
      const chain = chainMock({ data: [], error: null, count: 0 }).chain;
      mockFrom.mockReturnValue(chain);

      const res = await GET(makeGetRequest('/api/admin/users', { role: 'beta' }));
      expect(res.status).toBe(200);
      expect(chain.eq).toHaveBeenCalledWith('role', 'beta');
    });

    it('accepts role moderator', async () => {
      const chain = chainMock({ data: [], error: null, count: 0 }).chain;
      mockFrom.mockReturnValue(chain);

      const res = await GET(makeGetRequest('/api/admin/users', { role: 'moderator' }));
      expect(res.status).toBe(200);
      expect(chain.eq).toHaveBeenCalledWith('role', 'moderator');
    });

    it('rejects q param over 100 characters', async () => {
      const longQ = 'a'.repeat(101);
      const res = await GET(makeGetRequest('/api/admin/users', { q: longQ }));
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid query parameters');
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it('accepts q param with exactly 100 characters', async () => {
      const maxQ = 'a'.repeat(100);
      const chain = chainMock({ data: [], error: null, count: 0 }).chain;
      mockFrom.mockReturnValue(chain);

      const res = await GET(makeGetRequest('/api/admin/users', { q: maxQ }));
      expect(res.status).toBe(200);
    });

    it('coerces limit to integer', async () => {
      const chain = chainMock({ data: [], error: null, count: 0 }).chain;
      mockFrom.mockReturnValue(chain);

      const res = await GET(makeGetRequest('/api/admin/users', { limit: '50' }));
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.limit).toBe(50);
    });

    it('enforces limit min 1', async () => {
      const res = await GET(makeGetRequest('/api/admin/users', { limit: '0' }));
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid query parameters');
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it('enforces limit max 500', async () => {
      const res = await GET(makeGetRequest('/api/admin/users', { limit: '501' }));
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid query parameters');
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it('accepts limit 500', async () => {
      const chain = chainMock({ data: [], error: null, count: 0 }).chain;
      mockFrom.mockReturnValue(chain);

      const res = await GET(makeGetRequest('/api/admin/users', { limit: '500' }));
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.limit).toBe(500);
    });

    it('coerces offset to integer', async () => {
      const chain = chainMock({ data: [], error: null, count: 0 }).chain;
      mockFrom.mockReturnValue(chain);

      const res = await GET(makeGetRequest('/api/admin/users', { offset: '100' }));
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.offset).toBe(100);
    });

    it('enforces offset min 0', async () => {
      const res = await GET(makeGetRequest('/api/admin/users', { offset: '-1' }));
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid query parameters');
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it('accepts offset 0', async () => {
      const chain = chainMock({ data: [], error: null, count: 0 }).chain;
      mockFrom.mockReturnValue(chain);

      const res = await GET(makeGetRequest('/api/admin/users', { offset: '0' }));
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.offset).toBe(0);
    });
  });

  describe('Supabase query', () => {
    it('filters by is_active = true', async () => {
      const chain = chainMock({ data: [], error: null, count: 0 }).chain;
      mockFrom.mockReturnValue(chain);

      await GET(makeGetRequest('/api/admin/users'));

      expect(chain.eq).toHaveBeenCalledWith('is_active', true);
    });

    it('orders by created_at descending', async () => {
      const chain = chainMock({ data: [], error: null, count: 0 }).chain;
      mockFrom.mockReturnValue(chain);

      await GET(makeGetRequest('/api/admin/users'));

      expect(chain.order).toHaveBeenCalledWith('created_at', { ascending: false });
    });

    it('applies pagination range with correct limit and offset', async () => {
      const chain = chainMock({ data: [], error: null, count: 0 }).chain;
      mockFrom.mockReturnValue(chain);

      await GET(makeGetRequest('/api/admin/users', { limit: '50', offset: '100' }));

      // range(offset, offset + limit - 1)
      expect(chain.range).toHaveBeenCalledWith(100, 149);
    });

    it('applies role filter when provided', async () => {
      const chain = chainMock({ data: [], error: null, count: 0 }).chain;
      mockFrom.mockReturnValue(chain);

      await GET(makeGetRequest('/api/admin/users', { role: 'admin' }));

      expect(chain.eq).toHaveBeenCalledWith('role', 'admin');
    });

    it('applies or search filter with safe wildcards', async () => {
      const chain = chainMock({ data: [], error: null, count: 0 }).chain;
      mockFrom.mockReturnValue(chain);

      await GET(makeGetRequest('/api/admin/users', { q: 'test' }));

      const orCall = vi.mocked(chain.or).mock.calls[0] as unknown[];
      expect(typeof orCall[0]).toBe('string');
      expect((orCall[0] as string).includes('test')).toBe(true);
    });

    it('escapes special characters in search query', async () => {
      const chain = chainMock({ data: [], error: null, count: 0 }).chain;
      mockFrom.mockReturnValue(chain);

      await GET(makeGetRequest('/api/admin/users', { q: 'user%test_value\\char' }));

      const orCall = vi.mocked(chain.or).mock.calls[0] as unknown[];
      const query = orCall[0] as string;
      // The route escapes % to \%, _ to \_, \ to \\, so the safe string becomes: user\%test\_value\\char
      expect(query).toContain('user\\%test\\_value\\\\char');
    });

    it('removes invalid search characters', async () => {
      const chain = chainMock({ data: [], error: null, count: 0 }).chain;
      mockFrom.mockReturnValue(chain);

      // The route removes invalid chars like ,().*'", leaving only the safe text
      await GET(makeGetRequest('/api/admin/users', { q: 'test,().*\'"user' }));

      const orCall = vi.mocked(chain.or).mock.calls[0] as unknown[];
      const query = orCall[0] as string;
      // After removing invalid chars, 'testuser' remains and is used in the or query
      // Note: The or query itself uses commas as separator between conditions
      expect(query).toContain('testuser');
      // The query string will have commas between field conditions, but not from the input
      expect(query).toContain('display_name.ilike');
      expect(query).toContain('username.ilike');
    });

    it('skips or filter when safe search string becomes empty', async () => {
      const chain = chainMock({ data: [], error: null, count: 0 }).chain;
      mockFrom.mockReturnValue(chain);

      // Query with only chars that get removed: ,().*'"
      await GET(makeGetRequest('/api/admin/users', { q: ',().*\'"' }));

      // Since all chars are removed, safe is empty string, so or() is not called
      expect(chain.or).not.toHaveBeenCalled();
    });
  });

  describe('response format', () => {
    it('returns users array with total and pagination', async () => {
      const userData = [
        { id: VALID_UUID, username: 'user1', role: 'member', is_active: true },
        { id: VALID_UUID, username: 'user2', role: 'admin', is_active: true },
      ];
      const chain = chainMock({ data: userData, error: null, count: 5 }).chain;
      mockFrom.mockReturnValue(chain);

      const res = await GET(makeGetRequest('/api/admin/users'));
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.users).toEqual(userData);
      expect(body.total).toBe(5);
      expect(body.limit).toBe(200);
      expect(body.offset).toBe(0);
    });

    it('returns user count when provided', async () => {
      const chain = chainMock({ data: [], error: null, count: 42 }).chain;
      mockFrom.mockReturnValue(chain);

      const res = await GET(makeGetRequest('/api/admin/users'));
      const body = await res.json();

      expect(body.total).toBe(42);
    });

    it('returns data length as total when count is undefined', async () => {
      const userData = [{ id: VALID_UUID }];
      const chain = chainMock({ data: userData, error: null, count: undefined }).chain;
      mockFrom.mockReturnValue(chain);

      const res = await GET(makeGetRequest('/api/admin/users'));
      const body = await res.json();

      expect(body.total).toBe(1);
    });
  });

  describe('error handling', () => {
    it('returns 500 on Supabase query error', async () => {
      const dbError = new Error('Connection failed');
      const chain = chainMock({ data: null, error: dbError }).chain;
      mockFrom.mockReturnValue(chain);

      const res = await GET(makeGetRequest('/api/admin/users'));
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body.error).toBe('Failed to fetch users');
    });

    it('logs error to logger when query fails', async () => {
      const { logger } = await import('@/lib/logger');
      const dbError = new Error('Query error');
      const chain = chainMock({ data: null, error: dbError }).chain;
      mockFrom.mockReturnValue(chain);

      await GET(makeGetRequest('/api/admin/users'));

      expect(vi.mocked(logger.error)).toHaveBeenCalledWith(
        'Failed to fetch users:',
        expect.any(Error),
      );
    });
  });
});

// ============================================================================
// POST /api/admin/users
// ============================================================================

describe('POST /api/admin/users', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSessionData.mockResolvedValue(mockAdminSession({ fid: 123 }));
    mockGetClientIp.mockReturnValue('192.168.1.1');
  });

  describe('authentication', () => {
    it('returns 401 when unauthenticated', async () => {
      mockGetSessionData.mockResolvedValue(mockUnauthenticatedSession());

      const res = await POST(makePostRequest('/api/admin/users', { fid: 100 }));
      const body = await res.json();

      expect(res.status).toBe(401);
      expect(body.error).toBe('Unauthorized');
      expect(mockFrom).not.toHaveBeenCalled();
      expect(mockLogAuditEvent).not.toHaveBeenCalled();
    });

    it('returns 403 when authenticated but not admin', async () => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 456, isAdmin: false }));

      const res = await POST(makePostRequest('/api/admin/users', { fid: 100 }));
      const body = await res.json();

      expect(res.status).toBe(403);
      expect(body.error).toBe('Admin access required');
      expect(mockFrom).not.toHaveBeenCalled();
      expect(mockLogAuditEvent).not.toHaveBeenCalled();
    });
  });

  describe('input validation', () => {
    it('returns 400 when fid is not provided and no other identifier', async () => {
      const res = await POST(makePostRequest('/api/admin/users', {}));
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toMatch(/Invalid input|Wallet address.*required/);
    });

    it('accepts fid as positive integer', async () => {
      mockSearchUsers.mockResolvedValue({ result: { users: [] } });
      const chain = chainMock({ data: { id: VALID_UUID }, error: null }).chain;
      mockFrom.mockReturnValue(chain);

      const res = await POST(makePostRequest('/api/admin/users', { fid: 100 }));
      expect(res.status).not.toBe(400);
    });

    it('rejects fid = 0', async () => {
      const res = await POST(makePostRequest('/api/admin/users', { fid: 0 }));
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid input');
    });

    it('rejects negative fid', async () => {
      const res = await POST(makePostRequest('/api/admin/users', { fid: -1 }));
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid input');
    });

    it('accepts primary_wallet with valid format', async () => {
      mockGetUserByAddress.mockResolvedValue(null);
      const chain = chainMock({ data: { id: VALID_UUID }, error: null }).chain;
      mockFrom.mockReturnValue(chain);

      const res = await POST(makePostRequest('/api/admin/users', { primary_wallet: VALID_WALLET }));
      expect(res.status).not.toBe(400);
    });

    it('rejects primary_wallet with invalid format', async () => {
      const res = await POST(
        makePostRequest('/api/admin/users', { primary_wallet: 'not-an-address' }),
      );
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid input');
    });

    it('rejects primary_wallet without 0x prefix', async () => {
      const res = await POST(
        makePostRequest('/api/admin/users', {
          primary_wallet: '1234567890abcdef1234567890abcdef12345678',
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(400);
    });

    it('accepts role enum', async () => {
      mockGetUserByAddress.mockResolvedValue(null);
      const chain = chainMock({ data: { id: VALID_UUID }, error: null }).chain;
      mockFrom.mockReturnValue(chain);

      const res = await POST(
        makePostRequest('/api/admin/users', {
          primary_wallet: VALID_WALLET,
          role: 'admin',
        }),
      );
      expect(res.status).not.toBe(400);
    });

    it('rejects invalid role', async () => {
      const res = await POST(
        makePostRequest('/api/admin/users', {
          fid: 100,
          role: 'invalid_role',
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid input');
    });

    it('accepts optional real_name up to 200 chars', async () => {
      mockGetUserByFid.mockResolvedValue(null);
      const chain = chainMock({ data: { id: VALID_UUID }, error: null }).chain;
      mockFrom.mockReturnValue(chain);

      const res = await POST(
        makePostRequest('/api/admin/users', {
          fid: 100,
          real_name: 'John Doe Smith',
        }),
      );
      expect(res.status).not.toBe(400);
    });

    it('rejects real_name over 200 chars', async () => {
      const res = await POST(
        makePostRequest('/api/admin/users', {
          fid: 100,
          real_name: 'a'.repeat(201),
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid input');
    });

    it('accepts optional ign up to 100 chars', async () => {
      mockGetUserByFid.mockResolvedValue(null);
      const chain = chainMock({ data: { id: VALID_UUID }, error: null }).chain;
      mockFrom.mockReturnValue(chain);

      const res = await POST(
        makePostRequest('/api/admin/users', {
          fid: 100,
          ign: 'player123',
        }),
      );
      expect(res.status).not.toBe(400);
    });

    it('rejects ign over 100 chars', async () => {
      const res = await POST(
        makePostRequest('/api/admin/users', {
          fid: 100,
          ign: 'a'.repeat(101),
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid input');
    });

    it('accepts optional notes up to 1000 chars', async () => {
      mockGetUserByFid.mockResolvedValue(null);
      const chain = chainMock({ data: { id: VALID_UUID }, error: null }).chain;
      mockFrom.mockReturnValue(chain);

      const res = await POST(
        makePostRequest('/api/admin/users', {
          fid: 100,
          notes: 'a'.repeat(1000),
        }),
      );
      expect(res.status).not.toBe(400);
    });

    it('rejects notes over 1000 chars', async () => {
      const res = await POST(
        makePostRequest('/api/admin/users', {
          fid: 100,
          notes: 'a'.repeat(1001),
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid input');
    });
  });

  describe('username resolution', () => {
    it('resolves username to FID via searchUsers', async () => {
      mockSearchUsers.mockResolvedValue({
        result: {
          users: [{ fid: 999, username: 'testuser' }],
        },
      });
      mockGetUserByAddress.mockResolvedValue(null);
      const chain = chainMock({ data: { id: VALID_UUID }, error: null }).chain;
      mockFrom.mockReturnValue(chain);

      await POST(makePostRequest('/api/admin/users', { username: 'testuser' }));

      expect(mockSearchUsers).toHaveBeenCalledWith('testuser', 1);
      expect(chain.insert).toHaveBeenCalled();
    });

    it('matches exact username case-insensitive', async () => {
      mockSearchUsers.mockResolvedValue({
        result: {
          users: [
            { fid: 888, username: 'OtherUser' },
            { fid: 999, username: 'TestUser' },
          ],
        },
      });
      mockGetUserByFid.mockResolvedValue({
        fid: 999,
        username: 'TestUser',
        display_name: 'Test User',
        custody_address: VALID_WALLET,
        verified_addresses: { eth_addresses: [] },
      });
      const chain = chainMock({ data: { id: VALID_UUID }, error: null }).chain;
      mockFrom.mockReturnValue(chain);

      await POST(makePostRequest('/api/admin/users', { username: 'testuser' }));

      const insertCall = vi.mocked(chain.insert).mock.calls[0];
      const payload = insertCall[0] as Record<string, unknown>;
      expect(payload.fid).toBe(999);
    });

    it('uses first result if no exact match', async () => {
      mockSearchUsers.mockResolvedValue({
        result: {
          users: [{ fid: 111, username: 'closest_match' }],
        },
      });
      mockGetUserByFid.mockResolvedValue({
        fid: 111,
        username: 'closest_match',
        display_name: 'Closest Match',
        custody_address: VALID_WALLET,
        verified_addresses: { eth_addresses: [] },
      });
      const chain = chainMock({ data: { id: VALID_UUID }, error: null }).chain;
      mockFrom.mockReturnValue(chain);

      await POST(makePostRequest('/api/admin/users', { username: 'nomatch' }));

      const insertCall = vi.mocked(chain.insert).mock.calls[0];
      const payload = insertCall[0] as Record<string, unknown>;
      expect(payload.fid).toBe(111);
    });

    it('returns 404 if no Farcaster user found for username', async () => {
      mockSearchUsers.mockResolvedValue({ result: { users: [] } });

      const res = await POST(makePostRequest('/api/admin/users', { username: 'nonexistent' }));
      const body = await res.json();

      expect(res.status).toBe(404);
      expect(body.error).toContain('No Farcaster user found');
    });

    it('returns 500 if username lookup fails', async () => {
      mockSearchUsers.mockRejectedValue(new Error('API error'));

      const res = await POST(makePostRequest('/api/admin/users', { username: 'user' }));
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body.error).toContain('Failed to look up username');
    });

    it('strips @ prefix from username', async () => {
      mockSearchUsers.mockResolvedValue({
        result: {
          users: [{ fid: 999, username: 'testuser' }],
        },
      });
      const chain = chainMock({ data: { id: VALID_UUID }, error: null }).chain;
      mockFrom.mockReturnValue(chain);

      await POST(makePostRequest('/api/admin/users', { username: '@testuser' }));

      expect(mockSearchUsers).toHaveBeenCalledWith('testuser', 1);
    });
  });

  describe('Farcaster profile enrichment', () => {
    it('fetches Farcaster profile when FID provided', async () => {
      mockGetUserByFid.mockResolvedValue({
        fid: 100,
        username: 'fcuser',
        display_name: 'FC User',
        pfp_url: 'https://example.com/pfp.jpg',
        custody_address: VALID_WALLET,
        verified_addresses: { eth_addresses: ['0xaddr1'] },
        profile: { bio: { text: 'My bio' } },
      });
      const chain = chainMock({ data: { id: VALID_UUID }, error: null }).chain;
      mockFrom.mockReturnValue(chain);

      await POST(makePostRequest('/api/admin/users', { fid: 100 }));

      expect(mockGetUserByFid).toHaveBeenCalledWith(100);
      const insertCall = vi.mocked(chain.insert).mock.calls[0];
      const payload = insertCall[0] as Record<string, unknown>;
      expect(payload.username).toBe('fcuser');
      expect(payload.display_name).toBe('FC User');
      expect(payload.bio).toBe('My bio');
    });

    it('extracts verified addresses from Farcaster profile', async () => {
      const verifiedAddrs = ['0xaddr1', '0xaddr2'];
      mockGetUserByFid.mockResolvedValue({
        fid: 100,
        username: 'user',
        display_name: 'User',
        custody_address: VALID_WALLET,
        verified_addresses: { eth_addresses: verifiedAddrs },
      });
      const chain = chainMock({ data: { id: VALID_UUID }, error: null }).chain;
      mockFrom.mockReturnValue(chain);

      await POST(makePostRequest('/api/admin/users', { fid: 100 }));

      const insertCall = vi.mocked(chain.insert).mock.calls[0];
      const payload = insertCall[0] as Record<string, unknown>;
      expect(payload.verified_addresses).toEqual(verifiedAddrs);
    });

    it('resolves wallet from custody_address', async () => {
      mockGetUserByFid.mockResolvedValue({
        fid: 100,
        custody_address: VALID_WALLET,
        verified_addresses: { eth_addresses: [] },
      });
      const chain = chainMock({ data: { id: VALID_UUID }, error: null }).chain;
      mockFrom.mockReturnValue(chain);

      await POST(makePostRequest('/api/admin/users', { fid: 100 }));

      const insertCall = vi.mocked(chain.insert).mock.calls[0];
      const payload = insertCall[0] as Record<string, unknown>;
      expect(payload.primary_wallet).toBe(VALID_WALLET.toLowerCase());
    });

    it('resolves wallet from first verified address if no custody_address', async () => {
      mockGetUserByFid.mockResolvedValue({
        fid: 100,
        custody_address: null,
        verified_addresses: { eth_addresses: ['0xaddr1', '0xaddr2'] },
      });
      const chain = chainMock({ data: { id: VALID_UUID }, error: null }).chain;
      mockFrom.mockReturnValue(chain);

      await POST(makePostRequest('/api/admin/users', { fid: 100 }));

      const insertCall = vi.mocked(chain.insert).mock.calls[0];
      const payload = insertCall[0] as Record<string, unknown>;
      expect(payload.primary_wallet).toBe('0xaddr1');
    });

    it('uses fid placeholder wallet if no addresses available', async () => {
      mockGetUserByFid.mockResolvedValue({
        fid: 100,
        custody_address: null,
        verified_addresses: { eth_addresses: [] },
      });
      const chain = chainMock({ data: { id: VALID_UUID }, error: null }).chain;
      mockFrom.mockReturnValue(chain);

      await POST(makePostRequest('/api/admin/users', { fid: 100 }));

      const insertCall = vi.mocked(chain.insert).mock.calls[0];
      const payload = insertCall[0] as Record<string, unknown>;
      expect(payload.primary_wallet).toBe('fid:100');
    });

    it('continues if Farcaster profile fetch fails', async () => {
      mockGetUserByFid.mockRejectedValue(new Error('FC error'));
      const chain = chainMock({ data: { id: VALID_UUID }, error: null }).chain;
      mockFrom.mockReturnValue(chain);

      const res = await POST(makePostRequest('/api/admin/users', { fid: 100 }));

      expect(res.status).not.toBe(500);
      const insertCall = vi.mocked(chain.insert).mock.calls[0];
      const payload = insertCall[0] as Record<string, unknown>;
      expect(payload.fid).toBe(100);
      expect(payload.primary_wallet).toBe('fid:100');
    });
  });

  describe('wallet-based FID resolution', () => {
    it('resolves FID from wallet via getUserByAddress', async () => {
      mockGetUserByAddress.mockResolvedValue({
        fid: 555,
        username: 'walletuser',
        display_name: 'Wallet User',
        custody_address: VALID_WALLET,
        verified_addresses: { eth_addresses: [] },
      });
      const chain = chainMock({ data: { id: VALID_UUID }, error: null }).chain;
      mockFrom.mockReturnValue(chain);

      await POST(makePostRequest('/api/admin/users', { primary_wallet: VALID_WALLET }));

      expect(mockGetUserByAddress).toHaveBeenCalledWith(VALID_WALLET);
      const insertCall = vi.mocked(chain.insert).mock.calls[0];
      const payload = insertCall[0] as Record<string, unknown>;
      expect(payload.fid).toBe(555);
      expect(payload.role).toBe('member');
    });

    it('sets role to member when FID resolved from wallet', async () => {
      mockGetUserByAddress.mockResolvedValue({
        fid: 555,
        display_name: 'User',
        custody_address: VALID_WALLET,
        verified_addresses: { eth_addresses: [] },
      });
      const chain = chainMock({ data: { id: VALID_UUID }, error: null }).chain;
      mockFrom.mockReturnValue(chain);

      await POST(makePostRequest('/api/admin/users', { primary_wallet: VALID_WALLET }));

      const insertCall = vi.mocked(chain.insert).mock.calls[0];
      const payload = insertCall[0] as Record<string, unknown>;
      expect(payload.role).toBe('member');
    });

    it('does not resolve wallet FID if wallet-FID lookup fails', async () => {
      mockGetUserByAddress.mockRejectedValue(new Error('Lookup error'));
      const chain = chainMock({ data: { id: VALID_UUID }, error: null }).chain;
      mockFrom.mockReturnValue(chain);

      const res = await POST(makePostRequest('/api/admin/users', { primary_wallet: VALID_WALLET }));

      expect(res.status).not.toBe(500);
      const insertCall = vi.mocked(chain.insert).mock.calls[0];
      const payload = insertCall[0] as Record<string, unknown>;
      expect(payload.primary_wallet).toBe(VALID_WALLET.toLowerCase());
      expect(payload.fid).toBeUndefined();
      expect(payload.role).toBe('beta');
    });
  });

  describe('default role assignment', () => {
    it('defaults to member when FID provided', async () => {
      mockGetUserByFid.mockResolvedValue(null);
      const chain = chainMock({ data: { id: VALID_UUID }, error: null }).chain;
      mockFrom.mockReturnValue(chain);

      await POST(makePostRequest('/api/admin/users', { fid: 100 }));

      const insertCall = vi.mocked(chain.insert).mock.calls[0];
      const payload = insertCall[0] as Record<string, unknown>;
      expect(payload.role).toBe('member');
    });

    it('defaults to beta when only wallet provided', async () => {
      mockGetUserByAddress.mockResolvedValue(null);
      const chain = chainMock({ data: { id: VALID_UUID }, error: null }).chain;
      mockFrom.mockReturnValue(chain);

      await POST(makePostRequest('/api/admin/users', { primary_wallet: VALID_WALLET }));

      const insertCall = vi.mocked(chain.insert).mock.calls[0];
      const payload = insertCall[0] as Record<string, unknown>;
      expect(payload.role).toBe('beta');
    });

    it('respects explicit role override', async () => {
      mockGetUserByFid.mockResolvedValue(null);
      const chain = chainMock({ data: { id: VALID_UUID }, error: null }).chain;
      mockFrom.mockReturnValue(chain);

      await POST(
        makePostRequest('/api/admin/users', {
          fid: 100,
          role: 'admin',
        }),
      );

      const insertCall = vi.mocked(chain.insert).mock.calls[0];
      const payload = insertCall[0] as Record<string, unknown>;
      expect(payload.role).toBe('admin');
    });
  });

  describe('display_name fallback', () => {
    it('uses provided display_name if available', async () => {
      mockGetUserByAddress.mockResolvedValue(null);
      const chain = chainMock({ data: { id: VALID_UUID }, error: null }).chain;
      mockFrom.mockReturnValue(chain);

      await POST(
        makePostRequest('/api/admin/users', {
          primary_wallet: VALID_WALLET,
          real_name: 'Real Name Display',
        }),
      );

      const insertCall = vi.mocked(chain.insert).mock.calls[0];
      const payload = insertCall[0] as Record<string, unknown>;
      expect(payload.display_name).toBe('Real Name Display');
    });

    it('falls back to ign if real_name is not set', async () => {
      mockGetUserByAddress.mockResolvedValue(null);
      const chain = chainMock({ data: { id: VALID_UUID }, error: null }).chain;
      mockFrom.mockReturnValue(chain);

      await POST(
        makePostRequest('/api/admin/users', {
          primary_wallet: VALID_WALLET,
          ign: 'player123',
        }),
      );

      const insertCall = vi.mocked(chain.insert).mock.calls[0];
      const payload = insertCall[0] as Record<string, unknown>;
      expect(payload.display_name).toBe('player123');
    });

    it('uses wallet slice fallback if no real_name or ign', async () => {
      mockGetUserByAddress.mockResolvedValue(null);
      const chain = chainMock({ data: { id: VALID_UUID }, error: null }).chain;
      mockFrom.mockReturnValue(chain);

      await POST(makePostRequest('/api/admin/users', { primary_wallet: VALID_WALLET }));

      const insertCall = vi.mocked(chain.insert).mock.calls[0];
      const payload = insertCall[0] as Record<string, unknown>;
      const expected = VALID_WALLET.slice(0, 6) + '...' + VALID_WALLET.slice(-4);
      expect(payload.display_name).toBe(expected);
    });
  });

  describe('error handling', () => {
    it('returns 400 when neither wallet nor FID can be resolved', async () => {
      const res = await POST(makePostRequest('/api/admin/users', {}));
      const body = await res.json();

      expect(res.status).toBe(400);
    });

    it('returns 409 on unique constraint violation', async () => {
      mockGetUserByAddress.mockResolvedValue(null);
      const chain = chainMock({ error: { code: '23505' } }).chain;
      mockFrom.mockReturnValue(chain);

      const res = await POST(makePostRequest('/api/admin/users', { primary_wallet: VALID_WALLET }));
      const body = await res.json();

      expect(res.status).toBe(409);
      expect(body.error).toBe('User already exists');
      expect(mockLogAuditEvent).not.toHaveBeenCalled();
    });

    it('returns 500 on other database errors', async () => {
      mockGetUserByAddress.mockResolvedValue(null);
      const chain = chainMock({ error: new Error('DB error') }).chain;
      mockFrom.mockReturnValue(chain);

      const res = await POST(makePostRequest('/api/admin/users', { primary_wallet: VALID_WALLET }));
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body.error).toBe('Failed to create user');
      expect(mockLogAuditEvent).not.toHaveBeenCalled();
    });

    it('logs error when creation fails', async () => {
      const { logger } = await import('@/lib/logger');
      mockGetUserByAddress.mockResolvedValue(null);
      const chain = chainMock({ error: new Error('Insert failed') }).chain;
      mockFrom.mockReturnValue(chain);

      await POST(makePostRequest('/api/admin/users', { primary_wallet: VALID_WALLET }));

      expect(vi.mocked(logger.error)).toHaveBeenCalledWith('Create user error:', expect.any(Error));
    });
  });

  describe('audit logging', () => {
    it('logs audit event on successful creation', async () => {
      mockGetUserByFid.mockResolvedValue({
        fid: 999,
        custody_address: VALID_WALLET,
        verified_addresses: { eth_addresses: [] },
      });
      const chain = chainMock({ data: { id: VALID_UUID }, error: null }).chain;
      mockFrom.mockReturnValue(chain);

      await POST(
        makePostRequest('/api/admin/users', {
          primary_wallet: VALID_WALLET,
          fid: 999,
          role: 'admin',
        }),
      );

      expect(mockLogAuditEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          actorFid: 123,
          action: 'user.create',
          targetType: 'user',
          targetId: VALID_UUID,
          details: expect.objectContaining({
            wallet: VALID_WALLET.toLowerCase(),
            fid: 999,
            role: 'admin',
          }),
          ipAddress: '192.168.1.1',
        }),
      );
    });

    it('does not log audit event on creation failure', async () => {
      mockGetUserByAddress.mockResolvedValue(null);
      const chain = chainMock({ error: { code: '23505' } }).chain;
      mockFrom.mockReturnValue(chain);

      await POST(makePostRequest('/api/admin/users', { primary_wallet: VALID_WALLET }));

      expect(mockLogAuditEvent).not.toHaveBeenCalled();
    });

    it('includes getClientIp call with request', async () => {
      mockGetUserByAddress.mockResolvedValue(null);
      const chain = chainMock({ data: { id: VALID_UUID }, error: null }).chain;
      mockFrom.mockReturnValue(chain);

      const req = makePostRequest('/api/admin/users', { primary_wallet: VALID_WALLET });
      await POST(req);

      expect(mockGetClientIp).toHaveBeenCalledWith(req);
    });
  });

  describe('success response', () => {
    it('returns 200 with user data on success', async () => {
      mockGetUserByAddress.mockResolvedValue(null);
      const userData = { id: VALID_UUID, primary_wallet: VALID_WALLET, role: 'beta' };
      const chain = chainMock({ data: userData, error: null }).chain;
      mockFrom.mockReturnValue(chain);

      const res = await POST(makePostRequest('/api/admin/users', { primary_wallet: VALID_WALLET }));
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.user).toEqual(userData);
    });
  });
});

// ============================================================================
// PATCH /api/admin/users
// ============================================================================

describe('PATCH /api/admin/users', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSessionData.mockResolvedValue(mockAdminSession({ fid: 123 }));
    mockGetClientIp.mockReturnValue('192.168.1.1');
  });

  describe('authentication', () => {
    it('returns 401 when unauthenticated', async () => {
      mockGetSessionData.mockResolvedValue(mockUnauthenticatedSession());

      const res = await PATCH(makePostRequest('/api/admin/users', { id: VALID_UUID }));
      const body = await res.json();

      expect(res.status).toBe(401);
      expect(body.error).toBe('Unauthorized');
      expect(mockFrom).not.toHaveBeenCalled();
      expect(mockLogAuditEvent).not.toHaveBeenCalled();
    });

    it('returns 403 when authenticated but not admin', async () => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 456, isAdmin: false }));

      const res = await PATCH(makePostRequest('/api/admin/users', { id: VALID_UUID }));
      const body = await res.json();

      expect(res.status).toBe(403);
      expect(body.error).toBe('Admin access required');
      expect(mockFrom).not.toHaveBeenCalled();
      expect(mockLogAuditEvent).not.toHaveBeenCalled();
    });
  });

  describe('input validation', () => {
    it('requires id field', async () => {
      const res = await PATCH(makePostRequest('/api/admin/users', {}));
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid input');
    });

    it('validates id as UUID', async () => {
      const res = await PATCH(makePostRequest('/api/admin/users', { id: 'not-a-uuid' }));
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid input');
    });

    it('accepts valid UUID id', async () => {
      const chain = chainMock({ data: { id: VALID_UUID }, error: null }).chain;
      mockFrom.mockReturnValue(chain);

      const res = await PATCH(makePostRequest('/api/admin/users', { id: VALID_UUID }));
      expect(res.status).not.toBe(400);
    });

    it('validates fid as positive integer if provided', async () => {
      const res = await PATCH(
        makePostRequest('/api/admin/users', {
          id: VALID_UUID,
          fid: 0,
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid input');
    });

    it('allows fid to be null', async () => {
      const chain = chainMock({ data: { id: VALID_UUID }, error: null }).chain;
      mockFrom.mockReturnValue(chain);

      const res = await PATCH(
        makePostRequest('/api/admin/users', {
          id: VALID_UUID,
          fid: null,
        }),
      );
      expect(res.status).not.toBe(400);
    });

    it('validates primary_wallet format', async () => {
      const res = await PATCH(
        makePostRequest('/api/admin/users', {
          id: VALID_UUID,
          primary_wallet: 'invalid',
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid input');
    });

    it('validates verified_addresses as array of wallets', async () => {
      const chain = chainMock({ data: { id: VALID_UUID }, error: null }).chain;
      mockFrom.mockReturnValue(chain);

      const validWallet2 = '0x1111111111111111111111111111111111111111';
      const res = await PATCH(
        makePostRequest('/api/admin/users', {
          id: VALID_UUID,
          verified_addresses: [VALID_WALLET, validWallet2],
        }),
      );
      expect(res.status).not.toBe(400);
    });

    it('rejects verified_addresses with invalid wallet', async () => {
      const res = await PATCH(
        makePostRequest('/api/admin/users', {
          id: VALID_UUID,
          verified_addresses: ['0xinvalid'],
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid input');
    });
  });

  describe('assign_zid operation', () => {
    it('calls assign_next_zid RPC when assign_zid is true', async () => {
      const rpcChain = chainMock({ error: null }).chain;
      const selectChain = chainMock({ data: { id: VALID_UUID }, error: null }).chain;

      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount += 1;
        return callCount === 1 ? selectChain : selectChain;
      });

      // Mock rpc method on supabaseAdmin directly
      const supabaseProxy = {
        rpc: vi.fn().mockResolvedValue({ error: null }),
        from: mockFrom,
      };
      vi.mocked(mockFrom).mockReturnValue(selectChain);

      // We need to patch the module-level supabaseAdmin
      const { supabaseAdmin } = await import('@/lib/db/supabase');
      vi.mocked(supabaseAdmin).rpc = vi.fn().mockResolvedValue({ error: null });

      await PATCH(makePostRequest('/api/admin/users', { id: VALID_UUID, assign_zid: true }));

      expect(vi.mocked(supabaseAdmin).rpc).toHaveBeenCalledWith('assign_next_zid', {
        target_user_id: VALID_UUID,
      });
    });

    it('returns 500 if ZID assignment fails', async () => {
      const selectChain = chainMock({ data: { id: VALID_UUID }, error: null }).chain;
      mockFrom.mockReturnValue(selectChain);

      const { supabaseAdmin } = await import('@/lib/db/supabase');
      vi.mocked(supabaseAdmin).rpc = vi.fn().mockResolvedValue({ error: new Error('ZID error') });

      const res = await PATCH(
        makePostRequest('/api/admin/users', { id: VALID_UUID, assign_zid: true }),
      );
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body.error).toBe('Failed to assign ZID');
      expect(mockLogAuditEvent).not.toHaveBeenCalled();
    });

    it('fetches updated user after ZID assignment', async () => {
      const selectChain = chainMock({ data: { id: VALID_UUID }, error: null }).chain;
      mockFrom.mockReturnValue(selectChain);

      const { supabaseAdmin } = await import('@/lib/db/supabase');
      vi.mocked(supabaseAdmin).rpc = vi.fn().mockResolvedValue({ error: null });

      await PATCH(makePostRequest('/api/admin/users', { id: VALID_UUID, assign_zid: true }));

      expect(mockFrom).toHaveBeenCalledWith('users');
      expect(selectChain.select).toHaveBeenCalledWith('*');
      expect(selectChain.eq).toHaveBeenCalledWith('id', VALID_UUID);
    });

    it('logs audit event for ZID assignment', async () => {
      const selectChain = chainMock({ data: { id: VALID_UUID }, error: null }).chain;
      mockFrom.mockReturnValue(selectChain);

      const { supabaseAdmin } = await import('@/lib/db/supabase');
      vi.mocked(supabaseAdmin).rpc = vi.fn().mockResolvedValue({ error: null });

      await PATCH(makePostRequest('/api/admin/users', { id: VALID_UUID, assign_zid: true }));

      expect(mockLogAuditEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          actorFid: 123,
          action: 'user.assign_zid',
          targetType: 'user',
          targetId: VALID_UUID,
          ipAddress: '192.168.1.1',
        }),
      );
    });
  });

  describe('FID linking with Farcaster enrichment', () => {
    it('fetches Farcaster profile when FID is linked', async () => {
      const chain = chainMock({ data: { id: VALID_UUID }, error: null }).chain;
      mockFrom.mockReturnValue(chain);
      mockGetUserByFid.mockResolvedValue({
        fid: 555,
        username: 'fcuser',
        display_name: 'FC User',
        pfp_url: 'https://example.com/pfp.jpg',
        custody_address: VALID_WALLET,
        verified_addresses: { eth_addresses: ['0xaddr1'] },
        profile: { bio: { text: 'Bio' } },
      });

      await PATCH(makePostRequest('/api/admin/users', { id: VALID_UUID, fid: 555 }));

      expect(mockGetUserByFid).toHaveBeenCalledWith(555);
    });

    it('auto-upgrades role to member when FID linked', async () => {
      const chain = chainMock({ data: { id: VALID_UUID }, error: null }).chain;
      mockFrom.mockReturnValue(chain);
      mockGetUserByFid.mockResolvedValue({
        fid: 555,
        username: 'user',
        display_name: 'User',
        custody_address: VALID_WALLET,
        verified_addresses: { eth_addresses: [] },
      });

      await PATCH(makePostRequest('/api/admin/users', { id: VALID_UUID, fid: 555 }));

      const updateCall = vi.mocked(chain.update).mock.calls[0];
      const payload = updateCall[0] as Record<string, unknown>;
      expect(payload.role).toBe('member');
    });

    it('respects explicit role override over auto-upgrade', async () => {
      const chain = chainMock({ data: { id: VALID_UUID }, error: null }).chain;
      mockFrom.mockReturnValue(chain);
      mockGetUserByFid.mockResolvedValue({
        fid: 555,
        display_name: 'User',
        custody_address: VALID_WALLET,
        verified_addresses: { eth_addresses: [] },
      });

      await PATCH(
        makePostRequest('/api/admin/users', {
          id: VALID_UUID,
          fid: 555,
          role: 'admin',
        }),
      );

      const updateCall = vi.mocked(chain.update).mock.calls[0];
      const payload = updateCall[0] as Record<string, unknown>;
      expect(payload.role).toBe('admin');
    });

    it('continues if Farcaster profile fetch fails during FID link', async () => {
      const chain = chainMock({ data: { id: VALID_UUID }, error: null }).chain;
      mockFrom.mockReturnValue(chain);
      mockGetUserByFid.mockRejectedValue(new Error('FC error'));

      const res = await PATCH(makePostRequest('/api/admin/users', { id: VALID_UUID, fid: 555 }));

      expect(res.status).not.toBe(500);
      const updateCall = vi.mocked(chain.update).mock.calls[0];
      const payload = updateCall[0] as Record<string, unknown>;
      expect(payload.fid).toBe(555);
    });
  });

  describe('FID unlinking', () => {
    it('sets role to beta when FID is unlinked (set to null)', async () => {
      const chain = chainMock({ data: { id: VALID_UUID }, error: null }).chain;
      mockFrom.mockReturnValue(chain);

      await PATCH(makePostRequest('/api/admin/users', { id: VALID_UUID, fid: null }));

      const updateCall = vi.mocked(chain.update).mock.calls[0];
      const payload = updateCall[0] as Record<string, unknown>;
      expect(payload.role).toBe('beta');
    });

    it('respects explicit role when unlinking FID', async () => {
      const chain = chainMock({ data: { id: VALID_UUID }, error: null }).chain;
      mockFrom.mockReturnValue(chain);

      await PATCH(
        makePostRequest('/api/admin/users', {
          id: VALID_UUID,
          fid: null,
          role: 'admin',
        }),
      );

      const updateCall = vi.mocked(chain.update).mock.calls[0];
      const payload = updateCall[0] as Record<string, unknown>;
      expect(payload.role).toBe('admin');
    });
  });

  describe('update operations', () => {
    it('updates user with provided fields', async () => {
      const chain = chainMock({ data: { id: VALID_UUID }, error: null }).chain;
      mockFrom.mockReturnValue(chain);

      await PATCH(
        makePostRequest('/api/admin/users', {
          id: VALID_UUID,
          username: 'newname',
          is_active: false,
        }),
      );

      const updateCall = vi.mocked(chain.update).mock.calls[0];
      const payload = updateCall[0] as Record<string, unknown>;
      expect(payload.username).toBe('newname');
      expect(payload.is_active).toBe(false);
    });

    it('does not include id in update payload', async () => {
      const chain = chainMock({ data: { id: VALID_UUID }, error: null }).chain;
      mockFrom.mockReturnValue(chain);

      await PATCH(
        makePostRequest('/api/admin/users', {
          id: VALID_UUID,
          username: 'updated',
        }),
      );

      const updateCall = vi.mocked(chain.update).mock.calls[0];
      const payload = updateCall[0] as Record<string, unknown>;
      expect(payload.id).toBeUndefined();
    });

    it('does not include assign_zid in update payload', async () => {
      const chain = chainMock({ data: { id: VALID_UUID }, error: null }).chain;
      mockFrom.mockReturnValue(chain);

      await PATCH(
        makePostRequest('/api/admin/users', {
          id: VALID_UUID,
          assign_zid: false,
          username: 'updated',
        }),
      );

      const updateCall = vi.mocked(chain.update).mock.calls[0];
      const payload = updateCall[0] as Record<string, unknown>;
      expect(payload.assign_zid).toBeUndefined();
    });
  });

  describe('error handling', () => {
    it('returns 409 on unique constraint violation', async () => {
      const chain = chainMock({ error: { code: '23505' } }).chain;
      mockFrom.mockReturnValue(chain);

      const res = await PATCH(
        makePostRequest('/api/admin/users', {
          id: VALID_UUID,
          fid: 999,
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(409);
      expect(body.error).toContain('FID or wallet already linked');
      expect(mockLogAuditEvent).not.toHaveBeenCalled();
    });

    it('returns 500 on other database errors', async () => {
      const chain = chainMock({ error: new Error('DB error') }).chain;
      mockFrom.mockReturnValue(chain);

      const res = await PATCH(
        makePostRequest('/api/admin/users', {
          id: VALID_UUID,
          username: 'test',
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body.error).toBe('Failed to update user');
      expect(mockLogAuditEvent).not.toHaveBeenCalled();
    });

    it('logs error when update fails', async () => {
      const { logger } = await import('@/lib/logger');
      const chain = chainMock({ error: new Error('Update failed') }).chain;
      mockFrom.mockReturnValue(chain);

      await PATCH(
        makePostRequest('/api/admin/users', {
          id: VALID_UUID,
          username: 'test',
        }),
      );

      expect(vi.mocked(logger.error)).toHaveBeenCalledWith('Update user error:', expect.any(Error));
    });
  });

  describe('audit logging', () => {
    it('logs audit event on successful update', async () => {
      const chain = chainMock({ data: { id: VALID_UUID }, error: null }).chain;
      mockFrom.mockReturnValue(chain);

      await PATCH(
        makePostRequest('/api/admin/users', {
          id: VALID_UUID,
          username: 'newname',
          role: 'admin',
        }),
      );

      expect(mockLogAuditEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          actorFid: 123,
          action: 'user.update',
          targetType: 'user',
          targetId: VALID_UUID,
          details: expect.objectContaining({
            fields: expect.arrayContaining(['username', 'role']),
          }),
          ipAddress: '192.168.1.1',
        }),
      );
    });

    it('does not log audit event on update failure', async () => {
      const chain = chainMock({ error: new Error('DB error') }).chain;
      mockFrom.mockReturnValue(chain);

      await PATCH(
        makePostRequest('/api/admin/users', {
          id: VALID_UUID,
          username: 'test',
        }),
      );

      expect(mockLogAuditEvent).not.toHaveBeenCalled();
    });
  });

  describe('success response', () => {
    it('returns 200 with updated user data', async () => {
      const userData = { id: VALID_UUID, username: 'updated', role: 'admin' };
      const chain = chainMock({ data: userData, error: null }).chain;
      mockFrom.mockReturnValue(chain);

      const res = await PATCH(
        makePostRequest('/api/admin/users', {
          id: VALID_UUID,
          username: 'updated',
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.user).toEqual(userData);
    });
  });
});

// ============================================================================
// DELETE /api/admin/users
// ============================================================================

describe('DELETE /api/admin/users', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSessionData.mockResolvedValue(mockAdminSession({ fid: 123 }));
    mockGetClientIp.mockReturnValue('192.168.1.1');
  });

  describe('authentication', () => {
    it('returns 401 when unauthenticated', async () => {
      mockGetSessionData.mockResolvedValue(mockUnauthenticatedSession());

      const res = await DELETE(makePostRequest('/api/admin/users', { id: VALID_UUID }));
      const body = await res.json();

      expect(res.status).toBe(401);
      expect(body.error).toBe('Unauthorized');
      expect(mockFrom).not.toHaveBeenCalled();
      expect(mockLogAuditEvent).not.toHaveBeenCalled();
    });

    it('returns 403 when authenticated but not admin', async () => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 456, isAdmin: false }));

      const res = await DELETE(makePostRequest('/api/admin/users', { id: VALID_UUID }));
      const body = await res.json();

      expect(res.status).toBe(403);
      expect(body.error).toBe('Admin access required');
      expect(mockFrom).not.toHaveBeenCalled();
      expect(mockLogAuditEvent).not.toHaveBeenCalled();
    });
  });

  describe('input validation', () => {
    it('requires id field', async () => {
      const res = await DELETE(makePostRequest('/api/admin/users', {}));
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid input');
    });

    it('validates id as UUID', async () => {
      const res = await DELETE(makePostRequest('/api/admin/users', { id: 'invalid' }));
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid input');
    });

    it('accepts valid UUID', async () => {
      const chain = chainMock({ error: null }).chain;
      mockFrom.mockReturnValue(chain);

      const res = await DELETE(makePostRequest('/api/admin/users', { id: VALID_UUID }));
      expect(res.status).not.toBe(400);
    });
  });

  describe('deactivation operation', () => {
    it('updates is_active to false for user', async () => {
      const chain = chainMock({ error: null }).chain;
      mockFrom.mockReturnValue(chain);

      await DELETE(makePostRequest('/api/admin/users', { id: VALID_UUID }));

      expect(chain.update).toHaveBeenCalledWith({ is_active: false });
    });

    it('filters update by id', async () => {
      const chain = chainMock({ error: null }).chain;
      mockFrom.mockReturnValue(chain);

      await DELETE(makePostRequest('/api/admin/users', { id: VALID_UUID }));

      expect(chain.eq).toHaveBeenCalledWith('id', VALID_UUID);
    });
  });

  describe('error handling', () => {
    it('returns 500 on database error', async () => {
      const chain = chainMock({ error: new Error('DB error') }).chain;
      mockFrom.mockReturnValue(chain);

      const res = await DELETE(makePostRequest('/api/admin/users', { id: VALID_UUID }));
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body.error).toBe('Failed to deactivate user');
      expect(mockLogAuditEvent).not.toHaveBeenCalled();
    });

    it('logs error when deactivation fails', async () => {
      const { logger } = await import('@/lib/logger');
      const chain = chainMock({ error: new Error('Delete failed') }).chain;
      mockFrom.mockReturnValue(chain);

      await DELETE(makePostRequest('/api/admin/users', { id: VALID_UUID }));

      expect(vi.mocked(logger.error)).toHaveBeenCalledWith(
        'Deactivate user error:',
        expect.any(Error),
      );
    });
  });

  describe('audit logging', () => {
    it('logs audit event on successful deactivation', async () => {
      const chain = chainMock({ error: null }).chain;
      mockFrom.mockReturnValue(chain);

      await DELETE(makePostRequest('/api/admin/users', { id: VALID_UUID }));

      expect(mockLogAuditEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          actorFid: 123,
          action: 'user.deactivate',
          targetType: 'user',
          targetId: VALID_UUID,
          ipAddress: '192.168.1.1',
        }),
      );
    });

    it('does not log audit event on deactivation failure', async () => {
      const chain = chainMock({ error: new Error('DB error') }).chain;
      mockFrom.mockReturnValue(chain);

      await DELETE(makePostRequest('/api/admin/users', { id: VALID_UUID }));

      expect(mockLogAuditEvent).not.toHaveBeenCalled();
    });

    it('includes correct admin fid in audit event', async () => {
      mockGetSessionData.mockResolvedValue(mockAdminSession({ fid: 999 }));
      const chain = chainMock({ error: null }).chain;
      mockFrom.mockReturnValue(chain);

      await DELETE(makePostRequest('/api/admin/users', { id: VALID_UUID }));

      expect(mockLogAuditEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          actorFid: 999,
        }),
      );
    });
  });

  describe('success response', () => {
    it('returns 200 with success true', async () => {
      const chain = chainMock({ error: null }).chain;
      mockFrom.mockReturnValue(chain);

      const res = await DELETE(makePostRequest('/api/admin/users', { id: VALID_UUID }));
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
    });
  });
});
