import type { Cast } from '@/types';

/** Map a raw Neynar cast object to the client's Cast shape. Missing fields become safe defaults. */
export function neynarCastToCast(c: Record<string, unknown>): Cast {
  const author = c.author as Record<string, unknown> | undefined;
  const reactions = c.reactions as Record<string, unknown> | undefined;
  const replies = c.replies as Record<string, unknown> | undefined;

  return {
    hash: c.hash as string,
    author: {
      fid: (author?.fid as number) || 0,
      username: (author?.username as string) || '',
      display_name: (author?.display_name as string) || '',
      pfp_url: (author?.pfp_url as string) || '',
    },
    text: (c.text as string) || '',
    timestamp: (c.timestamp as string) || '',
    replies: { count: (replies?.count as number) || 0 },
    reactions: {
      likes_count: (reactions?.likes_count as number) || 0,
      recasts_count: (reactions?.recasts_count as number) || 0,
      likes: (reactions?.likes as { fid: number }[]) || [],
      recasts: (reactions?.recasts as { fid: number }[]) || [],
    },
    parent_hash: (c.parent_hash as string) || null,
    embeds: (c.embeds as Cast['embeds']) || [],
  };
}
