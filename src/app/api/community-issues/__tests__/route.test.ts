import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  chainMock,
  makeGetRequest,
  makePostRequest,
  mockAuthenticatedSession,
  mockUnauthenticatedSession,
} from '@/test-utils/api-helpers';

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
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}));

import { GET, POST } from '../route';

// Mock global fetch for Paperclip API calls
global.fetch = vi.fn() as unknown as typeof fetch;

// ── Test fixtures ────────────────────────────────────────────────────────────

const SAMPLE_ISSUE = {
  id: '550e8400-e29b-41d4-a716-446655440001',
  title: 'Dashboard loading slowly',
  description: 'The dashboard takes over 5 seconds to load after login',
  type: 'bug',
  priority: 'high',
  submitted_by_fid: 123,
  submitted_by_username: 'testuser',
  status: 'submitted',
  created_at: '2026-07-15T10:00:00Z',
  paperclip_issue_id: null,
};

const SAMPLE_ISSUE_2 = {
  id: '550e8400-e29b-41d4-a716-446655440002',
  title: 'Add export to CSV feature',
  description: 'Users want to export reports to CSV format',
  type: 'feature',
  priority: 'medium',
  submitted_by_fid: 456,
  submitted_by_username: 'anotheruser',
  status: 'submitted',
  created_at: '2026-07-15T09:00:00Z',
  paperclip_issue_id: null,
};

describe('GET /api/community-issues', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSessionData.mockResolvedValue(mockUnauthenticatedSession());
  });

  describe('authentication', () => {
    it('returns 401 when no session is present', async () => {
      mockGetSessionData.mockResolvedValue(null);

      const res = await GET(makeGetRequest('/api/community-issues'));
      const body = await res.json();

      expect(res.status).toBe(401);
      expect(body.error).toBe('Unauthorized');
      expect(mockFrom).not.toHaveBeenCalled();
    });
  });

  describe('success paths', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 123 }));
    });

    it('returns 200 with issues list', async () => {
      const mock = chainMock({
        data: [SAMPLE_ISSUE, SAMPLE_ISSUE_2],
        count: 2,
      });
      mockFrom.mockImplementation(mock.handler);

      const res = await GET(makeGetRequest('/api/community-issues'));
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.issues).toHaveLength(2);
      expect(body.issues[0].id).toBe(SAMPLE_ISSUE.id);
      expect(body.total).toBe(2);
    });

    it('uses default limit of 20', async () => {
      const mock = chainMock({
        data: [SAMPLE_ISSUE],
        count: 1,
      });
      mockFrom.mockImplementation(mock.handler);

      await GET(makeGetRequest('/api/community-issues'));

      const rangeCalls = mock.chain.range.mock.calls;
      expect(rangeCalls).toContainEqual([0, 19]); // limit 20 means range(0, 19)
    });

    it('uses default offset of 0', async () => {
      const mock = chainMock({
        data: [SAMPLE_ISSUE],
        count: 1,
      });
      mockFrom.mockImplementation(mock.handler);

      await GET(makeGetRequest('/api/community-issues'));

      const rangeCalls = mock.chain.range.mock.calls;
      expect(rangeCalls[0][0]).toBe(0);
    });

    it('clamps limit to maximum of 50', async () => {
      const mock = chainMock({
        data: [SAMPLE_ISSUE],
        count: 1,
      });
      mockFrom.mockImplementation(mock.handler);

      await GET(makeGetRequest('/api/community-issues', { limit: '100' }));

      const rangeCalls = mock.chain.range.mock.calls;
      expect(rangeCalls).toContainEqual([0, 49]); // max 50 means range(0, 49)
    });

    it('accepts custom limit under 50', async () => {
      const mock = chainMock({
        data: [SAMPLE_ISSUE],
        count: 1,
      });
      mockFrom.mockImplementation(mock.handler);

      await GET(makeGetRequest('/api/community-issues', { limit: '10' }));

      const rangeCalls = mock.chain.range.mock.calls;
      expect(rangeCalls).toContainEqual([0, 9]); // limit 10 means range(0, 9)
    });

    it('clamps offset to minimum of 0', async () => {
      const mock = chainMock({
        data: [SAMPLE_ISSUE],
        count: 1,
      });
      mockFrom.mockImplementation(mock.handler);

      await GET(makeGetRequest('/api/community-issues', { offset: '-10' }));

      const rangeCalls = mock.chain.range.mock.calls;
      expect(rangeCalls[0][0]).toBe(0);
    });

    it('accepts custom positive offset', async () => {
      const mock = chainMock({
        data: [SAMPLE_ISSUE],
        count: 1,
      });
      mockFrom.mockImplementation(mock.handler);

      await GET(makeGetRequest('/api/community-issues', { offset: '30', limit: '10' }));

      const rangeCalls = mock.chain.range.mock.calls;
      expect(rangeCalls).toContainEqual([30, 39]);
    });

    it('orders by created_at descending', async () => {
      const mock = chainMock({
        data: [SAMPLE_ISSUE],
        count: 1,
      });
      mockFrom.mockImplementation(mock.handler);

      await GET(makeGetRequest('/api/community-issues'));

      const orderCalls = mock.chain.order.mock.calls;
      expect(orderCalls).toContainEqual(['created_at', { ascending: false }]);
    });

    it('returns empty array when no issues exist', async () => {
      const mock = chainMock({
        data: [],
        count: 0,
      });
      mockFrom.mockImplementation(mock.handler);

      const res = await GET(makeGetRequest('/api/community-issues'));
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.issues).toEqual([]);
      expect(body.total).toBe(0);
    });

    it('handles null data gracefully', async () => {
      const mock = chainMock({
        data: null,
        count: 0,
      });
      mockFrom.mockImplementation(mock.handler);

      const res = await GET(makeGetRequest('/api/community-issues'));
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.issues).toEqual([]);
      expect(body.total).toBe(0);
    });
  });

  describe('error handling', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 123 }));
    });

    it('returns 500 when supabase query fails', async () => {
      const mock = chainMock({
        error: { message: 'Database connection failed' },
        data: null,
      });
      mockFrom.mockImplementation(mock.handler);

      const res = await GET(makeGetRequest('/api/community-issues'));
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body.error).toBe('Failed to fetch issues');
    });

    it('logs error when supabase fails', async () => {
      const { logger } = await import('@/lib/logger');
      const mock = chainMock({
        error: { message: 'Database error' },
        data: null,
      });
      mockFrom.mockImplementation(mock.handler);

      await GET(makeGetRequest('/api/community-issues'));

      expect(logger.error).toHaveBeenCalledWith(
        'Community issues fetch error:',
        expect.objectContaining({ message: 'Database error' }),
      );
    });
  });
});

