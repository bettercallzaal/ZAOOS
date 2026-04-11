# 347 -- ZAO Oracle: Verifying Real Outcomes for ZABAL Rewards

> **Status:** Research complete
> **Date:** April 11, 2026
> **Goal:** Design a ZAO Oracle system that captures and verifies real community outcomes on-chain, enabling trustless ZABAL reward distribution based on provable contributions

---

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **Oracle architecture** | USE a hybrid oracle: Supabase collects metrics (off-chain), Vercel cron writes attestations to EAS (on-chain), ZABAL rewards distribute based on attested outcomes. No Chainlink (overkill + expensive). No UMA (too complex for community metrics) |
| **Attestation layer** | USE EAS (Ethereum Attestation Service) on Base -- free, permissionless, Coinbase uses it, already on Base. Create a ZAO schema for contribution attestations. Contract: `0x4200000000000000000000000000000000000021` (Base) |
| **Anti-sybil** | USE Neynar Score (Farcaster-native, free) + existing allowlist gate. Minimum Neynar Score of 0.5 to earn rewards. Bots typically score <0.2. Combined with the ZAO membership gate, this blocks automated farming |
| **Capturable outcomes** | USE 5 tiers of outcomes ranked by verifiability (see matrix below). Tier 1 (on-chain) is trustless. Tier 5 (subjective) requires community validation |
| **Reward scaling** | USE base reward + outcome multiplier. Base: flat ZABAL per action. Multiplier: engagement metrics scale the reward up to 3x. Formula: `reward = base * min(1 + (engagement / threshold), 3)` |
| **Already built** | USE existing `engagement-collect` cron + OpenRank scores + `publish_log` table + `engagement_metrics` table. ZAO OS already captures Farcaster, X, and Threads engagement -- the oracle reads this existing data |
| **Dispute resolution** | USE optimistic verification (like UMA but simpler): reward is proposed, 24-hour challenge period, any ZAO member can dispute with evidence. No dispute = reward auto-distributes. Disputed = admin reviews. At our scale (13 promoters), this is sufficient |

---

## Comparison: Oracle Approaches for Community Metrics

| Approach | Cost | Complexity | Verifiability | Anti-Gaming | Base Support | ZAO Fit |
|----------|------|-----------|---------------|-------------|-------------|---------|
| **ZAO Oracle (EAS + Supabase)** | Free (EAS is free) | LOW -- Vercel cron writes attestations | HIGH -- on-chain attestations, verifiable | GOOD -- Neynar Score + allowlist + challenge period | YES (EAS on Base) | **BEST** -- uses existing infra |
| **Chainlink Functions** | $0.20-1.00/call | HIGH -- Solidity + DON config | VERY HIGH -- decentralized computation | GOOD -- consensus across nodes | YES | Overkill -- we're not feeding DeFi protocols |
| **UMA Optimistic Oracle** | Bond required ($) | HIGH -- custom assertion + dispute | VERY HIGH -- economic game theory | EXCELLENT -- economic penalties for lies | YES (via cross-chain) | Overkill -- too complex for 13 promoters |
| **Custom smart contract** | ~$5 deploy | MEDIUM -- Solidity + oracle pattern | MEDIUM -- single source of truth | POOR -- no dispute mechanism | YES | Fragile -- single point of failure |
| **Pure off-chain (Supabase only)** | Free | VERY LOW | NONE -- trust the database | POOR -- admin can manipulate | N/A | Insufficient -- no verifiability |

---

## What We Can Actually Capture and Verify

### Outcome Verifiability Matrix

