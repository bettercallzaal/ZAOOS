import { NextRequest, NextResponse } from 'next/server';
import { getSessionData } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/db/supabase';
import { createInAppNotification } from '@/lib/notifications';

/**
 * GET — Get comments for a proposal
 * Query: ?proposal_id=...
 */
export async function GET(req: NextRequest) {
  const session = await getSessionData();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const proposalId = req.nextUrl.searchParams.get('proposal_id');
  if (!proposalId) {
    return NextResponse.json({ error: 'proposal_id is required' }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from('proposal_comments')
    .select(`
      *,
      author:users!proposal_comments_author_id_fkey(display_name, username, pfp_url, fid, zid)
    `)
    .eq('proposal_id', proposalId)
    .order('created_at', { ascending: true });

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 });
  }

  return NextResponse.json({ comments: data });
}

/**
 * POST — Add a comment to a proposal
 * Body: { proposal_id, body }
 */
export async function POST(req: NextRequest) {
  const session = await getSessionData();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { proposal_id, body: commentBody } = body;

    if (!proposal_id || !commentBody?.trim()) {
      return NextResponse.json({ error: 'proposal_id and body are required' }, { status: 400 });
    }

    const { data: user } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('fid', session.fid)
      .single();

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { data: comment, error } = await supabaseAdmin
      .from('proposal_comments')
      .insert({
        proposal_id,
        author_id: user.id,
        body: commentBody.trim(),
      })
      .select(`
        *,
        author:users!proposal_comments_author_id_fkey(display_name, username, pfp_url, fid, zid)
      `)
      .single();

    if (error) throw error;

    // Notify proposal author about the comment (fire and forget)
    Promise.resolve(
      supabaseAdmin
        .from('proposals')
        .select('author_id, title, users!proposals_author_id_fkey(fid)')
        .eq('id', proposal_id)
        .single()
    ).then(({ data: p }) => {
      const authorFid = (p?.users as unknown as { fid: number } | null)?.fid;
      if (authorFid && authorFid !== session.fid) {
        createInAppNotification({
          recipientFids: [authorFid],
          type: 'comment',
          title: 'New Comment',
          body: `${session.displayName} commented on "${(p?.title as string || '').slice(0, 60)}"`,
          href: '/governance',
          actorFid: session.fid,
          actorDisplayName: session.displayName,
          actorPfpUrl: session.pfpUrl,
        }).catch((err) => console.error('[notify]', err));
      }
    }).catch((err) => console.error('[notify]', err));

    return NextResponse.json({ comment });
  } catch (err) {
    console.error('Comment error:', err);
    return NextResponse.json({ error: 'Failed to add comment' }, { status: 500 });
  }
}
