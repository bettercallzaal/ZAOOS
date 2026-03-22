import { supabaseAdmin } from '@/lib/db/supabase';
import { INTELLIGENCE_BASE } from './constants';

interface RandomStat {
  title: string;
  publish_text: string;
  stat_type: string;
}

type StatGenerator = () => Promise<RandomStat | null>;

const generators: StatGenerator[] = [
  // 1. Most wins
  async () => {
    const { data } = await supabaseAdmin
      .from('wavewarz_artists')
      .select('name, wins, losses, battles_count')
      .order('wins', { ascending: false })
      .limit(1)
      .single();
    if (!data) return null;
    const rate = data.battles_count > 0 ? Math.round((data.wins / data.battles_count) * 100) : 0;
    return {
      title: `${data.name} -- ${data.wins} WaveWarZ Wins`,
      publish_text: `${data.name} has won ${data.wins} WaveWarZ battles with a ${rate}% win rate -- the most wins on the platform.\n\nFull stats: ${INTELLIGENCE_BASE}/leaderboards`,
      stat_type: 'artist_win_record',
    };
  },

  // 2. Volume leader
  async () => {
    const { data } = await supabaseAdmin
      .from('wavewarz_artists')
      .select('name, total_volume_sol, battles_count')
      .order('total_volume_sol', { ascending: false })
      .limit(1)
      .single();
    if (!data) return null;
    return {
      title: `${data.name} -- ${Number(data.total_volume_sol).toFixed(2)} SOL Volume`,
      publish_text: `${data.name} has generated ${Number(data.total_volume_sol).toFixed(2)} SOL in trading volume across ${data.battles_count} battles -- more than any other artist.\n\nFull stats: ${INTELLIGENCE_BASE}/leaderboards`,
      stat_type: 'volume_leader',
    };
  },

  // 3. Undefeated artist
  async () => {
    const { data } = await supabaseAdmin
      .from('wavewarz_artists')
      .select('name, wins, losses')
      .eq('losses', 0)
      .gt('wins', 0)
      .order('wins', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!data) return null;
    return {
      title: `${data.name} -- Undefeated`,
      publish_text: `${data.name} is undefeated at ${data.wins}-0 on WaveWarZ.\n\nFull stats: ${INTELLIGENCE_BASE}/leaderboards`,
      stat_type: 'undefeated',
    };
  },

  // 4. Most active artist
  async () => {
    const { data } = await supabaseAdmin
      .from('wavewarz_artists')
      .select('name, battles_count')
      .order('battles_count', { ascending: false })
      .limit(1)
      .single();
    if (!data) return null;
    return {
      title: `${data.name} -- ${data.battles_count} Battles`,
      publish_text: `${data.name} has battled ${data.battles_count} times on WaveWarZ -- the most dedicated battler on the platform.\n\nFull stats: ${INTELLIGENCE_BASE}/leaderboards`,
      stat_type: 'most_active',
    };
  },

  // 5. Platform totals
  async () => {
    const { data: artists } = await supabaseAdmin
      .from('wavewarz_artists')
      .select('total_volume_sol');
    if (!artists?.length) return null;
    const totalVol = artists.reduce((s, a) => s + Number(a.total_volume_sol), 0);
    const { count } = await supabaseAdmin
      .from('wavewarz_battle_log')
      .select('id', { count: 'exact', head: true });
    return {
      title: `WaveWarZ Platform Stats`,
      publish_text: `WaveWarZ has hosted ${count || '600+'} battles with ${totalVol.toFixed(0)}+ SOL total trading volume across ${artists.length} artists.\n\nExplore: wavewarz.com`,
      stat_type: 'platform_total',
    };
  },

  // 6. Biggest single battle
  async () => {
    const { data } = await supabaseAdmin
      .from('wavewarz_battle_log')
      .select('battle_id, artist_a, artist_b, volume_sol')
      .order('volume_sol', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!data || Number(data.volume_sol) === 0) return null;
    return {
      title: `Biggest WaveWarZ Battle -- ${Number(data.volume_sol).toFixed(2)} SOL`,
      publish_text: `The highest volume WaveWarZ battle generated ${Number(data.volume_sol).toFixed(2)} SOL in trading between ${data.artist_a} and ${data.artist_b}.\n\nFull history: ${INTELLIGENCE_BASE}/battles`,
      stat_type: 'biggest_battle',
    };
  },

  // 7. Highest win rate (min 5 battles)
  async () => {
    const { data: artists } = await supabaseAdmin
      .from('wavewarz_artists')
      .select('name, wins, losses, battles_count')
      .gte('battles_count', 5);
    if (!artists?.length) return null;
    const best = artists.reduce((top, a) => {
      const rate = a.battles_count > 0 ? a.wins / a.battles_count : 0;
      const topRate = top.battles_count > 0 ? top.wins / top.battles_count : 0;
      return rate > topRate ? a : top;
    });
    const rate = Math.round((best.wins / best.battles_count) * 100);
    return {
      title: `${best.name} -- ${rate}% Win Rate`,
      publish_text: `${best.name} has a ${rate}% win rate across ${best.battles_count} battles -- the highest among active battlers.\n\nFull stats: ${INTELLIGENCE_BASE}/leaderboards`,
      stat_type: 'win_rate_leader',
    };
  },

  // 8. Earnings leader
  async () => {
    const { data } = await supabaseAdmin
      .from('wavewarz_artists')
      .select('name, career_earnings_sol')
      .order('career_earnings_sol', { ascending: false })
      .limit(1)
      .single();
    if (!data) return null;
    return {
      title: `${data.name} -- Top Earner`,
      publish_text: `${data.name} has earned ${Number(data.career_earnings_sol).toFixed(3)} SOL in career battle payouts on WaveWarZ.\n\nFull stats: ${INTELLIGENCE_BASE}/leaderboards`,
      stat_type: 'earnings_leader',
    };
  },

  // 9. Charity stats
  async () => ({
    title: `WaveWarZ Charity Impact`,
    publish_text: `WaveWarZ benefit battles have raised ~$1,500 for charity including girl child education and community support.\n\nLearn more: wavewarz.com`,
    stat_type: 'charity',
  }),

  // 10. Artist count
  async () => {
    const { count } = await supabaseAdmin
      .from('wavewarz_artists')
      .select('id', { count: 'exact', head: true });
    return {
      title: `${count || 43} Artists on WaveWarZ`,
      publish_text: `${count || 43} independent artists are competing on WaveWarZ -- hip-hop, R&B, and more. Who will you back?\n\nWatch battles: wavewarz.com`,
      stat_type: 'artist_count',
    };
  },
];

export async function getRandomStat(): Promise<RandomStat | null> {
  const shuffled = [...generators].sort(() => Math.random() - 0.5);
  for (const gen of shuffled) {
    try {
      const stat = await gen();
      if (stat) return stat;
    } catch {
      continue;
    }
  }
  return null;
}