| Tier | Verifiability | Example | How to Capture | Gameability Risk |
|------|--------------|---------|---------------|-----------------|
| **1: On-chain** | TRUSTLESS | Agent trade executed, ZABAL burned, bounty claimed, NFT minted, LP added | Read Base chain events directly | NONE -- blockchain is the source of truth |
| **2: Platform API** | HIGH | Farcaster cast posted, X tweet published, Paragraph newsletter sent, Threads post live | Neynar API, X API, Paragraph API -- verified by platform | LOW -- platforms verify identity |
| **3: Engagement** | MEDIUM | Likes, recasts, replies, views, email opens, x402 sales | `engagement-collect` cron (already built), OpenRank scores | MEDIUM -- can be botted on some platforms |
| **4: Attribution** | LOW-MEDIUM | New member joined because of your content, artist applied after your spotlight | Referral tracking, onboarding attribution, self-reported | HIGH -- hard to prove causation |
| **5: Subjective** | LOW | "Great show recap", "Helpful research", community impact | Peer voting (fractal process), admin review | HIGH -- requires human judgment |

### What We Already Capture (Existing Infrastructure)

| Data Source | What It Captures | File |
|------------|-----------------|------|
| `engagement-collect` cron | X likes/replies/reposts, Threads likes/replies/views | `src/app/api/cron/engagement-collect/route.ts` |
| `follower-snapshot` cron | Daily Farcaster follower count per member | `src/app/api/cron/follower-snapshot/route.ts` |
| `daily-digest` cron | Active members, tracks played, rooms hosted | `src/app/api/cron/daily-digest/route.ts` |
| OpenRank client | Farcaster engagement scores per FID | `src/lib/openrank/client.ts` |
| `publish_log` table | Every cross-platform post with platform_post_id | Supabase |
| `engagement_metrics` table | Per-post metrics (views, likes, replies, reposts, quotes) | Supabase |
| `agent_events` table | Every agent trade, burn, content purchase | Supabase |
| `agent_signals` table (new) | Community requests and agent responses | Supabase |

---

## ZAO Oracle Architecture

```
┌─────────────────────────────────────────────┐
│           DATA COLLECTION (existing)         │
│                                              │
│  engagement-collect cron → engagement_metrics│
│  follower-snapshot cron → follower_snapshots  │
│  agent crons → agent_events                  │
│  publish routes → publish_log                │
│  Neynar webhooks → cast data                 │
│  OpenRank → engagement scores                │
└──────────────┬──────────────────────────────┘
               │
┌──────────────▼──────────────────────────────┐
│           ZAO ORACLE CRON (new)              │
│  /api/cron/oracle/evaluate                   │
│                                              │
│  1. Query engagement_metrics for last 24h    │
│  2. Query agent_events for completed actions │
│  3. Query publish_log for new content        │
│  4. Calculate reward per contributor:        │
│     reward = base * min(1 + engagement, 3x)  │
│  5. Check anti-sybil:                        │
│     - Is contributor in allowlist? (gate)     │
│     - Neynar Score >= 0.5? (bot filter)      │
│     - Not already rewarded for this? (dedup) │
│  6. Write pending_rewards to Supabase        │
│  7. Create EAS attestation on Base           │
│  8. Start 24h challenge period               │
└──────────────┬──────────────────────────────┘
               │
┌──────────────▼──────────────────────────────┐
│           CHALLENGE PERIOD (24h)             │
│                                              │
│  Any ZAO member can dispute:                 │
│  POST /api/oracle/dispute                    │
│    { reward_id, reason, evidence }           │
│                                              │
│  If disputed → admin reviews → approve/deny  │
│  If no dispute after 24h → auto-distribute   │
└──────────────┬──────────────────────────────┘
               │
┌──────────────▼──────────────────────────────┐
│           DISTRIBUTION (automated)           │
│  /api/cron/oracle/distribute                 │
│                                              │
│  1. Query pending_rewards past challenge     │
│  2. For each undisputed reward:              │
│     - Transfer ZABAL from treasury wallet    │
│     - Burn 1%                                │
│     - Log to agent_events                    │
│     - Update EAS attestation status          │
│  3. Post summary to /zao Farcaster channel   │
└─────────────────────────────────────────────┘
```

---

## Reward Formula

### Base Rewards (flat, per action)

