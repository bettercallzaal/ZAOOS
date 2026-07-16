import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  chainMock,
  makePostRequest,
  mockAdminSession,
  mockAuthenticatedSession,
  mockUnauthenticatedSession,
  VALID_WALLET,
} from '@/test-utils/api-helpers';

const { mockGetSessionData, mockFrom } = vi.hoisted(() => ({
  mockGetSessionData: vi.fn(),
  mockFrom: vi.fn(),
}));

const { mockGetUsersByFids } = vi.hoisted(() => ({
  mockGetUsersByFids: vi.fn(),
}));

vi.mock('@/lib/auth/session', () => ({
  getSessionData: () => mockGetSessionData(),
}));

vi.mock('@/lib/db/supabase', () => ({
  supabaseAdmin: { from: mockFrom },
}));

vi.mock('@/lib/farcaster/neynar', () => ({
  getUsersByFids: mockGetUsersByFids,
}));

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

import { POST } from '../route';

// ============================================================================
// POST /api/admin/users/import
// ============================================================================

describe('POST /api/admin/users/import', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSessionData.mockResolvedValue(mockAdminSession({ fid: 123 }));
    mockGetUsersByFids.mockResolvedValue([]);
  });

  describe('authentication', () => {
    it('returns 403 when unauthenticated', async () => {
      mockGetSessionData.mockResolvedValue(mockUnauthenticatedSession());

      const res = await POST(makePostRequest('/api/admin/users/import', {}));
      const body = await res.json();

      expect(res.status).toBe(403);
      expect(body.error).toBe('Admin access required');
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it('returns 403 when authenticated but not admin', async () => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 456, isAdmin: false }));

      const res = await POST(makePostRequest('/api/admin/users/import', {}));
      const body = await res.json();

      expect(res.status).toBe(403);
      expect(body.error).toBe('Admin access required');
      expect(mockFrom).not.toHaveBeenCalled();
    });
  });

  describe('empty allowlist', () => {
    it('returns 200 with 0 imported/skipped when allowlist is empty', async () => {
      const allowlistChain = chainMock({ data: [], error: null }).chain;
      const usersChain = chainMock({ data: [], error: null }).chain;

      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount += 1;
        return callCount === 1 ? allowlistChain : usersChain;
      });

      const res = await POST(makePostRequest('/api/admin/users/import', {}));
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.imported).toBe(0);
      expect(body.skipped).toBe(0);
      expect(body.message).toBe('No allowlist entries to import');
    });

    it('calls allowlist.select with is_active=true filter', async () => {
      const allowlistChain = chainMock({ data: [], error: null }).chain;
      mockFrom.mockReturnValue(allowlistChain);

      await POST(makePostRequest('/api/admin/users/import', {}));

      expect(mockFrom).toHaveBeenCalledWith('allowlist');
      expect(allowlistChain.select).toHaveBeenCalledWith('*');
      expect(allowlistChain.eq).toHaveBeenCalledWith('is_active', true);
    });
  });

  describe('Supabase interaction', () => {
    it('fetches allowlist and existing users in parallel', async () => {
      const allowlistChain = chainMock({ data: [], error: null }).chain;
      const usersChain = chainMock({ data: [], error: null }).chain;

      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount += 1;
        return callCount === 1 ? allowlistChain : usersChain;
      });

      await POST(makePostRequest('/api/admin/users/import', {}));

      expect(mockFrom).toHaveBeenCalledTimes(2);
      expect(mockFrom).toHaveBeenNthCalledWith(1, 'allowlist');
      expect(mockFrom).toHaveBeenNthCalledWith(2, 'users');
    });

    it('queries users table with primary_wallet and fid fields', async () => {
      const allowlistChain = chainMock({ data: [], error: null }).chain;
      const usersChain = chainMock({ data: [], error: null }).chain;

      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount += 1;
        return callCount === 1 ? allowlistChain : usersChain;
      });

      await POST(makePostRequest('/api/admin/users/import', {}));

      expect(usersChain.select).toHaveBeenCalledWith('primary_wallet, fid');
    });
  });

  describe('error handling - database errors', () => {
    it('returns 500 when allowlist fetch fails', async () => {
      const dbError = new Error('Database connection failed');
      const allowlistChain = chainMock({ data: null, error: dbError }).chain;
      mockFrom.mockReturnValue(allowlistChain);

      const res = await POST(makePostRequest('/api/admin/users/import', {}));
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body.error).toBe('Import failed');
    });

    it('logs error to logger.error when fetch fails', async () => {
      const { logger } = await import('@/lib/logger');
      const dbError = new Error('DB error');
      const allowlistChain = chainMock({ data: null, error: dbError }).chain;
      mockFrom.mockReturnValue(allowlistChain);

      await POST(makePostRequest('/api/admin/users/import', {}));

      expect(vi.mocked(logger.error)).toHaveBeenCalledWith(
        'Import users error:',
        expect.any(Error),
      );
    });

    it('returns 500 on unexpected exception during fetch', async () => {
      mockFrom.mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      const res = await POST(makePostRequest('/api/admin/users/import', {}));
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body.error).toBe('Import failed');
    });

    it('does not expose sensitive error details in response', async () => {
      const dbError = new Error('Connection to db.example.com:5432 failed');
      const allowlistChain = chainMock({ data: null, error: dbError }).chain;
      mockFrom.mockReturnValue(allowlistChain);

      const res = await POST(makePostRequest('/api/admin/users/import', {}));
      const body = await res.json();

      expect(body.error).toBe('Import failed');
      expect(body.details).toBeUndefined();
      expect(body.errorMessage).toBeUndefined();
    });
  });

  describe('deduplication by wallet', () => {
    it('skips entry if primary_wallet already exists (case insensitive)', async () => {
      const allowlistEntry = {
        fid: 100,
        wallet_address: '0xABCD1234567890ABCD1234567890ABCD12345678',
        display_name: 'Test User',
        username: 'testuser',
      };

      const existingUser = {
        primary_wallet: '0xabcd1234567890abcd1234567890abcd12345678',
        fid: null,
      };

      const allowlistChain = chainMock({ data: [allowlistEntry], error: null }).chain;
      const usersChain = chainMock({ data: [existingUser], error: null }).chain;

      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount += 1;
        return callCount === 1 ? allowlistChain : usersChain;
      });

      const res = await POST(makePostRequest('/api/admin/users/import', {}));
      const body = await res.json();

      expect(body.imported).toBe(0);
      expect(body.skipped).toBe(1);
    });

    it('skips entry if FID already exists', async () => {
      const allowlistEntry = {
        fid: 100,
        display_name: 'Test User',
        username: 'testuser',
      };

      const existingUser = {
        primary_wallet: '0xfffffffffffffffffffffffffffffffffffffff1',
        fid: 100,
      };

      const allowlistChain = chainMock({ data: [allowlistEntry], error: null }).chain;
      const usersChain = chainMock({ data: [existingUser], error: null }).chain;

      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount += 1;
        return callCount === 1 ? allowlistChain : usersChain;
      });

      const res = await POST(makePostRequest('/api/admin/users/import', {}));
      const body = await res.json();

      expect(body.imported).toBe(0);
      expect(body.skipped).toBe(1);
    });

    it('skips entries with null wallet and fid', async () => {
      const allowlistEntry = {
        display_name: 'Test User',
        username: 'testuser',
      };

      const allowlistChain = chainMock({ data: [allowlistEntry], error: null }).chain;
      const usersChain = chainMock({ data: [], error: null }).chain;

      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount += 1;
        return callCount === 1 ? allowlistChain : usersChain;
      });

      const res = await POST(makePostRequest('/api/admin/users/import', {}));
      const body = await res.json();

      expect(body.imported).toBe(0);
      expect(body.skipped).toBe(1);
    });
  });

  describe('wallet determination logic', () => {
    it('uses wallet_address as primary wallet when available', async () => {
      const allowlistEntry = {
        fid: 100,
        wallet_address: VALID_WALLET,
        display_name: 'Test User',
        username: 'testuser',
      };

      const allowlistChain = chainMock({ data: [allowlistEntry], error: null }).chain;
      const usersChain = chainMock({ data: [], error: null }).chain;

      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount += 1;
        return callCount === 1 ? allowlistChain : usersChain;
      });

      const insertChain = chainMock({ error: null }).chain;
      const fromCalls = [allowlistChain, usersChain, insertChain];
      let fromCallIndex = 0;
      mockFrom.mockImplementation(() => {
        const result = fromCalls[fromCallIndex];
        fromCallIndex += 1;
        return result;
      });

      await POST(makePostRequest('/api/admin/users/import', {}));

      expect(insertChain.insert).toHaveBeenCalled();
      const insertCall = vi.mocked(insertChain.insert);
      const [userData] = insertCall.mock.calls[0] as unknown as [Record<string, unknown>];
      expect(userData.primary_wallet).toBe(VALID_WALLET.toLowerCase());
    });

    it('uses custody_address as fallback when wallet_address not available', async () => {
      const allowlistEntry = {
        fid: 100,
        custody_address: VALID_WALLET,
        display_name: 'Test User',
        username: 'testuser',
      };

      const allowlistChain = chainMock({ data: [allowlistEntry], error: null }).chain;
      const usersChain = chainMock({ data: [], error: null }).chain;

      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount += 1;
        return callCount === 1 ? allowlistChain : usersChain;
      });

      const insertChain = chainMock({ error: null }).chain;
      const fromCalls = [allowlistChain, usersChain, insertChain];
      let fromCallIndex = 0;
      mockFrom.mockImplementation(() => {
        const result = fromCalls[fromCallIndex];
        fromCallIndex += 1;
        return result;
      });

      await POST(makePostRequest('/api/admin/users/import', {}));

      expect(insertChain.insert).toHaveBeenCalled();
      const insertCall = vi.mocked(insertChain.insert);
      const [userData] = insertCall.mock.calls[0] as unknown as [Record<string, unknown>];
      expect(userData.primary_wallet).toBe(VALID_WALLET.toLowerCase());
    });

    it('uses fid: placeholder when no wallet available', async () => {
      const allowlistEntry = {
        fid: 100,
        display_name: 'Test User',
        username: 'testuser',
      };

      const allowlistChain = chainMock({ data: [allowlistEntry], error: null }).chain;
      const usersChain = chainMock({ data: [], error: null }).chain;

      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount += 1;
        return callCount === 1 ? allowlistChain : usersChain;
      });

      const insertChain = chainMock({ error: null }).chain;
      const fromCalls = [allowlistChain, usersChain, insertChain];
      let fromCallIndex = 0;
      mockFrom.mockImplementation(() => {
        const result = fromCalls[fromCallIndex];
        fromCallIndex += 1;
        return result;
      });

      await POST(makePostRequest('/api/admin/users/import', {}));

      expect(insertChain.insert).toHaveBeenCalled();
      const insertCall = vi.mocked(insertChain.insert);
      const [userData] = insertCall.mock.calls[0] as unknown as [Record<string, unknown>];
      expect(userData.primary_wallet).toBe('fid:100');
    });
  });

  describe('Farcaster enrichment via getUsersByFids', () => {
    it('fetches Farcaster data for all entries with fids', async () => {
      const allowlistEntries = [
        { fid: 100, display_name: 'User1' },
        { fid: 200, display_name: 'User2' },
      ];

      const allowlistChain = chainMock({ data: allowlistEntries, error: null }).chain;
      const usersChain = chainMock({ data: [], error: null }).chain;

      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount += 1;
        return callCount === 1 ? allowlistChain : usersChain;
      });

      mockGetUsersByFids.mockResolvedValue([]);

      await POST(makePostRequest('/api/admin/users/import', {}));

      expect(mockGetUsersByFids).toHaveBeenCalledWith([100, 200]);
    });

    it('enriches user data with Farcaster profile info when available', async () => {
      const allowlistEntry = {
        fid: 100,
        display_name: 'Old Name',
        pfp_url: null,
        username: null,
      };

      const fcUser = {
        fid: 100,
        display_name: 'Fresh Name',
        pfp_url: 'https://example.com/pfp.jpg',
        username: 'newusername',
        custody_address: VALID_WALLET,
        verified_addresses: { eth_addresses: ['0xaddr1'] },
        profile: { bio: { text: 'User bio' } },
      };

      const allowlistChain = chainMock({ data: [allowlistEntry], error: null }).chain;
      const usersChain = chainMock({ data: [], error: null }).chain;

      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount += 1;
        return callCount === 1 ? allowlistChain : usersChain;
      });

      const insertChain = chainMock({ error: null }).chain;
      const fromCalls = [allowlistChain, usersChain, insertChain];
      let fromCallIndex = 0;
      mockFrom.mockImplementation(() => {
        const result = fromCalls[fromCallIndex];
        fromCallIndex += 1;
        return result;
      });

      mockGetUsersByFids.mockResolvedValue([fcUser as unknown as Record<string, unknown>]);

      await POST(makePostRequest('/api/admin/users/import', {}));

      expect(insertChain.insert).toHaveBeenCalled();
      const insertCall = vi.mocked(insertChain.insert);
      const [userData] = insertCall.mock.calls[0] as unknown as [Record<string, unknown>];

      expect(userData.display_name).toBe('Fresh Name');
      expect(userData.pfp_url).toBe('https://example.com/pfp.jpg');
      expect(userData.username).toBe('newusername');
      expect(userData.bio).toBe('User bio');
    });

    it('keeps allowlist data when Farcaster data is incomplete', async () => {
      const allowlistEntry = {
        fid: 100,
        display_name: 'Allowlist Name',
        pfp_url: 'https://allowlist.com/pfp.jpg',
        username: 'allowlistuser',
      };

      const fcUser = {
        fid: 100,
        display_name: null,
        pfp_url: null,
        username: null,
      };

      const allowlistChain = chainMock({ data: [allowlistEntry], error: null }).chain;
      const usersChain = chainMock({ data: [], error: null }).chain;

      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount += 1;
        return callCount === 1 ? allowlistChain : usersChain;
      });

      const insertChain = chainMock({ error: null }).chain;
      const fromCalls = [allowlistChain, usersChain, insertChain];
      let fromCallIndex = 0;
      mockFrom.mockImplementation(() => {
        const result = fromCalls[fromCallIndex];
        fromCallIndex += 1;
        return result;
      });

      mockGetUsersByFids.mockResolvedValue([fcUser as unknown as Record<string, unknown>]);

      await POST(makePostRequest('/api/admin/users/import', {}));

      expect(insertChain.insert).toHaveBeenCalled();
      const insertCall = vi.mocked(insertChain.insert);
      const [userData] = insertCall.mock.calls[0] as unknown as [Record<string, unknown>];

      expect(userData.display_name).toBe('Allowlist Name');
      expect(userData.pfp_url).toBe('https://allowlist.com/pfp.jpg');
      expect(userData.username).toBe('allowlistuser');
    });

    it('logs warning and continues when Farcaster fetch fails', async () => {
      const { logger } = await import('@/lib/logger');
      const allowlistEntry = {
        fid: 100,
        display_name: 'Test User',
        username: 'testuser',
      };

      const allowlistChain = chainMock({ data: [allowlistEntry], error: null }).chain;
      const usersChain = chainMock({ data: [], error: null }).chain;

      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount += 1;
        return callCount === 1 ? allowlistChain : usersChain;
      });

      const insertChain = chainMock({ error: null }).chain;
      const fromCalls = [allowlistChain, usersChain, insertChain];
      let fromCallIndex = 0;
      mockFrom.mockImplementation(() => {
        const result = fromCalls[fromCallIndex];
        fromCallIndex += 1;
        return result;
      });

      mockGetUsersByFids.mockRejectedValue(new Error('Neynar API error'));

      const res = await POST(makePostRequest('/api/admin/users/import', {}));
      const body = await res.json();

      expect(vi.mocked(logger.warn)).toHaveBeenCalledWith(
        '[import] Batch Farcaster fetch failed, using cached data:',
        expect.any(Error),
      );
      expect(body.imported).toBe(1);
    });

    it('updates primary_wallet to custody_address when Farcaster provides real wallet', async () => {
      const allowlistEntry = {
        fid: 100,
        display_name: 'Test User',
      };

      const fcUser = {
        fid: 100,
        custody_address: VALID_WALLET,
        verified_addresses: { eth_addresses: [] },
      };

      const allowlistChain = chainMock({ data: [allowlistEntry], error: null }).chain;
      const usersChain = chainMock({ data: [], error: null }).chain;

      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount += 1;
        return callCount === 1 ? allowlistChain : usersChain;
      });

      const insertChain = chainMock({ error: null }).chain;
      const fromCalls = [allowlistChain, usersChain, insertChain];
      let fromCallIndex = 0;
      mockFrom.mockImplementation(() => {
        const result = fromCalls[fromCallIndex];
        fromCallIndex += 1;
        return result;
      });

      mockGetUsersByFids.mockResolvedValue([fcUser as unknown as Record<string, unknown>]);

      await POST(makePostRequest('/api/admin/users/import', {}));

      expect(insertChain.insert).toHaveBeenCalled();
      const insertCall = vi.mocked(insertChain.insert);
      const [userData] = insertCall.mock.calls[0] as unknown as [Record<string, unknown>];

      expect(userData.primary_wallet).toBe(VALID_WALLET.toLowerCase());
    });
  });

  describe('user data construction', () => {
    it('sets role to member for entries with fid', async () => {
      const allowlistEntry = {
        fid: 100,
        display_name: 'Test User',
        username: 'testuser',
      };

      const allowlistChain = chainMock({ data: [allowlistEntry], error: null }).chain;
      const usersChain = chainMock({ data: [], error: null }).chain;

      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount += 1;
        return callCount === 1 ? allowlistChain : usersChain;
      });

      const insertChain = chainMock({ error: null }).chain;
      const fromCalls = [allowlistChain, usersChain, insertChain];
      let fromCallIndex = 0;
      mockFrom.mockImplementation(() => {
        const result = fromCalls[fromCallIndex];
        fromCallIndex += 1;
        return result;
      });

      mockGetUsersByFids.mockResolvedValue([]);

      await POST(makePostRequest('/api/admin/users/import', {}));

      expect(insertChain.insert).toHaveBeenCalled();
      const insertCall = vi.mocked(insertChain.insert);
      const [userData] = insertCall.mock.calls[0] as unknown as [Record<string, unknown>];

      expect(userData.role).toBe('member');
    });

    it('sets role to beta for entries without fid', async () => {
      const allowlistEntry = {
        wallet_address: VALID_WALLET,
        display_name: 'Test User',
        username: 'testuser',
      };

      const allowlistChain = chainMock({ data: [allowlistEntry], error: null }).chain;
      const usersChain = chainMock({ data: [], error: null }).chain;

      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount += 1;
        return callCount === 1 ? allowlistChain : usersChain;
      });

      const insertChain = chainMock({ error: null }).chain;
      const fromCalls = [allowlistChain, usersChain, insertChain];
      let fromCallIndex = 0;
      mockFrom.mockImplementation(() => {
        const result = fromCalls[fromCallIndex];
        fromCallIndex += 1;
        return result;
      });

      await POST(makePostRequest('/api/admin/users/import', {}));

      expect(insertChain.insert).toHaveBeenCalled();
      const insertCall = vi.mocked(insertChain.insert);
      const [userData] = insertCall.mock.calls[0] as unknown as [Record<string, unknown>];

      expect(userData.role).toBe('beta');
    });

    it('uses display_name, ign, real_name, or wallet prefix as fallback for display_name', async () => {
      const allowlistEntry = {
        wallet_address: VALID_WALLET,
      };

      const allowlistChain = chainMock({ data: [allowlistEntry], error: null }).chain;
      const usersChain = chainMock({ data: [], error: null }).chain;

      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount += 1;
        return callCount === 1 ? allowlistChain : usersChain;
      });

      const insertChain = chainMock({ error: null }).chain;
      const fromCalls = [allowlistChain, usersChain, insertChain];
      let fromCallIndex = 0;
      mockFrom.mockImplementation(() => {
        const result = fromCalls[fromCallIndex];
        fromCallIndex += 1;
        return result;
      });

      await POST(makePostRequest('/api/admin/users/import', {}));

      expect(insertChain.insert).toHaveBeenCalled();
      const insertCall = vi.mocked(insertChain.insert);
      const [userData] = insertCall.mock.calls[0] as unknown as [Record<string, unknown>];

      expect(userData.display_name).toBe(VALID_WALLET.slice(0, 10));
    });

    it('sets is_active to true for all imported users', async () => {
      const allowlistEntry = {
        fid: 100,
        display_name: 'Test User',
      };

      const allowlistChain = chainMock({ data: [allowlistEntry], error: null }).chain;
      const usersChain = chainMock({ data: [], error: null }).chain;

      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount += 1;
        return callCount === 1 ? allowlistChain : usersChain;
      });

      const insertChain = chainMock({ error: null }).chain;
      const fromCalls = [allowlistChain, usersChain, insertChain];
      let fromCallIndex = 0;
      mockFrom.mockImplementation(() => {
        const result = fromCalls[fromCallIndex];
        fromCallIndex += 1;
        return result;
      });

      mockGetUsersByFids.mockResolvedValue([]);

      await POST(makePostRequest('/api/admin/users/import', {}));

      expect(insertChain.insert).toHaveBeenCalled();
      const insertCall = vi.mocked(insertChain.insert);
      const [userData] = insertCall.mock.calls[0] as unknown as [Record<string, unknown>];

      expect(userData.is_active).toBe(true);
    });

    it('preserves optional fields from allowlist entry', async () => {
      const allowlistEntry = {
        fid: 100,
        display_name: 'Test User',
        ens_name: 'testuser.eth',
        notes: 'VIP member',
      };

      const allowlistChain = chainMock({ data: [allowlistEntry], error: null }).chain;
      const usersChain = chainMock({ data: [], error: null }).chain;

      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount += 1;
        return callCount === 1 ? allowlistChain : usersChain;
      });

      const insertChain = chainMock({ error: null }).chain;
      const fromCalls = [allowlistChain, usersChain, insertChain];
      let fromCallIndex = 0;
      mockFrom.mockImplementation(() => {
        const result = fromCalls[fromCallIndex];
        fromCallIndex += 1;
        return result;
      });

      mockGetUsersByFids.mockResolvedValue([]);

      await POST(makePostRequest('/api/admin/users/import', {}));

      expect(insertChain.insert).toHaveBeenCalled();
      const insertCall = vi.mocked(insertChain.insert);
      const [userData] = insertCall.mock.calls[0] as unknown as [Record<string, unknown>];

      expect(userData.ens_name).toBe('testuser.eth');
      expect(userData.notes).toBe('VIP member');
    });
  });

  describe('success scenarios', () => {
    it('imports new users successfully', async () => {
      const allowlistEntry = {
        fid: 100,
        wallet_address: VALID_WALLET,
        display_name: 'Test User',
        username: 'testuser',
      };

      const allowlistChain = chainMock({ data: [allowlistEntry], error: null }).chain;
      const usersChain = chainMock({ data: [], error: null }).chain;

      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount += 1;
        if (callCount === 1) return allowlistChain;
        if (callCount === 2) return usersChain;
        return chainMock({ error: null }).chain;
      });

      const insertChain = chainMock({ error: null }).chain;
      const fromCalls = [allowlistChain, usersChain, insertChain];
      let fromCallIndex = 0;
      mockFrom.mockImplementation(() => {
        const result = fromCalls[fromCallIndex];
        fromCallIndex += 1;
        return result;
      });

      mockGetUsersByFids.mockResolvedValue([]);

      const res = await POST(makePostRequest('/api/admin/users/import', {}));
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.imported).toBe(1);
      expect(body.skipped).toBe(0);
      expect(body.total).toBe(1);
    });

    it('returns correct counts for mixed import and skip scenario', async () => {
      const allowlistEntries = [
        { fid: 100, wallet_address: VALID_WALLET, display_name: 'New User' },
        {
          fid: 200,
          wallet_address: '0xDEADBEEFDEADBEEFDEADBEEFDEADBEEFDEADBEEF',
          display_name: 'Old User',
        },
      ];

      const existingUsers = [
        { primary_wallet: '0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef', fid: null },
      ];

      const allowlistChain = chainMock({ data: allowlistEntries, error: null }).chain;
      const usersChain = chainMock({ data: existingUsers, error: null }).chain;

      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount += 1;
        if (callCount === 1) return allowlistChain;
        if (callCount === 2) return usersChain;
        return chainMock({ error: null }).chain;
      });

      const insertChain = chainMock({ error: null }).chain;
      const fromCalls = [allowlistChain, usersChain, insertChain];
      let fromCallIndex = 0;
      mockFrom.mockImplementation(() => {
        const result = fromCalls[fromCallIndex];
        fromCallIndex += 1;
        return result;
      });

      mockGetUsersByFids.mockResolvedValue([]);

      const res = await POST(makePostRequest('/api/admin/users/import', {}));
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.imported).toBe(1);
      expect(body.skipped).toBe(1);
      expect(body.total).toBe(2);
    });

    it('all entries already exist - returns 0 imported', async () => {
      const allowlistEntry = {
        fid: 100,
        wallet_address: VALID_WALLET,
        display_name: 'Test User',
      };

      const existingUser = {
        primary_wallet: VALID_WALLET.toLowerCase(),
        fid: 100,
      };

      const allowlistChain = chainMock({ data: [allowlistEntry], error: null }).chain;
      const usersChain = chainMock({ data: [existingUser], error: null }).chain;

      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount += 1;
        return callCount === 1 ? allowlistChain : usersChain;
      });

      mockGetUsersByFids.mockResolvedValue([]);

      const res = await POST(makePostRequest('/api/admin/users/import', {}));
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.imported).toBe(0);
      expect(body.skipped).toBe(1);
    });
  });

  describe('insert error handling', () => {
    it('skips entry on unique constraint violation (23505)', async () => {
      const allowlistEntry = {
        fid: 100,
        wallet_address: VALID_WALLET,
        display_name: 'Test User',
      };

      const allowlistChain = chainMock({ data: [allowlistEntry], error: null }).chain;
      const usersChain = chainMock({ data: [], error: null }).chain;

      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount += 1;
        if (callCount === 1) return allowlistChain;
        if (callCount === 2) return usersChain;
        const insertChain = chainMock({
          error: { code: '23505', message: 'Unique violation' },
        }).chain;
        return insertChain;
      });

      mockGetUsersByFids.mockResolvedValue([]);

      const res = await POST(makePostRequest('/api/admin/users/import', {}));
      const body = await res.json();

      expect(body.imported).toBe(0);
      expect(body.skipped).toBe(1);
      expect(body.errors).toBeUndefined();
    });

    it('collects other insert errors in errors array', async () => {
      const allowlistEntry = {
        fid: 100,
        wallet_address: VALID_WALLET,
        display_name: 'Test User',
        ign: 'testign',
      };

      const allowlistChain = chainMock({ data: [allowlistEntry], error: null }).chain;
      const usersChain = chainMock({ data: [], error: null }).chain;

      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount += 1;
        if (callCount === 1) return allowlistChain;
        if (callCount === 2) return usersChain;
        const insertChain = chainMock({
          error: { code: '42P09', message: 'Foreign key violation' },
        }).chain;
        return insertChain;
      });

      mockGetUsersByFids.mockResolvedValue([]);

      const res = await POST(makePostRequest('/api/admin/users/import', {}));
      const body = await res.json();

      expect(body.imported).toBe(0);
      expect(body.skipped).toBe(0);
      expect(body.errors).toBeDefined();
      expect(body.errors).toHaveLength(1);
      expect(body.errors[0]).toContain('testign');
      expect(body.errors[0]).toContain('Foreign key violation');
    });

    it('continues importing after individual entry error', async () => {
      const allowlistEntries = [
        { fid: 100, wallet_address: VALID_WALLET, display_name: 'User1' },
        {
          fid: 200,
          wallet_address: '0xABCDABCDABCDABCDABCDABCDABCDABCDABCDABCD',
          display_name: 'User2',
        },
      ];

      const allowlistChain = chainMock({ data: allowlistEntries, error: null }).chain;
      const usersChain = chainMock({ data: [], error: null }).chain;

      let callCount = 0;
      let insertCount = 0;
      mockFrom.mockImplementation(() => {
        callCount += 1;
        if (callCount === 1) return allowlistChain;
        if (callCount === 2) return usersChain;
        insertCount += 1;
        if (insertCount === 1) {
          return chainMock({ error: { code: '42P09', message: 'Error' } }).chain;
        }
        return chainMock({ error: null }).chain;
      });

      mockGetUsersByFids.mockResolvedValue([]);

      const res = await POST(makePostRequest('/api/admin/users/import', {}));
      const body = await res.json();

      expect(body.imported).toBe(1);
      expect(body.errors).toBeDefined();
      expect(body.errors).toHaveLength(1);
    });

    it('catches exception during entry processing and adds to errors', async () => {
      const allowlistEntry = {
        fid: 100,
        wallet_address: VALID_WALLET,
        display_name: 'Test User',
        ign: 'testign',
      };

      const allowlistChain = chainMock({ data: [allowlistEntry], error: null }).chain;
      const usersChain = chainMock({ data: [], error: null }).chain;

      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount += 1;
        if (callCount === 1) return allowlistChain;
        if (callCount === 2) return usersChain;
        const insertChain = chainMock({ error: null }).chain;
        vi.mocked(insertChain.insert).mockImplementation(() => {
          throw new Error('Unexpected insert error');
        });
        return insertChain;
      });

      mockGetUsersByFids.mockResolvedValue([]);

      const res = await POST(makePostRequest('/api/admin/users/import', {}));
      const body = await res.json();

      expect(body.imported).toBe(0);
      expect(body.errors).toBeDefined();
      expect(body.errors).toHaveLength(1);
      expect(body.errors[0]).toContain('testign');
      expect(body.errors[0]).toContain('Unexpected insert error');
    });

    it('includes error details in response message', async () => {
      const allowlistEntries = [
        { fid: 100, wallet_address: VALID_WALLET, display_name: 'User1' },
        {
          fid: 200,
          wallet_address: '0xABCDABCDABCDABCDABCDABCDABCDABCDABCDABCD',
          display_name: 'User2',
        },
      ];

      const allowlistChain = chainMock({ data: allowlistEntries, error: null }).chain;
      const usersChain = chainMock({ data: [], error: null }).chain;

      let callCount = 0;
      let insertCount = 0;
      mockFrom.mockImplementation(() => {
        callCount += 1;
        if (callCount === 1) return allowlistChain;
        if (callCount === 2) return usersChain;
        insertCount += 1;
        if (insertCount === 1) {
          return chainMock({ error: { code: '42P09', message: 'Error' } }).chain;
        }
        return chainMock({ error: null }).chain;
      });

      mockGetUsersByFids.mockResolvedValue([]);

      const res = await POST(makePostRequest('/api/admin/users/import', {}));
      const body = await res.json();

      expect(body.message).toContain('Imported 1 users');
      expect(body.message).toContain('1 errors');
    });
  });

  describe('response structure', () => {
    it('includes imported, skipped, total, and message in success response', async () => {
      const allowlistChain = chainMock({ data: [], error: null }).chain;
      mockFrom.mockReturnValue(allowlistChain);

      const res = await POST(makePostRequest('/api/admin/users/import', {}));
      const body = await res.json();

      expect(body).toHaveProperty('imported');
      expect(body).toHaveProperty('skipped');
      expect(body).toHaveProperty('message');
    });

    it('includes errors array when errors occur', async () => {
      const allowlistEntry = {
        fid: 100,
        wallet_address: VALID_WALLET,
        display_name: 'Test User',
      };

      const allowlistChain = chainMock({ data: [allowlistEntry], error: null }).chain;
      const usersChain = chainMock({ data: [], error: null }).chain;

      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount += 1;
        if (callCount === 1) return allowlistChain;
        if (callCount === 2) return usersChain;
        return chainMock({ error: { code: '42P09', message: 'Error' } }).chain;
      });

      mockGetUsersByFids.mockResolvedValue([]);

      const res = await POST(makePostRequest('/api/admin/users/import', {}));
      const body = await res.json();

      expect(body.errors).toBeDefined();
      expect(Array.isArray(body.errors)).toBe(true);
    });

    it('omits errors array when no errors occur', async () => {
      const allowlistChain = chainMock({ data: [], error: null }).chain;
      mockFrom.mockReturnValue(allowlistChain);

      const res = await POST(makePostRequest('/api/admin/users/import', {}));
      const body = await res.json();

      expect(body.errors).toBeUndefined();
    });
  });
});
