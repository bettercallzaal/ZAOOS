import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  chainMock,
  makePostRequest,
  mockAdminSession,
  mockAuthenticatedSession,
  mockUnauthenticatedSession,
  VALID_UUID,
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

import { DELETE, GET, POST, PUT } from '../route';

// ============================================================================
// GET /api/admin/nexus
// ============================================================================

describe('GET /api/admin/nexus', () => {
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
    it('queries nexus_links table with correct ordering', async () => {
      const chain = chainMock({ data: [], error: null }).chain;
      mockFrom.mockReturnValue(chain);

      await GET();

      expect(mockFrom).toHaveBeenCalledWith('nexus_links');
      expect(chain.select).toHaveBeenCalledWith('*');
      expect(chain.order).toHaveBeenNthCalledWith(1, 'category');
      expect(chain.order).toHaveBeenNthCalledWith(2, 'subcategory');
      expect(chain.order).toHaveBeenNthCalledWith(3, 'sort_order');
    });

    it('returns 500 when nexus_links query fails', async () => {
      const dbError = new Error('Database connection failed');
      const chain = chainMock({ data: null, error: dbError }).chain;
      mockFrom.mockReturnValue(chain);

      const res = await GET();
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body.error).toBe('Failed to fetch links');
    });

    it('returns 500 when exception is thrown during fetch', async () => {
      mockFrom.mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      const res = await GET();
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body.error).toBe('Failed to fetch links');
    });
  });

  describe('category and subcategory extraction', () => {
    it('returns empty categories and subcategories when no links', async () => {
      const chain = chainMock({ data: [], error: null }).chain;
      mockFrom.mockReturnValue(chain);

      const res = await GET();
      const body = await res.json();

      expect(body.categories).toEqual([]);
      expect(body.subcategories).toEqual([]);
    });

    it('extracts unique categories from links', async () => {
      const data = [
        { id: VALID_UUID, category: 'Music', subcategory: 'Streaming' },
        { id: VALID_UUID, category: 'Music', subcategory: 'Artists' },
        { id: VALID_UUID, category: 'Social', subcategory: 'Networks' },
      ];
      const chain = chainMock({ data, error: null }).chain;
      mockFrom.mockReturnValue(chain);

      const res = await GET();
      const body = await res.json();

      expect(body.categories).toEqual(['Music', 'Social']);
    });

    it('extracts unique subcategories from links', async () => {
      const data = [
        { id: VALID_UUID, category: 'Music', subcategory: 'Streaming' },
        { id: VALID_UUID, category: 'Music', subcategory: 'Artists' },
        { id: VALID_UUID, category: 'Social', subcategory: 'Streaming' },
      ];
      const chain = chainMock({ data, error: null }).chain;
      mockFrom.mockReturnValue(chain);

      const res = await GET();
      const body = await res.json();

      expect(body.subcategories).toEqual(['Streaming', 'Artists']);
    });
  });

  describe('success response', () => {
    it('returns 200 with links array and metadata', async () => {
      const data = [
        {
          id: VALID_UUID,
          title: 'Test Link',
          url: 'https://example.com',
          category: 'Music',
          subcategory: 'Streaming',
        },
      ];
      const chain = chainMock({ data, error: null }).chain;
      mockFrom.mockReturnValue(chain);

      const res = await GET();
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.links).toEqual(data);
      expect(body.count).toBe(1);
      expect(body.categories).toBeDefined();
      expect(body.subcategories).toBeDefined();
    });

    it('returns count of zero for empty link list', async () => {
      const chain = chainMock({ data: [], error: null }).chain;
      mockFrom.mockReturnValue(chain);

      const res = await GET();
      const body = await res.json();

      expect(body.count).toBe(0);
      expect(body.links).toEqual([]);
    });

    it('logs error to logger.error when exception occurs', async () => {
      const { logger } = await import('@/lib/logger');
      mockFrom.mockImplementation(() => {
        throw new Error('Fetch failed');
      });

      await GET();

      expect(vi.mocked(logger.error)).toHaveBeenCalledWith(
        'Nexus admin fetch error:',
        expect.any(Error),
      );
    });
  });
});

// ============================================================================
// POST /api/admin/nexus
// ============================================================================

