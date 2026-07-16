import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  chainMock,
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

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

import { DELETE, GET, POST } from '../route';

// ============================================================================
// GET /api/admin/allowlist
// ============================================================================

describe('GET /api/admin/allowlist', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSessionData.mockResolvedValue(mockAdminSession({ fid: 123 }));
    mockGetClientIp.mockReturnValue('192.168.1.1');
  });

  describe('authentication', () => {
    it('returns 401 when unauthenticated', async () => {
      mockGetSessionData.mockResolvedValue(mockUnauthenticatedSession());

      const res = await GET();
      const body = await res.json();

      expect(res.status).toBe(401);
      expect(body.error).toBe('Unauthorized');
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it('returns 403 when authenticated but not admin', async () => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 456, isAdmin: false }));

      const res = await GET();
      const body = await res.json();

      expect(res.status).toBe(403);
      expect(body.error).toBe('Admin access required');
      expect(mockFrom).not.toHaveBeenCalled();
    });
  });

  describe('Supabase interaction', () => {
    it('queries allowlist table with order descending by added_at', async () => {
      const chain = chainMock({ data: [], error: null }).chain;
      mockFrom.mockReturnValue(chain);

      await GET();

      expect(mockFrom).toHaveBeenCalledWith('allowlist');
      expect(chain.select).toHaveBeenCalledWith('*');
      expect(chain.order).toHaveBeenCalledWith('added_at', { ascending: false });
    });

    it('does not query users table when allowlist is empty', async () => {
      const chain = chainMock({ data: [], error: null }).chain;
      mockFrom.mockReturnValue(chain);

      await GET();

      // Only one call to from() for allowlist query
      expect(mockFrom).toHaveBeenCalledTimes(1);
      expect(mockFrom).toHaveBeenCalledWith('allowlist');
    });

    it('queries users table when allowlist contains entries with fids', async () => {
      const allowlistData = [
        { id: '1', fid: 100, wallet_address: null, added_at: '2026-01-01' },
        { id: '2', fid: 200, wallet_address: null, added_at: '2026-01-02' },
      ];
      const usersData = [
        { fid: 100, xmtp_address: 'user100@xmtp' },
        { fid: 200, xmtp_address: 'user200@xmtp' },
      ];

      const allowlistChain = chainMock({ data: allowlistData, error: null }).chain;
      const usersChain = chainMock({ data: usersData, error: null }).chain;

      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount += 1;
        return callCount === 1 ? allowlistChain : usersChain;
      });

      await GET();

      expect(mockFrom).toHaveBeenCalledTimes(2);
      expect(mockFrom).toHaveBeenNthCalledWith(1, 'allowlist');
      expect(mockFrom).toHaveBeenNthCalledWith(2, 'users');
    });

    it('filters users query by fids from allowlist and non-null xmtp_address', async () => {
      const allowlistData = [
        { id: '1', fid: 100, wallet_address: null, added_at: '2026-01-01' },
        { id: '2', fid: 200, wallet_address: null, added_at: '2026-01-02' },
      ];
      const usersData = [{ fid: 100, xmtp_address: 'user100@xmtp' }];

      const allowlistChain = chainMock({ data: allowlistData, error: null }).chain;
      const usersChain = chainMock({ data: usersData, error: null }).chain;

      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount += 1;
        return callCount === 1 ? allowlistChain : usersChain;
      });

      await GET();

      expect(usersChain.in).toHaveBeenCalledWith('fid', [100, 200]);
      expect(usersChain.not).toHaveBeenCalledWith('xmtp_address', 'is', null);
    });
  });

  describe('xmtp enrichment', () => {
    it('joins xmtp_address from users table into allowlist entries', async () => {
      const allowlistData = [{ id: '1', fid: 100, wallet_address: null, added_at: '2026-01-01' }];
      const usersData = [{ fid: 100, xmtp_address: 'user100@xmtp' }];

      const allowlistChain = chainMock({ data: allowlistData, error: null }).chain;
      const usersChain = chainMock({ data: usersData, error: null }).chain;

      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount += 1;
        return callCount === 1 ? allowlistChain : usersChain;
      });

      const res = await GET();
      const body = await res.json();

      expect(body.entries[0]).toEqual({
        ...allowlistData[0],
        xmtp_address: 'user100@xmtp',
      });
    });

    it('sets xmtp_address to null when user has no xmtp_address', async () => {
      const allowlistData = [{ id: '1', fid: 100, wallet_address: null, added_at: '2026-01-01' }];
      const usersData: Array<{ fid: number; xmtp_address: string | null }> = [];

      const allowlistChain = chainMock({ data: allowlistData, error: null }).chain;
      const usersChain = chainMock({ data: usersData, error: null }).chain;

      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount += 1;
        return callCount === 1 ? allowlistChain : usersChain;
      });

      const res = await GET();
      const body = await res.json();

      expect(body.entries[0].xmtp_address).toBeNull();
    });

    it('sets xmtp_address to null for entries without fid', async () => {
      const allowlistData = [
        { id: '1', fid: null, wallet_address: VALID_WALLET, added_at: '2026-01-01' },
      ];

      const allowlistChain = chainMock({ data: allowlistData, error: null }).chain;
      mockFrom.mockReturnValue(allowlistChain);

      const res = await GET();
      const body = await res.json();

      expect(body.entries[0].xmtp_address).toBeNull();
    });

    it('handles mixed entries (some with fid, some without)', async () => {
      const allowlistData = [
        { id: '1', fid: 100, wallet_address: null, added_at: '2026-01-01' },
        { id: '2', fid: null, wallet_address: VALID_WALLET, added_at: '2026-01-02' },
      ];
      const usersData = [{ fid: 100, xmtp_address: 'user100@xmtp' }];

      const allowlistChain = chainMock({ data: allowlistData, error: null }).chain;
      const usersChain = chainMock({ data: usersData, error: null }).chain;

      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount += 1;
        return callCount === 1 ? allowlistChain : usersChain;
      });

      const res = await GET();
      const body = await res.json();

      expect(body.entries).toHaveLength(2);
      expect(body.entries[0].xmtp_address).toBe('user100@xmtp');
      expect(body.entries[1].xmtp_address).toBeNull();
    });
  });

  describe('success response', () => {
    it('returns 200 with entries array', async () => {
      const allowlistChain = chainMock({ data: [], error: null }).chain;
      mockFrom.mockReturnValue(allowlistChain);

      const res = await GET();
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body).toEqual({ entries: [] });
    });

    it('returns all allowlist entries with correct structure', async () => {
      const allowlistData = [
        {
          id: VALID_UUID,
          fid: 100,
          wallet_address: VALID_WALLET,
          real_name: 'Test User',
          ign: 'testuser',
          notes: 'test notes',
          display_name: 'Test Display',
          pfp_url: 'https://example.com/pfp.jpg',
          username: 'testuser123',
          custody_address: VALID_WALLET,
          verified_addresses: ['0xaddr1'],
          ens_name: 'testuser.eth',
          added_at: '2026-01-01',
        },
      ];

      const allowlistChain = chainMock({ data: allowlistData, error: null }).chain;
      mockFrom.mockReturnValue(allowlistChain);

      const res = await GET();
      const body = await res.json();

      expect(body.entries).toHaveLength(1);
      expect(body.entries[0]).toMatchObject(allowlistData[0]);
      expect(body.entries[0].xmtp_address).toBeNull();
    });
  });

  describe('error handling', () => {
    it('returns 500 when allowlist query fails', async () => {
      const dbError = new Error('Database connection failed');
      const allowlistChain = chainMock({ data: null, error: dbError }).chain;
      mockFrom.mockReturnValue(allowlistChain);

      const res = await GET();
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body.error).toBe('Failed to fetch allowlist');
    });

    it('returns 500 when exception is thrown during fetch', async () => {
      mockFrom.mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      const res = await GET();
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body.error).toBe('Failed to fetch allowlist');
    });

    it('logs error to logger.error when exception occurs', async () => {
      const { logger } = await import('@/lib/logger');
      mockFrom.mockImplementation(() => {
        throw new Error('Fetch failed');
      });

      await GET();

      expect(vi.mocked(logger.error)).toHaveBeenCalledWith(
        'Allowlist fetch error:',
        expect.any(Error),
      );
    });

    it('does not expose sensitive error details in response', async () => {
      const dbError = new Error('Password: secret123, host: db.example.com');
      const allowlistChain = chainMock({ data: null, error: dbError }).chain;
      mockFrom.mockReturnValue(allowlistChain);

      const res = await GET();
      const body = await res.json();

      expect(body.error).toBe('Failed to fetch allowlist');
      expect(body.details).toBeUndefined();
      expect(body.errorMessage).toBeUndefined();
    });
  });
});

