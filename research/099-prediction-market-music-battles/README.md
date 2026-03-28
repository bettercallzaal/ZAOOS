# 99 — Prediction Market Music Battles for ZAO OS

> **Status:** Research complete
> **Date:** March 21, 2026
> **Goal:** Design a prediction-market-style voting system for music battles using virtual Respect points, purely in Supabase

---

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **Architecture** | Pure Supabase (no blockchain). Virtual "Respect Points" balance tracked in DB |
| **Market model** | Simplified parimutuel pool, not full CPMM/AMM. Far simpler to implement. |
| **Point source** | Seed from on-chain Respect snapshot, then track internally. Award bonus points for winning bets. |
| **Settlement** | Hybrid: auto-close on timer + optional admin/judge override |
| **MVP scope** | `battle_proposals` + `battle_stakes` tables, 3 API routes, 1 UI component |
| **Future** | Graduate to on-chain settlement via WaveWarZ Solana vaults if battles gain traction |

---

## 1. How Prediction Markets Differ from Simple Voting

### Simple Voting (Current ZAO Governance)
- One vote per person, weighted by token balance at time of vote
- No cost to vote (no skin in the game beyond existing holdings)
- Votes are for/against/abstain on a policy question
- Result: tally of votes determines outcome

### Prediction Market Voting (Music Battles)
- Users **stake points** on an outcome they believe will win
- Staking has a **cost** — you lock up points, creating real skin in the game
- If your side wins, you get your stake back **plus a share of the losing pool**
- If your side loses, you **forfeit some or all of your stake**
- The ratio of stakes on each side creates a **live probability signal** (like Polymarket prices)
- Result: the community's collective conviction, weighted by willingness to risk

### Why This Matters for Music

Simple voting ("which song do you like?") has weak signal. Everyone clicks and moves on. Prediction market mechanics create:

1. **Engaged participation** — you have something at stake
2. **Price discovery** — the odds shift as people stake, showing real conviction
3. **Reward for good taste** — consistent winners accumulate more influence
4. **Anti-spam** — staking costs points, so you only participate on battles you care about

---

## 2. Existing Platform Analysis

### WaveWarZ (Already in ZAO Ecosystem)
- Solana prediction market for music battles
- Two songs matched, fans deposit SOL into Battle Vault PDAs
- Winners get proportional share + 40% of losing pool
- Losers get 50% refund (partial recovery)
- 647 battles, 423 SOL total volume
- Settlement: judge decision during live X Spaces sessions

### Polymarket UX Patterns (Best-in-Class Binary Markets)
- Binary YES/NO shares priced $0.00-$1.00
- Price = market's probability estimate (65c YES = 65% chance)
- Every YES + NO pair fully collateralized at $1
- CLOB order book + AMM hybrid
- Resolution via UMA Optimistic Oracle (proposer -> challenge window -> voter dispute)
- Mobile-first, minimal friction, real-time price charts

### Manifold Markets (Play Money Reference)
- Uses "Mana" play-money currency (virtual points, no real money)
- CPMM (Constant Product Market Maker) called "Maniswap"
- Formula: `k = y^p * n^(1-p)` where y=YES reserves, n=NO reserves, p=initial probability
- Users start with 1000 Mana free
- Market creators seed liquidity pool
- **Most relevant model for ZAO** — virtual currency, no blockchain required
- Migrated from Firebase to Supabase PostgreSQL

### Music Battle Platforms
- **AuxBattle** — gamified head-to-head music sharing, community voting
- **Music League** — round-based themed competitions, anonymous playlists, cumulative points
- **SongBattle+** — real-time voting during streams, Spotify/YouTube/Apple Music integration
- **songbattle.io** — 1v1 tournament bracket format, ELO ratings

---

## 3. Simplified Implementation: Parimutuel Pool Model

For ZAO OS, a **parimutuel pool** is far simpler than a full AMM/CPMM and captures 90% of the prediction market magic. Here is how it works:

### How Parimutuel Works

1. Two songs are matched in a battle
2. Users stake Respect Points on the song they think will win
3. All stakes go into a shared pool
4. When the battle resolves, the losing side's stakes are redistributed to winners proportionally
5. A small percentage goes to the battle creator or community treasury

