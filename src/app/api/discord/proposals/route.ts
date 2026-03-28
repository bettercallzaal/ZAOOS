import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/db/supabase';

/**
 * GET /api/discord/proposals — Fetch Discord proposals with aggregated vote data
 * Query params:
 *   status: 'active' | 'closed' | 'all' (default: 'all')
 *   type:   'curate' | 'text' | 'governance' | 'funding' (optional filter)
 */
export async function GET(req: NextRequest) {
  const supabase = getSupabaseAdmin();
  const { searchParams } = req.nextUrl;

  const status = searchParams.get('status') || 'all';
  const type = searchParams.get('type');

  try {
    // Build proposals query
    let query = supabase
      .from('discord_proposals')
      .select('*')
      .order('created_at', { ascending: false });

    if (status !== 'all') {
      query = query.eq('status', status);
    }
    if (type) {
      query = query.eq('proposal_type', type);
    }

    const { data: proposals, error: proposalsErr } = await query;

    if (proposalsErr) {
      console.error('[discord/proposals] Query error:', proposalsErr);
      return NextResponse.json({ error: 'Failed to fetch proposals' }, { status: 500 });
    }

    if (!proposals || proposals.length === 0) {
      return NextResponse.json({ proposals: [], total: 0 });
    }

    // Fetch aggregated votes for all returned proposals
    const proposalIds = proposals.map(p => p.id);

    const { data: votes, error: votesErr } = await supabase
      .from('discord_proposal_votes')
      .select('proposal_id, vote_value, weight')
      .in('proposal_id', proposalIds);

    if (votesErr) {
      console.error('[discord/proposals] Votes query error:', votesErr);
    }

    // Aggregate votes per proposal
    const voteMap = new Map<number, {
      yes_count: number;
      no_count: number;
      abstain_count: number;
      yes_weight: number;
      no_weight: number;
      abstain_weight: number;
      total_votes: number;
      total_weight: number;
    }>();

    for (const v of votes ?? []) {
      const agg = voteMap.get(v.proposal_id) ?? {
        yes_count: 0, no_count: 0, abstain_count: 0,
        yes_weight: 0, no_weight: 0, abstain_weight: 0,
        total_votes: 0, total_weight: 0,
      };

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

      voteMap.set(v.proposal_id, agg);
    }

    // Merge proposals with vote data
    const enriched = proposals.map(p => ({
      ...p,
      votes: voteMap.get(p.id) ?? {
        yes_count: 0, no_count: 0, abstain_count: 0,
        yes_weight: 0, no_weight: 0, abstain_weight: 0,
        total_votes: 0, total_weight: 0,
      },
    }));

    return NextResponse.json({ proposals: enriched, total: enriched.length });
  } catch (err) {
    console.error('[discord/proposals] Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
