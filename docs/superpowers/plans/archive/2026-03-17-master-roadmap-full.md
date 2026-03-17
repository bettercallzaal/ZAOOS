# ZAO OS Master Roadmap — March 2026

> Reference document for implementation planning across sessions. Each sprint gets its own detailed plan when ready to execute.

**Source:** Cross-referenced from 55 research documents + full codebase deep audit (March 17, 2026)

---

## Current State: What's Built

### Chat System (~2,000 lines) — 90% complete
- Post to Farcaster with SIWF auth (no private keys)
- Reply, quote, embed, image upload (5MB limit)
- Mentions autocomplete with @username detection
- Reactions (like/recast) with optimistic UI
- Thread viewing and expansion
- Cross-posting to multiple channels
- Schedule posts via datetime input
- Search dialog for message lookup
- Admin message hiding (right-click context menu)
- Content filtering (all/music/art) and sorting (newest/oldest/most liked/most replied)
- Virtual scrolling with infinite scroll
- Character limit (1024)
- **Gaps:** No emoji picker, no draft autosave, no scheduled post management view

### XMTP Messaging (~1,500 lines) — 70% complete
- DM creation with individual or multiple members
- Real-time send/receive via XMTP streams
- Full group chat support with member list, leave group, remove conversation
- Conversation list with filtering (all/dms/groups)
- Unread count badges, last message preview
- Encryption banner, consecutive message grouping
- Auto-reconnect with error banners and reconnect CTA
- Key generation: auto-generated from FID, cached in localStorage
- **Gaps:** No typing indicators, no read receipts, no image/file sharing, no message editing/deletion, no group member management after creation

### Music System (~1,800 lines) — 75% complete
- 9 platforms: Spotify, SoundCloud, Sound.xyz, YouTube, Audius, Apple Music, Tidal, Bandcamp, generic audio
- Queue built from cast embeds + text URLs via `useMusicQueue()` hook
- Play/pause/next/prev, shuffle, repeat (off/all/one)
- Volume control, scrubber/seeking, waveform display
- Desktop: full player with artwork glow. Mobile: compact bar
- Radio mode with community playlists (Audius)
- Song submission with URL validation, metadata, per-channel lists
- Platform-specific color theming
- **Gaps:** No playlist creation, no favorites/save, no listening history, no cross-channel queue, no approval/curation queue

### Governance (~520 lines) — 60% complete
- Create proposals with title, description, category (general/music/tech/governance/treasury)
- Vote: for/against/abstain, weighted by on-chain Respect balance
- Vote tally visualization (green/red progress bar, counts + weight)
- Proposal comments (expandable)
- Status tracking: open/approved/rejected/completed
- Overview tab with user rank, respect, OG/ZOR breakdown
- **Gaps:** No quorum enforcement, no deadline countdown, no vote withdrawal, no proposal editing/cancellation, no treasury execution, no category filtering, no vote delegation

### Respect System (~320 lines) — 85% complete
- On-chain balance reads from Optimism (OG ERC-20 + ZOR ERC-1155)
- Multicall aggregation for performance
- First token date tracking via Transfer event logs
- Leaderboard: rank, name, wallet, OG/ZOR split, % of supply, ZID
- 5-minute cache TTL
- **Gaps:** No historical snapshots, no search in leaderboard, no individual user API endpoint, no progression indicators, no tier display

### Social/Discovery (~340 lines) — 50% complete
- Followers/following lists with sorting (recent/relevant/popular/mutual/zao)
- Client-side search and filtering (power badge, spam filter via Neynar score)
- Virtual scrolling with cursor pagination
- Follower cards with avatar, stats, follow button
- Community graph (dynamic import)
- Discover panel (dynamic import)
- **Gaps:** Community graph and discover panel implementation details unclear, no user search across full Farcaster, no blocks/mutes, no curated lists

### Admin Panel (~80 lines + child components) — Built
- 5 tabs: Users, ZIDs, Allowlist, Import, Moderation
- User search and filtering
- ZID assignment with atomic sequencing (1-99 early, 100+ public)
- CSV bulk import
- Message hiding (soft-delete)
- **Gaps:** Page reload after CSV import (poor UX), no audit logging, no admin action history, no stats dashboard