**Example:**
- Song A pool: 500 points (from 10 stakers)
- Song B pool: 300 points (from 8 stakers)
- Implied odds: Song A = 62.5%, Song B = 37.5%
- Song B wins! Total pool = 800 points
- Platform takes 5% = 40 points. Remaining = 760 points
- Each Song B staker gets: `(their_stake / 300) * 760` points back
- A staker who put in 100 points gets: `(100/300) * 760 = 253` points (153 profit)

### Why Parimutuel Over CPMM

| Feature | Parimutuel | CPMM (Manifold-style) |
|---------|------------|----------------------|
| Implementation complexity | Low (addition/division) | High (invariant math, liquidity pools) |
| Liquidity bootstrapping | Not needed | Requires initial liquidity seed |
| Price manipulation risk | Low (prices only finalize at close) | Higher (early trades move price cheaply) |
| Real-time odds | Yes (pool ratio) | Yes (reserve ratio) |
| Partial exit before close | No (simpler) | Yes (trade shares) |
| Good enough for 40-member community | Absolutely | Overkill |

---

## 4. Database Schema

### New Tables

```sql
-- ============================================================
-- BATTLE PROPOSALS — head-to-head music competitions
-- ============================================================
CREATE TABLE IF NOT EXISTS battle_proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Battle metadata
  title TEXT NOT NULL,                  -- "March Madness Round 1: Track A vs Track B"
  description TEXT,                     -- Optional context, theme, rules

  -- Song A
  song_a_url TEXT NOT NULL,             -- Music URL (Spotify, SoundCloud, YouTube, Audius, etc.)
  song_a_title TEXT NOT NULL,           -- "Ambition"
  song_a_artist TEXT NOT NULL,          -- "Stilo World"
  song_a_submission_id UUID REFERENCES song_submissions(id),  -- Link to existing submission

  -- Song B
  song_b_url TEXT NOT NULL,
  song_b_title TEXT NOT NULL,
  song_b_artist TEXT NOT NULL,
  song_b_submission_id UUID REFERENCES song_submissions(id),

  -- Battle lifecycle
  status TEXT NOT NULL DEFAULT 'open'
    CHECK (status IN ('draft', 'open', 'staking_closed', 'settled', 'cancelled')),
  created_by UUID NOT NULL REFERENCES users(id),
  opens_at TIMESTAMPTZ DEFAULT NOW(),   -- When staking begins
  closes_at TIMESTAMPTZ NOT NULL,       -- When staking ends (auto-close)
  settled_at TIMESTAMPTZ,               -- When winner was declared

  -- Settlement
  winner TEXT CHECK (winner IN ('song_a', 'song_b', 'draw', NULL)),
  settlement_method TEXT DEFAULT 'timer'
    CHECK (settlement_method IN ('timer', 'judge', 'community_vote', 'auto')),
  judge_fid BIGINT,                     -- Optional: designated judge FID
  settlement_notes TEXT,                -- Judge's reasoning

  -- Pool economics
  rake_percent NUMERIC(4,2) DEFAULT 5.00,  -- Platform/treasury cut (5%)
  min_stake INTEGER DEFAULT 10,            -- Minimum stake per bet
  max_stake INTEGER DEFAULT 500,           -- Maximum stake per bet (prevent whale dominance)

  -- Denormalized tallies (updated by trigger or API)
  pool_a INTEGER DEFAULT 0,             -- Total points staked on Song A
  pool_b INTEGER DEFAULT 0,             -- Total points staked on Song B
  total_stakers INTEGER DEFAULT 0,

  -- Farcaster integration
  channel TEXT DEFAULT 'wavewarz',
  cast_hash TEXT,                        -- Announcement cast

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- BATTLE STAKES — individual user stakes on a battle
-- ============================================================
CREATE TABLE IF NOT EXISTS battle_stakes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  battle_id UUID NOT NULL REFERENCES battle_proposals(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),

  -- Stake details
  side TEXT NOT NULL CHECK (side IN ('song_a', 'song_b')),
  amount INTEGER NOT NULL CHECK (amount > 0),  -- Respect Points staked

  -- Settlement results (filled after battle settles)
  payout INTEGER,                       -- Points returned (null = unsettled)
  profit INTEGER,                       -- payout - amount (can be negative)

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(battle_id, user_id)            -- One stake per user per battle
);

-- ============================================================
-- RESPECT POINTS LEDGER — virtual point balance tracking
-- ============================================================
CREATE TABLE IF NOT EXISTS respect_points_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),

  -- Transaction details
  amount INTEGER NOT NULL,              -- Positive = credit, negative = debit
  balance_after INTEGER NOT NULL,       -- Running balance after this transaction

  -- Source tracking
  source TEXT NOT NULL CHECK (source IN (
    'initial_sync',      -- Seeded from on-chain Respect balance
    'battle_stake',      -- Points locked for a battle
    'battle_win',        -- Points won from a battle
    'battle_refund',     -- Points returned from cancelled battle or draw
    'battle_rake',       -- Points earned as battle creator
    'bonus_streak',      -- Bonus for winning streak
    'admin_grant',       -- Admin-granted points
    'daily_login'        -- Daily login bonus (engagement)
  )),
  reference_id UUID,                    -- FK to battle_stakes.id, battle_proposals.id, etc.
  note TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- USER BATTLE STATS — leaderboard/profile data
-- ============================================================
CREATE TABLE IF NOT EXISTS user_battle_stats (
  user_id UUID PRIMARY KEY REFERENCES users(id),
  total_battles INTEGER DEFAULT 0,
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  draws INTEGER DEFAULT 0,
  total_staked INTEGER DEFAULT 0,
  total_won INTEGER DEFAULT 0,
  total_lost INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,     -- Consecutive wins
  best_streak INTEGER DEFAULT 0,
  win_rate NUMERIC(5,2) DEFAULT 0.00,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_battles_status ON battle_proposals(status);
CREATE INDEX idx_battles_closes_at ON battle_proposals(closes_at) WHERE status = 'open';
CREATE INDEX idx_battles_created ON battle_proposals(created_at DESC);
CREATE INDEX idx_battle_stakes_battle ON battle_stakes(battle_id);
CREATE INDEX idx_battle_stakes_user ON battle_stakes(user_id);
CREATE INDEX idx_respect_ledger_user ON respect_points_ledger(user_id, created_at DESC);
CREATE INDEX idx_respect_ledger_source ON respect_points_ledger(source);

-- ============================================================
-- RLS
-- ============================================================
ALTER TABLE battle_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE battle_stakes ENABLE ROW LEVEL SECURITY;
ALTER TABLE respect_points_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_battle_stats ENABLE ROW LEVEL SECURITY;

-- Service role full access (API routes use supabaseAdmin)
CREATE POLICY "Service role full access" ON battle_proposals FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON battle_stakes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON respect_points_ledger FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON user_battle_stats FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- HELPER: Get user's current Respect Points balance
-- ============================================================
CREATE OR REPLACE FUNCTION get_respect_balance(p_user_id UUID)
RETURNS INTEGER AS $$
  SELECT COALESCE(
    (SELECT balance_after FROM respect_points_ledger
     WHERE user_id = p_user_id
     ORDER BY created_at DESC LIMIT 1),
    0
  );
$$ LANGUAGE SQL STABLE;

-- ============================================================
-- TRIGGER: Auto-update pool tallies on battle_stakes changes
-- ============================================================
CREATE OR REPLACE FUNCTION update_battle_pools()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE battle_proposals SET
    pool_a = (SELECT COALESCE(SUM(amount), 0) FROM battle_stakes WHERE battle_id = COALESCE(NEW.battle_id, OLD.battle_id) AND side = 'song_a'),
    pool_b = (SELECT COALESCE(SUM(amount), 0) FROM battle_stakes WHERE battle_id = COALESCE(NEW.battle_id, OLD.battle_id) AND side = 'song_b'),
    total_stakers = (SELECT COUNT(*) FROM battle_stakes WHERE battle_id = COALESCE(NEW.battle_id, OLD.battle_id))
  WHERE id = COALESCE(NEW.battle_id, OLD.battle_id);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER battle_stakes_pool_sync
  AFTER INSERT OR UPDATE OR DELETE ON battle_stakes
  FOR EACH ROW EXECUTE FUNCTION update_battle_pools();
```

