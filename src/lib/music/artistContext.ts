import { getFcQualityScoreByFid } from '@/lib/fc-identity';
import { getUserByFid, getUserCasts } from '@/lib/farcaster/neynar';

export interface TopCast {
  content: string;
  reactions: number;
  timestamp: string;
}

export interface ArtistContext {
  artistFid: number;
  artistHandle: string;
  walletAddress?: string;
  bio: string;
  followerCount: number;
  engagementRate: number;      // avg (likes + recasts) per cast over last 20 casts
  recentCastVelocity: number;  // casts posted in the last 7 days
  communityScore: bigint | null;
  topPerformingCasts: TopCast[];
}

const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const CAST_FETCH_LIMIT = 20;

export async function buildArtistContext(
  fid: number,
  nowMs = Date.now(),
): Promise<ArtistContext | null> {
  const [user, casts, communityScore] = await Promise.all([
    getUserByFid(fid),
    getUserCasts(fid, CAST_FETCH_LIMIT),
    getFcQualityScoreByFid(fid),
  ]);

  if (!user) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const castList: any[] = Array.isArray(casts) ? casts : [];

  const recentCastVelocity = castList.filter((c) => {
    const ts = new Date(c.timestamp ?? 0).getTime();
    return nowMs - ts < ONE_WEEK_MS;
  }).length;

  const totalReactions = castList.reduce((sum: number, c) => {
    return sum + (c.reactions?.likes_count ?? 0) + (c.reactions?.recasts_count ?? 0);
  }, 0);

  const engagementRate =
    castList.length > 0 ? Math.round((totalReactions / castList.length) * 100) / 100 : 0;

  const topPerformingCasts: TopCast[] = [...castList]
    .map((c) => ({
      content: (c.text ?? '') as string,
      reactions: (c.reactions?.likes_count ?? 0) + (c.reactions?.recasts_count ?? 0),
      timestamp: (c.timestamp ?? '') as string,
    }))
    .sort((a, b) => b.reactions - a.reactions)
    .slice(0, 3);

  return {
    artistFid: fid,
    artistHandle: user.username ?? '',
    walletAddress: user.verified_addresses?.eth_addresses?.[0],
    bio: user.profile?.bio?.text ?? '',
    followerCount: user.follower_count ?? 0,
    engagementRate,
    recentCastVelocity,
    communityScore,
    topPerformingCasts,
  };
}