### Auth (~400 lines) — 90% complete
- Two methods: SIWF (Farcaster) + SIWE (wallet signature with ERC-1271 support)
- Nonce: one-time use, 5-minute TTL, max 10K in memory
- iron-session: encrypted httpOnly cookies, 7-day TTL, sameSite=lax
- Admin determination from community.config (FIDs + wallets)
- Signer registration via Neynar managed signers
- **Gaps:** No multi-wallet support, no session management UI, no profile editing endpoint

### Middleware (~105 lines) — 70% complete
- Per-route rate limits (10-30/min depending on endpoint)
- IP extraction from x-real-ip / x-forwarded-for
- Security headers: HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy
- XMTP COEP/COOP headers for SharedArrayBuffer
- **Gaps:** In-memory rate limit store (breaks on multiple replicas), no per-user limits, no Redis

### Notifications (~110 lines backend + ~230 lines UI) — 70% complete
- Bell + dropdown on every page with realtime Supabase subscription (fallback: 30s polling)
- Mark read (individual + all), unread count badge
- Push notifications via Farcaster Mini App protocol (batched, invalid token handling)
- Types: message, proposal, vote, comment, member, system
- **Triggers that exist:** Post reactions, welcome on sign-up
- **Triggers missing:** Message send/reply, follows, mentions, proposal creation announcement, song submissions

### Database — 11 tables
`allowlist`, `users`, `sessions`, `hidden_messages`, `notification_tokens`, `notifications`, `proposals`, `proposal_votes`, `proposal_comments`, `channel_casts`, `song_submissions`

---

## Sprint Roadmap (Detailed)

### Sprint 1 — Quick Wins (1-2 days)
**Plan:** `docs/superpowers/plans/2026-03-17-sprint-1-quick-wins.md`

| Task | Effort | Details |
|------|--------|---------|
| PostHog analytics | ~10 lines | `posthog-js`, auto pageview/pageleave capture, free 1M events/mo |
| ZID in ProfileDrawer | ~20 lines | Add `zid` to ProfileData interface, display badge next to name |
| Notification triggers | ~30 lines | Add triggers for votes, comments, member joins |

---

### Sprint 2 — Respect Activation (1-2 weeks)
**Dependencies:** None
**Why this is the keystone:** Hats roles, gamification, referral rewards, curation rewards, and incubator proposals ALL depend on Respect being active.

#### New Database Tables

**`respect_ledger`** — every Respect earning/spending event:
```sql
CREATE TABLE respect_ledger (
  id SERIAL PRIMARY KEY,
  zid TEXT NOT NULL,
  fid BIGINT NOT NULL,
  action TEXT NOT NULL,        -- 'curation', 'peer_recognition', 'consistency'
  amount DECIMAL NOT NULL,
  source_hash TEXT,            -- cast hash that triggered it
  created_at TIMESTAMP DEFAULT NOW()
);
```

**`respect_balances`** — current state with tier:
```sql
CREATE TABLE respect_balances (
  zid TEXT PRIMARY KEY,
  fid BIGINT NOT NULL,
  total_earned DECIMAL DEFAULT 0,
  current_balance DECIMAL DEFAULT 0,
  tier TEXT DEFAULT 'newcomer',
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### Tier System

| Tier | Respect Required | Unlocks |
|------|-----------------|---------|
| Newcomer | 0 | Basic access |
| Member | 100 | Can tip Respect to others |
| Curator | 500 | 2x curation weight in feed ranking |
| Elder | 2000 | Governance votes, moderation powers |
| Legend | 10000 | Max tip allowance, special badge |

#### Decay Mechanism (2% weekly)

Formula: `balance * POWER(0.98, weeks_since_last_update)`

Run weekly via Supabase pg_cron or Edge Function cron:
```sql
UPDATE respect_balances
SET current_balance = current_balance * POWER(0.98, EXTRACT(EPOCH FROM (NOW() - updated_at)) / 604800),
    tier = CASE
      WHEN current_balance >= 10000 THEN 'legend'
      WHEN current_balance >= 2000 THEN 'elder'
      WHEN current_balance >= 500 THEN 'curator'
      WHEN current_balance >= 100 THEN 'member'
      ELSE 'newcomer'
    END,
    updated_at = NOW();