### Adding `respect_balance` to Existing Users Table

```sql
-- Add cached balance to users table for quick reads
ALTER TABLE users ADD COLUMN IF NOT EXISTS respect_points_balance INTEGER DEFAULT 0;
```

---

## 5. API Route Design

### Route Structure

```
src/app/api/battles/
  route.ts              — GET (list battles), POST (create battle)
  [id]/
    route.ts            — GET (single battle details with stakes)
    stake/
      route.ts          — POST (place a stake)
    settle/
      route.ts          — POST (settle battle — admin/judge only)
src/app/api/respect-points/
  route.ts              — GET (user's balance + recent transactions)
  sync/
    route.ts            — POST (sync on-chain Respect to virtual points)
```

### POST `/api/battles` — Create a Battle

```typescript
// Zod schema
const createBattleSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().max(2000).optional(),
  song_a_url: z.string().url(),
  song_a_title: z.string().min(1).max(200),
  song_a_artist: z.string().min(1).max(200),
  song_b_url: z.string().url(),
  song_b_title: z.string().min(1).max(200),
  song_b_artist: z.string().min(1).max(200),
  closes_at: z.string().datetime().refine(
    (val) => new Date(val).getTime() > Date.now() + 3600000,  // Min 1 hour
    { message: 'Battle must be open for at least 1 hour' }
  ),
  settlement_method: z.enum(['timer', 'judge', 'community_vote']).default('timer'),
  judge_fid: z.number().int().positive().optional(),
  min_stake: z.number().int().min(1).max(100).default(10),
  max_stake: z.number().int().min(10).max(1000).default(500),
  rake_percent: z.number().min(0).max(20).default(5),
});
```

