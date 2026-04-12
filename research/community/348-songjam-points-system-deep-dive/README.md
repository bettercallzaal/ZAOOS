# 348 -- SongJam Points System Deep Dive: Scoring, Multipliers & ZABAL Oracle Integration

> **Status:** Research complete
> **Date:** April 11, 2026
> **Goal:** Understand how SongJam's leaderboard scoring works -- points types, multiplier formulas, data we can read, and how to use it as an oracle input for ZABAL rewards

---

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **Use SongJam as primary oracle data source** | USE the existing `/api/songjam/leaderboard` route as the richest single data source for ZABAL rewards. It provides totalPoints, farcasterPoints, tlPoints, songjamSpacePoints, empireMultiplier, stakingMultiplier, zabalBalance, and wallet addresses -- all in one API call |
| **Point types as reward weights** | USE `songjamSpacePoints` for attendance rewards (live participation), `farcasterPoints` for engagement rewards (social activity), `tlPoints` for mention tracking (ZABAL promotion). Weight each differently in the oracle |
| **Multipliers as trust signals** | USE `empireMultiplier` (4.0-8.6x range) and `stakingMultiplier` (2.1-3.0x range) as anti-gaming trust signals. Higher multiplier = more SANG staked = more skin in the game. Oracle should weight rewards by multiplier |
| **Scoring engine location** | The scoring algorithm lives in the Cloudflare Worker (`songjamspace-leaderboard.logesh-063.workers.dev`), NOT in the open-source repos. The site repo (`songjam-site`) only stores raw session points in Firestore and fetches aggregated data from the worker |
| **No direct scoring access** | SKIP trying to replicate SongJam's scoring formula. USE their aggregated output (totalPoints) as-is. The Cloudflare Worker is a black box but the output data is rich enough for our oracle |
| **Empire Builder data** | Empire Builder has NO public API, but its multiplier comes through SongJam's leaderboard data as `empireMultiplier`. This is our only programmatic access to Empire data. Adrian (Empire Builder) is building V3 APIs -- wait for the Sunday call |
| **Staking formula** | SongJam uses square-root multiplier for SANG staking. Minimum stake: 50,000 tokens. Optimal: 500,000 tokens. Staking contract on Base at `0x4C143539356444ABA748b8523A39D953f24D8d80` |

---

## SongJam Data Model (from Cloudflare Worker API)

### API Endpoint

```
GET https://songjamspace-leaderboard.logesh-063.workers.dev/{projectId}
GET https://songjamspace-leaderboard.logesh-063.workers.dev/{projectId}_weekly
GET https://songjamspace-leaderboard.logesh-063.workers.dev/{projectId}_daily
```

ZAO project ID: `bettercallzaal_s2`

### Entry Schema

```typescript
interface SongjamEntry {
  username: string;           // X/Twitter handle
  name: string;               // display name
  userId: string;             // unique ID
  totalPoints: number;        // aggregate score (all point types * multipliers)
  farcasterPoints?: number;   // points from Farcaster engagement (36-64 range)
  tlPoints?: number;          // timeline/mention points (0.2-23.6 range)
  songjamSpacePoints?: number;// points from attending live audio spaces
  pointsWithoutMultiplier?: number; // raw score before multipliers
  stakingMultiplier?: number; // SANG staking boost (2.1-3.0x range)
  stakedBalance?: string;     // SANG tokens staked (raw, 18 decimals)
  empireMultiplier?: number;  // Empire Builder boost (4.0-8.6x range)
  zabalBalance?: string;      // ZABAL token balance (raw, 18 decimals)
  connectedWalletAddress?: string; // Base wallet address
}
```

### Sample Data (Top Performers)

| User | totalPoints | farcasterPts | tlPts | spacePts | empireMult | stakingMult | zabalBalance |
|------|------------|-------------|-------|----------|-----------|-------------|-------------|
| JasonAlder99 | 2,818 | 64 | 23.6 | high | 4.3x | 2.5x | 46.8B |
| (typical user) | 100-500 | 10-40 | 1-10 | varies | 1-4x | 1-2x | 1-10B |
| (low activity) | 0-50 | 0-5 | 0-1 | 0 | none | none | 0 |

### Point Types Explained

