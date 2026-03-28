import { NextRequest, NextResponse } from 'next/server';
import { getSessionData } from '@/lib/auth/session';
import { getSupabaseAdmin } from '@/lib/db/supabase';

/**
 * POST /api/discord/proposals/vote — Vote on a Discord proposal from the web app
 * Body: { proposalId: number, vote: 'yes' | 'no' | 'abstain' }
 *
 * Requires authenticated user with a linked discord_id and >0 Respect.
 * Upserts into discord_proposal_votes using discord_id as voter_id.
 */
export async function POST(req: NextRequest) {
  const session = await getSessionData();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();

  try {
    const body = await req.json();
    const { proposalId, vote } = body as { proposalId: unknown; vote: unknown };

    // Validate input
    if (typeof proposalId !== 'number' || !Number.isInteger(proposalId)) {
      return NextResponse.json({ error: 'proposalId must be an integer' }, { status: 400 });
    }
    if (!['yes', 'no', 'abstain'].includes(vote as string)) {
      return NextResponse.json({ error: 'vote must be "yes", "no", or "abstain"' }, { status: 400 });
    }

    // Get user's discord_id from the users table
    const { data: user, error: userErr } = await supabase
      .from('users')
      .select('discord_id, fid')
      .eq('fid', session.fid)
      .eq('is_active', true)
      .maybeSingle();

    if (userErr) {
      console.error('[discord/proposals/vote] user query error:', userErr);
      return NextResponse.json({ error: 'Failed to look up user' }, { status: 500 });
    }

    if (!user || !user.discord_id) {
      return NextResponse.json(
        { error: 'Link your Discord account first. Go to Settings to add your Discord ID.' },
        { status: 403 },
      );
    }

    const discordId = user.discord_id as string;

    // Validate: proposal must exist and be active
    const { data: proposal, error: proposalErr } = await supabase
      .from('discord_proposals')
      .select('id, status')
      .eq('id', proposalId)
      .single();

    if (proposalErr || !proposal) {
      return NextResponse.json({ error: 'Proposal not found' }, { status: 404 });
    }

    if (proposal.status !== 'active') {
      return NextResponse.json({ error: 'This proposal is no longer active' }, { status: 400 });
    }

    // Get user's Respect weight from respect_members
    // Try matching by fid first, then by name/wallet
    let respectWeight = 0;

    const { data: respectMember } = await supabase
      .from('respect_members')
      .select('total_respect')
      .eq('fid', session.fid)
      .maybeSingle();

    if (respectMember) {
      respectWeight = Number(respectMember.total_respect) || 0;
    }

    if (respectWeight <= 0) {
      return NextResponse.json(
        { error: 'You need Respect to vote. Earn Respect through fractal participation.' },
        { status: 403 },
      );
    }

    // Upsert vote into discord_proposal_votes
    const { error: upsertErr } = await supabase
      .from('discord_proposal_votes')
      .upsert(
        {
          proposal_id: proposalId,
          voter_id: discordId,
          vote_value: vote as string,
          weight: respectWeight,
        },
        { onConflict: 'proposal_id,voter_id' },
      );

    if (upsertErr) {
      console.error('[discord/proposals/vote] upsert error:', upsertErr);
      return NextResponse.json({ error: 'Failed to record vote' }, { status: 500 });
    }

    // Fetch updated vote counts for this proposal
    const { data: allVotes } = await supabase
      .from('discord_proposal_votes')
      .select('vote_value, weight')
      .eq('proposal_id', proposalId);

    const agg = {
      yes_count: 0, no_count: 0, abstain_count: 0,
      yes_weight: 0, no_weight: 0, abstain_weight: 0,
      total_votes: 0, total_weight: 0,
    };

    for (const v of allVotes ?? []) {
      const w = Number(v.weight) || 0;
      agg.total_votes += 1;
      agg.total_weight += w;
      if (v.vote_value === 'yes') {
        agg.yes_count += 1;
        agg.yes_weight += w;
      } else if (v.vote_value === 'no') {
        agg.no_count += 1;
        agg.no_weight += w;
      } else {
        agg.abstain_count += 1;
        agg.abstain_weight += w;
      }
    }

    return NextResponse.json({
      success: true,
      vote: vote as string,
      weight: respectWeight,
      votes: agg,
    });
  } catch (err) {
    console.error('[discord/proposals/vote] unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
