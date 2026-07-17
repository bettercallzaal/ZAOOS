// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';

const mockGetAuthorFeed = vi.hoisted(() => vi.fn());
vi.mock('@atproto/api', () => ({
  AtpAgent: vi.fn().mockImplementation(() => ({
    getAuthorFeed: mockGetAuthorFeed,
  })),
}));

const mockUpsert = vi.hoisted(() => vi.fn());
const mockFrom = vi.hoisted(() => vi.fn());
vi.mock('@/lib/db/supabase', () => ({
  supabaseAdmin: { from: mockFrom },
}));

import { getFeedSkeleton, syncMemberPosts } from '../feed';

afterEach(() => vi.clearAllMocks());

const MEMBERS = [
  { did: 'did:plc:abc', handle: 'zaal.bsky.social' },
  { did: 'did:plc:xyz', handle: 'arthur.bsky.social' },
];

function makePost(uri: string, indexedAt = '2026-07-01T00:00:00.000Z') {
  return {
    post: {
      uri,
      indexedAt,
      record: { text: `Post ${uri}` },
    },
  };
}

// ---------------------------------------------------------------------------
// syncMemberPosts
// ---------------------------------------------------------------------------
describe('syncMemberPosts', () => {
  it('returns zero counts when no members in DB', async () => {
    mockFrom.mockReturnValue({ select: vi.fn().mockResolvedValue({ data: null }) });
    const result = await syncMemberPosts();
    expect(result).toEqual({ synced: 0, members: 0, errors: [] });
    expect(mockGetAuthorFeed).not.toHaveBeenCalled();
  });

  it('returns zero counts when member list is empty', async () => {
    mockFrom.mockReturnValue({ select: vi.fn().mockResolvedValue({ data: [] }) });
    const result = await syncMemberPosts();
    expect(result).toEqual({ synced: 0, members: 0, errors: [] });
  });

  it('syncs posts for all members and returns total count', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'bluesky_members') {
        return { select: vi.fn().mockResolvedValue({ data: MEMBERS }) };
      }
      // bluesky_feed_posts upsert
      return { upsert: mockUpsert };
    });
    mockUpsert.mockResolvedValue({ error: null });
    mockGetAuthorFeed.mockResolvedValue({
      data: { feed: [makePost('at://zaal/1'), makePost('at://zaal/2')] },
    });

    const result = await syncMemberPosts();
    expect(result.members).toBe(2);
    expect(result.synced).toBe(4); // 2 posts × 2 members
    expect(result.errors).toHaveLength(0);
    expect(mockUpsert).toHaveBeenCalledTimes(2);
  });

  it('collects errors per member without failing the whole sync', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'bluesky_members') {
        return { select: vi.fn().mockResolvedValue({ data: [MEMBERS[0]] }) };
      }
      return { upsert: mockUpsert };
    });
    mockGetAuthorFeed.mockRejectedValue(new Error('network error'));

    const result = await syncMemberPosts();
    expect(result.synced).toBe(0);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain('zaal.bsky.social');
  });

  it('records upsert error in errors array', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'bluesky_members') {
        return { select: vi.fn().mockResolvedValue({ data: [MEMBERS[0]] }) };
      }
      return { upsert: mockUpsert };
    });
    mockGetAuthorFeed.mockResolvedValue({
      data: { feed: [makePost('at://zaal/1')] },
    });
    mockUpsert.mockResolvedValue({ error: new Error('upsert failed') });

    const result = await syncMemberPosts();
    expect(result.synced).toBe(0);
    expect(result.errors).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// getFeedSkeleton
// ---------------------------------------------------------------------------
describe('getFeedSkeleton', () => {
  it('returns empty feed when no posts', async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
      }),
    });
    const result = await getFeedSkeleton();
    expect(result).toEqual({ feed: [] });
  });

  it('returns feed URIs without cursor when fewer posts than limit', async () => {
    const posts = [
      { uri: 'at://a/1', indexed_at: '2026-07-02T00:00:00Z' },
      { uri: 'at://a/2', indexed_at: '2026-07-01T00:00:00Z' },
    ];
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue({ data: posts, error: null }),
        }),
      }),
    });
    const result = await getFeedSkeleton(undefined, 30);
    expect(result.feed).toEqual([{ post: 'at://a/1' }, { post: 'at://a/2' }]);
    expect(result.cursor).toBeUndefined();
  });

  it('returns cursor when result count equals limit', async () => {
    const posts = Array.from({ length: 5 }, (_, i) => ({
      uri: `at://a/${i}`,
      indexed_at: `2026-07-0${5 - i}T00:00:00Z`,
    }));
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue({ data: posts, error: null }),
        }),
      }),
    });
    const result = await getFeedSkeleton(undefined, 5); // limit = 5, got 5 = full page
    expect(result.cursor).toBe(posts[4].indexed_at);
  });

  it('applies lt filter when cursor is provided', async () => {
    const mockLt = vi.fn().mockResolvedValue({ data: [], error: null });
    const mockLimit = vi.fn().mockReturnValue({ lt: mockLt });
    const mockOrder = vi.fn().mockReturnValue({ limit: mockLimit });
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({ order: mockOrder }),
    });

    // Feed module applies cursor as .lt('indexed_at', cursor)
    // Need to handle the conditional query chain
    const posts = [{ uri: 'at://a/1', indexed_at: '2026-07-01T00:00:00Z' }];
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue({
            lt: vi.fn().mockResolvedValue({ data: posts, error: null }),
          }),
        }),
      }),
    });
    const result = await getFeedSkeleton('2026-07-02T00:00:00Z');
    expect(result.feed).toHaveLength(1);
  });
});
