import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  makePostRequest,
  mockAdminSession,
  mockAuthenticatedSession,
  mockUnauthenticatedSession,
  VALID_UUID,
} from '@/test-utils/api-helpers';

// ── Hoisted mocks ────────────────────────────────────────────────────────────
const { mockGetSessionData, mockFrom } = vi.hoisted(() => ({
  mockGetSessionData: vi.fn(),
  mockFrom: vi.fn(),
}));

const { mockPostCast } = vi.hoisted(() => ({
  mockPostCast: vi.fn(),
}));

const { mockLogAuditEvent, mockGetClientIp } = vi.hoisted(() => ({
  mockLogAuditEvent: vi.fn(),
  mockGetClientIp: vi.fn(),
}));

const { mockLogger } = vi.hoisted(() => ({
  mockLogger: { error: vi.fn() },
}));

vi.mock('@/lib/auth/session', () => ({
  getSessionData: () => mockGetSessionData(),
}));

vi.mock('@/lib/db/supabase', () => ({
  supabaseAdmin: { from: (...args: unknown[]) => mockFrom(...args) },
}));

vi.mock('@/lib/farcaster/neynar', () => ({
  postCast: (...args: unknown[]) => mockPostCast(...args),
}));

vi.mock('@/lib/db/audit-log', () => ({
  logAuditEvent: (...args: unknown[]) => mockLogAuditEvent(...args),
  getClientIp: (req: Request) => mockGetClientIp(req),
}));

vi.mock('@/lib/logger', () => ({
  logger: mockLogger,
}));

vi.mock('@/lib/env', () => ({
  ENV: {
    ZAO_OFFICIAL_SIGNER_UUID: 'signer-uuid-123',
    ZAO_OFFICIAL_FID: '12345',
    ZAO_OFFICIAL_NEYNAR_API_KEY: 'neynar-key-456',
  },
}));

import { POST } from '../route';

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Build a Supabase query-chain mock that resolves to result.
 * Every chained method returns the chain itself for further chaining.
 * Terminal methods (.single, .then) resolve the query.
 */