describe('POST /api/admin/nexus', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSessionData.mockResolvedValue(mockAdminSession({ fid: 123 }));
    mockGetClientIp.mockReturnValue('192.168.1.1');
  });

  describe('authentication', () => {
    it('returns 401 when unauthenticated', async () => {
      mockGetSessionData.mockResolvedValue(mockUnauthenticatedSession());

      const res = await POST(
        makePostRequest('/api/admin/nexus', {
          title: 'Test',
          url: 'https://example.com',
          category: 'Music',
          subcategory: 'Streaming',
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(401);
      expect(body.error).toBe('Unauthorized');
      expect(mockFrom).not.toHaveBeenCalled();
      expect(mockLogAuditEvent).not.toHaveBeenCalled();
    });

    it('returns 403 when authenticated but not admin', async () => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 456, isAdmin: false }));

      const res = await POST(
        makePostRequest('/api/admin/nexus', {
          title: 'Test',
          url: 'https://example.com',
          category: 'Music',
          subcategory: 'Streaming',
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(403);
      expect(body.error).toBe('Admin access required');
      expect(mockFrom).not.toHaveBeenCalled();
      expect(mockLogAuditEvent).not.toHaveBeenCalled();
    });
  });

  describe('input validation', () => {
    it('returns 400 when title is missing', async () => {
      const res = await POST(
        makePostRequest('/api/admin/nexus', {
          url: 'https://example.com',
          category: 'Music',
          subcategory: 'Streaming',
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid input');
      expect(body.details).toBeDefined();
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it('returns 400 when title is empty string', async () => {
      const res = await POST(
        makePostRequest('/api/admin/nexus', {
          title: '',
          url: 'https://example.com',
          category: 'Music',
          subcategory: 'Streaming',
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid input');
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it('returns 400 when title exceeds 200 characters', async () => {
      const longTitle = 'a'.repeat(201);
      const res = await POST(
        makePostRequest('/api/admin/nexus', {
          title: longTitle,
          url: 'https://example.com',
          category: 'Music',
          subcategory: 'Streaming',
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid input');
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it('accepts title with exactly 200 characters', async () => {
      const maxTitle = 'a'.repeat(200);
      const chain = chainMock({
        data: { id: VALID_UUID, title: maxTitle },
        error: null,
      }).chain;
      mockFrom.mockReturnValue(chain);

      const res = await POST(
        makePostRequest('/api/admin/nexus', {
          title: maxTitle,
          url: 'https://example.com',
          category: 'Music',
          subcategory: 'Streaming',
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.link).toBeDefined();
    });

    it('returns 400 when url is missing', async () => {
      const res = await POST(
        makePostRequest('/api/admin/nexus', {
          title: 'Test Link',
          category: 'Music',
          subcategory: 'Streaming',
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid input');
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it('returns 400 when url is not a valid URL', async () => {
      const res = await POST(
        makePostRequest('/api/admin/nexus', {
          title: 'Test Link',
          url: 'not-a-url',
          category: 'Music',
          subcategory: 'Streaming',
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid input');
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it('returns 400 when category is missing', async () => {
      const res = await POST(
        makePostRequest('/api/admin/nexus', {
          title: 'Test Link',
          url: 'https://example.com',
          subcategory: 'Streaming',
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid input');
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it('returns 400 when category is empty string', async () => {
      const res = await POST(
        makePostRequest('/api/admin/nexus', {
          title: 'Test Link',
          url: 'https://example.com',
          category: '',
          subcategory: 'Streaming',
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid input');
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it('returns 400 when category exceeds 100 characters', async () => {
      const longCategory = 'a'.repeat(101);
      const res = await POST(
        makePostRequest('/api/admin/nexus', {
          title: 'Test Link',
          url: 'https://example.com',
          category: longCategory,
          subcategory: 'Streaming',
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid input');
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it('returns 400 when subcategory is missing', async () => {
      const res = await POST(
        makePostRequest('/api/admin/nexus', {
          title: 'Test Link',
          url: 'https://example.com',
          category: 'Music',
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid input');
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it('returns 400 when subcategory exceeds 100 characters', async () => {
      const longSubcategory = 'a'.repeat(101);
      const res = await POST(
        makePostRequest('/api/admin/nexus', {
          title: 'Test Link',
          url: 'https://example.com',
          category: 'Music',
          subcategory: longSubcategory,
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid input');
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it('accepts optional description field', async () => {
      const chain = chainMock({
        data: { id: VALID_UUID },
        error: null,
      }).chain;
      mockFrom.mockReturnValue(chain);

      const res = await POST(
        makePostRequest('/api/admin/nexus', {
          title: 'Test Link',
          url: 'https://example.com',
          category: 'Music',
          subcategory: 'Streaming',
          description: 'A test link description',
        }),
      );

      expect(res.status).toBe(200);
    });

    it('returns 400 when description exceeds 500 characters', async () => {
      const longDescription = 'a'.repeat(501);
      const res = await POST(
        makePostRequest('/api/admin/nexus', {
          title: 'Test Link',
          url: 'https://example.com',
          category: 'Music',
          subcategory: 'Streaming',
          description: longDescription,
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid input');
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it('accepts optional icon field', async () => {
      const chain = chainMock({
        data: { id: VALID_UUID },
        error: null,
      }).chain;
      mockFrom.mockReturnValue(chain);

      const res = await POST(
        makePostRequest('/api/admin/nexus', {
          title: 'Test Link',
          url: 'https://example.com',
          category: 'Music',
          subcategory: 'Streaming',
          icon: '🎵',
        }),
      );

      expect(res.status).toBe(200);
    });

    it('returns 400 when icon exceeds 50 characters', async () => {
      const longIcon = 'a'.repeat(51);
      const res = await POST(
        makePostRequest('/api/admin/nexus', {
          title: 'Test Link',
          url: 'https://example.com',
          category: 'Music',
          subcategory: 'Streaming',
          icon: longIcon,
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid input');
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it('accepts valid portal_group enum values', async () => {
      const chain = chainMock({
        data: { id: VALID_UUID },
        error: null,
      }).chain;
      mockFrom.mockReturnValue(chain);

      const validGroups = ['MUSIC', 'SOCIAL', 'BUILD', 'EARN', 'GOVERN', 'VIP'];

      for (const group of validGroups) {
        vi.clearAllMocks();
        mockFrom.mockReturnValue(chain);
        mockGetSessionData.mockResolvedValue(mockAdminSession({ fid: 123 }));

        const res = await POST(
          makePostRequest('/api/admin/nexus', {
            title: 'Test Link',
            url: 'https://example.com',
            category: 'Music',
            subcategory: 'Streaming',
            portal_group: group as never,
          }),
        );

        expect(res.status).toBe(200);
      }
    });

    it('returns 400 when portal_group is invalid enum value', async () => {
      const res = await POST(
        makePostRequest('/api/admin/nexus', {
          title: 'Test Link',
          url: 'https://example.com',
          category: 'Music',
          subcategory: 'Streaming',
          portal_group: 'INVALID',
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid input');
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it('returns 400 when sort_order is negative', async () => {
      const res = await POST(
        makePostRequest('/api/admin/nexus', {
          title: 'Test Link',
          url: 'https://example.com',
          category: 'Music',
          subcategory: 'Streaming',
          sort_order: -1,
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid input');
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it('returns 400 when sort_order is not an integer', async () => {
      const res = await POST(
        makePostRequest('/api/admin/nexus', {
          title: 'Test Link',
          url: 'https://example.com',
          category: 'Music',
          subcategory: 'Streaming',
          sort_order: 1.5,
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid input');
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it('defaults sort_order to 0 when not provided', async () => {
      const chain = chainMock({
        data: { id: VALID_UUID, sort_order: 0 },
        error: null,
      }).chain;
      mockFrom.mockReturnValue(chain);

      const res = await POST(
        makePostRequest('/api/admin/nexus', {
          title: 'Test Link',
          url: 'https://example.com',
          category: 'Music',
          subcategory: 'Streaming',
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.link).toBeDefined();
    });

    it('accepts is_featured boolean field', async () => {
      const chain = chainMock({
        data: { id: VALID_UUID, is_featured: true },
        error: null,
      }).chain;
      mockFrom.mockReturnValue(chain);

      const res = await POST(
        makePostRequest('/api/admin/nexus', {
          title: 'Test Link',
          url: 'https://example.com',
          category: 'Music',
          subcategory: 'Streaming',
          is_featured: true,
        }),
      );

      expect(res.status).toBe(200);
    });

    it('accepts is_active boolean field', async () => {
      const chain = chainMock({
        data: { id: VALID_UUID, is_active: true },
        error: null,
      }).chain;
      mockFrom.mockReturnValue(chain);

      const res = await POST(
        makePostRequest('/api/admin/nexus', {
          title: 'Test Link',
          url: 'https://example.com',
          category: 'Music',
          subcategory: 'Streaming',
          is_active: false,
        }),
      );

      expect(res.status).toBe(200);
    });

    it('accepts tags array field', async () => {
      const chain = chainMock({
        data: { id: VALID_UUID, tags: ['tag1', 'tag2'] },
        error: null,
      }).chain;
      mockFrom.mockReturnValue(chain);

      const res = await POST(
        makePostRequest('/api/admin/nexus', {
          title: 'Test Link',
          url: 'https://example.com',
          category: 'Music',
          subcategory: 'Streaming',
          tags: ['tag1', 'tag2'],
        }),
      );

      expect(res.status).toBe(200);
    });
  });

  describe('Supabase interaction', () => {
    it('calls supabaseAdmin.from with nexus_links table', async () => {
      const chain = chainMock({
        data: { id: VALID_UUID },
        error: null,
      }).chain;
      mockFrom.mockReturnValue(chain);

      await POST(
        makePostRequest('/api/admin/nexus', {
          title: 'Test Link',
          url: 'https://example.com',
          category: 'Music',
          subcategory: 'Streaming',
        }),
      );

      expect(mockFrom).toHaveBeenCalledWith('nexus_links');
    });

    it('inserts link with correct payload including added_by', async () => {
      const chain = chainMock({
        data: { id: VALID_UUID },
        error: null,
      }).chain;
      mockFrom.mockReturnValue(chain);

      await POST(
        makePostRequest('/api/admin/nexus', {
          title: 'Test Link',
          url: 'https://example.com',
          category: 'Music',
          subcategory: 'Streaming',
        }),
      );

      const insertCall = vi.mocked(chain.insert);
      expect(insertCall).toHaveBeenCalled();
      const [payload] = insertCall.mock.calls[0] as unknown as [Record<string, unknown>];

      expect(payload).toEqual(
        expect.objectContaining({
          title: 'Test Link',
          url: 'https://example.com',
          category: 'Music',
          subcategory: 'Streaming',
          added_by: 'fid:123',
        }),
      );
    });

    it('inserts link with all optional fields', async () => {
      const chain = chainMock({
        data: { id: VALID_UUID },
        error: null,
      }).chain;
      mockFrom.mockReturnValue(chain);

      await POST(
        makePostRequest('/api/admin/nexus', {
          title: 'Test Link',
          url: 'https://example.com',
          category: 'Music',
          subcategory: 'Streaming',
          description: 'A test link',
          icon: '🎵',
          portal_group: 'MUSIC',
          sort_order: 5,
          is_featured: true,
          is_active: true,
          is_gated: false,
          tags: ['test'],
        }),
      );

      const insertCall = vi.mocked(chain.insert);
      const [payload] = insertCall.mock.calls[0] as unknown as [Record<string, unknown>];

      expect(payload).toEqual(
        expect.objectContaining({
          title: 'Test Link',
          url: 'https://example.com',
          description: 'A test link',
          icon: '🎵',
          portal_group: 'MUSIC',
          sort_order: 5,
          is_featured: true,
          is_active: true,
          is_gated: false,
          tags: ['test'],
        }),
      );
    });

    it('calls .select() and .single() on insert', async () => {
      const chain = chainMock({
        data: { id: VALID_UUID },
        error: null,
      }).chain;
      mockFrom.mockReturnValue(chain);

      await POST(
        makePostRequest('/api/admin/nexus', {
          title: 'Test Link',
          url: 'https://example.com',
          category: 'Music',
          subcategory: 'Streaming',
        }),
      );

      expect(chain.select).toHaveBeenCalledWith();
      expect(chain.single).toHaveBeenCalled();
    });
  });

  describe('audit logging', () => {
    it('logs audit event after successful insert', async () => {
      const chain = chainMock({
        data: { id: VALID_UUID },
        error: null,
      }).chain;
      mockFrom.mockReturnValue(chain);

      await POST(
        makePostRequest('/api/admin/nexus', {
          title: 'Test Link',
          url: 'https://example.com',
          category: 'Music',
          subcategory: 'Streaming',
        }),
      );

      expect(mockLogAuditEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          actorFid: 123,
          action: 'nexus.add',
          targetType: 'nexus_link',
          targetId: VALID_UUID,
          details: {
            title: 'Test Link',
            url: 'https://example.com',
          },
          ipAddress: '192.168.1.1',
        }),
      );
    });

    it('calls getClientIp with the request object', async () => {
      const chain = chainMock({
        data: { id: VALID_UUID },
        error: null,
      }).chain;
      mockFrom.mockReturnValue(chain);

      const req = makePostRequest('/api/admin/nexus', {
        title: 'Test Link',
        url: 'https://example.com',
        category: 'Music',
        subcategory: 'Streaming',
      });

      await POST(req);

      expect(mockGetClientIp).toHaveBeenCalledWith(req);
    });

    it('does not log audit event when insert fails', async () => {
      const dbError = new Error('Database error');
      const chain = chainMock({ error: dbError }).chain;
      mockFrom.mockReturnValue(chain);

      await POST(
        makePostRequest('/api/admin/nexus', {
          title: 'Test Link',
          url: 'https://example.com',
          category: 'Music',
          subcategory: 'Streaming',
        }),
      );

      expect(mockLogAuditEvent).not.toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('returns 500 when Supabase insert returns error', async () => {
      const dbError = new Error('Database connection failed');
      const chain = chainMock({ error: dbError }).chain;
      mockFrom.mockReturnValue(chain);

      const res = await POST(
        makePostRequest('/api/admin/nexus', {
          title: 'Test Link',
          url: 'https://example.com',
          category: 'Music',
          subcategory: 'Streaming',
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body.error).toBe('Failed to add link');
    });

    it('returns 500 when request body is not valid JSON', async () => {
      const malformedReq = new (await import('next/server')).NextRequest(
        new URL('/api/admin/nexus', 'http://localhost:3000'),
        {
          method: 'POST',
          body: '{invalid json',
        },
      );

      const res = await POST(malformedReq);
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body.error).toBe('Failed to add link');
    });

    it('logs error to logger.error when exception occurs', async () => {
      const { logger } = await import('@/lib/logger');
      mockFrom.mockImplementation(() => {
        throw new Error('Insert failed');
      });

      await POST(
        makePostRequest('/api/admin/nexus', {
          title: 'Test Link',
          url: 'https://example.com',
          category: 'Music',
          subcategory: 'Streaming',
        }),
      );

      expect(vi.mocked(logger.error)).toHaveBeenCalledWith('Nexus add error:', expect.any(Error));
    });
  });

  describe('success response', () => {
    it('returns 200 with link data on valid request', async () => {
      const linkData = { id: VALID_UUID, title: 'Test Link' };
      const chain = chainMock({
        data: linkData,
        error: null,
      }).chain;
      mockFrom.mockReturnValue(chain);

      const res = await POST(
        makePostRequest('/api/admin/nexus', {
          title: 'Test Link',
          url: 'https://example.com',
          category: 'Music',
          subcategory: 'Streaming',
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.link).toEqual(linkData);
    });
  });
});

// ============================================================================
// PUT /api/admin/nexus (Update & Reorder)
// ============================================================================

describe('PUT /api/admin/nexus', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSessionData.mockResolvedValue(mockAdminSession({ fid: 123 }));
    mockGetClientIp.mockReturnValue('192.168.1.1');
  });

  describe('authentication', () => {
    it('returns 401 when unauthenticated on single update', async () => {
      mockGetSessionData.mockResolvedValue(mockUnauthenticatedSession());

      const res = await PUT(
        makePostRequest('/api/admin/nexus', {
          id: VALID_UUID,
          title: 'Updated Title',
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(401);
      expect(body.error).toBe('Unauthorized');
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it('returns 403 when non-admin on single update', async () => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 456, isAdmin: false }));

      const res = await PUT(
        makePostRequest('/api/admin/nexus', {
          id: VALID_UUID,
          title: 'Updated Title',
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(403);
      expect(body.error).toBe('Admin access required');
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it('returns 401 when unauthenticated on reorder', async () => {
      mockGetSessionData.mockResolvedValue(mockUnauthenticatedSession());

      const res = await PUT(
        makePostRequest('/api/admin/nexus', {
          updates: [
            { id: VALID_UUID, sort_order: 1 },
            { id: VALID_UUID, sort_order: 2 },
          ],
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(401);
      expect(body.error).toBe('Unauthorized');
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it('returns 403 when non-admin on reorder', async () => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 456, isAdmin: false }));

      const res = await PUT(
        makePostRequest('/api/admin/nexus', {
          updates: [{ id: VALID_UUID, sort_order: 1 }],
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(403);
      expect(body.error).toBe('Admin access required');
      expect(mockFrom).not.toHaveBeenCalled();
    });
  });

  describe('reorder operation', () => {
    it('detects reorder operation by presence of updates array', async () => {
      const chain = chainMock({ error: null }).chain;
      mockFrom.mockReturnValue(chain);

      await PUT(
        makePostRequest('/api/admin/nexus', {
          updates: [{ id: VALID_UUID, sort_order: 1 }],
        }),
      );

      expect(mockFrom).toHaveBeenCalled();
    });

    it('returns 400 when updates array has invalid structure', async () => {
      const res = await PUT(
        makePostRequest('/api/admin/nexus', {
          updates: [{ id: 'not-uuid', sort_order: 1 }],
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid reorder input');
      expect(body.details).toBeDefined();
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it('returns 400 when sort_order is negative in reorder', async () => {
      const res = await PUT(
        makePostRequest('/api/admin/nexus', {
          updates: [{ id: VALID_UUID, sort_order: -1 }],
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid reorder input');
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it('updates multiple links with Promise.allSettled', async () => {
      const chain = chainMock({ error: null }).chain;
      mockFrom.mockReturnValue(chain);

      await PUT(
        makePostRequest('/api/admin/nexus', {
          updates: [
            { id: VALID_UUID, sort_order: 1 },
            { id: VALID_UUID, sort_order: 2 },
          ],
        }),
      );

      expect(mockFrom).toHaveBeenCalledTimes(2);
    });

    it('returns 500 when any reorder update fails', async () => {
      // Create a chain that rejects when awaited (for Promise.allSettled)
      mockFrom.mockImplementation(() => {
        return Promise.reject(new Error('Update failed'));
      });

      const res = await PUT(
        makePostRequest('/api/admin/nexus', {
          updates: [{ id: VALID_UUID, sort_order: 1 }],
        }),
      );
      const body = await res.json();

      // Route checks for rejected promises in allSettled results
      expect(res.status).toBe(500);
      expect(body.error).toMatch(/[Ff]ailed/);
    });

    it('returns success with updated count on successful reorder', async () => {
      const chain = chainMock({ error: null }).chain;
      mockFrom.mockReturnValue(chain);

      const res = await PUT(
        makePostRequest('/api/admin/nexus', {
          updates: [
            { id: VALID_UUID, sort_order: 1 },
            { id: VALID_UUID, sort_order: 2 },
            { id: VALID_UUID, sort_order: 3 },
          ],
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.updated).toBe(3);
    });
  });

  describe('single link update', () => {
    it('returns 400 when id is missing in update', async () => {
      const res = await PUT(
        makePostRequest('/api/admin/nexus', {
          title: 'Updated Title',
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid input');
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it('returns 400 when id is not valid UUID', async () => {
      const res = await PUT(
        makePostRequest('/api/admin/nexus', {
          id: 'not-uuid',
          title: 'Updated Title',
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid input');
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it('allows partial updates with only some fields', async () => {
      const chain = chainMock({
        data: { id: VALID_UUID, title: 'Updated Title' },
        error: null,
      }).chain;
      mockFrom.mockReturnValue(chain);

      const res = await PUT(
        makePostRequest('/api/admin/nexus', {
          id: VALID_UUID,
          title: 'Updated Title',
        }),
      );

      expect(res.status).toBe(200);
    });

    it('updates title field', async () => {
      const chain = chainMock({
        data: { id: VALID_UUID },
        error: null,
      }).chain;
      mockFrom.mockReturnValue(chain);

      await PUT(
        makePostRequest('/api/admin/nexus', {
          id: VALID_UUID,
          title: 'New Title',
        }),
      );

      const updateCall = vi.mocked(chain.update);
      expect(updateCall).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'New Title',
          updated_at: expect.any(String),
        }),
      );
    });

    it('updates sort_order field', async () => {
      const chain = chainMock({
        data: { id: VALID_UUID },
        error: null,
      }).chain;
      mockFrom.mockReturnValue(chain);

      await PUT(
        makePostRequest('/api/admin/nexus', {
          id: VALID_UUID,
          sort_order: 10,
        }),
      );

      const updateCall = vi.mocked(chain.update);
      expect(updateCall).toHaveBeenCalledWith(
        expect.objectContaining({
          sort_order: 10,
        }),
      );
    });

    it('returns 500 when update fails', async () => {
      const dbError = new Error('Update failed');
      const chain = chainMock({ error: dbError }).chain;
      mockFrom.mockReturnValue(chain);

      const res = await PUT(
        makePostRequest('/api/admin/nexus', {
          id: VALID_UUID,
          title: 'Updated Title',
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body.error).toBe('Failed to update link');
    });

    it('logs audit event on successful update', async () => {
      const chain = chainMock({
        data: { id: VALID_UUID },
        error: null,
      }).chain;
      mockFrom.mockReturnValue(chain);

      await PUT(
        makePostRequest('/api/admin/nexus', {
          id: VALID_UUID,
          title: 'Updated Title',
          description: 'Updated description',
        }),
      );

      expect(mockLogAuditEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          actorFid: 123,
          action: 'nexus.update',
          targetType: 'nexus_link',
          targetId: VALID_UUID,
          ipAddress: '192.168.1.1',
        }),
      );

      // Verify that the details object contains at least the fields we sent
      const call = vi.mocked(mockLogAuditEvent).mock.calls[0];
      const details = (call[0] as Record<string, unknown>).details as Record<string, unknown>;
      expect(details.title).toBe('Updated Title');
      expect(details.description).toBe('Updated description');
    });

    it('does not log audit event when update fails', async () => {
      const chain = chainMock({ error: new Error('Error') }).chain;
      mockFrom.mockReturnValue(chain);

      await PUT(
        makePostRequest('/api/admin/nexus', {
          id: VALID_UUID,
          title: 'Updated Title',
        }),
      );

      expect(mockLogAuditEvent).not.toHaveBeenCalled();
    });

    it('returns 200 with updated link data', async () => {
      const linkData = { id: VALID_UUID, title: 'Updated Title' };
      const chain = chainMock({
        data: linkData,
        error: null,
      }).chain;
      mockFrom.mockReturnValue(chain);

      const res = await PUT(
        makePostRequest('/api/admin/nexus', {
          id: VALID_UUID,
          title: 'Updated Title',
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.link).toEqual(linkData);
    });
  });

  describe('error handling', () => {
    it('logs error to logger.error when exception occurs', async () => {
      const { logger } = await import('@/lib/logger');
      mockFrom.mockImplementation(() => {
        throw new Error('Update failed');
      });

      await PUT(
        makePostRequest('/api/admin/nexus', {
          id: VALID_UUID,
          title: 'Updated Title',
        }),
      );

      expect(vi.mocked(logger.error)).toHaveBeenCalledWith(
        'Nexus update error:',
        expect.any(Error),
      );
    });

    it('does not expose sensitive error details in response', async () => {
      const dbError = new Error('Connection to db.example.com failed');
      const chain = chainMock({ error: dbError }).chain;
      mockFrom.mockReturnValue(chain);

      const res = await PUT(
        makePostRequest('/api/admin/nexus', {
          id: VALID_UUID,
          title: 'Updated Title',
        }),
      );
      const body = await res.json();

      expect(body.error).toBe('Failed to update link');
      expect(body.details).toBeUndefined();
    });
  });
});

// ============================================================================
// DELETE /api/admin/nexus
// ============================================================================

describe('DELETE /api/admin/nexus', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSessionData.mockResolvedValue(mockAdminSession({ fid: 123 }));
    mockGetClientIp.mockReturnValue('192.168.1.1');
  });

  describe('authentication', () => {
    it('returns 401 when unauthenticated', async () => {
      mockGetSessionData.mockResolvedValue(mockUnauthenticatedSession());

      const res = await DELETE(makePostRequest('/api/admin/nexus', { id: VALID_UUID }));
      const body = await res.json();

      expect(res.status).toBe(401);
      expect(body.error).toBe('Unauthorized');
      expect(mockFrom).not.toHaveBeenCalled();
      expect(mockLogAuditEvent).not.toHaveBeenCalled();
    });

    it('returns 403 when authenticated but not admin', async () => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 456, isAdmin: false }));

      const res = await DELETE(makePostRequest('/api/admin/nexus', { id: VALID_UUID }));
      const body = await res.json();

      expect(res.status).toBe(403);
      expect(body.error).toBe('Admin access required');
      expect(mockFrom).not.toHaveBeenCalled();
      expect(mockLogAuditEvent).not.toHaveBeenCalled();
    });
  });

  describe('input validation', () => {
    it('returns 400 when id is missing', async () => {
      const res = await DELETE(makePostRequest('/api/admin/nexus', {}));
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid input');
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it('returns 400 when id is not a valid UUID', async () => {
      const res = await DELETE(makePostRequest('/api/admin/nexus', { id: 'not-a-uuid' }));
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid input');
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it('accepts valid UUID v4 format', async () => {
      const chain = chainMock({ error: null }).chain;
      mockFrom.mockReturnValue(chain);

      const res = await DELETE(makePostRequest('/api/admin/nexus', { id: VALID_UUID }));
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
    });
  });

  describe('Supabase interaction', () => {
    it('calls supabaseAdmin.from with nexus_links table', async () => {
      const chain = chainMock({ error: null }).chain;
      mockFrom.mockReturnValue(chain);

      await DELETE(makePostRequest('/api/admin/nexus', { id: VALID_UUID }));

      expect(mockFrom).toHaveBeenCalledWith('nexus_links');
    });

    it('deletes entry with correct id', async () => {
      const chain = chainMock({ error: null }).chain;
      mockFrom.mockReturnValue(chain);

      await DELETE(makePostRequest('/api/admin/nexus', { id: VALID_UUID }));

      const eqCall = vi.mocked(chain.eq);
      expect(eqCall).toHaveBeenCalledWith('id', VALID_UUID);
    });

    it('performs delete operation', async () => {
      const chain = chainMock({ error: null }).chain;
      mockFrom.mockReturnValue(chain);

      await DELETE(makePostRequest('/api/admin/nexus', { id: VALID_UUID }));

      const deleteCall = vi.mocked(chain.delete);
      expect(deleteCall).toHaveBeenCalled();
    });
  });

  describe('audit logging', () => {
    it('logs audit event after successful delete', async () => {
      const chain = chainMock({ error: null }).chain;
      mockFrom.mockReturnValue(chain);

      await DELETE(makePostRequest('/api/admin/nexus', { id: VALID_UUID }));

      expect(mockLogAuditEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          actorFid: 123,
          action: 'nexus.delete',
          targetType: 'nexus_link',
          targetId: VALID_UUID,
          ipAddress: '192.168.1.1',
        }),
      );
    });

    it('calls getClientIp with the request object', async () => {
      const chain = chainMock({ error: null }).chain;
      mockFrom.mockReturnValue(chain);

      const req = makePostRequest('/api/admin/nexus', { id: VALID_UUID });

      await DELETE(req);

      expect(mockGetClientIp).toHaveBeenCalledWith(req);
    });

    it('includes correct admin fid in audit event', async () => {
      mockGetSessionData.mockResolvedValue(mockAdminSession({ fid: 999 }));
      const chain = chainMock({ error: null }).chain;
      mockFrom.mockReturnValue(chain);

      await DELETE(makePostRequest('/api/admin/nexus', { id: VALID_UUID }));

      expect(mockLogAuditEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          actorFid: 999,
        }),
      );
    });
  });

  describe('error handling', () => {
    it('returns 500 when Supabase delete returns error', async () => {
      const dbError = new Error('Database error');
      const chain = chainMock({ error: dbError }).chain;
      mockFrom.mockReturnValue(chain);

      const res = await DELETE(makePostRequest('/api/admin/nexus', { id: VALID_UUID }));
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body.error).toBe('Failed to delete link');
      expect(mockLogAuditEvent).not.toHaveBeenCalled();
    });

    it('returns 500 when request body is not valid JSON', async () => {
      const malformedReq = new (await import('next/server')).NextRequest(
        new URL('/api/admin/nexus', 'http://localhost:3000'),
        {
          method: 'DELETE',
          body: '{invalid json',
        },
      );

      const res = await DELETE(malformedReq);
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body.error).toBe('Failed to delete link');
    });

    it('logs error to logger.error when exception occurs', async () => {
      const { logger } = await import('@/lib/logger');
      mockFrom.mockImplementation(() => {
        throw new Error('Delete failed');
      });

      await DELETE(makePostRequest('/api/admin/nexus', { id: VALID_UUID }));

      expect(vi.mocked(logger.error)).toHaveBeenCalledWith(
        'Nexus delete error:',
        expect.any(Error),
      );
    });

    it('does not log audit event when delete fails', async () => {
      const dbError = new Error('Database error');
      const chain = chainMock({ error: dbError }).chain;
      mockFrom.mockReturnValue(chain);

      await DELETE(makePostRequest('/api/admin/nexus', { id: VALID_UUID }));

      expect(mockLogAuditEvent).not.toHaveBeenCalled();
    });

    it('does not expose sensitive error details in response', async () => {
      const dbError = new Error('Connection to db.example.com failed');
      const chain = chainMock({ error: dbError }).chain;
      mockFrom.mockReturnValue(chain);

      const res = await DELETE(makePostRequest('/api/admin/nexus', { id: VALID_UUID }));
      const body = await res.json();

      expect(body.error).toBe('Failed to delete link');
      expect(body.details).toBeUndefined();
      expect(body.errorMessage).toBeUndefined();
    });
  });

  describe('success response', () => {
    it('returns 200 with success true', async () => {
      const chain = chainMock({ error: null }).chain;
      mockFrom.mockReturnValue(chain);

      const res = await DELETE(makePostRequest('/api/admin/nexus', { id: VALID_UUID }));
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      expect(Object.keys(body)).toEqual(['success']);
    });
  });
});