### POST `/api/battles/[id]/stake` — Place a Stake

```typescript
const stakeSchema = z.object({
  side: z.enum(['song_a', 'song_b']),
  amount: z.number().int().positive(),
});

// Core logic (pseudocode):
// 1. Validate battle is open and not past closes_at
// 2. Check user hasn't already staked on this battle
// 3. Check amount >= min_stake and <= max_stake
// 4. Check user's respect_points_balance >= amount
// 5. In a transaction:
//    a. Debit user's balance (insert ledger entry with source='battle_stake')
//    b. Insert battle_stake row
//    c. Update user's cached respect_points_balance
// 6. Return updated battle odds + user's stake
```

### POST `/api/battles/[id]/settle` — Settle a Battle

```typescript
const settleSchema = z.object({
  winner: z.enum(['song_a', 'song_b', 'draw']),
  notes: z.string().max(1000).optional(),
});

// Core logic (pseudocode):
// 1. Validate caller is admin or designated judge
// 2. Validate battle status is 'open' or 'staking_closed'
// 3. Calculate payouts:
//    - total_pool = pool_a + pool_b
//    - rake = total_pool * rake_percent / 100
//    - payout_pool = total_pool - rake
//    - For each winning stake: payout = (stake.amount / winning_pool) * payout_pool
//    - For draw: refund everyone (minus small rake)
// 4. In a transaction:
//    a. Update battle_proposals status='settled', winner, settled_at
//    b. Update each battle_stake with payout and profit
//    c. Credit each winner's balance (ledger entry source='battle_win')
//    d. Credit rake to treasury or battle creator
//    e. Update user_battle_stats for all participants
// 5. Send notifications to all stakers
```

### Settlement Calculation Function

```typescript
function calculatePayouts(battle: Battle, stakes: Stake[]) {
  const totalPool = battle.pool_a + battle.pool_b;
  const rake = Math.floor(totalPool * battle.rake_percent / 100);
  const payoutPool = totalPool - rake;

  if (battle.winner === 'draw') {
    // Refund everyone minus rake split equally
    return stakes.map(s => ({
      ...s,
      payout: Math.floor(s.amount * (payoutPool / totalPool)),
      profit: Math.floor(s.amount * (payoutPool / totalPool)) - s.amount,
    }));
  }

  const winningPool = battle.winner === 'song_a' ? battle.pool_a : battle.pool_b;

  return stakes.map(s => {
    if (s.side === battle.winner) {
      const payout = Math.floor((s.amount / winningPool) * payoutPool);
      return { ...s, payout, profit: payout - s.amount };
    } else {
      return { ...s, payout: 0, profit: -s.amount };
    }
  });
}
```