| Point Type | What It Measures | How It's Earned | Range |
|-----------|-----------------|----------------|-------|
| `songjamSpacePoints` | Live audio participation | Attending SongJam spaces, speaking, staying in room | 0 - thousands |
| `farcasterPoints` | Farcaster social engagement | Casts, likes, recasts in ZABAL-related channels | 0 - 64+ |
| `tlPoints` | Timeline/mention activity | Mentioning ZABAL on X/Twitter, engagement on mentions | 0 - 24+ |
| `pointsWithoutMultiplier` | Raw base score | Sum of all point types before multipliers | varies |
| `totalPoints` | Final aggregated score | `pointsWithoutMultiplier * stakingMultiplier * empireMultiplier` (approximate) | 0 - 3000+ |

### Multiplier System

**Staking Multiplier (SANG):**
- Minimum stake: 50,000 SANG tokens
- Optimal stake: 500,000 SANG tokens
- Formula: square-root based (sqrt(staked / optimal))
- Range: 1.0x (no stake) to ~3.0x (optimal+)
- Contract: `0x4C143539356444ABA748b8523A39D953f24D8d80` (Base)

**Empire Multiplier:**
- Source: Empire Builder platform (empirebuilder.world)
- Based on staking activity within Empire Builder
- Range: 1.0x to 8.6x (observed in leaderboard data)
- No direct API -- only accessible through SongJam's aggregated data
- Adrian (Empire Builder) building V3 API endpoints

**Combined effect:**
```
totalPoints ≈ pointsWithoutMultiplier * stakingMultiplier * empireMultiplier
```

A user with 100 base points, 2.5x staking, 4.0x empire = 1,000 total points.

---

## Comparison: Data Sources for ZABAL Oracle

| Source | Data Richness | Update Freq | API Access | Anti-Gaming | ZAO Already Uses |
|--------|-------------|-------------|-----------|-------------|-----------------|
| **SongJam Leaderboard** | HIGH (7 metrics + 2 multipliers + wallet) | Real-time (60s cache) | YES (Cloudflare Worker) | GOOD (staking = skin in game) | YES (`/api/songjam/leaderboard`) |
| **Empire Builder** | MEDIUM (multiplier only via SongJam) | Unknown | NO (V3 coming) | GOOD (staking required) | PARTIAL (iframe at /ecosystem) |
| **Neynar / Farcaster** | HIGH (casts, likes, follows, score) | Real-time | YES (API) | GOOD (Neynar Score) | YES (OpenRank + engagement cron) |
| **X / Twitter API** | MEDIUM (likes, replies, views) | Hourly (cron) | YES (API) | MEDIUM (bots exist) | YES (`x-insights.ts`) |
| **On-chain (Base)** | HIGHEST (trades, burns, staking) | Block-time (~2s) | YES (RPC) | TRUSTLESS | YES (agent_events) |

---

## How to Use SongJam Data in the ZAO Oracle

### Oracle Integration Architecture

```
SongJam Leaderboard API
  └── /api/songjam/leaderboard?timeframe=weekly
       │
       ├── farcasterPoints → ENGAGEMENT weight (30%)
       ├── songjamSpacePoints → ATTENDANCE weight (25%)
       ├── tlPoints → PROMOTION weight (20%)
       ├── stakingMultiplier → TRUST signal (anti-gaming)
       ├── empireMultiplier → COMMITMENT signal (anti-gaming)
       └── zabalBalance → HOLDER signal (skin in game)
       │
       ▼
  Oracle Reward Calculation:
    base_reward = action_base_zabal
    engagement_mult = min(1 + farcasterPoints/20, 2.0)
    attendance_mult = min(1 + songjamSpacePoints/500, 1.5)
    promotion_mult = min(1 + tlPoints/10, 1.5)
    trust_mult = sqrt(stakingMultiplier * empireMultiplier) / 3  (0.3 - 1.0 range)
    
    final_reward = base_reward * engagement_mult * attendance_mult * promotion_mult * trust_mult
```

### Practical Example

