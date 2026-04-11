import { PORTALS, type Portal } from './destinations';

const INTEREST_KEYWORDS: Record<string, string[]> = {
  music: ['music', 'listen', 'song', 'beat', 'artist', 'producer', 'dj', 'rap', 'hip hop', 'electronic', 'battle', 'stream'],
  social: ['chat', 'talk', 'community', 'friends', 'connect', 'social', 'discord', 'telegram', 'hang out', 'meet'],
  build: ['build', 'code', 'develop', 'agent', 'ai', 'tool', 'hack', 'create', 'tech', 'engineer'],
  earn: ['earn', 'money', 'token', 'stake', 'bounty', 'reward', 'profit', 'income', 'crypto'],
  govern: ['vote', 'govern', 'proposal', 'dao', 'decision', 'democracy', 'policy'],
  vip: ['member', 'vip', 'exclusive', 'all', 'everything', 'full access'],
};

export function matchInterest(input: string): Portal | null {
  const lower = input.toLowerCase().trim();

  let bestMatch: string | null = null;
  let bestScore = 0;

  for (const [portalId, keywords] of Object.entries(INTEREST_KEYWORDS)) {
    const score = keywords.filter(kw => lower.includes(kw)).length;
    if (score > bestScore) {
      bestScore = score;
      bestMatch = portalId;
    }
  }

  if (!bestMatch) return null;
  return PORTALS.find(p => p.id === bestMatch) ?? null;
}

export const CONCIERGE_PROMPTS = [
  "What are you into?",
  "Music, social, building, or earning?",
  "I can point you to the right door.",
] as const;

export const QUICK_OPTIONS = [
  { label: '🎵 Music', value: 'music' },
  { label: '💬 Social', value: 'social' },
  { label: '🛠️ Build', value: 'build' },
  { label: '💰 Earn', value: 'earn' },
  { label: '⭐ Govern', value: 'govern' },
  { label: '👑 Everything', value: 'vip' },
] as const;
