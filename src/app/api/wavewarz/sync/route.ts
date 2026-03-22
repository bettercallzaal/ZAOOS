import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db/supabase';
import { WAVEWARZ_WALLETS } from '@/lib/wavewarz/constants';
import { scrapeArtistStats } from '@/lib/wavewarz/scraper';
import {
  createSpotlightProposal,
  createLeaderboardProposal,
  createSessionReminderProposal,
  getNewSpotlightTier,
} from '@/lib/wavewarz/proposals';

export async function POST(req: NextRequest) {
  // Verify cron secret
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const results = { scraped: 0, failed: 0, proposals: 0 };

  // Get a system user ID to author proposals (first admin)
  const { data: systemUser } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('is_admin', true)
    .limit(1)
    .single();

  if (!systemUser) {
    return NextResponse.json({ error: 'No admin user for system proposals' }, { status: 500 });
  }
  const authorId = systemUser.id;

  // Scrape each wallet with rate limiting
  for (const { wallet, name: fallbackName } of WAVEWARZ_WALLETS) {
    try {
      const stats = await scrapeArtistStats(wallet);
      if (!stats) {
        results.failed++;
        continue;
      }

      // Get existing record
      const { data: existing } = await supabaseAdmin
        .from('wavewarz_artists')
        .select('wins, spotlight_tier, last_battle_id')
        .eq('solana_wallet', wallet)
        .maybeSingle();

      // Upsert artist
      await supabaseAdmin
        .from('wavewarz_artists')
        .upsert({
          solana_wallet: wallet,
          name: stats.name !== 'Unknown' ? stats.name : fallbackName,
          battles_count: stats.battlesCount,
          wins: stats.wins,
          losses: stats.losses,
          total_volume_sol: stats.totalVolumeSol,
          career_earnings_sol: stats.careerEarningsSol,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'solana_wallet' });

      results.scraped++;

      // Check for spotlight tier upgrade
      const newTier = getNewSpotlightTier(stats.wins, existing?.spotlight_tier || null);
      if (newTier) {
        const proposalId = await createSpotlightProposal(
          stats.name !== 'Unknown' ? stats.name : fallbackName,
          stats.wins,
          stats.totalVolumeSol,
          wallet,
          newTier,
          authorId,
        );
        if (proposalId) {
          await supabaseAdmin
            .from('wavewarz_artists')
            .update({ spotlight_tier: newTier })
            .eq('solana_wallet', wallet);
          results.proposals++;
        }
      }

      // Small delay to avoid rate limiting the Intelligence dashboard
      await new Promise(r => setTimeout(r, 200));
    } catch (err) {
      console.error(`[wavewarz-sync] Error processing ${wallet}:`, err);
      results.failed++;
    }
  }

  // Check day of week for leaderboard + session reminders
  const now = new Date();
  const estDate = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
  const dayOfWeek = estDate.getDay(); // 0=Sun, 6=Sat

  // Sunday: create weekly leaderboard proposal
  if (dayOfWeek === 0) {
    const id = await createLeaderboardProposal(authorId);
    if (id) results.proposals++;
  }

  // Mon-Fri: create session reminder proposal
  if (dayOfWeek >= 1 && dayOfWeek <= 5) {
    const id = await createSessionReminderProposal(authorId);
    if (id) results.proposals++;
  }

  return NextResponse.json({ ok: true, ...results });
}
