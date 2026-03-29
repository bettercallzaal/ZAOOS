import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/db/supabase';

/**
 * GET /api/discord/member-stats — Cross-platform Discord activity stats
 * Query params:
 *   discord_id: string (required) — Discord user ID or username
 */
export async function GET(req: NextRequest) {
  // Auth guard — prevent unauthenticated data enumeration
  const { getSessionData } = await import('@/lib/auth/session');
  const session = await getSessionData();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  const discordId = req.nextUrl.searchParams.get('discord_id');

  if (!discordId) {
    return NextResponse.json(
      { error: 'discord_id is required' },
      { status: 400 },
    );
  }

  try {
    // --- Fractal participation ---
    // Look up user by discord_id to find their member_name / wallet for fractal_scores
    const { data: user } = await supabase
      .from('users')
      .select('username, display_name, primary_wallet, discord_id')
      .eq('discord_id', discordId)
      .maybeSingle();

    const fractalStats = {
      totalRespect: 0,
      participationCount: 0,
      bestRank: 0,
      averageLevel: 0,
    };

    if (user) {
      const lookupName = user.display_name || user.username || '';
      const lookupWallet = user.primary_wallet?.toLowerCase() || '';

      // Query fractal_scores by wallet or member name
      const conditions: string[] = [];
      if (lookupWallet) conditions.push(`wallet_address.ilike.${lookupWallet}`);
      if (lookupName) conditions.push(`member_name.ilike.${lookupName}`);

      if (conditions.length > 0) {
        const { data: scores } = await supabase
          .from('fractal_scores')
          .select('rank, score')
          .or(conditions.join(','));

        if (scores && scores.length > 0) {
          fractalStats.participationCount = scores.length;
          fractalStats.totalRespect = scores.reduce((sum, s) => sum + (s.score || 0), 0);
          fractalStats.bestRank = Math.min(...scores.map(s => s.rank).filter(r => r > 0));
          // Average level: rank 1 = level 6, rank 6 = level 1
          const avgRank = scores.reduce((sum, s) => sum + s.rank, 0) / scores.length;
          fractalStats.averageLevel = Math.round((7 - avgRank) * 10) / 10;
        }
      }
    }

    // --- Proposal activity ---
    const { data: proposals, error: proposalsErr } = await supabase
      .from('discord_proposals')
      .select('id')
      .eq('author_id', discordId);

    if (proposalsErr) {
      console.error('[discord/member-stats] Proposals query error:', proposalsErr);
    }

    const proposalsCreated = proposals?.length ?? 0;

    // --- Voting activity ---
    const { data: votes, error: votesErr } = await supabase
      .from('discord_proposal_votes')
      .select('weight')
      .eq('voter_id', discordId);

    if (votesErr) {
      console.error('[discord/member-stats] Votes query error:', votesErr);
    }

    const votesCast = votes?.length ?? 0;
    const totalRespectWeight = (votes ?? []).reduce(
      (sum, v) => sum + (Number(v.weight) || 0),
      0,
    );

    return NextResponse.json({
      discordId,
      fractal: fractalStats,
      governance: {
        proposalsCreated,
        votesCast,
        totalRespectWeight,
      },
    });
  } catch (err) {
    console.error('[discord/member-stats] Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
