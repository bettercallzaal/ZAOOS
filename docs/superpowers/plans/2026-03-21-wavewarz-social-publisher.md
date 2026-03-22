# WaveWarZ Social Publisher Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make ZAO OS the governance-gated Farcaster publishing hub for WaveWarZ — sync battle data, generate proposals, and publish approved ones via WaveWarZ's official signer.

**Architecture:** Extend the existing proposal system with `wavewarz` and `social` categories. A nightly cron scrapes WaveWarZ Intelligence for battle data, stores it in two new Supabase tables, and generates proposals. The vote threshold publisher routes `wavewarz` proposals to WaveWarZ's own Farcaster signer. A random stat generator button lets members create proposals from synced data.

**Tech Stack:** Next.js 16 App Router, Supabase, Neynar SDK, Zod, Vercel Cron

**Spec:** `docs/superpowers/specs/2026-03-21-wavewarz-social-publisher-design.md`

---

## File Map

### New Files
| File | Responsibility |
|------|---------------|
| `src/lib/wavewarz/constants.ts` | 43-wallet roster, spotlight thresholds, proposal templates |
| `src/lib/wavewarz/scraper.ts` | Fetch + parse WaveWarZ Intelligence artist pages |
| `src/lib/wavewarz/proposals.ts` | Generate proposal objects from battle data |
| `src/lib/wavewarz/random-stats.ts` | 10 random stat types, query DB, format text |
| `src/app/api/wavewarz/sync/route.ts` | Cron endpoint: scrape + upsert + create proposals |
| `src/app/api/wavewarz/artists/route.ts` | GET leaderboard from wavewarz_artists |
| `src/app/api/wavewarz/random-stat/route.ts` | GET random stat for proposal pre-fill |
| `src/components/wavewarz/GeneratePostButton.tsx` | Button + preview modal for random stat proposals |
| `scripts/wavewarz-tables.sql` | SQL for wavewarz_artists + wavewarz_battle_log tables |

### Modified Files
| File | Change |
|------|--------|
| `src/lib/env.ts:33` | Add 3 WAVEWARZ_OFFICIAL env vars |
| `src/lib/validation/schemas.ts:59-65` | Add `wavewarz` and `social` to proposalCategorySchema |
| `src/app/api/proposals/vote/route.ts:209-218` | Route wavewarz proposals to WaveWarZ signer |
| `src/app/(auth)/governance/page.tsx:70-76` | Add category colors + GeneratePostButton |
| `src/app/(auth)/wavewarz/page.tsx:40-78` | Add GeneratePostButton above tab switcher |
| `community.config.ts` | Add `channel: 'wavewarz'` to wavewarz config |
| `vercel.json` | Add cron schedule for /api/wavewarz/sync |

---

## Task 1: Environment Variables + Schema Updates

**Files:**
- Modify: `src/lib/env.ts:33`
- Modify: `src/lib/validation/schemas.ts:59-65`
- Modify: `src/app/(auth)/governance/page.tsx:70-76`
- Modify: `community.config.ts`

- [ ] **Step 1: Add WaveWarZ env vars to env.ts**

In `src/lib/env.ts`, before the closing `} as const;` on line 34, add:

```typescript
  // WaveWarZ official account (governance-powered posting to /wavewarz channel)
  WAVEWARZ_OFFICIAL_FID: optionalEnv('WAVEWARZ_OFFICIAL_FID'),
  WAVEWARZ_OFFICIAL_SIGNER_UUID: optionalEnv('WAVEWARZ_OFFICIAL_SIGNER_UUID'),
  WAVEWARZ_OFFICIAL_NEYNAR_API_KEY: optionalEnv('WAVEWARZ_OFFICIAL_NEYNAR_API_KEY'),
```

- [ ] **Step 2: Add wavewarz and social to proposal categories**

In `src/lib/validation/schemas.ts`, replace the `proposalCategorySchema` (lines 59-65):

