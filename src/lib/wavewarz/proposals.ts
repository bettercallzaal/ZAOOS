import { supabaseAdmin } from '@/lib/db/supabase';
import { SPOTLIGHT_TIERS, RESPECT_THRESHOLD, INTELLIGENCE_BASE, type SpotlightTier } from './constants';

interface ProposalInput {
  title: string;
  description: string;
  category: string;
  publish_text: string;
  respect_threshold: number;
  author_id: string;
}

async function createWavewarzProposal(input: ProposalInput) {
  const { data, error } = await supabaseAdmin
    .from('proposals')
    .insert({
      title: input.title,
      description: input.description,
      category: input.category,
      publish_text: input.publish_text,
      respect_threshold: input.respect_threshold,
      author_id: input.author_id,
    })
    .select('id')
    .single();

  if (error) {
    console.error('[wavewarz-proposals] Insert failed:', error);
    return null;
  }
  return data.id as string;
}

export async function createBattleResultProposal(
  winnerName: string,
  loserName: string,
  margin: string,
  volumeSol: number,
  battleId: string,
  authorId: string,
) {
  const title = `${winnerName} beat ${loserName} -- Battle #${battleId}`;
  const description = `${winnerName} defeated ${loserName} (${margin}) with ${volumeSol} SOL trading volume in WaveWarZ Battle #${battleId}. Vote to publish this result to the /wavewarz Farcaster channel.`;
  const publish_text = `${winnerName} beat ${loserName} (${margin}) | ${volumeSol} SOL volume | Battle #${battleId}\n\nWatch battles live: wavewarz.com`;

  return createWavewarzProposal({
    title: title.slice(0, 200),
    description,
    category: 'wavewarz',
    publish_text,
    respect_threshold: RESPECT_THRESHOLD,
    author_id: authorId,
  });
}

export async function createSpotlightProposal(
  artistName: string,
  wins: number,
  volumeSol: number,
  wallet: string,
  tier: SpotlightTier,
  authorId: string,
) {
  const tierConfig = SPOTLIGHT_TIERS.find(t => t.tier === tier);
  if (!tierConfig) return null;

  const title = `${tierConfig.label}: ${artistName}`;
  const description = `${artistName} has reached ${wins} WaveWarZ wins with ${volumeSol} SOL total volume. Vote to spotlight them on the /wavewarz Farcaster channel.`;
  const publish_text = `${tierConfig.label}: ${artistName} has ${wins} WaveWarZ wins with ${volumeSol} SOL total volume.\n\nArtist profile: ${INTELLIGENCE_BASE}/artist/${wallet}`;

  return createWavewarzProposal({
    title: title.slice(0, 200),
    description,
    category: 'wavewarz',
    publish_text,
    respect_threshold: RESPECT_THRESHOLD,
    author_id: authorId,
  });
}

export async function createLeaderboardProposal(authorId: string) {
  const { data: artists } = await supabaseAdmin
    .from('wavewarz_artists')
    .select('name, wins, losses, total_volume_sol')
    .order('wins', { ascending: false })
    .limit(5);

  if (!artists?.length) return null;

  const today = new Date().toISOString().split('T')[0];
  const lines = artists.map((a, i) => {
    const total = a.wins + a.losses;
    const rate = total > 0 ? Math.round((a.wins / total) * 100) : 0;
    return `${i + 1}. ${a.name} -- ${a.wins}W-${a.losses}L (${rate}%) | ${Number(a.total_volume_sol).toFixed(2)} SOL`;
  });

  const title = `WaveWarZ Weekly Top 5 -- Week of ${today}`;
  const description = `This week's top WaveWarZ battlers. Vote to publish to the /wavewarz Farcaster channel.`;
  const publish_text = `WaveWarZ Weekly Top 5:\n\n${lines.join('\n')}\n\nFull leaderboard: ${INTELLIGENCE_BASE}/leaderboards`;

  return createWavewarzProposal({
    title: title.slice(0, 200),
    description,
    category: 'wavewarz',
    publish_text,
    respect_threshold: RESPECT_THRESHOLD,
    author_id: authorId,
  });
}

export async function createSessionReminderProposal(authorId: string) {
  const today = new Date().toISOString().split('T')[0];

  // Check if a reminder already exists for today
  const { data: existing } = await supabaseAdmin
    .from('proposals')
    .select('id')
    .eq('category', 'wavewarz')
    .like('title', `%Session Reminder -- ${today}%`)
    .limit(1);

  if (existing?.length) return null;

  const title = `WaveWarZ Session Reminder -- ${today}`;
  const description = `Reminder for tonight's WaveWarZ battles on X Spaces. Vote to publish to the /wavewarz Farcaster channel.`;
  const publish_text = `WaveWarZ battles go LIVE tonight at 8:30 PM EST on X Spaces.\n\nJoin the session: wavewarz.com`;

  return createWavewarzProposal({
    title: title.slice(0, 200),
    description,
    category: 'wavewarz',
    publish_text,
    respect_threshold: RESPECT_THRESHOLD,
    author_id: authorId,
  });
}

export function getNewSpotlightTier(wins: number, currentTier: string | null): SpotlightTier | null {
  const tierOrder: SpotlightTier[] = ['rising_star', 'veteran', 'legend'];
  const currentIdx = currentTier ? tierOrder.indexOf(currentTier as SpotlightTier) : -1;

  for (let i = SPOTLIGHT_TIERS.length - 1; i >= 0; i--) {
    const t = SPOTLIGHT_TIERS[i];
    if (wins >= t.minWins && i > currentIdx) {
      return t.tier;
    }
  }
  return null;
}