// ============================================================================
// POST /api/admin/allowlist
// ============================================================================

describe('POST /api/admin/allowlist', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSessionData.mockResolvedValue(mockAdminSession({ fid: 123 }));
    mockGetClientIp.mockReturnValue('192.168.1.1');
  });

  describe('authentication', () => {
    it('returns 401 when unauthenticated', async () => {
      mockGetSessionData.mockResolvedValue(mockUnauthenticatedSession());

      const res = await POST(makePostRequest('/api/admin/allowlist', { fid: 100 }));
      const body = await res.json();

      expect(res.status).toBe(401);
      expect(body.error).toBe('Unauthorized');
      expect(mockFrom).not.toHaveBeenCalled();
      expect(mockLogAuditEvent).not.toHaveBeenCalled();
    });

    it('returns 403 when authenticated but not admin', async () => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 456, isAdmin: false }));

      const res = await POST(makePostRequest('/api/admin/allowlist', { fid: 100 }));
      const body = await res.json();

      expect(res.status).toBe(403);
      expect(body.error).toBe('Admin access required');
      expect(mockFrom).not.toHaveBeenCalled();
      expect(mockLogAuditEvent).not.toHaveBeenCalled();
    });
  });

  describe('input validation', () => {
    it('returns 400 when neither fid nor wallet_address is provided', async () => {
      const res = await POST(makePostRequest('/api/admin/allowlist', { notes: 'test' }));
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid input');
      expect(body.details).toBeDefined();
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it('returns 400 when fid is invalid type', async () => {
      const res = await POST(makePostRequest('/api/admin/allowlist', { fid: 'not-a-number' }));
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid input');
      expect(body.details).toBeDefined();
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it('returns 400 when fid is not positive', async () => {
      const res = await POST(makePostRequest('/api/admin/allowlist', { fid: 0 }));
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid input');
      expect(body.details).toBeDefined();
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it('returns 400 when wallet_address is invalid format', async () => {
      const res = await POST(
        makePostRequest('/api/admin/allowlist', { wallet_address: 'not-an-address' }),
      );
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid input');
      expect(body.details).toBeDefined();
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it('accepts fid as sole identifier', async () => {
      const chain = chainMock({ error: null }).chain;
      mockFrom.mockReturnValue(chain);

      const res = await POST(makePostRequest('/api/admin/allowlist', { fid: 100 }));
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
    });

    it('accepts wallet_address as sole identifier', async () => {
      const chain = chainMock({ error: null }).chain;
      mockFrom.mockReturnValue(chain);

      const res = await POST(
        makePostRequest('/api/admin/allowlist', { wallet_address: VALID_WALLET }),
      );
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
    });

    it('accepts both fid and wallet_address', async () => {
      const chain = chainMock({ error: null }).chain;
      mockFrom.mockReturnValue(chain);

      const res = await POST(
        makePostRequest('/api/admin/allowlist', {
          fid: 100,
          wallet_address: VALID_WALLET,
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
    });

    it('accepts optional real_name field', async () => {
      const chain = chainMock({ error: null }).chain;
      mockFrom.mockReturnValue(chain);

      const res = await POST(
        makePostRequest('/api/admin/allowlist', {
          fid: 100,
          real_name: 'John Doe',
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
    });

    it('accepts optional ign field', async () => {
      const chain = chainMock({ error: null }).chain;
      mockFrom.mockReturnValue(chain);

      const res = await POST(
        makePostRequest('/api/admin/allowlist', {
          fid: 100,
          ign: 'player123',
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
    });

    it('accepts optional notes field', async () => {
      const chain = chainMock({ error: null }).chain;
      mockFrom.mockReturnValue(chain);

      const res = await POST(
        makePostRequest('/api/admin/allowlist', {
          fid: 100,
          notes: 'VIP member, early access',
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
    });

    it('returns 400 when notes exceeds max length (500 chars)', async () => {
      const longNotes = 'a'.repeat(501);
      const res = await POST(
        makePostRequest('/api/admin/allowlist', {
          fid: 100,
          notes: longNotes,
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid input');
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it('accepts notes with exactly 500 chars', async () => {
      const maxNotes = 'a'.repeat(500);
      const chain = chainMock({ error: null }).chain;
      mockFrom.mockReturnValue(chain);

      const res = await POST(
        makePostRequest('/api/admin/allowlist', {
          fid: 100,
          notes: maxNotes,
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
    });

    it('accepts optional display_name field', async () => {
      const chain = chainMock({ error: null }).chain;
      mockFrom.mockReturnValue(chain);

      const res = await POST(
        makePostRequest('/api/admin/allowlist', {
          fid: 100,
          display_name: 'John Doe',
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
    });

    it('accepts optional pfp_url field', async () => {
      const chain = chainMock({ error: null }).chain;
      mockFrom.mockReturnValue(chain);

      const res = await POST(
        makePostRequest('/api/admin/allowlist', {
          fid: 100,
          pfp_url: 'https://example.com/pfp.jpg',
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
    });

    it('returns 400 when pfp_url is not a valid URL', async () => {
      const res = await POST(
        makePostRequest('/api/admin/allowlist', {
          fid: 100,
          pfp_url: 'not-a-url',
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid input');
      expect(mockFrom).not.toHaveBeenCalled();
    });
  });

  describe('Supabase interaction', () => {
    it('calls supabaseAdmin.from with allowlist table', async () => {
      const chain = chainMock({ error: null }).chain;
      mockFrom.mockReturnValue(chain);

      await POST(makePostRequest('/api/admin/allowlist', { fid: 100 }));

      expect(mockFrom).toHaveBeenCalledWith('allowlist');
    });

    it('inserts entry with correct payload', async () => {
      const chain = chainMock({ error: null }).chain;
      mockFrom.mockReturnValue(chain);

      await POST(
        makePostRequest('/api/admin/allowlist', {
          fid: 100,
          real_name: 'John Doe',
        }),
      );

      const insertCall = vi.mocked(chain.insert);
      expect(insertCall).toHaveBeenCalled();
      const [payload] = insertCall.mock.calls[0] as unknown as [Record<string, unknown>];

      expect(payload).toEqual({
        fid: 100,
        real_name: 'John Doe',
      });
    });

    it('inserts entry with only wallet_address', async () => {
      const chain = chainMock({ error: null }).chain;
      mockFrom.mockReturnValue(chain);

      await POST(
        makePostRequest('/api/admin/allowlist', {
          wallet_address: VALID_WALLET,
        }),
      );

      const insertCall = vi.mocked(chain.insert);
      const [payload] = insertCall.mock.calls[0] as unknown as [Record<string, unknown>];

      expect(payload).toEqual({
        wallet_address: VALID_WALLET,
      });
    });

    it('inserts entry with all fields provided', async () => {
      const chain = chainMock({ error: null }).chain;
      mockFrom.mockReturnValue(chain);

      const entryData = {
        fid: 100,
        wallet_address: VALID_WALLET,
        real_name: 'John Doe',
        ign: 'johndoe',
        notes: 'VIP',
        display_name: 'JD',
        pfp_url: 'https://example.com/pfp.jpg',
        username: 'johndoe123',
        custody_address: VALID_WALLET,
        verified_addresses: ['0xaddr1'],
        ens_name: 'john.eth',
      };

      await POST(makePostRequest('/api/admin/allowlist', entryData));

      const insertCall = vi.mocked(chain.insert);
      const [payload] = insertCall.mock.calls[0] as unknown as [Record<string, unknown>];

      expect(payload).toEqual(entryData);
    });
  });

  describe('audit logging', () => {
    it('logs audit event after successful insert', async () => {
      const chain = chainMock({ error: null }).chain;
      mockFrom.mockReturnValue(chain);

      await POST(
        makePostRequest('/api/admin/allowlist', {
          fid: 100,
          real_name: 'John Doe',
        }),
      );

      expect(mockLogAuditEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          actorFid: 123,
          action: 'allowlist.add',
          targetType: 'allowlist',
          ipAddress: '192.168.1.1',
        }),
      );
    });

    it('includes entry details in audit log', async () => {
      const chain = chainMock({ error: null }).chain;
      mockFrom.mockReturnValue(chain);

      const entryData = {
        fid: 100,
        real_name: 'John Doe',
        notes: 'VIP',
      };

      await POST(makePostRequest('/api/admin/allowlist', entryData));

      expect(mockLogAuditEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          details: { entry: entryData },
        }),
      );
    });

    it('calls getClientIp with the request object', async () => {
      const chain = chainMock({ error: null }).chain;
      mockFrom.mockReturnValue(chain);

      const req = makePostRequest('/api/admin/allowlist', { fid: 100 });

      await POST(req);

      expect(mockGetClientIp).toHaveBeenCalledWith(req);
    });

    it('includes correct admin fid in audit event', async () => {
      mockGetSessionData.mockResolvedValue(mockAdminSession({ fid: 999 }));
      const chain = chainMock({ error: null }).chain;
      mockFrom.mockReturnValue(chain);

      await POST(makePostRequest('/api/admin/allowlist', { fid: 100 }));

      expect(mockLogAuditEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          actorFid: 999,
        }),
      );
    });
  });

  describe('error handling', () => {
    it('returns 409 when entry already exists (unique constraint violation)', async () => {
      const dbError = { code: '23505', message: 'Unique constraint violation' };
      const chain = chainMock({ error: dbError }).chain;
      mockFrom.mockReturnValue(chain);

      const res = await POST(makePostRequest('/api/admin/allowlist', { fid: 100 }));
      const body = await res.json();

      expect(res.status).toBe(409);
      expect(body.error).toBe('Entry already exists');
      expect(mockLogAuditEvent).not.toHaveBeenCalled();
    });

    it('returns 500 when Supabase insert returns other error', async () => {
      const dbError = new Error('Database connection failed');
      const chain = chainMock({ error: dbError }).chain;
      mockFrom.mockReturnValue(chain);

      const res = await POST(makePostRequest('/api/admin/allowlist', { fid: 100 }));
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body.error).toBe('Failed to add entry');
    });

    it('returns 500 when request body is not valid JSON', async () => {
      const malformedReq = new (await import('next/server')).NextRequest(
        new URL('/api/admin/allowlist', 'http://localhost:3000'),
        {
          method: 'POST',
          body: '{invalid json',
        },
      );

      const res = await POST(malformedReq);
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body.error).toBe('Failed to add entry');
    });

    it('logs error to logger.error when exception occurs', async () => {
      const { logger } = await import('@/lib/logger');
      mockFrom.mockImplementation(() => {
        throw new Error('Insert failed');
      });

      await POST(makePostRequest('/api/admin/allowlist', { fid: 100 }));

      expect(vi.mocked(logger.error)).toHaveBeenCalledWith(
        'Add allowlist error:',
        expect.any(Error),
      );
    });

    it('does not log audit event when insert fails', async () => {
      const dbError = new Error('Database error');
      const chain = chainMock({ error: dbError }).chain;
      mockFrom.mockReturnValue(chain);

      await POST(makePostRequest('/api/admin/allowlist', { fid: 100 }));

      expect(mockLogAuditEvent).not.toHaveBeenCalled();
    });

    it('does not expose sensitive error details in response', async () => {
      const dbError = new Error('Connection to db.example.com:5432 failed');
      const chain = chainMock({ error: dbError }).chain;
      mockFrom.mockReturnValue(chain);

      const res = await POST(makePostRequest('/api/admin/allowlist', { fid: 100 }));
      const body = await res.json();

      expect(body.error).toBe('Failed to add entry');
      expect(body.details).toBeUndefined();
      expect(body.errorMessage).toBeUndefined();
    });
  });

  describe('success response', () => {
    it('returns 200 with success true on valid request', async () => {
      const chain = chainMock({ error: null }).chain;
      mockFrom.mockReturnValue(chain);

      const res = await POST(makePostRequest('/api/admin/allowlist', { fid: 100 }));
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      expect(Object.keys(body)).toEqual(['success']);
    });
  });
});

// ============================================================================
// DELETE /api/admin/allowlist
// ============================================================================

describe('DELETE /api/admin/allowlist', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSessionData.mockResolvedValue(mockAdminSession({ fid: 123 }));
    mockGetClientIp.mockReturnValue('192.168.1.1');
  });

  describe('authentication', () => {
    it('returns 401 when unauthenticated', async () => {
      mockGetSessionData.mockResolvedValue(mockUnauthenticatedSession());

      const res = await DELETE(makePostRequest('/api/admin/allowlist', { id: VALID_UUID }));
      const body = await res.json();

      expect(res.status).toBe(401);
      expect(body.error).toBe('Unauthorized');
      expect(mockFrom).not.toHaveBeenCalled();
      expect(mockLogAuditEvent).not.toHaveBeenCalled();
    });

    it('returns 403 when authenticated but not admin', async () => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 456, isAdmin: false }));

      const res = await DELETE(makePostRequest('/api/admin/allowlist', { id: VALID_UUID }));
      const body = await res.json();

      expect(res.status).toBe(403);
      expect(body.error).toBe('Admin access required');
      expect(mockFrom).not.toHaveBeenCalled();
      expect(mockLogAuditEvent).not.toHaveBeenCalled();
    });
  });

  describe('input validation', () => {
    it('returns 400 when id is missing', async () => {
      const res = await DELETE(makePostRequest('/api/admin/allowlist', {}));
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid input');
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it('returns 400 when id is not a valid UUID', async () => {
      const res = await DELETE(makePostRequest('/api/admin/allowlist', { id: 'not-a-uuid' }));
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid input');
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it('accepts valid UUID v4 format', async () => {
      const chain = chainMock({ error: null }).chain;
      mockFrom.mockReturnValue(chain);

      const res = await DELETE(makePostRequest('/api/admin/allowlist', { id: VALID_UUID }));
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
    });
  });

  describe('Supabase interaction', () => {
    it('calls supabaseAdmin.from with allowlist table', async () => {
      const chain = chainMock({ error: null }).chain;
      mockFrom.mockReturnValue(chain);

      await DELETE(makePostRequest('/api/admin/allowlist', { id: VALID_UUID }));

      expect(mockFrom).toHaveBeenCalledWith('allowlist');
    });

    it('deletes entry with correct id', async () => {
      const chain = chainMock({ error: null }).chain;
      mockFrom.mockReturnValue(chain);

      await DELETE(makePostRequest('/api/admin/allowlist', { id: VALID_UUID }));

      const eqCall = vi.mocked(chain.eq);
      expect(eqCall).toHaveBeenCalledWith('id', VALID_UUID);
    });

    it('performs delete operation on filtered query', async () => {
      const chain = chainMock({ error: null }).chain;
      mockFrom.mockReturnValue(chain);

      await DELETE(makePostRequest('/api/admin/allowlist', { id: VALID_UUID }));

      const deleteCall = vi.mocked(chain.delete);
      expect(deleteCall).toHaveBeenCalled();
    });
  });

  describe('audit logging', () => {
    it('logs audit event after successful delete', async () => {
      const chain = chainMock({ error: null }).chain;
      mockFrom.mockReturnValue(chain);

      await DELETE(makePostRequest('/api/admin/allowlist', { id: VALID_UUID }));

      expect(mockLogAuditEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          actorFid: 123,
          action: 'allowlist.remove',
          targetType: 'allowlist',
          targetId: VALID_UUID,
          ipAddress: '192.168.1.1',
        }),
      );
    });

    it('calls getClientIp with the request object', async () => {
      const chain = chainMock({ error: null }).chain;
      mockFrom.mockReturnValue(chain);

      const req = makePostRequest('/api/admin/allowlist', { id: VALID_UUID });

      await DELETE(req);

      expect(mockGetClientIp).toHaveBeenCalledWith(req);
    });

    it('includes correct admin fid in audit event', async () => {
      mockGetSessionData.mockResolvedValue(mockAdminSession({ fid: 999 }));
      const chain = chainMock({ error: null }).chain;
      mockFrom.mockReturnValue(chain);

      await DELETE(makePostRequest('/api/admin/allowlist', { id: VALID_UUID }));

      expect(mockLogAuditEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          actorFid: 999,
        }),
      );
    });
  });

  describe('error handling', () => {
    it('returns 500 when Supabase delete returns an error', async () => {
      const dbError = new Error('Database error');
      const chain = chainMock({ error: dbError }).chain;
      mockFrom.mockReturnValue(chain);

      const res = await DELETE(makePostRequest('/api/admin/allowlist', { id: VALID_UUID }));
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body.error).toBe('Failed to remove entry');
      expect(mockLogAuditEvent).not.toHaveBeenCalled();
    });

    it('returns 500 when request body is not valid JSON', async () => {
      const malformedReq = new (await import('next/server')).NextRequest(
        new URL('/api/admin/allowlist', 'http://localhost:3000'),
        {
          method: 'DELETE',
          body: '{invalid json',
        },
      );

      const res = await DELETE(malformedReq);
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body.error).toBe('Failed to remove entry');
    });

    it('logs error to logger.error when exception occurs', async () => {
      const { logger } = await import('@/lib/logger');
      mockFrom.mockImplementation(() => {
        throw new Error('Delete failed');
      });

      await DELETE(makePostRequest('/api/admin/allowlist', { id: VALID_UUID }));

      expect(vi.mocked(logger.error)).toHaveBeenCalledWith(
        'Remove allowlist error:',
        expect.any(Error),
      );
    });

    it('does not log audit event when delete fails', async () => {
      const dbError = new Error('Database error');
      const chain = chainMock({ error: dbError }).chain;
      mockFrom.mockReturnValue(chain);

      await DELETE(makePostRequest('/api/admin/allowlist', { id: VALID_UUID }));

      expect(mockLogAuditEvent).not.toHaveBeenCalled();
    });

    it('does not expose sensitive error details in response', async () => {
      const dbError = new Error('Connection to db.example.com failed');
      const chain = chainMock({ error: dbError }).chain;
      mockFrom.mockReturnValue(chain);

      const res = await DELETE(makePostRequest('/api/admin/allowlist', { id: VALID_UUID }));
      const body = await res.json();

      expect(body.error).toBe('Failed to remove entry');
      expect(body.details).toBeUndefined();
      expect(body.errorMessage).toBeUndefined();
    });
  });

  describe('success response', () => {
    it('returns 200 with success true on valid request', async () => {
      const chain = chainMock({ error: null }).chain;
      mockFrom.mockReturnValue(chain);

      const res = await DELETE(makePostRequest('/api/admin/allowlist', { id: VALID_UUID }));
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      expect(Object.keys(body)).toEqual(['success']);
    });
  });
});