**Promoter: JasonAlder99**
- Publishes a show recap (base: 100,000 ZABAL)
- farcasterPoints: 64 → engagement_mult: min(1 + 64/20, 2.0) = 2.0x
- songjamSpacePoints: 500 → attendance_mult: min(1 + 500/500, 1.5) = 1.5x
- tlPoints: 23.6 → promotion_mult: min(1 + 23.6/10, 1.5) = 1.5x
- stakingMultiplier: 2.5, empireMultiplier: 4.3 → trust_mult: sqrt(2.5 * 4.3) / 3 = 1.09
- **Final reward: 100,000 * 2.0 * 1.5 * 1.5 * 1.09 = 490,500 ZABAL**

**Promoter: Low Activity User**
- Publishes same recap (base: 100,000 ZABAL)
- farcasterPoints: 5 → engagement_mult: 1.25x
- songjamSpacePoints: 0 → attendance_mult: 1.0x
- tlPoints: 0.5 → promotion_mult: 1.05x
- No staking → trust_mult: 0.33x (minimum)
- **Final reward: 100,000 * 1.25 * 1.0 * 1.05 * 0.33 = 43,313 ZABAL**

Active, staked, engaged members earn **11x more** than passive ones for the same action. This naturally rewards real contributors and penalizes bot farming.

---

## SongJam Repos Inventory (81 total, key ones)

| Repo | What It Contains | Relevance |
|------|-----------------|-----------|
| `songjam-site` | Next.js leaderboard frontend, staking balance checker, Firestore points storage | HIGH -- fork for custom ZABAL leaderboard UI |
| `songjam-contracts` | Solidity contracts (Hardhat), staking mechanics | HIGH -- understand staking formula |
| `songjam-leaderboard-ui` | React leaderboard display with filtering | MEDIUM -- UI patterns |
| `songjam-ui` | Main SongJam app UI | LOW -- general reference |
| `songjam-agent-onboarding` | Guide for AI agents joining SongJam spaces | HIGH -- how agents participate in spaces |
| `buyback-jupiter-webhook` | Jupiter swap webhook for buyback | HIGH -- SANG buyback pattern (like our ZABAL agent buybacks) |

---

## ZAO Ecosystem Integration

### Existing Files

| File | What It Does for Oracle |
|------|----------------------|
| `src/app/api/songjam/leaderboard/route.ts` | Proxies SongJam Worker API, 60s cache. Oracle reads this |
| `src/components/respect/SongjamLeaderboard.tsx` | Displays leaderboard in /respect page. Shows all fields |
| `src/app/(auth)/respect/RespectPageClient.tsx` | Respect page with SongJam tab |
| `src/middleware.ts:71` | Rate limits SongJam API to 20/min |
| `src/app/(auth)/ecosystem/page.tsx:57-60` | SongJam iframe at songjam.space/zabal |

### New Files Needed

| File | Purpose |
|------|---------|
| `src/lib/oracle/songjam.ts` | Fetch SongJam data, extract oracle inputs (points, multipliers) |
| `src/lib/oracle/scoring.ts` | Calculate reward multipliers from SongJam + engagement data |

---

## Open Questions for SongJam Team

1. Is the Cloudflare Worker scoring formula documented anywhere?
2. Can we get webhook notifications when a user's points change significantly?
3. Can the ZABAL project (`bettercallzaal_s2`) get custom point weights?
4. Is there an API for historical point snapshots (not just current)?
5. Can agents earn SongJam points by participating in spaces programmatically?

---

## Sources

- [SongJam Site Repo](https://github.com/songjamspace/songjam-site)
- [SongJam Contracts Repo](https://github.com/songjamspace/songjam-contracts)
- [SongJam Leaderboard UI Repo](https://github.com/songjamspace/songjam-leaderboard-ui)
- [SongJam Agent Onboarding](https://github.com/songjamspace/songjam-agent-onboarding)
- [SongJam Leaderboard API](https://songjamspace-leaderboard.logesh-063.workers.dev/bettercallzaal_s2)
- [SongJam ZABAL Page](https://songjam.space/zabal)
- [Adam (SongJam) on ZABAL Leaderboard](https://x.com/adam_songjam/status/2006134495578407406)
- [ZAO ZABAL Update 3 (Paragraph)](https://paragraph.com/@thezao/zabal-update-3)
- [Doc 347 - ZAO Oracle](../../governance/347-zao-oracle-outcome-verification/)
