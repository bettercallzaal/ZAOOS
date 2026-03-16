import { NextRequest, NextResponse } from 'next/server';
import { getSessionData } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/db/supabase';
import { createInAppNotification, sendNotification } from '@/lib/notifications';

/**
 * GET — List proposals with vote tallies
 * Query: ?status=open (optional filter)
 */
export async function GET(req: NextRequest) {
  const session = await getSessionData();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const status = req.nextUrl.searchParams.get('status');
  const limit = Math.min(parseInt(req.nextUrl.searchParams.get('limit') || '50', 10), 100);
  const offset = Math.max(parseInt(req.nextUrl.searchParams.get('offset') || '0', 10), 0);

  let query = supabaseAdmin
    .from('proposals')
    .select(`
      *,
      author:users!proposals_author_id_fkey(display_name, username, pfp_url, fid, zid),
      votes:proposal_votes(vote, respect_weight),
      comment_count:proposal_comments(count)
    `, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error, count: totalCount } = await query;

  if (error) {
    console.error('Proposals fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch proposals' }, { status: 500 });
  }

  // Tally votes
  const proposals = (data || []).map((p) => {
    const votes = p.votes || [];
    const forVotes = votes.filter((v: { vote: string }) => v.vote === 'for');
    const againstVotes = votes.filter((v: { vote: string }) => v.vote === 'against');
    const abstainVotes = votes.filter((v: { vote: string }) => v.vote === 'abstain');

    return {
      id: p.id,
      title: p.title,
      description: p.description,
      status: p.status,
      category: p.category,
      author: p.author,
      created_at: p.created_at,
      closes_at: p.closes_at,
      tally: {
        for: { count: forVotes.length, weight: forVotes.reduce((s: number, v: { respect_weight: number }) => s + v.respect_weight, 0) },
        against: { count: againstVotes.length, weight: againstVotes.reduce((s: number, v: { respect_weight: number }) => s + v.respect_weight, 0) },
        abstain: { count: abstainVotes.length, weight: abstainVotes.reduce((s: number, v: { respect_weight: number }) => s + v.respect_weight, 0) },
        totalVoters: votes.length,
        totalWeight: votes.reduce((s: number, v: { respect_weight: number }) => s + v.respect_weight, 0),
      },
      commentCount: p.comment_count?.[0]?.count || 0,
    };
  });

  return NextResponse.json({ proposals, total: totalCount ?? proposals.length, limit, offset });
}

/**
 * POST — Create a new proposal
 * Body: { title, description, category?, closes_at? }
 */
export async function POST(req: NextRequest) {
  const session = await getSessionData();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { title, description, category, closes_at } = body;

    if (!title?.trim() || !description?.trim()) {
      return NextResponse.json({ error: 'Title and description are required' }, { status: 400 });
    }

    // Get user row
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('id, zid')
      .eq('fid', session.fid)
      .single();

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { data: proposal, error } = await supabaseAdmin
      .from('proposals')
      .insert({
        title: title.trim(),
        description: description.trim(),
        author_id: user.id,
        category: category || 'general',
        closes_at: closes_at || null,
      })
      .select()
      .single();

    if (error) throw error;

    // Notify all active members about the new proposal (fire and forget)
    Promise.resolve(
      supabaseAdmin
        .from('users')
        .select('fid')
        .eq('is_active', true)
        .neq('fid', session.fid)
    ).then(({ data: members }) => {
      if (members?.length) {
        const fids = members.map((m) => m.fid).filter(Boolean);
        createInAppNotification({
          recipientFids: fids,
          type: 'proposal',
          title: 'New Proposal',
          body: title.trim().slice(0, 100),
          href: '/governance',
          actorFid: session.fid,
          actorDisplayName: session.displayName,
          actorPfpUrl: session.pfpUrl,
        }).catch(() => {});
        sendNotification(
          'New Proposal',
          `${session.displayName}: ${title.trim().slice(0, 80)}`,
          'https://zaoos.com/governance',
          `proposal-${proposal.id}`,
          session.fid
        ).catch(() => {});
      }
    }).catch(() => {});

    return NextResponse.json({ proposal });
  } catch (err) {
    console.error('Create proposal error:', err);
    return NextResponse.json({ error: 'Failed to create proposal' }, { status: 500 });
  }
}