```

#### Curation Mining Formula

```
respect_earned = (collectors_after_you - collectors_before_you) * time_decay_factor
time_decay_factor = 1 / (1 + hours_since_first_share * 0.1)
```

Early curators earn exponentially more. 10hrs after first share = half credit. 100hrs = ~9% credit.

#### On-Chain Sync Strategy

- Primary system: **off-chain** PostgreSQL (fast iteration, no gas)
- Periodic on-chain attestation via **EAS** on Base (weekly Merkle root snapshots)
- Token standard: **ERC-5192** (Minimal Soulbound) on Base for permanent attestation

#### Implementation Tasks

1. Create `respect_ledger` and `respect_balances` tables
2. API endpoint: `GET /api/respect/balance/:fid` — returns current balance + tier
3. API endpoint: `POST /api/respect/earn` — records earning event, updates balance
4. Sync job: read on-chain OG + ZOR balances → populate off-chain ledger
5. Decay cron: weekly Supabase Edge Function
6. Connect Respect balance to governance vote weight (modify proposals/vote route)
7. Display tier badges on profiles (ProfileCard, ProfileDrawer, leaderboard)
8. Tier-based UI gating (show/hide features based on tier)

---

### Sprint 3 — Engagement & Retention (1-2 weeks)
**Dependencies:** Sprint 2 (Respect must be live for rewards)

#### Engagement Streaks

- Track daily activity (any post or reaction counts)
- 7-day streak = 5 bonus Respect
- 30-day streak = 25 bonus Respect
- 1 freeze per week (miss 1 day without breaking streak)
- Flame icon in UI showing current streak count
- Progress bar: "3 posts to Curator status"

#### Badges

| Badge | Criteria | Storage |
|-------|----------|---------|
| OG | Founding 40 members | `user_badges` table, badge_type='og' |
| First Track | Posted first music track | Auto-detect from song_submissions |
| Curator | 50+ reactions received on shared music | Calculated from reactions |
| Connector | 5 successful referrals (active at D30) | Calculated from referrals |

New table: `user_badges (id, fid, badge_type, earned_at)`

#### Track of the Day

- Community members submit tracks for consideration
- Trending algorithm: `score = (positive_reactions + 1) / (total_reactions + 2) * (1 / (1 + hours_since_post / 24))`
- Top track featured daily, curator + artist both earn Respect
- Weekly listening parties: 1hr, 3-5 tracks, votes, Respect for featured artists

#### Referral System

| Parameter | Value |
|-----------|-------|
| Invite codes per member | 2-3 (Phase 1), 5 (Phase 2) |
| Referrer reward on join | 5 Respect |
| Referrer reward at D30 | 5 more Respect |
| Referred user bonus | 2 Respect |
| Cap per person | 10 referrals max |
| Accountability | Referrer loses rep if referrals get banned |

#### Notification Strategy

| Priority | Trigger | Method |
|----------|---------|--------|
| Always | Reply, @mention, DM, Respect earned | Real-time push |
| Daily batch | New member, event, reactions summary | Daily digest |
| Weekly | Community stats, top content | Email (Resend, 3K/mo free) |
| Max | 5 push notifications/day | Quiet hours: 10pm-8am |

---

### Sprint 4 — Moderation & Search (1-2 weeks)
**Dependencies:** Sprint 2 (Respect for weighted flagging)

#### Automated Moderation (Tier 1 — catches ~80%)

| Rule | Threshold |
|------|-----------|
| Neynar user score | < 0.3 → auto-flag |
| Phishing domains | Blocklist → auto-block |
| Rate limiting | 10 posts/hour per user |
| Duplicate detection | 3+ identical posts → auto-hide |

#### Community Reports (Tier 2 — catches ~15%)

1. Any member flags with reason: spam, harassment, off-topic, copyright
2. 3 unique flags → auto-hide pending moderator review
3. Respect-weighted: member with 50+ Respect counts as 2 flags
4. False flagging penalty: flag weight decreases for dismissed flags

#### Moderator Queue (Tier 3 — catches ~5%)

- 3-5 trusted Curators review flagged content
- Appeals go to 3-person panel (not original moderator)
- Jury system for serious disputes: 5 random members (30+ day tenure, 20+ Respect), anonymous vote

#### AI Moderation APIs

| API | Cost | Use |
|-----|------|-----|
| Perspective API (Google) | Free | Real-time toxicity scoring on every post |
| OpenAI Moderation API | Free | Second opinion on flagged content |
| Claude Haiku | ~$0.003/check | Complex appeals needing context |

#### Full-Text Search

Phase 1: Supabase `tsvector`/`tsquery` + GIN index (free, good to ~1M rows)
Phase 2: Meilisearch (typo-tolerant, instant, faceted, ~$5/mo self-hosted)

#### Music Approval Queue

- Add `status` field to `song_submissions`: pending → approved → rejected
- Admin/Curator review interface
- Auto-approve from members with Curator tier or above

---

### Sprint 5 — Hats & Treasury (Q3 2026, 2-3 weeks)
**Dependencies:** Sprint 2 (Respect must be live for eligibility modules)

#### Hat Tree

```
                    ZAO Top Hat (Safe multisig)
                   /        |         \
            Curators    Artists     Moderators
            /    \         |         /      \
      Senior  Junior   Featured   Senior   Junior