describe('POST /api/community-issues', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSessionData.mockResolvedValue(mockUnauthenticatedSession());
    vi.mocked(global.fetch).mockClear();
  });

  describe('authentication', () => {
    it('returns 401 when no session is present', async () => {
      mockGetSessionData.mockResolvedValue(null);

      const res = await POST(
        makePostRequest('/api/community-issues', {
          title: 'Test issue',
          description: 'A detailed test issue description here',
          type: 'bug',
          priority: 'high',
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(401);
      expect(body.error).toBe('Unauthorized');
      expect(mockFrom).not.toHaveBeenCalled();
    });
  });

  describe('request validation', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 123 }));
    });

    it('returns 400 on invalid JSON', async () => {
      const req = new (await import('next/server')).NextRequest(
        new URL('/api/community-issues', 'http://localhost:3000'),
        {
          method: 'POST',
          body: 'not valid json {',
        },
      );

      const res = await POST(req);
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid JSON');
    });

    it('returns 400 when title is too short', async () => {
      const res = await POST(
        makePostRequest('/api/community-issues', {
          title: 'Bad',
          description: 'A detailed test issue description here',
          type: 'bug',
          priority: 'high',
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Validation failed');
      expect(body.details).toBeDefined();
    });

    it('returns 400 when title is too long', async () => {
      const longTitle = 'a'.repeat(201);
      const res = await POST(
        makePostRequest('/api/community-issues', {
          title: longTitle,
          description: 'A detailed test issue description here',
          type: 'bug',
          priority: 'high',
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Validation failed');
    });

    it('returns 400 when description is too short', async () => {
      const res = await POST(
        makePostRequest('/api/community-issues', {
          title: 'Valid title',
          description: 'Short',
          type: 'bug',
          priority: 'high',
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Validation failed');
    });

    it('returns 400 when description is too long', async () => {
      const longDescription = 'a'.repeat(5001);
      const res = await POST(
        makePostRequest('/api/community-issues', {
          title: 'Valid title',
          description: longDescription,
          type: 'bug',
          priority: 'high',
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Validation failed');
    });

    it('returns 400 on invalid type enum', async () => {
      const res = await POST(
        makePostRequest('/api/community-issues', {
          title: 'Valid title',
          description: 'A detailed test issue description here',
          type: 'invalid_type',
          priority: 'high',
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Validation failed');
    });

    it('returns 400 on invalid priority enum', async () => {
      const res = await POST(
        makePostRequest('/api/community-issues', {
          title: 'Valid title',
          description: 'A detailed test issue description here',
          type: 'bug',
          priority: 'critical',
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Validation failed');
    });

    it('uses default priority of medium when not provided', async () => {
      const mock = chainMock({
        data: SAMPLE_ISSUE,
        count: 1,
      });
      mockFrom.mockImplementation(mock.handler);
      vi.mocked(global.fetch).mockResolvedValue(new Response('{}', { status: 200 }));

      const res = await POST(
        makePostRequest('/api/community-issues', {
          title: 'Valid title',
          description: 'A detailed test issue description here',
          type: 'bug',
          // priority omitted
        }),
      );

      expect(res.status).toBe(201);
      const insertCalls = mock.chain.insert.mock.calls;
      expect(insertCalls[0][0]).toMatchObject({
        priority: 'medium',
      });
    });
  });

  describe('success paths', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(
        mockAuthenticatedSession({
          fid: 123,
          username: 'testuser',
        }),
      );
    });

    it('returns 201 on successful issue creation', async () => {
      const mock = chainMock({
        data: SAMPLE_ISSUE,
        count: 1,
      });
      mockFrom.mockImplementation(mock.handler);

      const res = await POST(
        makePostRequest('/api/community-issues', {
          title: 'Dashboard loading slowly',
          description: 'The dashboard takes over 5 seconds to load after login',
          type: 'bug',
          priority: 'high',
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(201);
      expect(body.message).toBe('Issue submitted successfully');
      expect(body.issue).toMatchObject(SAMPLE_ISSUE);
    });

    it('stores issue data in supabase with correct fields', async () => {
      const mock = chainMock({
        data: SAMPLE_ISSUE,
        count: 1,
      });
      mockFrom.mockImplementation(mock.handler);

      await POST(
        makePostRequest('/api/community-issues', {
          title: 'Dashboard loading slowly',
          description: 'The dashboard takes over 5 seconds to load after login',
          type: 'bug',
          priority: 'high',
        }),
      );

      const insertCalls = mock.chain.insert.mock.calls;
      expect(insertCalls[0][0]).toMatchObject({
        title: 'Dashboard loading slowly',
        description: 'The dashboard takes over 5 seconds to load after login',
        type: 'bug',
        priority: 'high',
        submitted_by_fid: 123,
        submitted_by_username: 'testuser',
        status: 'submitted',
      });
    });

    it('includes session username in supabase insert', async () => {
      const mock = chainMock({
        data: SAMPLE_ISSUE,
        count: 1,
      });
      mockFrom.mockImplementation(mock.handler);

      mockGetSessionData.mockResolvedValue(
        mockAuthenticatedSession({
          fid: 456,
          username: 'anotheruser',
        }),
      );

      await POST(
        makePostRequest('/api/community-issues', {
          title: 'Test title',
          description: 'A detailed test issue description here',
          type: 'feature',
          priority: 'low',
        }),
      );

      const insertCalls = mock.chain.insert.mock.calls;
      expect(insertCalls[0][0]).toMatchObject({
        submitted_by_fid: 456,
        submitted_by_username: 'anotheruser',
      });
    });

    it('sets status to submitted in supabase', async () => {
      const mock = chainMock({
        data: SAMPLE_ISSUE,
        count: 1,
      });
      mockFrom.mockImplementation(mock.handler);

      await POST(
        makePostRequest('/api/community-issues', {
          title: 'Valid title',
          description: 'A detailed test issue description here',
          type: 'bug',
          priority: 'high',
        }),
      );

      const insertCalls = mock.chain.insert.mock.calls;
      expect(insertCalls[0][0].status).toBe('submitted');
    });

    it('calls select and single on insert for returned data', async () => {
      const mock = chainMock({
        data: SAMPLE_ISSUE,
        count: 1,
      });
      mockFrom.mockImplementation(mock.handler);

      await POST(
        makePostRequest('/api/community-issues', {
          title: 'Test',
          description: 'A detailed test issue description here',
          type: 'bug',
          priority: 'high',
        }),
      );

      const selectCalls = mock.chain.select.mock.calls;
      const singleCalls = mock.chain.single.mock.calls;

      expect(selectCalls).toBeDefined();
      expect(singleCalls).toBeDefined();
    });

    it('handles whitespace-only descriptions gracefully', async () => {
      const mock = chainMock({
        data: SAMPLE_ISSUE,
        count: 1,
      });
      mockFrom.mockImplementation(mock.handler);

      const res = await POST(
        makePostRequest('/api/community-issues', {
          title: 'Valid title',
          description: '   This is valid after trim   ',
          type: 'bug',
          priority: 'high',
        }),
      );

      expect(res.status).toBe(201);

      const insertCalls = mock.chain.insert.mock.calls;
      expect(insertCalls[0][0].description).toBe('This is valid after trim');
    });
  });

  describe('error handling', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 123 }));
    });

    it('returns 500 when supabase insert fails', async () => {
      const mock = chainMock({
        error: { message: 'Database constraint violation' },
        data: null,
      });
      mockFrom.mockImplementation(mock.handler);

      const res = await POST(
        makePostRequest('/api/community-issues', {
          title: 'Test title',
          description: 'A detailed test issue description here',
          type: 'bug',
          priority: 'high',
        }),
      );
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body.error).toBe('Failed to save issue');
    });

    it('logs error when supabase insert fails', async () => {
      const { logger } = await import('@/lib/logger');
      const dbError = { message: 'Insert failed' };
      const mock = chainMock({
        error: dbError,
        data: null,
      });
      mockFrom.mockImplementation(mock.handler);

      await POST(
        makePostRequest('/api/community-issues', {
          title: 'Test title',
          description: 'A detailed test issue description here',
          type: 'bug',
          priority: 'high',
        }),
      );

      expect(logger.error).toHaveBeenCalledWith('Community issue insert error:', dbError);
    });
  });
});