---

## 6. Auto-Close / Settlement Mechanisms

### Option 1: Timer-Based Auto-Close (Recommended for MVP)

Use a **Supabase Edge Function** or **Vercel Cron** to check for expired battles:

```typescript
// Vercel cron: runs every 5 minutes
// src/app/api/cron/settle-battles/route.ts

export async function GET(req: NextRequest) {
  // Verify cron secret
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Find battles past their close time that haven't settled
  const { data: expired } = await supabaseAdmin
    .from('battle_proposals')
    .select('*')
    .eq('status', 'open')
    .lt('closes_at', new Date().toISOString());

  for (const battle of expired || []) {
    // For timer-based: winner = side with more total stakes
    const winner = battle.pool_a > battle.pool_b ? 'song_a'
                 : battle.pool_b > battle.pool_a ? 'song_b'
                 : 'draw';

    await settleBattle(battle.id, winner, 'Auto-settled: staking majority wins');
  }

  return NextResponse.json({ settled: expired?.length || 0 });
}
```

**vercel.json cron config:**
```json
{
  "crons": [{
    "path": "/api/cron/settle-battles",
    "schedule": "*/5 * * * *"
  }]
}
```

### Option 2: Judge Decision

- Battle creator designates a judge (by FID)
- After `closes_at`, staking locks and battle enters `staking_closed` status
- Judge calls `/api/battles/[id]/settle` with their decision
- If judge doesn't decide within 24 hours, falls back to stake-majority auto-settle

### Option 3: Community Vote (Hybrid)

- After staking closes, a **second phase** opens where non-stakers vote on the winner
- This separates the "betting" population from the "judging" population
- Prevents bias (stakers obviously want their side to win)
- Implementation: reuse existing `proposal_votes` pattern but linked to battle

### Option 4: Objective Metrics (Future)

- Pull play counts from Spotify/SoundCloud/Audius APIs
- Song with more plays in the battle window wins
- Most "fair" but requires API integrations

### Recommended: Hybrid Timer + Judge

```
Battle created -> Staking open (closes_at timer)
                  |
                  v
Timer expires -> Status: 'staking_closed'
                  |
        +---------+---------+
        |                   |
   settlement_method        |
   == 'timer'?              |
        |                   |
   YES: auto-settle         NO: wait for judge
   (majority pool wins)          |
                            Judge calls /settle
                            within 24h?
                                |
                           YES: judge decides
                           NO:  auto-settle fallback
```

---

## 7. UI Component Design

### BattleCard Component (Feed View)

```
+------------------------------------------------------+
|  BATTLE #42                              LIVE  2h 14m |
|  March Madness: Round 1                              |
+------------------------------------------------------+
|                                                      |
|  +-------------------+    +-------------------+      |
|  | [Album Art]       |    | [Album Art]       |      |
|  | "Ambition"        |    | "Night Drive"     |      |
|  | Stilo World       |    | Luna Echo         |      |
|  |                   |    |                   |      |
|  | [Play Button]     |    | [Play Button]     |      |
|  +-------------------+    +-------------------+      |
|                                                      |
|  [===== 62% ============|====== 38% =====]           |
|  500 pts (10 stakers)    300 pts (8 stakers)         |
|                                                      |
|  +-- Your Stake --------------------------------+    |
|  |  Amount: [--] [50] [++]    Side: [A] [B]     |    |
|  |  Potential payout: 82 pts (+32 profit)       |    |
|  |  [   STAKE 50 RESPECT POINTS   ]            |    |
|  +----------------------------------------------+    |
|                                                      |
|  Balance: 450 Respect Points                         |
+------------------------------------------------------+
```

### Key UX Patterns Borrowed from Polymarket

1. **Probability bar** — horizontal split bar showing current odds (pool ratio)
2. **Price/odds update in real-time** — use Supabase Realtime subscriptions
3. **Potential payout calculator** — show expected return before staking
4. **Simple binary choice** — Song A or Song B, no complexity
5. **Countdown timer** — prominent time remaining display
6. **Mobile-first** — swipeable card layout, thumb-friendly stake buttons

### BattleDetail Page