```

#### Role Eligibility

| Hat | Module | Threshold |
|-----|--------|-----------|
| Top Hat | Safe multisig | N/A |
| Senior Curator | ERC-20 Eligibility | 500+ Respect |
| Junior Curator | ERC-20 Eligibility | 100+ Respect |
| Featured Artist | Allowlist Eligibility | Curated by Senior Curators |
| Senior Mod | Allowlist Eligibility | Appointed by Top Hat |
| Junior Mod | Election Eligibility | Community vote |

#### Contract Addresses

- Hats Protocol v1 (all chains): `0x3bc1A0Ad72417f2d411118085256fC53CBdDd137`
- $ZAO OG Respect (Optimism): `0x34cE89baA7E4a4B00E17F7E4C0cb97105C216957`
- $ZOR (Optimism): `0x9885CCeEf7E8371Bf8d6f2413723D25917E7445c`

#### Deployment Steps

1. Create Safe multisig on Optimism (safe.global) — 3-of-5 signers
2. Create Top Hat via app.hatsprotocol.xyz, mint to Safe address
3. Create child hats for each role with names/descriptions
4. Attach ERC-20 eligibility module for Curator roles (Respect threshold)
5. Attach Allowlist eligibility for Artist/Senior Mod
6. Deploy Hats Signer Gate v2 as Zodiac module + guard on Safe
7. Enable Multi Claims Hatter for self-service claiming
8. Connect Guild.xyz for Discord/Telegram channel gating

#### SDK Packages

```
@hatsprotocol/sdk-v1-core
@hatsprotocol/sdk-v1-subgraph
@hatsprotocol/modules-sdk
@hatsprotocol/hats-signer-gate-sdk
```

#### ZAO OS Integration

```typescript
// Check hat ownership for UI permissions
async function requireHat(userAddress: string, action: string) {
  const roleHatMap: Record<string, bigint> = {
    "feature_content": SENIOR_CURATOR_HAT_ID,
    "suggest_feature": JUNIOR_CURATOR_HAT_ID,
    "moderate_post": SENIOR_MOD_HAT_ID,
    "flag_content": JUNIOR_MOD_HAT_ID,
  };
  const hatId = roleHatMap[action];
  if (!hatId) return false;
  return await hatsClient.isWearerOfHat({ wearer: userAddress, hatId });
}
```

#### Gotchas

- Eligibility checked dynamically — no grace period when balance drops
- Hat trees are per-chain (no cross-chain eligibility)
- Top Hat compromise = full tree takeover — must be Safe multisig
- HSG deeply couples Safe to Hats — careful migration if removing
- Tree is append-only (can deactivate, cannot delete hats)

#### Alternative: Decent DAO

Decent DAO bundles Hats + Safe + fractal subDAO hierarchy. Includes automated term limits and re-election. Faster path but less flexibility. **Decision needed before Sprint 5 starts.**

---

### Sprint 6 — AI Agent (Q4 2026, 3-4 weeks)
**Dependencies:** XMTP (built), Neynar webhooks (built), Respect (Sprint 2)

#### Setup

- Separate `zao-agent` repo
- Framework: ElizaOS (17,800+ stars, MIT)
- LLM: Claude (Anthropic API)
- Plugins: `@elizaos/plugin-farcaster`, `@elizaos/plugin-xmtp`
- Deploy: Railway with `DAEMON_PROCESS=true` (~$5-10/mo)
- Dedicated Farcaster account (@zao-agent) with managed signer
- Dedicated wallet for XMTP signing

#### Phase 1 (weeks 1-2): Community Support

| Trigger | Response |
|---------|----------|
| New allowlist addition | Welcome DM via XMTP with getting started guide |
| `hi` / `hello` | Welcome message + community status |
| `help` | Feature guide + FAQ |
| `recommend` | Music recommendations |
| `what's trending` | This week's top tracks |
| @mention in channel | Context-aware response |