```typescript
export const proposalCategorySchema = z.enum([
  'general',
  'treasury',
  'governance',
  'technical',
  'community',
  'wavewarz',
  'social',
]);
```

- [ ] **Step 3: Add category colors in governance page**

In `src/app/(auth)/governance/page.tsx`, add to the `CATEGORY_COLORS` object (after line 75):

```typescript
  wavewarz: 'bg-green-500/10 text-green-400',
  social: 'bg-pink-500/10 text-pink-400',
```

- [ ] **Step 4: Add channel to community config**

In `community.config.ts`, add `channel: 'wavewarz'` to the wavewarz object.

- [ ] **Step 5: Verify build passes**

Run: `npm run build`
Expected: Build succeeds (no type errors from new enum values)

- [ ] **Step 6: Commit**

```bash
git add src/lib/env.ts src/lib/validation/schemas.ts src/app/\(auth\)/governance/page.tsx community.config.ts
git commit -m "feat: add wavewarz and social proposal categories + env vars"
```

---

## Task 2: Signer Routing in Vote Threshold Publisher

**Files:**
- Modify: `src/app/api/proposals/vote/route.ts:152-226`

- [ ] **Step 1: Read the current checkPublishThreshold function**

Read `src/app/api/proposals/vote/route.ts` lines 152-226 to understand the full publish flow.

- [ ] **Step 2: Modify the Farcaster publish block to route by category**

In `src/app/api/proposals/vote/route.ts`, replace the hardcoded signer/channel block (lines 209-218) with category-aware routing:

```typescript
        // Route to appropriate signer based on proposal category
        let signerUuid: string | undefined;
        let neynarApiKey: string | undefined;
        let publishChannel: string;

        if (fullProposal.category === 'wavewarz') {
          signerUuid = ENV.WAVEWARZ_OFFICIAL_SIGNER_UUID;
          neynarApiKey = ENV.WAVEWARZ_OFFICIAL_NEYNAR_API_KEY;
          publishChannel = 'wavewarz';
        } else {
          signerUuid = ENV.ZAO_OFFICIAL_SIGNER_UUID;
          neynarApiKey = ENV.ZAO_OFFICIAL_NEYNAR_API_KEY;
          publishChannel = 'zao';
        }

        if (signerUuid) {
          const result = await postCast(
            signerUuid,
            castText,
            publishChannel,
            undefined,
            undefined,
            embedUrls,
            undefined,
            neynarApiKey,
          );
          castHash = result?.cast?.hash || null;
          console.log(`[publish-threshold] Published to /${publishChannel}: ${castHash}`);
        }
```

Also update the guard condition above this block — it currently checks `ENV.ZAO_OFFICIAL_SIGNER_UUID`. Change to check whichever signer is appropriate:

```typescript
    const hasWavewarzSigner = fullProposal.category === 'wavewarz' && ENV.WAVEWARZ_OFFICIAL_SIGNER_UUID;
    const hasZaoSigner = fullProposal.category !== 'wavewarz' && ENV.ZAO_OFFICIAL_SIGNER_UUID;
    if (hasWavewarzSigner || hasZaoSigner) {
```

- [ ] **Step 3: Verify build passes**

Run: `npm run build`

- [ ] **Step 4: Commit**

```bash
git add src/app/api/proposals/vote/route.ts
git commit -m "feat: route wavewarz proposals to WaveWarZ official Farcaster signer"
```

---

## Task 3: Database Tables + Seed Script

**Files:**
- Create: `scripts/wavewarz-tables.sql`

- [ ] **Step 1: Create the SQL migration file**

Create `scripts/wavewarz-tables.sql` with both tables from the spec:

