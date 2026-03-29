import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db/supabase';
import { getFollowers, getFollowing, getUsersByFids } from '@/lib/farcaster/neynar';
import { getEngagementScores } from '@/lib/openrank/client';

/**
 * GET /api/cron/follower-snapshot
 *
 * Vercel cron-compatible route that:
 * 1. Fetches all active members from Supabase
 * 2. Snapshots each member's follower list from Neynar
 * 3. Compares with yesterday's snapshot to detect unfollows
 * 4. Stores results in follower_snapshots, unfollow_events, member_stats_history
 *
 * Auth: Bearer CRON_SECRET (skipped in dev if CRON_SECRET not set)
 */
export async function GET(request: NextRequest) {
  try {
    // Auth check: require CRON_SECRET (never run unauthenticated)
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret) {
      return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 });
    }
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch active members with FIDs
    const { data: members, error: membersError } = await supabaseAdmin
      .from('users')
      .select('fid')
      .not('fid', 'is', null)
      .eq('is_active', true);

    if (membersError) {
      console.error('Failed to fetch members:', membersError);
      return NextResponse.json(
        { error: 'Failed to fetch members' },
        { status: 500 }
      );
    }

    if (!members || members.length === 0) {
      return NextResponse.json({
        membersProcessed: 0,
        newUnfollows: 0,
        errors: [],
      });
    }

    const fids = members.map((m) => m.fid as number);
    const errors: string[] = [];
    let totalUnfollows = 0;
    let membersProcessed = 0;

    // Process members sequentially to respect Neynar rate limits (300 RPM)
    for (const fid of fids) {
      try {
        await processMember(fid);
        membersProcessed++;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        errors.push(`FID ${fid}: ${msg}`);
        console.error(`Follower snapshot error for FID ${fid}:`, err);
      }

      // 200ms delay between members to stay well under 300 RPM
      await delay(200);
    }

    // Optionally fetch OpenRank engagement scores in bulk
    try {
      const scores = await getEngagementScores(fids);
      if (scores.size > 0) {
        const today = new Date().toISOString().split('T')[0];
        for (const [fid, score] of scores) {
          await supabaseAdmin
            .from('member_stats_history')
            .update({ engagement_score: score })
            .eq('fid', fid)
            .eq('snapshot_date', today);
        }
      }
    } catch (err) {
      console.error('OpenRank scores fetch failed (non-fatal):', err);
    }

    return NextResponse.json({
      membersProcessed,
      newUnfollows: totalUnfollows,
      errors,
    });

    // ---- Helper: process a single member ----
    async function processMember(fid: number) {
      // Fetch all followers by paginating through Neynar API
      const allFollowerFids = await fetchAllFollowerFids(fid);

      // Fetch following count (first page only, we just need the count)
      let followingCount = 0;
      try {
        const followingData = await getFollowing(fid, undefined, 'desc_chron', undefined, 1);
        // Neynar returns a total in the response for following; approximate from users array + next cursor
        // The users array length on limit=1 won't give total, so we use the user profile approach
        // For simplicity, count from the user object if available
        followingCount = followingData.users?.length ?? 0;
        // Better: fetch user profile which has following_count
      } catch {
        // Non-fatal: following count is supplementary
      }

      // Get user profile for accurate following_count
      try {
        const users = await getUsersByFids([fid]);
        if (users[0]) {
          followingCount = users[0].following_count ?? followingCount;
        }
      } catch {
        // Non-fatal
      }

      const today = new Date().toISOString().split('T')[0];
      const followerCount = allFollowerFids.length;

      // Upsert today's snapshot
      const { error: snapshotError } = await supabaseAdmin
        .from('follower_snapshots')
        .upsert(
          {
            fid,
            follower_fids: allFollowerFids,
            follower_count: followerCount,
            following_count: followingCount,
            snapshot_date: today,
          },
          { onConflict: 'fid,snapshot_date' }
        );

      if (snapshotError) {
        throw new Error(`Snapshot upsert failed: ${snapshotError.message}`);
      }

      // Upsert stats history
      await supabaseAdmin
        .from('member_stats_history')
        .upsert(
          {
            fid,
            follower_count: followerCount,
            following_count: followingCount,
            snapshot_date: today,
          },
          { onConflict: 'fid,snapshot_date' }
        );

      // Compare with yesterday's snapshot to detect unfollows
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      const { data: prevSnapshot } = await supabaseAdmin
        .from('follower_snapshots')
        .select('follower_fids')
        .eq('fid', fid)
        .eq('snapshot_date', yesterdayStr)
        .single();

      if (prevSnapshot && prevSnapshot.follower_fids) {
        const previousSet = new Set<number>(prevSnapshot.follower_fids);
        const currentSet = new Set<number>(allFollowerFids);

        // Unfollowers = in yesterday's snapshot but not in today's
        const unfollowerFids = [...previousSet].filter(
          (f) => !currentSet.has(f)
        );

        if (unfollowerFids.length > 0) {
          totalUnfollows += unfollowerFids.length;

          // Fetch unfollower user details in batches of 100
          const unfollowerDetails = new Map<
            number,
            { username: string; displayName: string }
          >();

          for (let i = 0; i < unfollowerFids.length; i += 100) {
            const batch = unfollowerFids.slice(i, i + 100);
            try {
              const users = await getUsersByFids(batch);
              for (const user of users) {
                unfollowerDetails.set(user.fid, {
                  username: user.username || '',
                  displayName: user.display_name || '',
                });
              }
            } catch {
              // Non-fatal: we still record the unfollow without username
            }
            if (i + 100 < unfollowerFids.length) await delay(200);
          }

          // Insert unfollow events
          const unfollowRows = unfollowerFids.map((unfollowerFid) => ({
            member_fid: fid,
            unfollower_fid: unfollowerFid,
            unfollower_username:
              unfollowerDetails.get(unfollowerFid)?.username || null,
            unfollower_display_name:
              unfollowerDetails.get(unfollowerFid)?.displayName || null,
          }));

          const { error: unfollowError } = await supabaseAdmin
            .from('unfollow_events')
            .insert(unfollowRows);

          if (unfollowError) {
            console.error(
              `Failed to insert unfollow events for FID ${fid}:`,
              unfollowError
            );
          }
        }
      }
    }
  } catch (err) {
    console.error('Follower snapshot cron error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Fetch all follower FIDs for a user by paginating through Neynar API.
 * Returns a flat array of FIDs.
 */
async function fetchAllFollowerFids(fid: number): Promise<number[]> {
  const allFids: number[] = [];
  let cursor: string | undefined;
  let page = 0;
  const MAX_PAGES = 50; // Safety limit: 50 pages * 100 = 5000 followers max

  do {
    const data = await getFollowers(fid, undefined, 'desc_chron', cursor, 100);
    const users = data.users || [];

    for (const entry of users) {
      // Neynar followers endpoint returns { user: {...}, ...}
      const userFid = entry.user?.fid ?? entry.fid;
      if (userFid) allFids.push(userFid);
    }

    cursor = data.next?.cursor || undefined;
    page++;

    if (cursor) await delay(200);
  } while (cursor && page < MAX_PAGES);

  return allFids;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