#### Phase 2 (weeks 3-4): Music Intelligence

- Music taste memory via pgvector or Hindsight
- Personalized recommendations based on listening history
- Weekly music digest per member
- Connect music APIs: Audius, Spotify, Sound.xyz

#### Phase 3 (weeks 5-6): Moderation + Social

- Spam detection (Neynar score + Claude)
- Curation scoring
- Social taste matching (find members with similar taste)
- Genre-based XMTP groups

#### Memory Architecture

**Option A: Custom pgvector** — 4 Supabase tables: `agent_user_memories`, `agent_interactions`, `agent_community_memory`, `agent_social_graph`

**Option B: Hindsight** (recommended) — `@vectorize-io/hindsight-client`, Docker on Railway, 91.4% accuracy on LongMemEval. Memory banks: `user_{fid}`, `community`, `music_knowledge`, `moderation`. Three operations: retain, recall, reflect.

**Decision needed before Sprint 6 starts.**

---

### Sprint 7 — Cross-Platform Distribution (2027, ongoing)
**Dependencies:** Core platform stable

#### Platform Priority Tiers

**Tier 1 — Build Custom (free APIs):**

| Platform | SDK | Text Limit | Notes |
|----------|-----|-----------|-------|
| Farcaster | Neynar (built) | 1,024 | Already done |
| Lens | `@lens-protocol/client` | Unlimited | Collect/monetize model |
| Bluesky | `@atproto/api` | 300 | Facets for rich text (NOT markdown) |
| Nostr | `nostr-tools` / NDK | Unlimited | Keypair auth, Wavlake music integration |
| Hive | `@hiveio/dhive` | Unlimited | On-chain monetization |

**Tier 2 — Use Ayrshare ($49-99/mo):**

| Platform | Text Limit | Notes |
|----------|-----------|-------|
| X/Twitter | 280 | Free tier: 1,500 tweets/mo write-only |
| Mastodon | 500 | Basic HTML content format |
| Threads | 500 | No DM API |

**Tier 3 — Higher Effort:**
Instagram (strict copyright), TikTok (video only, 6 req/min), YouTube (10K units/day quota)

#### Architecture

```
Compose in ZAO OS → Post Normalization → Message Queue (BullMQ)
  → Platform workers (parallel) → Status tracker with retry
```

Minimum viable cross-post: text (truncated per platform) + link + 1 image.

#### Cost: $49-299/mo depending on tier coverage

---

## Decision Points

These need user input before planning can proceed:

| Decision | Needed Before | Options |
|----------|--------------|---------|
| Decent DAO vs custom Hats stack | Sprint 5 | Decent = faster, less flexible. Custom = more control. |
| ElizaOS vs custom agent | Sprint 6 | ElizaOS = ecosystem, dependency. Custom = full control. |
| Hindsight vs custom pgvector memory | Sprint 6 | Hindsight = 91% accuracy, Docker. pgvector = simpler, Supabase-native. |
| Ayrshare vs custom cross-posting | Sprint 7 | Ayrshare = $49-99/mo, handles OAuth. Custom = free, more work. |
| Off-chain → on-chain Respect timing | After Sprint 2 | Start off-chain. When to attest on-chain via EAS? |
| Privy integration for non-crypto users | Sprint 3 or 4 | Email/Google/Apple login. Free to 1K MAU. |
| Redis for rate limiting | Sprint 4 | Current in-memory store breaks on multiple Vercel replicas. |

---

## Dependency Graph

```
Sprint 1 (Quick Wins) ─── no dependencies
     │
Sprint 2 (Respect) ────── no dependencies
     │
     ├── Sprint 3 (Engagement) ── needs Respect for rewards
     │
     ├── Sprint 4 (Moderation) ── needs Respect for weighted flagging
     │
     └── Sprint 5 (Hats) ──────── needs Respect for eligibility modules
              │
              └── Sprint 5b (Treasury) ── needs Hats for signer gate

Sprint 6 (AI Agent) ────── needs XMTP (built) + Respect (Sprint 2)

Sprint 7 (Distribution) ── no hard deps, but core should be stable
```

Sprints 1 and 2 can run in parallel. Sprints 3, 4, and 5 can run in parallel after Sprint 2. Sprint 6 can start any time after Sprint 2.