```sql
-- WaveWarZ Artist Stats (synced nightly from Intelligence dashboard)
CREATE TABLE IF NOT EXISTS wavewarz_artists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  solana_wallet TEXT NOT NULL UNIQUE,
  battles_count INTEGER NOT NULL DEFAULT 0,
  wins INTEGER NOT NULL DEFAULT 0,
  losses INTEGER NOT NULL DEFAULT 0,
  total_volume_sol NUMERIC NOT NULL DEFAULT 0,
  career_earnings_sol NUMERIC NOT NULL DEFAULT 0,
  biggest_win_sol NUMERIC NOT NULL DEFAULT 0,
  win_streak INTEGER NOT NULL DEFAULT 0,
  best_win_streak INTEGER NOT NULL DEFAULT 0,
  first_seen TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_battle TIMESTAMPTZ,
  last_battle_id TEXT,
  zao_fid INTEGER,
  farcaster_username TEXT,
  spotlight_tier TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_wavewarz_artists_wins ON wavewarz_artists(wins DESC);
CREATE INDEX IF NOT EXISTS idx_wavewarz_artists_volume ON wavewarz_artists(total_volume_sol DESC);
CREATE INDEX IF NOT EXISTS idx_wavewarz_artists_wallet ON wavewarz_artists(solana_wallet);
CREATE INDEX IF NOT EXISTS idx_wavewarz_artists_fid ON wavewarz_artists(zao_fid) WHERE zao_fid IS NOT NULL;

-- WaveWarZ Battle Log (raw battle results)
CREATE TABLE IF NOT EXISTS wavewarz_battle_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  battle_id TEXT NOT NULL UNIQUE,
  artist_a TEXT NOT NULL,
  artist_b TEXT NOT NULL,
  song_a TEXT,
  song_b TEXT,
  winner TEXT,
  winner_margin TEXT,
  volume_sol NUMERIC NOT NULL DEFAULT 0,
  battle_type TEXT,
  settled_at TIMESTAMPTZ,
  proposal_id UUID,
  synced_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_wavewarz_battles_settled ON wavewarz_battle_log(settled_at DESC);
CREATE INDEX IF NOT EXISTS idx_wavewarz_battles_id ON wavewarz_battle_log(battle_id);

-- Enable RLS
ALTER TABLE wavewarz_artists ENABLE ROW LEVEL SECURITY;
ALTER TABLE wavewarz_battle_log ENABLE ROW LEVEL SECURITY;

-- Read-only for authenticated users
CREATE POLICY "wavewarz_artists_read" ON wavewarz_artists FOR SELECT TO authenticated USING (true);
CREATE POLICY "wavewarz_battle_log_read" ON wavewarz_battle_log FOR SELECT TO authenticated USING (true);
```

- [ ] **Step 2: Run the SQL in Supabase dashboard**

Execute the SQL in the Supabase SQL Editor to create the tables.

- [ ] **Step 3: Commit**

```bash
git add scripts/wavewarz-tables.sql
git commit -m "feat: add wavewarz_artists and wavewarz_battle_log tables"
```

---

## Task 4: Constants + Wallet Roster

**Files:**
- Create: `src/lib/wavewarz/constants.ts`

- [ ] **Step 1: Create constants file with wallet roster and templates**

Create `src/lib/wavewarz/constants.ts` with:
- The full 43-wallet roster array (wallet address + known name)
- Spotlight tier thresholds
- Proposal text templates
- The Intelligence base URL