function chainMock(result: { data?: unknown; error?: unknown }) {
  const chain: Record<string, unknown> = {};
  chain.select = vi.fn().mockReturnValue(chain);
  chain.eq = vi.fn().mockReturnValue(chain);
  chain.update = vi.fn().mockReturnValue(chain);
  chain.insert = vi.fn().mockReturnValue(chain);
  chain.single = vi.fn().mockResolvedValue(result);
  // biome-ignore lint/suspicious/noThenProperty: intentional thenable — mocks an awaitable Supabase query chain
  chain.then = vi.fn((resolve: (val: unknown) => void, reject?: (err: unknown) => void) => {
    Promise.resolve(result).then(resolve, reject);
  });
  return chain;
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('POST /api/publish/farcaster', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetClientIp.mockReturnValue('192.168.1.1');
  });

  // ── Authentication tests ──────────────────────────────────────────────────

  describe('Authentication', () => {
    it('returns 403 when unauthenticated', async () => {
      mockGetSessionData.mockResolvedValue(mockUnauthenticatedSession());
      const req = makePostRequest('/api/publish/farcaster', { proposalId: VALID_UUID });
      const res = await POST(req);

      expect(res.status).toBe(403);
      const body = await res.json();
      expect(body.error).toBe('Admin only');
    });

    it('returns 403 when authenticated but not admin', async () => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ isAdmin: false }));
      const req = makePostRequest('/api/publish/farcaster', { proposalId: VALID_UUID });
      const res = await POST(req);

      expect(res.status).toBe(403);
      const body = await res.json();
      expect(body.error).toBe('Admin only');
    });
  });

  // ── Input validation tests ───────────────────────────────────────────────

  describe('Input validation', () => {
    it('returns 400 when proposalId is missing', async () => {
      mockGetSessionData.mockResolvedValue(mockAdminSession());
      const req = makePostRequest('/api/publish/farcaster', {});
      const res = await POST(req);

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe('Invalid input');
      expect(body.details).toBeDefined();
    });

    it('returns 400 when proposalId is not a valid UUID', async () => {
      mockGetSessionData.mockResolvedValue(mockAdminSession());
      const req = makePostRequest('/api/publish/farcaster', { proposalId: 'not-a-uuid' });
      const res = await POST(req);

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe('Invalid input');
      expect(body.details).toBeDefined();
    });

    it('returns 400 when proposalId is empty string', async () => {
      mockGetSessionData.mockResolvedValue(mockAdminSession());
      const req = makePostRequest('/api/publish/farcaster', { proposalId: '' });
      const res = await POST(req);

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe('Invalid input');
    });
  });

  // ── Proposal lookup tests ────────────────────────────────────────────────

  describe('Proposal lookup', () => {
    it('returns 404 when proposal not found', async () => {
      mockGetSessionData.mockResolvedValue(mockAdminSession());
      mockFrom.mockImplementation(() => chainMock({ data: null, error: null }));

      const req = makePostRequest('/api/publish/farcaster', { proposalId: VALID_UUID });
      const res = await POST(req);

      expect(res.status).toBe(404);
      const body = await res.json();
      expect(body.error).toBe('Proposal not found');
    });

    it('returns 404 when fetch returns an error', async () => {
      mockGetSessionData.mockResolvedValue(mockAdminSession());
      mockFrom.mockImplementation(() =>
        chainMock({ data: null, error: new Error('Database error') }),
      );

      const req = makePostRequest('/api/publish/farcaster', { proposalId: VALID_UUID });
      const res = await POST(req);

      expect(res.status).toBe(404);
      const body = await res.json();
      expect(body.error).toBe('Proposal not found');
    });
  });

  // ── Already published guard tests ────────────────────────────────────────

  describe('Already published guard', () => {
    it('returns 409 when proposal is already published', async () => {
      mockGetSessionData.mockResolvedValue(mockAdminSession());
      const proposal = {
        id: VALID_UUID,
        title: 'Published Proposal',
        published_cast_hash: '0xabc123',
        respect_threshold: 1000,
        author: { username: 'testuser', display_name: 'Test User', fid: 123 },
      };
      mockFrom.mockImplementation(() => chainMock({ data: proposal, error: null }));

      const req = makePostRequest('/api/publish/farcaster', { proposalId: VALID_UUID });
      const res = await POST(req);

      expect(res.status).toBe(409);
      const body = await res.json();
      expect(body.error).toBe('Already published');
      expect(body.cast_hash).toBe('0xabc123');
    });
  });

  // ── Respect vote threshold tests ────────────────────────────────────────

  describe('Respect vote threshold', () => {
    it('returns 400 when threshold not met', async () => {
      mockGetSessionData.mockResolvedValue(mockAdminSession());
      const proposal = {
        id: VALID_UUID,
        title: 'Low Vote Proposal',
        description: 'Not enough votes',
        published_cast_hash: null,
        respect_threshold: 1000,
        author: { username: 'testuser', display_name: 'Test User', fid: 123 },
      };

      mockFrom.mockImplementation((table: string) => {
        const data = table === 'proposals' ? proposal : [];
        return chainMock({ data, error: null });
      });

      const req = makePostRequest('/api/publish/farcaster', { proposalId: VALID_UUID });
      const res = await POST(req);

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe('Threshold not met');
      expect(body.current).toBe(0);
      expect(body.threshold).toBe(1000);
    });

    it('publishes when threshold is met', async () => {
      mockGetSessionData.mockResolvedValue(mockAdminSession({ fid: 999 }));
      const proposal = {
        id: VALID_UUID,
        title: 'Valid Proposal',
        description: 'Test description',
        publish_text: null,
        publish_image_url: null,
        published_cast_hash: null,
        respect_threshold: 1000,
        author: { username: 'author', display_name: 'Author Name', fid: 123 },
      };

      const votes = [
        { vote: 'for', respect_weight: 600 },
        { vote: 'for', respect_weight: 500 },
        { vote: 'against', respect_weight: 200 },
      ];

      mockFrom.mockImplementation((table: string) => {
        const data = table === 'proposals' ? proposal : votes;
        return chainMock({ data, error: null });
      });

      mockPostCast.mockResolvedValue({ cast: { hash: 'cast-hash-xyz' } });

      const req = makePostRequest('/api/publish/farcaster', { proposalId: VALID_UUID });
      const res = await POST(req);

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.respect_votes).toBe(1100);
      expect(body.threshold).toBe(1000);
    });

    it('calculates respect weight correctly from votes, ignoring against votes', async () => {
      mockGetSessionData.mockResolvedValue(mockAdminSession({ fid: 999 }));
      const proposal = {
        id: VALID_UUID,
        title: 'Proposal',
        description: 'desc',
        publish_text: null,
        publish_image_url: null,
        published_cast_hash: null,
        respect_threshold: 300,
        author: { username: 'user', display_name: 'User', fid: 1 },
      };

      const votes = [
        { vote: 'for', respect_weight: 250 },
        { vote: 'for', respect_weight: null }, // null weight counts as 0
        { vote: 'against', respect_weight: 100 }, // ignored
        { vote: 'against', respect_weight: 200 }, // ignored
        { vote: 'for', respect_weight: 100 },
      ];

      mockFrom.mockImplementation((table: string) => {
        const data = table === 'proposals' ? proposal : votes;
        return chainMock({ data, error: null });
      });

      mockPostCast.mockResolvedValue({ cast: { hash: 'hash' } });

      const req = makePostRequest('/api/publish/farcaster', { proposalId: VALID_UUID });
      const res = await POST(req);

      expect(res.status).toBe(200);
      const body = await res.json();
      // Only count 'for' votes: 250 + 0 + 100 = 350 (against votes ignored)
      expect(body.respect_votes).toBe(350);
    });
  });

  // ── postCast integration tests ───────────────────────────────────────────

  describe('postCast integration', () => {
    it('calls postCast with correct parameters', async () => {
      mockGetSessionData.mockResolvedValue(mockAdminSession({ fid: 999 }));
      const proposal = {
        id: VALID_UUID,
        title: 'Title',
        description: 'desc',
        publish_text: null,
        publish_image_url: 'https://example.com/image.png',
        published_cast_hash: null,
        respect_threshold: 100,
        author: { username: 'author', display_name: 'Author', fid: 1 },
      };

      const votes = [{ vote: 'for', respect_weight: 150 }];

      mockFrom.mockImplementation((table: string) => {
        const data = table === 'proposals' ? proposal : votes;
        return chainMock({ data, error: null });
      });

      mockPostCast.mockResolvedValue({ cast: { hash: 'cast-hash-123' } });

      const req = makePostRequest('/api/publish/farcaster', { proposalId: VALID_UUID });
      await POST(req);

      expect(mockPostCast).toHaveBeenCalledWith(
        'signer-uuid-123',
        expect.any(String), // castText
        'zao', // channel
        undefined, // no parent
        undefined, // no embedHash
        ['https://example.com/image.png'], // embedUrls
        undefined, // no embedFid
        'neynar-key-456', // API key
      );
    });

    it('returns 500 when postCast throws an error', async () => {
      mockGetSessionData.mockResolvedValue(mockAdminSession({ fid: 999 }));
      const proposal = {
        id: VALID_UUID,
        title: 'Title',
        description: 'desc',
        publish_text: null,
        publish_image_url: null,
        published_cast_hash: null,
        respect_threshold: 100,
        author: { username: 'author', display_name: 'Author', fid: 1 },
      };

      const votes = [{ vote: 'for', respect_weight: 150 }];

      mockFrom.mockImplementation((table: string) => {
        const data = table === 'proposals' ? proposal : votes;
        return chainMock({ data, error: null });
      });

      mockPostCast.mockRejectedValue(new Error('Neynar API error'));

      const req = makePostRequest('/api/publish/farcaster', { proposalId: VALID_UUID });
      const res = await POST(req);

      expect(res.status).toBe(500);
      const body = await res.json();
      expect(body.error).toBe('Failed to publish cast');
      expect(mockLogger.error).toHaveBeenCalledWith(
        '[publish/farcaster] Error:',
        expect.any(Error),
      );
    });
  });

  // ── Audit logging tests ──────────────────────────────────────────────────

  describe('Audit logging', () => {
    it('logs audit event on successful publish', async () => {
      mockGetSessionData.mockResolvedValue(mockAdminSession({ fid: 999 }));
      const proposal = {
        id: VALID_UUID,
        title: 'Title',
        description: 'desc',
        publish_text: null,
        publish_image_url: null,
        published_cast_hash: null,
        respect_threshold: 100,
        author: { username: 'author', display_name: 'Author', fid: 1 },
      };

      const votes = [{ vote: 'for', respect_weight: 150 }];

      mockFrom.mockImplementation((table: string) => {
        const data = table === 'proposals' ? proposal : votes;
        return chainMock({ data, error: null });
      });

      mockPostCast.mockResolvedValue({ cast: { hash: 'cast-hash-xyz' } });

      const req = makePostRequest('/api/publish/farcaster', { proposalId: VALID_UUID });
      await POST(req);

      expect(mockLogAuditEvent).toHaveBeenCalledWith({
        actorFid: 999,
        action: 'proposal.publish',
        targetType: 'proposal',
        targetId: VALID_UUID,
        details: {
          castHash: 'cast-hash-xyz',
          respectVotes: 150,
          threshold: 100,
        },
        ipAddress: '192.168.1.1',
      });
    });
  });

  // ── Success response tests ───────────────────────────────────────────────

  describe('Success response', () => {
    it('returns 200 with correct response shape on success', async () => {
      mockGetSessionData.mockResolvedValue(mockAdminSession({ fid: 999 }));
      const proposal = {
        id: VALID_UUID,
        title: 'Title',
        description: 'Test description',
        publish_text: null,
        publish_image_url: null,
        published_cast_hash: null,
        respect_threshold: 100,
        author: { username: 'author', display_name: 'Author', fid: 1 },
      };

      const votes = [{ vote: 'for', respect_weight: 150 }];

      mockFrom.mockImplementation((table: string) => {
        const data = table === 'proposals' ? proposal : votes;
        return chainMock({ data, error: null });
      });

      mockPostCast.mockResolvedValue({ cast: { hash: 'cast-hash-final' } });

      const req = makePostRequest('/api/publish/farcaster', { proposalId: VALID_UUID });
      const res = await POST(req);

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual({
        success: true,
        cast_hash: 'cast-hash-final',
        text: expect.any(String),
        respect_votes: 150,
        threshold: 100,
      });
      expect(body.text).toContain('Test description');
    });

    it('includes the attribution line in cast text', async () => {
      mockGetSessionData.mockResolvedValue(mockAdminSession({ fid: 999 }));
      const proposal = {
        id: VALID_UUID,
        title: 'Title',
        description: 'desc',
        publish_text: null,
        publish_image_url: null,
        published_cast_hash: null,
        respect_threshold: 100,
        author: { username: 'testauthor', display_name: 'Test Author', fid: 1 },
      };

      const votes = [{ vote: 'for', respect_weight: 150 }];

      mockFrom.mockImplementation((table: string) => {
        const data = table === 'proposals' ? proposal : votes;
        return chainMock({ data, error: null });
      });

      mockPostCast.mockResolvedValue({ cast: { hash: 'hash' } });

      const req = makePostRequest('/api/publish/farcaster', { proposalId: VALID_UUID });
      const res = await POST(req);

      const body = await res.json();
      expect(body.text).toMatch(/— Proposed by @testauthor • Approved by ZAO governance/);
    });
  });

  // ── Edge cases ───────────────────────────────────────────────────────────

  describe('Edge cases', () => {
    it('handles proposal with no votes (empty votes array)', async () => {
      mockGetSessionData.mockResolvedValue(mockAdminSession({ fid: 999 }));
      const proposal = {
        id: VALID_UUID,
        title: 'No votes',
        description: 'desc',
        publish_text: null,
        publish_image_url: null,
        published_cast_hash: null,
        respect_threshold: 1,
        author: { username: 'author', display_name: 'Author', fid: 1 },
      };

      mockFrom.mockImplementation((table: string) => {
        const data = table === 'proposals' ? proposal : [];
        return chainMock({ data, error: null });
      });

      const req = makePostRequest('/api/publish/farcaster', { proposalId: VALID_UUID });
      const res = await POST(req);

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe('Threshold not met');
      expect(body.current).toBe(0);
    });

    it('handles proposal.respect_threshold as undefined (uses default 1000)', async () => {
      mockGetSessionData.mockResolvedValue(mockAdminSession({ fid: 999 }));
      const proposal = {
        id: VALID_UUID,
        title: 'No threshold',
        description: 'desc',
        publish_text: null,
        publish_image_url: null,
        published_cast_hash: null,
        respect_threshold: null,
        author: { username: 'author', display_name: 'Author', fid: 1 },
      };

      const votes = [{ vote: 'for', respect_weight: 1500 }];

      mockFrom.mockImplementation((table: string) => {
        const data = table === 'proposals' ? proposal : votes;
        return chainMock({ data, error: null });
      });

      mockPostCast.mockResolvedValue({ cast: { hash: 'hash' } });

      const req = makePostRequest('/api/publish/farcaster', { proposalId: VALID_UUID });
      const res = await POST(req);

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.threshold).toBe(1000);
    });

    it('handles postCast response with missing cast.hash', async () => {
      mockGetSessionData.mockResolvedValue(mockAdminSession({ fid: 999 }));
      const proposal = {
        id: VALID_UUID,
        title: 'Title',
        description: 'desc',
        publish_text: null,
        publish_image_url: null,
        published_cast_hash: null,
        respect_threshold: 100,
        author: { username: 'author', display_name: 'Author', fid: 1 },
      };

      const votes = [{ vote: 'for', respect_weight: 150 }];

      mockFrom.mockImplementation((table: string) => {
        const data = table === 'proposals' ? proposal : votes;
        return chainMock({ data, error: null });
      });

      mockPostCast.mockResolvedValue({ cast: {} }); // no hash

      const req = makePostRequest('/api/publish/farcaster', { proposalId: VALID_UUID });
      const res = await POST(req);

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.cast_hash).toBeUndefined();
    });
  });
});