```
/battles/[id]
  - Full battle info with both songs embedded (audio players)
  - Live odds chart (historical pool ratio over time)
  - Staker list (anonymous or public, configurable)
  - Comments section (reuse proposal_comments pattern)
  - Settlement result card (after battle ends)
```

### Leaderboard Component

```
/battles/leaderboard
  - Win rate ranking
  - Total profit ranking
  - Current streak ranking
  - "Tastemaker Score" = win_rate * sqrt(total_battles)
```

### Integration Points with Existing UI

- **Governance page**: Add "Battles" tab alongside "Proposals"
- **Music sidebar**: "Active Battles" widget showing live battles
- **Profile drawer**: Battle stats (wins/losses/streak)
- **Notifications**: "Battle #42 settled! You won 82 points"
- **Channel feed**: Auto-post battle announcements to `wavewarz` channel

---

## 8. Respect Points Economy Design

### Initial Seeding

```typescript
// One-time sync: read on-chain Respect, seed virtual balance
async function syncRespectToPoints(userId: string, wallet: string) {
  const onChainBalance = await getOnChainRespect(wallet); // existing multicall logic
  const currentVirtual = await getRespectBalance(userId);

  if (currentVirtual === 0 && onChainBalance > 0) {
    // First sync: 1 on-chain Respect = 100 virtual Respect Points
    const virtualPoints = onChainBalance * 100;
    await creditPoints(userId, virtualPoints, 'initial_sync');
  }
}
```

### Point Sources

| Source | Amount | Notes |
|--------|--------|-------|
| Initial sync | On-chain Respect * 100 | One-time seed from OG + ZOR balance |
| Battle win | Proportional pool share | Core earning mechanism |
| Win streak bonus | +10% per consecutive win | Rewards consistency (cap at 5x) |
| Daily login | +5 points | Engagement incentive |
| Create battle | Rake earnings (5% default) | Incentivize battle creation |
| Admin grant | Variable | For special events, corrections |

### Anti-Gaming Rules

1. **Max stake cap** — prevent whales from dominating (default 500 pts)
2. **Min stake** — prevent dust spam (default 10 pts)
3. **One stake per battle** — no changing sides
4. **No self-battles** — creator can't stake on own battle
5. **Min 3 stakers to settle** — avoid 1v1 insider deals
6. **Cooldown** — max 5 battles created per day per user

---

## 9. Futarchy Connection: Battle Outcomes as Governance Signal

The prediction market model creates a natural bridge to futarchy-style governance:

### How It Works

1. **Community proposes** adding an artist to the ZAO roster
2. **Instead of a simple vote**, create two conditional battles:
   - Battle A: "If Artist X joins, will our community engagement increase?"
   - Battle B: "If Artist X doesn't join, will our community engagement increase?"
3. **Members stake** based on their genuine beliefs about outcomes
4. **Market prices** reveal whether the community truly believes the artist will add value
5. **The proposal passes** if Battle A's odds are significantly higher than Battle B's

This is simplified futarchy — using prediction market mechanics to make better governance decisions rather than just popularity contests.

### Practical Starting Point

For ZAO's 40-member community, full futarchy is overkill. Start with:
- Simple music battles (Song A vs Song B)
- Track who has the best "taste" (win rate)
- Use battle results to influence playlist curation
- Graduate to governance-linked battles if engagement is strong

---

## 10. Open Source Reference Implementations

### Most Relevant to ZAO OS