```typescript
// All 43 verified WaveWarZ artist wallets from Intelligence dashboard (doc 101)
export const WAVEWARZ_WALLETS: { wallet: string; name: string }[] = [
  { wallet: 'B97zbRCUf2jhPj6Cs2QXc9EGyWdNDvQ6ExUeB7sxrTSA', name: 'LUI' },
  { wallet: '62g5hYiSTqj185F26c3pT6EPx4Gs1P6gL72kGNzvkbjM', name: 'Hurric4n3Ike' },
  { wallet: '2J32aabxSnAPC4YpTC6jFX6EMPRkHeovPuMNtfLs8bXp', name: 'Stormi' },
  { wallet: 'CUh7ZWej4qG4daKHA44vV7zNNeonyctt45qHZykz9WGN', name: 'APORKALYPSE' },
  { wallet: 'F4HRLiYo8uk9uuF9PV23czSHRy38sgj9uPBJdx4dmZnP', name: 'Lil Rocky' },
  { wallet: '9HMK1zVyNJhnqtgog9knwrjHtqeX6N2fjcvojfw7y2WZ', name: 'ONE' },
  { wallet: '4g2wDCUN1WcsMRd2czDSVhxgk5eCLH4CpVLk3thfv5rG', name: 'Hurric4n3Ike' },
  { wallet: 'F9U1Q12LtVRadwMud97Mm6K4YCBSrEgS7ZBd9vMTB1t8', name: 'Yoshiro Mare' },
  { wallet: '9xTn9ni1UPACiB1KQy6U8gd33nzM86BP3REje9gyBZmx', name: 'GODCLOUD' },
  { wallet: 'BFM9h9WMxGCYxqexLB5w93iSd5uye9xCyxkjchZirG4X', name: 'PROF!T' },
  { wallet: '23oqJnEJhJ3qLTq5MjKYPgLDYjfpRmvWWzMA3Zq6NGmg', name: 'Geek Myth' },
  { wallet: 'j2wHMZUPNrAuj1yoGtuE47pUcQQ4EvASnkWrS1kD6hs', name: 'Money Miller' },
  { wallet: '9LLTjsWhYJBxFgca43MQtrLLsPcxWMR86NoxAHGsBUCk', name: 'STILO English' },
  { wallet: 'Dtoezry5LGFEx63AaGJyWBgn5GbobTmKZ4SrX9v6BmF4', name: 'Crypto Beat Radio' },
  { wallet: 'Bf75J5XaGQkqC7ndhNWrkhWfqJnJrLrHKa3dhr2Nh3Pe', name: 'CHECK' },
  { wallet: 'AmDkgFg1dbLeGppfou612eeoygbRjuXZ1Kv5hfynSurs', name: 'JED XO' },
  { wallet: 'CWvdGzpNbUDRJaUVGVwFnyMCwnLikfYqA45KGgWpC5NM', name: 'Krem' },
  { wallet: '7v6RxAhGZd6MzvCZ9gxsw5t4iHaGUmG7mn4cSzSLSChu', name: 'K1DDV3NOM' },
  { wallet: '9rgpHm4iSXjdN9Psarw5Lz8ftqVcV5CnE1xjrYFhz1gW', name: 'Dr. Bruce Banner' },
  { wallet: 'F11aszq1b1p3QvuYzmJXMwFMFYw7bxTbeQ42PfQyCzNE', name: 'Goose Park' },
  { wallet: '2tbquBjgrCUbsxTbCHYJM1BSc3MZD3W1HXGmD5y4R8tU', name: 'MOZAY CALLOWAY' },
  { wallet: '3vEb4ECM4tqfG1CLrdXqgA56KA4UcuWx9mw7puiWWQKG', name: 'Ramone' },
  { wallet: 'EB6NHP31B8hM1f4zwzKVNUD66t3CYLfse6HhD9fim1wg', name: 'BallOutCut' },
  { wallet: 'EsZTCLNnTzvma5rJArHvQsuoUtxoRiZTuTgng3nNxW6s', name: 'CANNON' },
  { wallet: 'CnzrNEu9JFS95fsbMGvkbNLzEKbDazQ6RiTXkrwbbBZw', name: 'CANNON JONES' },
  { wallet: 'CcXSb6iaUFZwsrMFw2htXYdVDqxPTtn4EkoyJ78XLtys', name: 'Chief' },
  { wallet: '9xMBJbs3xZ1CwpR75U7b4vpTD3ou3HbVzuHiLRE21Jgo', name: '$BONGA: VibeLord' },
  { wallet: 'BFjm3Cocn1gdqRe9kA9k1Wf5P5ffPtohLttpqdyAhFBb', name: 'Armand' },
  { wallet: 'Bx1o7mkirgPigHwAxVQaypoRHtL6JNdLHmcrzpfyk12f', name: 'Chill Sample Hub' },
  { wallet: '7a6BrTcHq21CNgY6okuYyCJczTctJnqv1zUSRAjNqNAJ', name: 'Rome' },
  { wallet: '7gR78C7mq5Bg1iFBht7kxx8F88Gpx8oy3P3y7BQeeGYz', name: 'Preshzino Songz' },
  { wallet: '59x5Y37hR6LbFSLWKitY47H4LvnakVet6hVobm6c7anx', name: 'JayStreetz' },
  { wallet: '9RbUvEftkY9Q7teDaCYjGs1w5n7318GUaJ1KdLDCQM1B', name: 'Hurric4n3Ike' },
  { wallet: '8qXrvREdA1whuqmLiuW7h9ZhiRCrkWpZqKUs97ss68M1', name: 'The Tech' },
  { wallet: '4LyAbTzpEPo21tN9rNazkU5VmkNdPBJ7HttiAT2CuB8S', name: 'LexiBanti' },
  { wallet: 'EMXDPJp9jTaDnSdzvwzpA5zdfgbf74mwjNQc5ZAmCSNA', name: 'Visionz' },
  { wallet: 'G7oRakt851BoY5HVQM7ryP8fma3LkSVHiavyQFbuQY66', name: 'Wiz' },
  { wallet: 'EyGR6ptNoBjbLCT53uu6eN1UAYzTDaQtpBFWmMxQ4TMU', name: 'Rome' },
  { wallet: '3upVJtamyVx9h8zseHhGDHbtqZ7n15wUh6SzNJR2GFN4', name: 'PKMN CTO' },
  { wallet: 'Ciu7T1FhAthTBMC7dN7KQKyRGAr2BpPg5Snq6YxBsxSm', name: '$STUPID: Atchblockbaby' },
  { wallet: '3FXptfW8c1w9CQk6FRAK97vVHBPisABdHvVr2DJAurwR', name: 'Davyd' },
  { wallet: '13gQxwput7SSr7BQSxPiRvW45Q81KtKZikzWw4A75fkc', name: 'AYOTEMI' },
  { wallet: 'Cx5HiWEw8m87HMPV7zcis65y6KEtFV47h8sBnhsefaYD', name: 'GESD1' },
];

export const INTELLIGENCE_BASE = 'https://wavewarz-intelligence.vercel.app';

export const SPOTLIGHT_TIERS = [
  { tier: 'rising_star', label: 'Rising Star', minWins: 3 },
  { tier: 'veteran', label: 'Battle Veteran', minWins: 10 },
  { tier: 'legend', label: 'Battle Legend', minWins: 25 },
] as const;

export type SpotlightTier = typeof SPOTLIGHT_TIERS[number]['tier'];

export const RESPECT_THRESHOLD = 1000;
```

