// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockGetUserByFid = vi.hoisted(() => vi.fn());
const mockGetUserCasts = vi.hoisted(() => vi.fn());
const mockGetFcQualityScoreByFid = vi.hoisted(() => vi.fn());

vi.mock('@/lib/farcaster/neynar', () => ({
  getUserByFid: mockGetUserByFid,
  getUserCasts: mockGetUserCasts,
}));

vi.mock('@/lib/fc-identity', () => ({
  getFcQualityScoreByFid: mockGetFcQualityScoreByFid,
}));

import { buildArtistContext } from '../artistContext';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const NOW = new Date('2026-07-17T12:00:00Z').getTime();
const TWO_DAYS_AGO = new Date('2026-07-15T12:00:00Z').toISOString();
const TEN_DAYS_AGO = new Date('2026-07-07T12:00:00Z').toISOString();

function makeUser(overrides: Record<string, unknown> = {}) {
  return {
    username: 'wavewarz',
    follower_count: 5000,
    following_count: 200,
    verified_addresses: { eth_addresses: ['0xabc123'] },
    profile: { bio: { text: 'Beat slayer from the underground' } },
    ...overrides,
  };
}

function makeCast(
  content: string,
  likes: number,
  recasts: number,
  timestamp = TWO_DAYS_AGO,
) {
  return {
    text: content,
    timestamp,
    reactions: { likes_count: likes, recasts_count: recasts },
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockGetFcQualityScoreByFid.mockResolvedValue(BigInt(42));
  mockGetUserCasts.mockResolvedValue([]);
  mockGetUserByFid.mockResolvedValue(makeUser());
});

// ---------------------------------------------------------------------------
// Null guard
// ---------------------------------------------------------------------------

describe('null guard', () => {
  it('returns null when getUserByFid returns null', async () => {
    mockGetUserByFid.mockResolvedValue(null);
    expect(await buildArtistContext(99, NOW)).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Identity fields
// ---------------------------------------------------------------------------

describe('identity fields', () => {
  it('maps artistFid, artistHandle, bio, followerCount from user object', async () => {
    const ctx = await buildArtistContext(42, NOW);
    expect(ctx).not.toBeNull();
    expect(ctx!.artistFid).toBe(42);
    expect(ctx!.artistHandle).toBe('wavewarz');
    expect(ctx!.bio).toBe('Beat slayer from the underground');
    expect(ctx!.followerCount).toBe(5000);
  });

  it('sets walletAddress from verified_addresses.eth_addresses[0]', async () => {
    const ctx = await buildArtistContext(42, NOW);
    expect(ctx!.walletAddress).toBe('0xabc123');
  });

  it('walletAddress is undefined when no eth addresses present', async () => {
    mockGetUserByFid.mockResolvedValue(makeUser({ verified_addresses: { eth_addresses: [] } }));
    const ctx = await buildArtistContext(42, NOW);
    expect(ctx!.walletAddress).toBeUndefined();
  });

  it('bio defaults to empty string when profile bio is absent', async () => {
    mockGetUserByFid.mockResolvedValue(makeUser({ profile: undefined }));
    const ctx = await buildArtistContext(42, NOW);
    expect(ctx!.bio).toBe('');
  });
});

// ---------------------------------------------------------------------------
// Engagement rate
// ---------------------------------------------------------------------------

describe('engagementRate', () => {
  it('returns 0 when cast list is empty', async () => {
    mockGetUserCasts.mockResolvedValue([]);
    const ctx = await buildArtistContext(42, NOW);
    expect(ctx!.engagementRate).toBe(0);
  });

  it('averages (likes + recasts) across all fetched casts, rounded to 2dp', async () => {
    mockGetUserCasts.mockResolvedValue([
      makeCast('cast a', 10, 5, TWO_DAYS_AGO),  // 15 reactions
      makeCast('cast b', 5, 0, TWO_DAYS_AGO),   // 5 reactions
      makeCast('cast c', 8, 2, TWO_DAYS_AGO),   // 10 reactions
    ]);
    // avg = 30 / 3 = 10.00
    const ctx = await buildArtistContext(42, NOW);
    expect(ctx!.engagementRate).toBe(10);
  });

  it('rounds to 2 decimal places', async () => {
    mockGetUserCasts.mockResolvedValue([
      makeCast('a', 1, 0),
      makeCast('b', 1, 0),
      makeCast('c', 2, 0),
    ]);
    // avg = 4 / 3 ≈ 1.33
    const ctx = await buildArtistContext(42, NOW);
    expect(ctx!.engagementRate).toBe(1.33);
  });
});

// ---------------------------------------------------------------------------
// recentCastVelocity
// ---------------------------------------------------------------------------

describe('recentCastVelocity', () => {
  it('counts only casts within the last 7 days', async () => {
    mockGetUserCasts.mockResolvedValue([
      makeCast('recent 1', 10, 0, TWO_DAYS_AGO),
      makeCast('recent 2', 5, 0, TWO_DAYS_AGO),
      makeCast('old', 100, 50, TEN_DAYS_AGO),
    ]);
    const ctx = await buildArtistContext(42, NOW);
    expect(ctx!.recentCastVelocity).toBe(2);
  });

  it('returns 0 when all casts are older than 7 days', async () => {
    mockGetUserCasts.mockResolvedValue([
      makeCast('old 1', 10, 0, TEN_DAYS_AGO),
      makeCast('old 2', 5, 0, TEN_DAYS_AGO),
    ]);
    const ctx = await buildArtistContext(42, NOW);
    expect(ctx!.recentCastVelocity).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// topPerformingCasts
// ---------------------------------------------------------------------------

describe('topPerformingCasts', () => {
  it('returns top 3 casts sorted by total reactions descending', async () => {
    mockGetUserCasts.mockResolvedValue([
      makeCast('low', 1, 0),
      makeCast('high', 100, 50),
      makeCast('mid', 20, 5),
      makeCast('also-low', 2, 0),
    ]);
    const ctx = await buildArtistContext(42, NOW);
    expect(ctx!.topPerformingCasts).toHaveLength(3);
    expect(ctx!.topPerformingCasts[0].content).toBe('high');
    expect(ctx!.topPerformingCasts[0].reactions).toBe(150);
    expect(ctx!.topPerformingCasts[1].content).toBe('mid');
  });

  it('returns fewer than 3 when cast list has fewer entries', async () => {
    mockGetUserCasts.mockResolvedValue([makeCast('only', 5, 1)]);
    const ctx = await buildArtistContext(42, NOW);
    expect(ctx!.topPerformingCasts).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// communityScore passthrough
// ---------------------------------------------------------------------------

describe('communityScore', () => {
  it('passes through the bigint score from getFcQualityScoreByFid', async () => {
    mockGetFcQualityScoreByFid.mockResolvedValue(BigInt(9001));
    const ctx = await buildArtistContext(42, NOW);
    expect(ctx!.communityScore).toBe(BigInt(9001));
  });

  it('passes through null when quality score is unavailable', async () => {
    mockGetFcQualityScoreByFid.mockResolvedValue(null);
    const ctx = await buildArtistContext(42, NOW);
    expect(ctx!.communityScore).toBeNull();
  });
});
