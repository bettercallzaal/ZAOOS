import { AtpAgent } from '@atproto/api';
import { supabaseAdmin } from '@/lib/db/supabase';

/**
 * Sync recent posts from all ZAO Bluesky members into the feed index.
 * Fetches the last 20 posts from each member, stores new ones.
 */
export async function syncMemberPosts(): Promise<{ synced: number; members: number; errors: string[] }> {
  const { data: members } = await supabaseAdmin
    .from('bluesky_members')
    .select('did, handle');

  if (!members?.length) return { synced: 0, members: 0, errors: [] };

  const agent = new AtpAgent({ service: 'https://public.api.bsky.app' });
  let totalSynced = 0;
  const errors: string[] = [];

  const results = await Promise.allSettled(
    members.map(async (member) => {
      try {
        const { data } = await agent.getAuthorFeed({
          actor: member.did,
          limit: 20,
          filter: 'posts_no_replies',
        });

        if (!data?.feed?.length) return 0;

        const rows = data.feed.map((item) => ({
          uri: item.post.uri,
          did: member.did,
          indexed_at: item.post.indexedAt || new Date().toISOString(),
          text_preview: ((item.post.record as { text?: string })?.text || '').slice(0, 100),
        }));

        const { error } = await supabaseAdmin
          .from('bluesky_feed_posts')
          .upsert(rows, { onConflict: 'uri' });

        if (error) throw error;
        return rows.length;
      } catch (err) {
        errors.push(`${member.handle}: ${err instanceof Error ? err.message : 'Unknown error'}`);
        return 0;
      }
    })
  );

  for (const result of results) {
    if (result.status === 'fulfilled') totalSynced += result.value;
  }

  return { synced: totalSynced, members: members.length, errors };
}

/**
 * Get feed skeleton — returns post URIs in reverse chronological order.
 * This is what Bluesky's AppView calls to render the feed.
 */
export async function getFeedSkeleton(
  cursor?: string,
  limit = 30,
): Promise<{ feed: { post: string }[]; cursor?: string }> {
  let query = supabaseAdmin
    .from('bluesky_feed_posts')
    .select('uri, indexed_at')
    .order('indexed_at', { ascending: false })
    .limit(limit);

  if (cursor) {
    query = query.lt('indexed_at', cursor);
  }

  const { data, error } = await query;

  if (error || !data?.length) {
    return { feed: [] };
  }

  const feed = data.map((row) => ({ post: row.uri }));
  const lastItem = data[data.length - 1];
  const nextCursor = data.length === limit ? lastItem.indexed_at : undefined;

  return { feed, cursor: nextCursor };
}