- [ ] **Step 2: Verify build**

Run: `npm run build`

- [ ] **Step 3: Commit**

```bash
git add src/lib/wavewarz/constants.ts
git commit -m "feat: add WaveWarZ constants with 43-wallet roster"
```

---

## Task 5: Intelligence Scraper

**Files:**
- Create: `src/lib/wavewarz/scraper.ts`

- [ ] **Step 1: Create the scraper**

Create `src/lib/wavewarz/scraper.ts` that fetches an artist page from WaveWarZ Intelligence and parses the stats from the HTML/hydration payload:

```typescript
import { INTELLIGENCE_BASE } from './constants';

export interface ArtistStats {
  name: string;
  wallet: string;
  wins: number;
  losses: number;
  battlesCount: number;
  totalVolumeSol: number;
  careerEarningsSol: number;
  lastBattleId: string | null;
}

/**
 * Fetch and parse an artist's stats from WaveWarZ Intelligence.
 * The page is a Next.js SSR page — stats are in the initial HTML payload.
 */
export async function scrapeArtistStats(wallet: string): Promise<ArtistStats | null> {
  try {
    const res = await fetch(`${INTELLIGENCE_BASE}/artist/${wallet}`, {
      headers: { 'User-Agent': 'ZAO-OS-Sync/1.0' },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return null;

    const html = await res.text();

    // Extract artist name from page title or heading
    const nameMatch = html.match(/<(?:h1|h2|title)[^>]*>([^<]+)/i);
    const name = nameMatch?.[1]?.replace(/ \| WaveWarZ.*/, '').trim() || 'Unknown';

    // Parse stats from Next.js hydration payload or visible text
    const winsMatch = html.match(/(?:Wins|wins)[:\s]*(\d+)/);
    const lossesMatch = html.match(/(?:Losses|losses)[:\s]*(\d+)/);
    const volumeMatch = html.match(/(?:Total Volume|volume)[:\s]*([\d.]+)\s*SOL/i);
    const earningsMatch = html.match(/(?:Career Earnings|earnings)[:\s]*([\d.]+)\s*SOL/i);

    const wins = winsMatch ? parseInt(winsMatch[1], 10) : 0;
    const losses = lossesMatch ? parseInt(lossesMatch[1], 10) : 0;

    return {
      name,
      wallet,
      wins,
      losses,
      battlesCount: wins + losses,
      totalVolumeSol: volumeMatch ? parseFloat(volumeMatch[1]) : 0,
      careerEarningsSol: earningsMatch ? parseFloat(earningsMatch[1]) : 0,
      lastBattleId: null, // Will be populated from battle-specific parsing if available
    };
  } catch (err) {
    console.error(`[wavewarz-scraper] Failed to scrape ${wallet}:`, err);
    return null;
  }
}
```

