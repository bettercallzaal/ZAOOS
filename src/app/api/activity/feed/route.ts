import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionData } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/db/supabase';

const querySchema = z.object({
  filter: z.enum(['all', 'music', 'governance', 'social']).default('all'),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export type ActivityItem = {
  id: string;
  type: 'cast' | 'song' | 'vote' | 'member' | 'proposal' | 'respect';
  actor: { fid: number; displayName: string; pfpUrl: string | null };
  description: string;
  timestamp: string;
  link?: string;
};

/**
 * GET /api/activity/feed
 * Aggregates recent activity across the community.
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
  const activities: ActivityItem[] = [];

  try {
    // Fetch recent song submissions
    if (filter === 'all' || filter === 'music') {
      const { data: songs } = await supabaseAdmin
        .from('song_submissions')
        .select('id, title, artist_name, submitted_by_fid, created_at, users!song_submissions_submitted_by_fid_fkey(display_name, pfp_url)')
        .order('created_at', { ascending: false })
        .limit(limit);

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
          description: `submitted "${s.title}" by ${s.artist_name}`,
          timestamp: s.created_at,
          link: '/chat',
        });
      }
    }

    // Fetch recent proposals
    if (filter === 'all' || filter === 'governance') {
      const { data: proposals } = await supabaseAdmin
        .from('proposals')
        .select('id, title, status, created_at, author:users!proposals_author_id_fkey(fid, display_name, pfp_url)')
        .order('created_at', { ascending: false })
        .limit(limit);

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
    }

    // Fetch recent members
    if (filter === 'all' || filter === 'social') {
      const { data: members } = await supabaseAdmin
        .from('users')
        .select('fid, display_name, pfp_url, created_at')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(limit);

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
    }

    // Fetch recent votes
    if (filter === 'all' || filter === 'governance') {
      const { data: votes } = await supabaseAdmin
        .from('proposal_votes')
        .select('id, vote, created_at, proposal_id, voter_fid, proposals(title), users!proposal_votes_voter_fid_fkey(display_name, pfp_url)')
        .order('created_at', { ascending: false })
        .limit(limit);

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
    }

    // Fetch recent casts (chat activity)
    if (filter === 'all' || filter === 'social') {
      const { data: casts } = await supabaseAdmin
        .from('channel_casts')
        .select('hash, text, author_fid, author_username, author_display_name, author_pfp_url, timestamp')
        .order('timestamp', { ascending: false })
        .limit(limit);

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
          description: `posted: "${preview}"`,
          timestamp: c.timestamp,
          link: '/chat',
        });
      }
    }

    // Sort all activities by timestamp descending
    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return NextResponse.json({
      activities: activities.slice(0, limit),
      total: activities.length,
    });
  } catch (error) {
    console.error('[activity/feed] Error:', error);
    return NextResponse.json({ error: 'Failed to load activity' }, { status: 500 });
  }
}