| Project | Stack | Relevance | License |
|---------|-------|-----------|---------|
| [Manifold Markets](https://github.com/manifoldmarkets/manifold) | TypeScript, Supabase, React | Play-money CPMM, migrated to Supabase | MIT-ish |
| [play-money](https://github.com/openpredictionmarkets/play-money) | TypeScript, Prisma, PostgreSQL | Simple prediction market platform | MIT |
| [socialpredict](https://github.com/openpredictionmarkets/socialpredict) | Go | Easy to deploy prediction market | MIT |
| [PredictOS](https://github.com/PredictionXBT/PredictOS) | Next.js 14, Supabase Edge Functions | AI-agent prediction framework | Open source |

### Key Insight from Manifold

Manifold's CPMM formula (`k = y^p * n^(1-p)`) is elegant but unnecessary for ZAO's scale. Their migration from Firebase to Supabase PostgreSQL validates that prediction markets can run entirely on Supabase. Their "Mana" play-money system is conceptually identical to what we're proposing with virtual Respect Points.

---

## 11. MVP Implementation Plan

### Phase 1: Foundation (1-2 days)

1. Run SQL migration to create `battle_proposals`, `battle_stakes`, `respect_points_ledger`, `user_battle_stats` tables
2. Add `respect_points_balance` column to `users` table
3. Create initial point sync endpoint (read on-chain, seed virtual)

### Phase 2: Core API (2-3 days)

4. `POST /api/battles` — create battle
5. `GET /api/battles` — list active/settled battles
6. `GET /api/battles/[id]` — battle detail with stakes
7. `POST /api/battles/[id]/stake` — place a stake (with balance check + transaction)
8. `POST /api/battles/[id]/settle` — settle battle (admin/judge)
9. `GET /api/respect-points` — balance + transaction history

### Phase 3: Auto-Settlement (1 day)

10. Vercel cron job for auto-settling expired timer-based battles
11. Judge fallback logic (24h timeout)

### Phase 4: UI (2-3 days)

12. `BattleCard` component (feed view with odds bar, stake input)
13. `BattleDetail` page with audio players + live odds
14. `BattleCreate` form (select two songs, set rules)
15. "Battles" tab on governance page
16. Respect Points balance in header/profile

### Phase 5: Polish (1-2 days)

17. Supabase Realtime subscriptions for live odds updates
18. Notifications for battle events
19. Leaderboard page
20. Cast announcement to `wavewarz` channel on battle creation

**Total estimated effort: 7-11 days**

---

## 12. Future Enhancements

- **Tournament brackets** — 8 or 16 songs, single elimination, auto-advance winners
- **On-chain settlement** — graduate to WaveWarZ Solana vaults for real SOL stakes
- **AI judge** — use audio analysis to provide objective quality scores
- **Cross-community battles** — ZAO vs another community's picks
- **Multi-outcome markets** — "Which of these 4 songs will get the most Spotify plays this week?"
- **Respect-weighted judging** — judges' votes weighted by their on-chain Respect
- **Battle replay** — embed recordings of live judging sessions (a la WaveWarZ X Spaces)

---

## Sources

- [PredictOS - Open source prediction market framework](https://github.com/PredictionXBT/PredictOS)
- [Open Prediction Markets - GitHub org](https://github.com/openpredictionmarkets)
- [play-money - Simple prediction market platform](https://github.com/openpredictionmarkets/play-money)
- [Manifold Markets - Open source prediction markets on Supabase](https://github.com/manifoldmarkets/manifold)
- [Manifold Market Mechanics (CPMM)](https://news.manifold.markets/p/above-the-fold-market-mechanics)
- [Polymarket 101 - How binary markets work](https://docs.polymarket.com/polymarket-101)
- [Polymarket UX case study](https://medium.com/@zabdelkarim1/polymarket-product-case-study-2b1a8ed81e7c)
- [How to build a platform like Polymarket](https://interexy.com/how-to-create-a-prediction-market-platform)
- [Futarchy: Prediction markets meet DAOs on Solana (Helius)](https://www.helius.dev/blog/futarchy-and-governance-prediction-markets-meet-daos-on-solana)
- [MetaDAO Complete Guide 2025](https://www.mexc.com/learn/article/metadao-complete-guide-2025-decentralized-governance-revolution-based-on-prediction-markets/1)
- [Futarchy - The Future of DAO Governance](https://medium.com/@zoharajabeen20/futarchy-the-future-of-dao-governance-ccda599c97f3)
- [UMA Optimistic Oracle - Prediction market resolution](https://rocknblock.io/blog/how-prediction-markets-resolution-works-uma-optimistic-oracle-polymarket)
- [Oracle design for prediction markets](https://www.softwareseni.com/oracle-design-and-resolution-mechanisms-for-prediction-market-outcome-verification-and-settlement-systems/)
- [Music League - Round-based music competitions](https://firebirdmagazine.com/news/music-league)
- [SongBattle+ - Real-time music battles](https://songbattle.plus/)
- [songbattle.io - 1v1 tournament battles](https://songbattle.io/)
- [Manifold Markets Review 2026](https://cryptonews.com/cryptocurrency/manifold-markets-review/)