| Action | Base ZABAL | Tier |
|--------|-----------|------|
| Newsletter published to Paragraph | 50,000 | 2 (API verified) |
| Social post (X/Farcaster/Bluesky) | 10,000 | 2 (API verified) |
| Show recap published | 100,000 | 2 (API verified) |
| Artist spotlight | 25,000 | 2 (API verified) |
| Agent trade executed | 5,000 | 1 (on-chain) |
| Bounty claimed + approved | varies | 1 (on-chain) |
| Graph signal completed | 10,000 | 2 (API verified) |
| Fractal meeting attended | 15,000 | 4 (peer verified) |
| ZOUNZ proposal voted | 5,000 | 1 (on-chain) |
| New member onboarded (verified) | 25,000 | 4 (attribution) |

### Engagement Multiplier (scales 1x-3x)

```
multiplier = min(1 + (engagement_score / threshold), 3.0)
final_reward = base * multiplier
```

| Metric | Threshold for 2x | Threshold for 3x (cap) |
|--------|-----------------|----------------------|
| Farcaster likes | 10 | 25+ |
| Farcaster recasts | 5 | 15+ |
| Email opens | 50 | 150+ |
| x402 content sales | 3 | 10+ |
| Replies/comments | 5 | 15+ |

**Example:** Newsletter with 20 likes, 8 recasts, 75 opens
- Likes: 20/10 = 2.0 → capped at 2.0
- Recasts: 8/5 = 1.6
- Opens: 75/50 = 1.5
- Average multiplier: (2.0 + 1.6 + 1.5) / 3 = 1.7
- Reward: 50,000 * 1.7 = **85,000 ZABAL** (vs 50,000 flat)

### Anti-Gaming Layers

| Layer | What It Checks | Blocks |
|-------|---------------|--------|
| **1. Allowlist gate** | Is contributor a ZAO member or COC promoter? | Random outsiders |
| **2. Neynar Score** | Score >= 0.5 (bots typically <0.2) | Automated accounts |
| **3. Deduplication** | Has this content already been rewarded? | Double-claiming |
| **4. Rate limit** | Max 5 rewards per contributor per day | Spam farming |
| **5. Quality check** | Perspective API toxicity < 0.3, min content length | Low-effort garbage |
| **6. Challenge period** | 24h window for community disputes | Sophisticated gaming |
| **7. Conviction weight** | Staked ZABAL increases trust level | Aligns incentives |

---

## EAS Integration (On-Chain Attestations)

### EAS on Base

| Detail | Value |
|--------|-------|
| Contract | `0x4200000000000000000000000000000000000021` (Base mainnet) |
| Schema Registry | `0x4200000000000000000000000000000000000020` |
| Explorer | base.easscan.org |
| Cost per attestation | ~$0.001 on Base |
| Off-chain option | Free (signed but not on-chain) |

### ZAO Contribution Schema

```solidity
// Schema: "address contributor, string action, uint256 zabalReward, string contentHash, uint256 engagementScore, bool disputed"
bytes32 constant ZAO_CONTRIBUTION_SCHEMA = 0x...; // registered once
```

Each reward creates an attestation:
```json
{
  "schema": "ZAO_CONTRIBUTION_SCHEMA",
  "recipient": "0xPromoterWallet",
  "data": {
    "contributor": "0xPromoterWallet",
    "action": "newsletter_published",
    "zabalReward": 85000,
    "contentHash": "ipfs://Qm...",
    "engagementScore": 170,
    "disputed": false
  }
}
```

This attestation is permanent, on-chain proof that the promoter earned ZABAL for a specific contribution with a specific engagement score. Anyone can verify it on base.easscan.org.

---

## Supabase Schema (New Tables)

