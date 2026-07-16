import { beforeEach, describe, expect, it, vi } from 'vitest';

// ── Hoisted mocks ────────────────────────────────────────────────────────────
const { mockGetSessionData } = vi.hoisted(() => ({
  mockGetSessionData: vi.fn(),
}));

const { mockGetFollowing } = vi.hoisted(() => ({
  mockGetFollowing: vi.fn(),
}));

const { mockLoggerError } = vi.hoisted(() => ({
  mockLoggerError: vi.fn(),
}));

vi.mock('@/lib/auth/session', () => ({
  getSessionData: () => mockGetSessionData(),
}));

vi.mock('@/lib/farcaster/neynar', () => ({
  getFollowing: (...args: unknown[]) => mockGetFollowing(...args),
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    error: (...args: unknown[]) => mockLoggerError(...args),
  },
}));

// ── Route import (after mocks) ───────────────────────────────────────────────
import { GET } from '@/app/api/following/online/route';
import {
  makeGetRequest,
  mockAuthenticatedSession,
  mockUnauthenticatedSession,
} from '@/test-utils/api-helpers';

describe('GET /api/following/online', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Unauthenticated requests (no session)', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockUnauthenticatedSession());
    });

    it('returns 401 Unauthorized', async () => {
      const _req = makeGetRequest('/api/following/online');
      const res = await GET();
      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body).toEqual({ error: 'Unauthorized' });
    });

    it('does not call getFollowing', async () => {
      const _req = makeGetRequest('/api/following/online');
      await GET();
      expect(mockGetFollowing).not.toHaveBeenCalled();
    });
  });

  describe('Authenticated requests with valid session', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(
        mockAuthenticatedSession({ fid: 123, username: 'currentuser' }),
      );
    });

    it('returns 200 with members and currentFid', async () => {
      const mockData = {
        users: [
          {
            user: {
              fid: 456,
              username: 'alice',
              display_name: 'Alice',
              pfp_url: 'https://example.com/alice.jpg',
              custody_address: '0xaaa',
              verified_addresses: {
                eth_addresses: ['0xbbb', '0xccc'],
              },
            },
          },
          {
            fid: 789,
            username: 'bob',
            display_name: 'Bob Smith',
            pfp_url: 'https://example.com/bob.jpg',
            custody_address: '0xddd',
          },
        ],
        next: { cursor: undefined },
      };
      mockGetFollowing.mockResolvedValue(mockData);

      const res = await GET();
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body).toHaveProperty('members');
      expect(body).toHaveProperty('currentFid', 123);
      expect(body.members).toHaveLength(2);
    });

    it('maps users correctly from nested user prop', async () => {
      const mockData = {
        users: [
          {
            user: {
              fid: 456,
              username: 'alice',
              display_name: 'Alice',
              pfp_url: 'https://example.com/alice.jpg',
              custody_address: '0xaaa',
              verified_addresses: {
                eth_addresses: ['0xbbb'],
              },
            },
          },
        ],
        next: { cursor: undefined },
      };
      mockGetFollowing.mockResolvedValue(mockData);

      const res = await GET();
      const body = await res.json();

      expect(body.members[0]).toEqual({
        fid: 456,
        username: 'alice',
        displayName: 'Alice',
        pfpUrl: 'https://example.com/alice.jpg',
        addresses: ['0xaaa', '0xbbb'],
      });
    });

    it('maps users correctly from flat structure (item.user missing)', async () => {
      const mockData = {
        users: [
          {
            fid: 789,
            username: 'bob',
            display_name: 'Bob Smith',
            pfp_url: 'https://example.com/bob.jpg',
            custody_address: '0xddd',
            verified_addresses: {
              eth_addresses: ['0xeee'],
            },
          },
        ],
        next: { cursor: undefined },
      };
      mockGetFollowing.mockResolvedValue(mockData);

      const res = await GET();
      const body = await res.json();

      expect(body.members[0]).toEqual({
        fid: 789,
        username: 'bob',
        displayName: 'Bob Smith',
        pfpUrl: 'https://example.com/bob.jpg',
        addresses: ['0xddd', '0xeee'],
      });
    });

    it('excludes self from members (filters by fid === session.fid)', async () => {
      const mockData = {
        users: [
          {
            fid: 123, // same as session.fid
            username: 'currentuser',
            display_name: 'Current User',
            pfp_url: 'https://example.com/current.jpg',
          },
          {
            fid: 456,
            username: 'alice',
            display_name: 'Alice',
            pfp_url: 'https://example.com/alice.jpg',
          },
        ],
        next: { cursor: undefined },
      };
      mockGetFollowing.mockResolvedValue(mockData);

      const res = await GET();
      const body = await res.json();

      expect(body.members).toHaveLength(1);
      expect(body.members[0].fid).toBe(456);
    });

    it('handles empty following list', async () => {
      const mockData = {
        users: [],
        next: { cursor: undefined },
      };
      mockGetFollowing.mockResolvedValue(mockData);

      const res = await GET();
      const body = await res.json();

      expect(body.members).toHaveLength(0);
      expect(body.currentFid).toBe(123);
    });

    it('handles missing username with fallback', async () => {
      const mockData = {
        users: [
          {
            fid: 456,
            display_name: 'Alice Only Display',
            pfp_url: 'https://example.com/alice.jpg',
          },
        ],
        next: { cursor: undefined },
      };
      mockGetFollowing.mockResolvedValue(mockData);

      const res = await GET();
      const body = await res.json();

      expect(body.members[0].username).toBeNull();
      expect(body.members[0].displayName).toBe('Alice Only Display');
    });

    it('uses FID as displayName fallback when display_name is missing', async () => {
      const mockData = {
        users: [
          {
            fid: 456,
            username: 'alice',
            pfp_url: 'https://example.com/alice.jpg',
          },
        ],
        next: { cursor: undefined },
      };
      mockGetFollowing.mockResolvedValue(mockData);

      const res = await GET();
      const body = await res.json();

      expect(body.members[0].displayName).toBe('alice');
    });

    it('falls back to `FID {fid}` when both display_name and username are missing', async () => {
      const mockData = {
        users: [
          {
            fid: 456,
            pfp_url: 'https://example.com/alice.jpg',
          },
        ],
        next: { cursor: undefined },
      };
      mockGetFollowing.mockResolvedValue(mockData);

      const res = await GET();
      const body = await res.json();

      expect(body.members[0].displayName).toBe('FID 456');
    });

    it('handles missing pfpUrl with null', async () => {
      const mockData = {
        users: [
          {
            fid: 456,
            username: 'alice',
            display_name: 'Alice',
          },
        ],
        next: { cursor: undefined },
      };
      mockGetFollowing.mockResolvedValue(mockData);

      const res = await GET();
      const body = await res.json();

      expect(body.members[0].pfpUrl).toBeNull();
    });

    it('collects addresses from custody_address and verified_addresses.eth_addresses', async () => {
      const mockData = {
        users: [
          {
            fid: 456,
            username: 'alice',
            display_name: 'Alice',
            pfp_url: 'https://example.com/alice.jpg',
            custody_address: '0xaaa',
            verified_addresses: {
              eth_addresses: ['0xbbb', '0xccc'],
            },
          },
        ],
        next: { cursor: undefined },
      };
      mockGetFollowing.mockResolvedValue(mockData);

      const res = await GET();
      const body = await res.json();

      expect(body.members[0].addresses).toEqual(['0xaaa', '0xbbb', '0xccc']);
    });

    it('handles addresses with only custody_address', async () => {
      const mockData = {
        users: [
          {
            fid: 456,
            username: 'alice',
            display_name: 'Alice',
            pfp_url: 'https://example.com/alice.jpg',
            custody_address: '0xaaa',
          },
        ],
        next: { cursor: undefined },
      };
      mockGetFollowing.mockResolvedValue(mockData);

      const res = await GET();
      const body = await res.json();

      expect(body.members[0].addresses).toEqual(['0xaaa']);
    });

    it('handles addresses with only verified eth_addresses', async () => {
      const mockData = {
        users: [
          {
            fid: 456,
            username: 'alice',
            display_name: 'Alice',
            pfp_url: 'https://example.com/alice.jpg',
            verified_addresses: {
              eth_addresses: ['0xbbb', '0xccc'],
            },
          },
        ],
        next: { cursor: undefined },
      };
      mockGetFollowing.mockResolvedValue(mockData);

      const res = await GET();
      const body = await res.json();

      expect(body.members[0].addresses).toEqual(['0xbbb', '0xccc']);
    });

    it('handles empty addresses array', async () => {
      const mockData = {
        users: [
          {
            fid: 456,
            username: 'alice',
            display_name: 'Alice',
            pfp_url: 'https://example.com/alice.jpg',
          },
        ],
        next: { cursor: undefined },
      };
      mockGetFollowing.mockResolvedValue(mockData);

      const res = await GET();
      const body = await res.json();

      expect(body.members[0].addresses).toEqual([]);
    });

    it('paginates through multiple pages (MAX_PAGES = 2)', async () => {
      const mockDataPage1 = {
        users: [
          {
            fid: 456,
            username: 'alice',
            display_name: 'Alice',
            pfp_url: 'https://example.com/alice.jpg',
          },
        ],
        next: { cursor: 'page1_cursor' },
      };
      const mockDataPage2 = {
        users: [
          {
            fid: 789,
            username: 'bob',
            display_name: 'Bob',
            pfp_url: 'https://example.com/bob.jpg',
          },
        ],
        next: { cursor: undefined },
      };

      mockGetFollowing.mockResolvedValueOnce(mockDataPage1).mockResolvedValueOnce(mockDataPage2);

      const res = await GET();
      const body = await res.json();

      expect(body.members).toHaveLength(2);
      expect(mockGetFollowing).toHaveBeenCalledTimes(2);
      expect(mockGetFollowing).toHaveBeenNthCalledWith(1, 123, 123, 'desc_chron', undefined, 100);
      expect(mockGetFollowing).toHaveBeenNthCalledWith(
        2,
        123,
        123,
        'desc_chron',
        'page1_cursor',
        100,
      );
    });

    it('stops pagination after MAX_PAGES (2) even if cursor is present', async () => {
      const mockDataPage1 = {
        users: [{ fid: 456, username: 'alice', display_name: 'Alice' }],
        next: { cursor: 'page1_cursor' },
      };
      const mockDataPage2 = {
        users: [{ fid: 789, username: 'bob', display_name: 'Bob' }],
        next: { cursor: 'page2_cursor' }, // Would paginate further but capped at MAX_PAGES=2
      };

      mockGetFollowing.mockResolvedValueOnce(mockDataPage1).mockResolvedValueOnce(mockDataPage2);

      const res = await GET();
      const _body = await res.json();

      expect(mockGetFollowing).toHaveBeenCalledTimes(2);
    });

    it('stops pagination when cursor is undefined mid-loop', async () => {
      const mockDataPage1 = {
        users: [{ fid: 456, username: 'alice', display_name: 'Alice' }],
        next: { cursor: undefined }, // Stop early
      };

      mockGetFollowing.mockResolvedValueOnce(mockDataPage1);

      const res = await GET();
      const _body = await res.json();

      expect(mockGetFollowing).toHaveBeenCalledTimes(1);
    });

    it('sets cache-control header to private, max-age=15', async () => {
      const mockData = {
        users: [
          {
            fid: 456,
            username: 'alice',
            display_name: 'Alice',
            pfp_url: 'https://example.com/alice.jpg',
          },
        ],
        next: { cursor: undefined },
      };
      mockGetFollowing.mockResolvedValue(mockData);

      const res = await GET();

      expect(res.headers.get('Cache-Control')).toBe('private, max-age=15');
    });

    it('calls getFollowing with correct parameters (desc_chron sort)', async () => {
      const mockData = {
        users: [],
        next: { cursor: undefined },
      };
      mockGetFollowing.mockResolvedValue(mockData);

      await GET();

      expect(mockGetFollowing).toHaveBeenCalledWith(123, 123, 'desc_chron', undefined, 100);
    });
  });

  describe('Error handling', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 123 }));
    });

    it('returns 500 and logs error when getFollowing throws', async () => {
      const testError = new Error('Neynar API error');
      mockGetFollowing.mockRejectedValue(testError);

      const res = await GET();
      expect(res.status).toBe(500);

      const body = await res.json();
      expect(body).toEqual({ error: 'Failed to fetch following' });
      expect(mockLoggerError).toHaveBeenCalledWith('Following online error:', testError);
    });

    it('does not expose error details in response', async () => {
      const sensitiveError = new Error('Neynar API key invalid');
      mockGetFollowing.mockRejectedValue(sensitiveError);

      const res = await GET();
      const body = await res.json();

      expect(body.error).toBe('Failed to fetch following');
      expect(body.error).not.toContain('API key');
      expect(body.error).not.toContain('Neynar');
    });

    it('handles error during pagination (first page succeeds, second fails)', async () => {
      const mockDataPage1 = {
        users: [{ fid: 456, username: 'alice', display_name: 'Alice' }],
        next: { cursor: 'page1_cursor' },
      };

      mockGetFollowing
        .mockResolvedValueOnce(mockDataPage1)
        .mockRejectedValueOnce(new Error('Second page failed'));

      const res = await GET();
      expect(res.status).toBe(500);
      expect(mockLoggerError).toHaveBeenCalled();
    });
  });

  describe('Response structure validation', () => {
    beforeEach(() => {
      mockGetSessionData.mockResolvedValue(mockAuthenticatedSession({ fid: 123 }));
    });

    it('response contains all required member fields', async () => {
      const mockData = {
        users: [
          {
            fid: 456,
            username: 'alice',
            display_name: 'Alice',
            pfp_url: 'https://example.com/alice.jpg',
            custody_address: '0xaaa',
            verified_addresses: { eth_addresses: ['0xbbb'] },
          },
        ],
        next: { cursor: undefined },
      };
      mockGetFollowing.mockResolvedValue(mockData);

      const res = await GET();
      const body = await res.json();

      const member = body.members[0];
      expect(member).toHaveProperty('fid');
      expect(member).toHaveProperty('username');
      expect(member).toHaveProperty('displayName');
      expect(member).toHaveProperty('pfpUrl');
      expect(member).toHaveProperty('addresses');
    });

    it('response does not contain unwanted fields from source', async () => {
      const mockData = {
        users: [
          {
            fid: 456,
            username: 'alice',
            display_name: 'Alice',
            pfp_url: 'https://example.com/alice.jpg',
            custody_address: '0xaaa',
            verified_addresses: { eth_addresses: ['0xbbb'] },
            power_user: true, // should not appear in response
            verified: true, // should not appear in response
          },
        ],
        next: { cursor: undefined },
      };
      mockGetFollowing.mockResolvedValue(mockData);

      const res = await GET();
      const body = await res.json();

      const member = body.members[0];
      expect(member).not.toHaveProperty('power_user');
      expect(member).not.toHaveProperty('verified');
      expect(member).not.toHaveProperty('display_name');
      expect(member).not.toHaveProperty('custody_address');
    });
  });
});
