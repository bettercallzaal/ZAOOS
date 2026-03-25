import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionData } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/db/supabase';
import { createInAppNotification, sendNotification } from '@/lib/notifications';
import { createProposalSchema } from '@/lib/validation/schemas';
import { logAuditEvent, getClientIp } from '@/lib/db/audit-log';

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
  const category = req.nextUrl.searchParams.get('category');
  const limit = Math.min(parseInt(req.nextUrl.searchParams.get('limit') || '50', 10), 100);
  const offset = Math.max(parseInt(req.nextUrl.searchParams.get('offset') || '0', 10), 0);

  // Look up current user's internal ID for matching their votes
  const { data: currentUser } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('fid', session.fid)
    .single();
  const currentUserId = currentUser?.id ?? null;

  let query = supabaseAdmin
    .from('proposals')
    .select(`
      *,
      author:users!proposals_author_id_fkey(display_name, username, pfp_url, fid, zid),
      votes:proposal_votes(vote, respect_weight, voter_id),
      comment_count:proposal_comments(count)
    `, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) {
    query = query.eq('status', status);
  }
  if (category) {
    query = query.eq('category', category);
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
      user_vote: currentUserId
        ? (votes.find((v: { voter_id: string }) => v.voter_id === currentUserId)?.vote ?? null)
        : null,
      publish_text: p.publish_text || null,
      published_cast_hash: p.published_cast_hash || null,
      published_bluesky_uri: p.published_bluesky_uri || null,
      published_x_url: p.published_x_url || null,
      publish_fc_error: p.publish_fc_error || null,
      publish_bsky_error: p.publish_bsky_error || null,
      publish_x_error: p.publish_x_error || null,
      respect_threshold: p.respect_threshold || 1000,
    };
  });

  // Fire-and-forget: check for proposals whose voting period ended and threshold was met
  // This handles the case where threshold was reached during the voting period but
  // publishing was deferred until the deadline passed.
  checkExpiredProposalsForPublish(proposals).catch((err) =>
    console.error('[proposals] expired-publish check failed:', err)
  );

  return NextResponse.json({ proposals, total: totalCount ?? proposals.length, limit, offset }, { headers: { 'Cache-Control': 'no-store' } });
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
    const parsed = createProposalSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    const { title, description, category, closes_at, publish_text, publish_image_url, respect_threshold } = parsed.data;

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
        title,
        description,
        author_id: user.id,
        category,
        closes_at: closes_at || null,
        publish_text: publish_text || null,
        publish_image_url: publish_image_url || null,
        respect_threshold: respect_threshold ?? 1000,
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
        }).catch((err) => console.error('[notify]', err));
        sendNotification(
          'New Proposal',
          `${session.displayName}: ${title.trim().slice(0, 80)}`,
          'https://zaoos.com/governance',
          `proposal-${proposal.id}`,
          session.fid
        ).catch((err) => console.error('[notify]', err));
      }
    }).catch((err) => console.error('[notify]', err));

    return NextResponse.json({ proposal });
  } catch (err) {
    console.error('Create proposal error:', err);
    return NextResponse.json({ error: 'Failed to create proposal' }, { status: 500 });
  }
}

/**
 * Valid status transitions for proposals.
 * Key = current status, Value = set of statuses it can transition to.
 */
const VALID_TRANSITIONS: Record<string, string[]> = {
  open: ['approved', 'rejected', 'completed'],
  approved: ['completed', 'open'],
  rejected: ['open'],
  completed: ['open'],
  published: ['completed', 'open'],
};

/**
 * PATCH — Update proposal status (admin only)
 * Body: { id: uuid, status: 'open' | 'approved' | 'rejected' | 'completed' }
 */
export async function PATCH(req: NextRequest) {
  const session = await getSessionData();
  if (!session?.isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const schema = z.object({
      id: z.string().uuid(),
      status: z.enum(['open', 'approved', 'rejected', 'completed']),
    });
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // Fetch current proposal to validate transition
    const { data: current } = await supabaseAdmin
      .from('proposals')
      .select('status')
      .eq('id', parsed.data.id)
      .single();

    if (!current) {
      return NextResponse.json({ error: 'Proposal not found' }, { status: 404 });
    }

    const allowed = VALID_TRANSITIONS[current.status] || [];
    if (!allowed.includes(parsed.data.status)) {
      return NextResponse.json(
        { error: `Cannot transition from "${current.status}" to "${parsed.data.status}"` },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin
      .from('proposals')
      .update({ status: parsed.data.status })
      .eq('id', parsed.data.id);

    if (error) {
      console.error('Update proposal status error:', error);
      return NextResponse.json({ error: 'Failed to update proposal' }, { status: 500 });
    }

    logAuditEvent({
      actorFid: session.fid!,
      action: 'proposal.status_change',
      targetType: 'proposal',
      targetId: parsed.data.id,
      details: { newStatus: parsed.data.status },
      ipAddress: getClientIp(req),
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('PATCH proposal error:', err);
    return NextResponse.json({ error: 'Failed to update proposal' }, { status: 500 });
  }
}

// ─── Auto-publish check for proposals whose voting period ended ──────────

interface ProposalSummary {
  id: string;
  status: string;
  closes_at: string | null;
  tally: { for: { weight: number } };
  published_cast_hash: string | null;
  respect_threshold: number;
}

async function checkExpiredProposalsForPublish(proposals: ProposalSummary[]) {
  const now = Date.now();

  for (const p of proposals) {
    // Only check open proposals with a deadline that has passed
    if (p.status !== 'open') continue;
    if (!p.closes_at) continue;
    if (new Date(p.closes_at).getTime() > now) continue;
    if (p.published_cast_hash) continue;

    const forWeight = p.tally.for.weight;
    const threshold = p.respect_threshold || 1000;

    if (forWeight >= threshold) {
      // Deadline passed + threshold met → trigger publish via the vote route's logic
      // Import dynamically to avoid circular dependency
      try {
        // We can't easily import checkPublishThreshold from the vote route,
        // so we just update the status to 'approved' — the admin can then publish,
        // or we mark it for the next vote to trigger publish.
        // For now, mark as approved so it's visible in the UI.
        await supabaseAdmin
          .from('proposals')
          .update({ status: 'approved' })
          .eq('id', p.id)
          .eq('status', 'open');

        console.info(`[proposals] Auto-approved proposal ${p.id} — deadline passed, ${forWeight}/${threshold}R threshold met`);
      } catch (err) {
        console.error(`[proposals] Auto-approve failed for ${p.id}:`, err);
      }
    }
  }
}