```sql
-- Pending rewards awaiting challenge period
CREATE TABLE pending_rewards (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  contributor_address text NOT NULL,
  contributor_fid integer,
  action text NOT NULL,
  base_reward numeric NOT NULL,
  multiplier numeric NOT NULL DEFAULT 1.0,
  final_reward numeric NOT NULL,
  content_hash text,
  engagement_data jsonb,
  eas_attestation_uid text,
  status text DEFAULT 'pending', -- pending, challenged, distributed, rejected
  challenge_reason text,
  challenge_by text,
  challenge_at timestamptz,
  distribute_after timestamptz NOT NULL, -- created_at + 24h
  distributed_tx text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_pending_rewards_status ON pending_rewards(status);
CREATE INDEX idx_pending_rewards_distribute ON pending_rewards(distribute_after);
```

---

## Creative Reward Ideas (Oracle-Capturable)

| Idea | Tier | How Oracle Captures It |
|------|------|----------------------|
| **Streak bonus** (7 days consecutive) | 2 | Count consecutive days with publish_log entries per contributor |
| **First blood** (first to complete new bounty type) | 1 | agent_events timestamp -- earliest claimer gets 5x |
| **Cross-platform bonus** (same content on 3+ platforms) | 2 | Count distinct platforms in publish_log for same content_hash |
| **Referral chain** (onboard someone who onboards someone) | 4 | Track inviter_fid in users table, 2-deep chain |
| **Discovery bonus** (share research doc that gets 10+ views) | 3 | Track research doc views + sharer attribution |
| **Agent revenue milestone** (agent earns more than it costs) | 1 | Compare agent_events revenue vs operating costs |
| **Conviction milestone** (stake 100M ZABAL for 30 days) | 1 | Read ClawdViction contract on-chain |
| **Governance participation** (vote on 5+ proposals in a month) | 1 | Read ZOUNZ Governor contract on-chain |
| **Collaboration bonus** (2+ contributors on same content) | 2 | Co-author field in publish_log |
| **Seasonal multiplier** (2x rewards during launch week) | N/A | Time-based config in oracle cron |

---

## ZAO Ecosystem Integration

### Codebase Files

| File | Role in Oracle |
|------|---------------|
| `src/app/api/cron/engagement-collect/route.ts` | Already collects X + Threads metrics -- extend for Farcaster + Bluesky |
| `src/app/api/cron/follower-snapshot/route.ts` | Daily follower counts -- use for growth attribution |
| `src/lib/openrank/client.ts` | Farcaster engagement scores -- use as anti-sybil signal |
| `src/lib/moderation/moderate.ts` | Perspective API -- use for content quality gate |
| `src/lib/agents/events.ts` | Agent event logging -- oracle reads this for agent rewards |
| `src/lib/agents/config.ts` | Agent config -- oracle reads for reward eligibility |
| New: `src/lib/oracle/evaluate.ts` | Core oracle logic: calculate rewards from metrics |
| New: `src/lib/oracle/attest.ts` | EAS attestation creation on Base |
| New: `src/lib/oracle/distribute.ts` | ZABAL transfer from treasury to contributor |
| New: `src/app/api/cron/oracle/evaluate/route.ts` | Daily cron: evaluate contributions, create pending rewards |
| New: `src/app/api/cron/oracle/distribute/route.ts` | Daily cron: distribute undisputed rewards past 24h |
| New: `src/app/api/oracle/dispute/route.ts` | API for community members to dispute rewards |

---

## Sources

- [EAS Documentation](https://docs.attest.org/)
- [EAS on Base (easscan)](https://base.easscan.org/)
- [EAS Oracles Use Case](https://docs.attest.org/docs/idea--zone/use--case--examples/oracles)
- [Chainlink Functions](https://docs.chain.link/chainlink-functions)
- [UMA Optimistic Oracle](https://docs.uma.xyz/protocol-overview/how-does-umas-oracle-work)
- [Human Passport (anti-sybil)](https://passport.human.tech/)
- [OpenRank API](https://docs.openrank.com/integrations/farcaster)
- [Neynar Score Documentation](https://docs.neynar.com)
- [Doc 324 - ZABAL Tokenomics](../../business/324-zabal-sang-wallet-agent-tokenomics/)
- [Doc 345 - Master Blueprint](../../agents/345-zabal-agent-swarm-master-blueprint/)
