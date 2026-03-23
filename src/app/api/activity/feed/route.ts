import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionData } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/db/supabase';

const querySchema = z.object({
  filter: z.enum(['all', 'music', 'governance', 'social', 'fractals', 'wavewarz']).default('all'),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export type ActivityType = 'cast' | 'song' | 'vote' | 'member' | 'proposal' | 'respect' | 'fractal' | 'battle';

export type ActivityItem = {
  id: string;
  type: ActivityType;
  actor: { fid: number; displayName: string; pfpUrl: string | null };
  description: string;
  timestamp: string;
  link?: string;
};

/**
 * GET /api/activity/feed
 * Aggregates recent activity across the community.
 * Returns a unified feed from casts, proposals, votes, songs, members, fractals, and battles.
 */
export async function GET(req: NextRequest) {
  const session = await getSessionData();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const parsed = querySchema.safeParse({
    filter: req.nextUrl.searchParams.get('filter') ?? undefined,
    limit: req.nextUrl.searchParams.get('limit') ?? undefined,
  });
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid params', details: parsed.error.flatten() }, { status: 400 });
  }

  const { filter, limit } = parsed.data;
  const perSource = 5; // fetch 5 most recent from each source
  const activities: ActivityItem[] = [];

  try {
    const fetches: PromiseLike<void>[] = [];

    // ── Song submissions ──
    if (filter === 'all' || filter === 'music') {
      fetches.push(
        supabaseAdmin
          .from('song_submissions')
          .select('id, title, artist, submitted_by_fid, created_at, users!song_submissions_submitted_by_fid_fkey(display_name, pfp_url)')
          .order('created_at', { ascending: false })
          .limit(perSource)
          .then(({ data: songs }) => {
            for (const s of songs || []) {
              const user = Array.isArray(s.users) ? s.users[0] : s.users;
              activities.push({
                id: `song-${s.id}`,
                type: 'song',
                actor: {
                  fid: s.submitted_by_fid,
                  displayName: (user as { display_name?: string })?.display_name || 'Member',
                  pfpUrl: (user as { pfp_url?: string })?.pfp_url || null,
                },
                description: `submitted "${s.title}" by ${s.artist}`,
                timestamp: s.created_at,
                link: '/chat',
              });
            }
          })
      );
    }

    // ── Proposals ──
    if (filter === 'all' || filter === 'governance') {
      fetches.push(
        supabaseAdmin
          .from('proposals')
          .select('id, title, status, created_at, author:users!proposals_author_id_fkey(fid, display_name, pfp_url)')
          .order('created_at', { ascending: false })
          .limit(perSource)
          .then(({ data: proposals }) => {
            for (const p of proposals || []) {
              const author = Array.isArray(p.author) ? p.author[0] : p.author;
              activities.push({
                id: `proposal-${p.id}`,
                type: 'proposal',
                actor: {
                  fid: (author as { fid?: number })?.fid || 0,
                  displayName: (author as { display_name?: string })?.display_name || 'Member',
                  pfpUrl: (author as { pfp_url?: string })?.pfp_url || null,
                },
                description: `created proposal "${p.title}"`,
                timestamp: p.created_at,
                link: '/governance',
              });
            }
          })
      );
    }

    // ── New members ──
    if (filter === 'all' || filter === 'social') {
      fetches.push(
        supabaseAdmin
          .from('users')
          .select('fid, display_name, pfp_url, created_at, last_login_at')
          .eq('is_active', true)
          .not('last_login_at', 'is', null)
          .order('created_at', { ascending: false })
          .limit(perSource)
          .then(({ data: members }) => {
            for (const m of members || []) {
              if (m.fid) {
                activities.push({
                  id: `member-${m.fid}`,
                  type: 'member',
                  actor: {
                    fid: m.fid,
                    displayName: m.display_name || 'New Member',
                    pfpUrl: m.pfp_url || null,
                  },
                  description: 'joined THE ZAO',
                  timestamp: m.created_at,
                  link: '/social',
                });
              }
            }
          })
      );
    }

    // ── Proposal votes ──
    if (filter === 'all' || filter === 'governance') {
      fetches.push(
        supabaseAdmin
          .from('proposal_votes')
          .select('id, vote, created_at, proposal_id, voter_fid, proposals(title), users!proposal_votes_voter_fid_fkey(display_name, pfp_url)')
          .order('created_at', { ascending: false })
          .limit(perSource)
          .then(({ data: votes }) => {
            for (const v of votes || []) {
              const user = Array.isArray(v.users) ? v.users[0] : v.users;
              const proposal = Array.isArray(v.proposals) ? v.proposals[0] : v.proposals;
              activities.push({
                id: `vote-${v.id}`,
                type: 'vote',
                actor: {
                  fid: v.voter_fid,
                  displayName: (user as { display_name?: string })?.display_name || 'Member',
                  pfpUrl: (user as { pfp_url?: string })?.pfp_url || null,
                },
                description: `voted ${v.vote} on "${(proposal as { title?: string })?.title || 'a proposal'}"`,
                timestamp: v.created_at,
                link: '/governance',
              });
            }
          })
      );
    }

    // ── Casts (chat activity) ──
    if (filter === 'all' || filter === 'social') {
      fetches.push(
        supabaseAdmin
          .from('channel_casts')
          .select('hash, text, author_fid, author_username, author_display_name, author_pfp_url, timestamp')
          .order('timestamp', { ascending: false })
          .limit(perSource)
          .then(({ data: casts }) => {
            for (const c of casts || []) {
              const preview = (c.text || '').slice(0, 80) + ((c.text || '').length > 80 ? '...' : '');
              activities.push({
                id: `cast-${c.hash}`,
                type: 'cast',
                actor: {
                  fid: c.author_fid,
                  displayName: c.author_display_name || c.author_username || 'Member',
                  pfpUrl: c.author_pfp_url || null,
                },
                description: `posted in /zao: "${preview}"`,
                timestamp: c.timestamp,
                link: '/chat',
              });
            }
          })
      );
    }

    // ── Fractal sessions ──
    if (filter === 'all' || filter === 'fractals') {
      fetches.push(
        supabaseAdmin
          .from('fractal_sessions')
          .select('id, session_date, name, host_name, participant_count')
          .order('session_date', { ascending: false })
          .limit(perSource)
          .then(({ data: sessions }) => {
            for (const s of sessions || []) {
              activities.push({
                id: `fractal-${s.id}`,
                type: 'fractal',
                actor: {
                  fid: 0,
                  displayName: s.host_name || 'THE ZAO',
                  pfpUrl: null,
                },
                description: `completed fractal session "${s.name || 'Weekly Session'}" with ${s.participant_count || '?'} participants`,
                timestamp: s.session_date,
                link: '/governance/fractals',
              });
            }
          })
      );
    }

    // ── WaveWarZ battles ──
    if (filter === 'all' || filter === 'wavewarz') {
      fetches.push(
        supabaseAdmin
          .from('wavewarz_battle_log')
          .select('id, battle_id, artist_a, artist_b, winner, winner_margin, volume_sol, settled_at')
          .not('settled_at', 'is', null)
          .order('settled_at', { ascending: false })
          .limit(perSource)
          .then(({ data: battles }) => {
            for (const b of battles || []) {
              const vol = Number(b.volume_sol).toFixed(2);
              const desc = b.winner
                ? `${b.winner} won vs ${b.winner === b.artist_a ? b.artist_b : b.artist_a} (${vol} SOL)`
                : `${b.artist_a} vs ${b.artist_b} battle settled (${vol} SOL)`;
              activities.push({
                id: `battle-${b.id}`,
                type: 'battle',
                actor: {
                  fid: 0,
                  displayName: b.winner || 'WaveWarZ',
                  pfpUrl: null,
                },
                description: desc,
                timestamp: b.settled_at,
                link: '/social/wavewarz',
              });
            }
          })
      );
    }

    // Run all queries in parallel
    await Promise.allSettled(fetches);

    // Sort by timestamp descending
    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    const response = NextResponse.json({
      activities: activities.slice(0, limit),
      total: activities.length,
    });

    // 30-second cache
    response.headers.set('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=60');

    return response;
  } catch (error) {
    console.error('[activity/feed] Error:', error);
    return NextResponse.json({ error: 'Failed to load activity' }, { status: 500 });
  }
}