- [ ] **Step 2: Verify build**

Run: `npm run build`

- [ ] **Step 3: Commit**

```bash
git add src/lib/wavewarz/scraper.ts
git commit -m "feat: add WaveWarZ Intelligence page scraper"
```

---

## Task 6: Proposal Generator

**Files:**
- Create: `src/lib/wavewarz/proposals.ts`

- [ ] **Step 1: Create proposal generator with templates from spec**

Create `src/lib/wavewarz/proposals.ts` with functions to generate proposal objects for each type (battle result, spotlight, leaderboard, session reminder):

```typescript
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
```

- [ ] **Step 2: Verify build**

Run: `npm run build`

- [ ] **Step 3: Commit**

```bash
git add src/lib/wavewarz/proposals.ts
git commit -m "feat: add WaveWarZ proposal generators (battle, spotlight, leaderboard, reminder)"
```

---

## Task 7: Sync Cron Route

**Files:**
- Create: `src/app/api/wavewarz/sync/route.ts`
- Modify: `vercel.json`

- [ ] **Step 1: Create the sync endpoint**

Create `src/app/api/wavewarz/sync/route.ts` — the cron that scrapes Intelligence, upserts artists, detects new battles, and creates proposals:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db/supabase';
import { WAVEWARZ_WALLETS } from '@/lib/wavewarz/constants';
import { scrapeArtistStats } from '@/lib/wavewarz/scraper';
import {
  createBattleResultProposal,
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

  // Scrape each wallet with rate limiting (avoid hammering Intelligence)
  for (const { wallet, name: fallbackName } of WAVEWARZ_WALLETS) {
    try {
      const stats = await scrapeArtistStats(wallet);
      if (!stats) {
        results.failed++;
        continue;
      }

      // Upsert artist
      const { data: existing } = await supabaseAdmin
        .from('wavewarz_artists')
        .select('wins, spotlight_tier, last_battle_id')
        .eq('solana_wallet', wallet)
        .maybeSingle();

      const prevWins = existing?.wins ?? 0;
      const prevBattleId = existing?.last_battle_id;

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
  const estHour = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
  const dayOfWeek = estHour.getDay(); // 0=Sun, 6=Sat

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
```

- [ ] **Step 2: Add cron to vercel.json**

Read `vercel.json` and add the cron entry. If no `vercel.json` exists, create one:

```json
{
  "crons": [
    {
      "path": "/api/wavewarz/sync",
      "schedule": "0 23 * * *"
    }
  ]
}
```

- [ ] **Step 3: Verify build**

Run: `npm run build`

- [ ] **Step 4: Commit**

```bash
git add src/app/api/wavewarz/sync/route.ts vercel.json
git commit -m "feat: add WaveWarZ sync cron (6 PM EST daily)"
```

---

## Task 8: Artists Leaderboard API

**Files:**
- Create: `src/app/api/wavewarz/artists/route.ts`

- [ ] **Step 1: Create the leaderboard endpoint**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getSessionData } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/db/supabase';

export async function GET(req: NextRequest) {
  const session = await getSessionData();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(req.url);
  const sort = url.searchParams.get('sort') || 'wins';
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '20', 10), 50);
  const linkedOnly = url.searchParams.get('linked_only') === 'true';

  const validSorts = ['wins', 'total_volume_sol'];
  const sortCol = validSorts.includes(sort) ? sort : 'wins';

  let query = supabaseAdmin
    .from('wavewarz_artists')
    .select('*')
    .order(sortCol, { ascending: false })
    .limit(limit);

  if (linkedOnly) {
    query = query.not('zao_fid', 'is', null);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[wavewarz-artists] Fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch artists' }, { status: 500 });
  }

  return NextResponse.json({ artists: data });
}
```

- [ ] **Step 2: Verify build**

Run: `npm run build`

- [ ] **Step 3: Commit**

```bash
git add src/app/api/wavewarz/artists/route.ts
git commit -m "feat: add WaveWarZ artist leaderboard API"
```

---

## Task 9: Random Stat Generator

**Files:**
- Create: `src/lib/wavewarz/random-stats.ts`
- Create: `src/app/api/wavewarz/random-stat/route.ts`

- [ ] **Step 1: Create random stats logic**

Create `src/lib/wavewarz/random-stats.ts` with 10 stat types that query from the DB:

```typescript
import { supabaseAdmin } from '@/lib/db/supabase';
import { INTELLIGENCE_BASE } from './constants';

interface RandomStat {
  title: string;
  publish_text: string;
  stat_type: string;
}

type StatGenerator = () => Promise<RandomStat | null>;

const generators: StatGenerator[] = [
  // 1. Artist win record (most wins)
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

  // 4. Most active artist (most battles)
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

  // 6. Biggest single battle by volume
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
      .gte('battles_count', 5)
      .order('wins', { ascending: false });
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

  // 9. Charity stats (static — from research)
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
  // Shuffle and try each generator until one returns a result
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
```

- [ ] **Step 2: Create the API route**

Create `src/app/api/wavewarz/random-stat/route.ts`:

```typescript
import { NextResponse } from 'next/server';
import { getSessionData } from '@/lib/auth/session';
import { getRandomStat } from '@/lib/wavewarz/random-stats';

export async function GET() {
  const session = await getSessionData();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const stat = await getRandomStat();
  if (!stat) {
    return NextResponse.json({ error: 'No stats available yet' }, { status: 404 });
  }

  return NextResponse.json(stat);
}
```

- [ ] **Step 3: Verify build**

Run: `npm run build`

- [ ] **Step 4: Commit**

```bash
git add src/lib/wavewarz/random-stats.ts src/app/api/wavewarz/random-stat/route.ts
git commit -m "feat: add WaveWarZ random stat generator (10 stat types)"
```

---

## Task 10: Generate Post Button Component

**Files:**
- Create: `src/components/wavewarz/GeneratePostButton.tsx`
- Modify: `src/app/(auth)/governance/page.tsx`
- Modify: `src/app/(auth)/wavewarz/page.tsx`

- [ ] **Step 1: Create the GeneratePostButton component**

Create `src/components/wavewarz/GeneratePostButton.tsx`:

```typescript
'use client';

import { useState } from 'react';

interface RandomStatResponse {
  title: string;
  publish_text: string;
  stat_type: string;
}

export function GeneratePostButton() {
  const [stat, setStat] = useState<RandomStatResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function generateStat() {
    setLoading(true);
    setError(null);
    setStat(null);
    setSuccess(false);
    try {
      const res = await fetch('/api/wavewarz/random-stat');
      if (!res.ok) throw new Error('No stats available');
      const data = await res.json();
      setStat(data);
    } catch {
      setError('Could not generate stat. Try syncing data first.');
    } finally {
      setLoading(false);
    }
  }

  async function createProposal() {
    if (!stat) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/proposals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: stat.title,
          description: `Generated WaveWarZ stat. Vote to publish to the /wavewarz Farcaster channel.`,
          category: 'wavewarz',
          publish_text: stat.publish_text,
          respect_threshold: 1000,
        }),
      });
      if (!res.ok) throw new Error('Failed to create proposal');
      setSuccess(true);
      setStat(null);
    } catch {
      setError('Failed to create proposal');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <button
        onClick={generateStat}
        disabled={loading}
        className="px-3 py-1.5 text-xs font-medium rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors disabled:opacity-50"
      >
        {loading ? 'Generating...' : 'Generate WaveWarZ Post'}
      </button>

      {stat && (
        <div className="mt-3 p-3 bg-[#0d1b2a] rounded-xl border border-gray-800">
          <p className="text-xs text-gray-500 mb-1">Preview:</p>
          <p className="text-sm text-white font-medium mb-1">{stat.title}</p>
          <p className="text-xs text-gray-300 whitespace-pre-wrap">{stat.publish_text}</p>
          <div className="flex gap-2 mt-3">
            <button
              onClick={createProposal}
              disabled={submitting}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-[#f5a623] text-black hover:bg-[#ffd700] transition-colors disabled:opacity-50"
            >
              {submitting ? 'Creating...' : 'Create Proposal'}
            </button>
            <button
              onClick={generateStat}
              disabled={loading}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors"
            >
              Try Another
            </button>
          </div>
        </div>
      )}

      {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
      {success && <p className="mt-2 text-xs text-green-400">Proposal created! Check the governance tab.</p>}
    </div>
  );
}
```

- [ ] **Step 2: Add to governance page**

In `src/app/(auth)/governance/page.tsx`, import and render `GeneratePostButton` near the "New Proposal" button area. Add import at top:

```typescript
import { GeneratePostButton } from '@/components/wavewarz/GeneratePostButton';
```

Place the component in the proposals section header area.

- [ ] **Step 3: Add to wavewarz page**

In `src/app/(auth)/wavewarz/page.tsx`, import and render `GeneratePostButton` between the header and the view switcher. Add import at top:

```typescript
import { GeneratePostButton } from '@/components/wavewarz/GeneratePostButton';
```

Add the component in a container between the header and the tab switcher div.

- [ ] **Step 4: Verify build**

Run: `npm run build`

- [ ] **Step 5: Commit**

```bash
git add src/components/wavewarz/GeneratePostButton.tsx src/app/\(auth\)/governance/page.tsx src/app/\(auth\)/wavewarz/page.tsx
git commit -m "feat: add Generate WaveWarZ Post button to governance and wavewarz pages"
```

---

## Task 11: Verify End-to-End Flow

- [ ] **Step 1: Verify build passes clean**

Run: `npm run build`
Expected: No errors

- [ ] **Step 2: Verify lint passes**

Run: `npm run lint`
Expected: No errors from new files

- [ ] **Step 3: Manual smoke test checklist**

Verify in the running app:
1. Governance page shows `wavewarz` and `social` category colors
2. "Generate WaveWarZ Post" button appears on governance page
3. "Generate WaveWarZ Post" button appears on /wavewarz page
4. After DB tables are created and seeded, the random stat endpoint returns data
5. Creating a wavewarz proposal works through the existing proposal flow

- [ ] **Step 4: Final commit if any fixes needed**

```bash
git add -A
git commit -m "fix: wavewarz social publisher cleanup"
```
