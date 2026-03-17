# Future Sprints (3-7) — Detailed Specs

> These sprints unlock after Sprint 2 (Respect Activation) is complete. Each will get its own execution plan when ready to build.

**Dependencies:** All require Sprint 2 (Respect) to be live first.

---

## Sprint 3 — Engagement & Retention (1-2 weeks)

**Dependencies:** Sprint 2 (Respect must be live for rewards)

### Engagement Streaks

- Track daily activity (any post or reaction counts)
- 7-day streak = 5 bonus Respect
- 30-day streak = 25 bonus Respect
- 1 freeze per week (miss 1 day without breaking streak)
- Flame icon in UI showing current streak count
- Progress bar: "3 posts to Curator status"

### Badges

| Badge | Criteria | Storage |
|-------|----------|---------|
| OG | Founding 40 members | `user_badges` table, badge_type='og' |
| First Track | Posted first music track | Auto-detect from song_submissions |
| Curator | 50+ reactions received on shared music | Calculated from reactions |
| Connector | 5 successful referrals (active at D30) | Calculated from referrals |

New table: `user_badges (id, fid, badge_type, earned_at)`

### Track of the Day

- Community members submit tracks for consideration
- Trending algorithm: `score = (positive_reactions + 1) / (total_reactions + 2) * (1 / (1 + hours_since_post / 24))`
- Top track featured daily, curator + artist both earn Respect
- Weekly listening parties: 1hr, 3-5 tracks, votes, Respect for featured artists

### Referral System

| Parameter | Value |
|-----------|-------|
| Invite codes per member | 2-3 (Phase 1), 5 (Phase 2) |
| Referrer reward on join | 5 Respect |
| Referrer reward at D30 | 5 more Respect |
| Referred user bonus | 2 Respect |
| Cap per person | 10 referrals max |
| Accountability | Referrer loses rep if referrals get banned |

### Notification Strategy

| Priority | Trigger | Method |
|----------|---------|--------|
| Always | Reply, @mention, DM, Respect earned | Real-time push |
| Daily batch | New member, event, reactions summary | Daily digest |
| Weekly | Community stats, top content | Email (Resend, 3K/mo free) |
| Max | 5 push notifications/day | Quiet hours: 10pm-8am |

---

## Sprint 4 — Moderation & Search (1-2 weeks)

**Dependencies:** Sprint 2 (Respect for weighted flagging)

### Automated Moderation (Tier 1 — catches ~80%)

| Rule | Threshold |
|------|-----------|
| Neynar user score | < 0.3 → auto-flag |
| Phishing domains | Blocklist → auto-block |
| Rate limiting | 10 posts/hour per user |
| Duplicate detection | 3+ identical posts → auto-hide |

### Community Reports (Tier 2 — catches ~15%)

1. Any member flags with reason: spam, harassment, off-topic, copyright
2. 3 unique flags → auto-hide pending moderator review
3. Respect-weighted: member with 50+ Respect counts as 2 flags
4. False flagging penalty: flag weight decreases for dismissed flags

### Moderator Queue (Tier 3 — catches ~5%)

- 3-5 trusted Curators review flagged content
- Appeals go to 3-person panel (not original moderator)
- Jury system for serious disputes: 5 random members (30+ day tenure, 20+ Respect), anonymous vote

### AI Moderation APIs

| API | Cost | Use |
|-----|------|-----|
| Perspective API (Google) | Free | Real-time toxicity scoring on every post |
| OpenAI Moderation API | Free | Second opinion on flagged content |
| Claude Haiku | ~$0.003/check | Complex appeals needing context |

### Full-Text Search

Phase 1: Supabase `tsvector`/`tsquery` + GIN index (free, good to ~1M rows)
Phase 2: Meilisearch (typo-tolerant, instant, faceted, ~$5/mo self-hosted)

### Music Approval Queue

- Add `status` field to `song_submissions`: pending → approved → rejected
- Admin/Curator review interface
- Auto-approve from members with Curator tier or above

---

## Sprint 5 — Hats & Treasury (Q3 2026, 2-3 weeks)

**Dependencies:** Sprint 2 (Respect must be live for eligibility modules)

### Hat Tree

```
                    ZAO Top Hat (Safe multisig)
                   /        |         \
            Curators    Artists     Moderators
            /    \         |         /      \
      Senior  Junior   Featured   Senior   Junior
```

### Role Eligibility

| Hat | Module | Threshold |
|-----|--------|-----------|
| Top Hat | Safe multisig | N/A |
| Senior Curator | ERC-20 Eligibility | 500+ Respect |
| Junior Curator | ERC-20 Eligibility | 100+ Respect |
| Featured Artist | Allowlist Eligibility | Curated by Senior Curators |
| Senior Mod | Allowlist Eligibility | Appointed by Top Hat |
| Junior Mod | Election Eligibility | Community vote |

### Contract Addresses

- Hats Protocol v1 (all chains): `0x3bc1A0Ad72417f2d411118085256fC53CBdDd137`
- $ZAO OG Respect (Optimism): `0x34cE89baA7E4a4B00E17F7E4C0cb97105C216957`
- $ZOR (Optimism): `0x9885CCeEf7E8371Bf8d6f2413723D25917E7445c`

### Deployment Steps

1. Create Safe multisig on Optimism (safe.global) — 3-of-5 signers
2. Create Top Hat via app.hatsprotocol.xyz, mint to Safe address
3. Create child hats for each role with names/descriptions
4. Attach ERC-20 eligibility module for Curator roles (Respect threshold)
5. Attach Allowlist eligibility for Artist/Senior Mod
6. Deploy Hats Signer Gate v2 as Zodiac module + guard on Safe
7. Enable Multi Claims Hatter for self-service claiming
8. Connect Guild.xyz for Discord/Telegram channel gating

### SDK Packages

```
@hatsprotocol/sdk-v1-core
@hatsprotocol/sdk-v1-subgraph
@hatsprotocol/modules-sdk
@hatsprotocol/hats-signer-gate-sdk
```

### ZAO OS Integration

```typescript
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

### Gotchas

- Eligibility checked dynamically — no grace period when balance drops
- Hat trees are per-chain (no cross-chain eligibility)
- Top Hat compromise = full tree takeover — must be Safe multisig
- HSG deeply couples Safe to Hats — careful migration if removing
- Tree is append-only (can deactivate, cannot delete hats)

### Open Decision: Decent DAO

Decent DAO bundles Hats + Safe + fractal subDAO hierarchy. Includes automated term limits and re-election. Faster path but less flexibility. Evaluate before Sprint 5 starts.

---

## Sprint 6 — AI Agent (Q4 2026, 3-4 weeks)

**Dependencies:** XMTP (built), Neynar webhooks (built), Respect (Sprint 2)
**Decided:** ElizaOS framework, pgvector in Supabase for memory

### Setup

- Separate `zao-agent` repo
- Framework: ElizaOS (17,800+ stars, MIT)
- LLM: Claude (Anthropic API)
- Plugins: `@elizaos/plugin-farcaster`, `@elizaos/plugin-xmtp`
- Deploy: Railway with `DAEMON_PROCESS=true` (~$5-10/mo)
- Dedicated Farcaster account (@zao-agent) with managed signer
- Dedicated wallet for XMTP signing

### Phase 1 (weeks 1-2): Community Support

| Trigger | Response |
|---------|----------|
| New allowlist addition | Welcome DM via XMTP with getting started guide |
| `hi` / `hello` | Welcome message + community status |
| `help` | Feature guide + FAQ |
| `recommend` | Music recommendations |
| `what's trending` | This week's top tracks |
| @mention in channel | Context-aware response |

### Phase 2 (weeks 3-4): Music Intelligence

- Music taste memory via pgvector (4 tables: `agent_user_memories`, `agent_interactions`, `agent_community_memory`, `agent_social_graph`)
- Embed research docs (54 docs, 300K+ words) as knowledge base for semantic search
- Personalized recommendations based on listening history
- Weekly music digest per member
- Connect music APIs: Audius, Spotify, Sound.xyz

### Phase 3 (weeks 5-6): Moderation + Social

- Spam detection (Neynar score + Claude)
- Curation scoring
- Social taste matching (find members with similar taste)
- Genre-based XMTP groups

---

## Sprint 7 — Cross-Platform Distribution (2027, ongoing)

**Dependencies:** Core platform stable
**Decided:** Custom integrations, no Ayrshare

### Platform Priority Tiers

**Tier 1 — Build Custom (free APIs):**

| Platform | SDK | Text Limit | Notes |
|----------|-----|-----------|-------|
| Farcaster | Neynar (built) | 1,024 | Already done |
| Lens | `@lens-protocol/client` | Unlimited | Collect/monetize model |
| Bluesky | `@atproto/api` | 300 | Facets for rich text (NOT markdown) |
| Nostr | `nostr-tools` / NDK | Unlimited | Keypair auth, Wavlake music integration |
| Hive | `@hiveio/dhive` | Unlimited | On-chain monetization |

**Tier 2 — Custom X/Twitter:**

| Platform | SDK | Text Limit | Notes |
|----------|-----|-----------|-------|
| X/Twitter | `twitter-api-v2` | 280 | Free tier: 1,500 tweets/mo write-only |
| Mastodon | REST API | 500 | Basic HTML content format |
| Threads | Threads API | 500 | No DM API |

**Tier 3 — Higher Effort:**
Instagram (strict copyright), TikTok (video only, 6 req/min), YouTube (10K units/day quota)

### Architecture

```
Compose in ZAO OS → Post Normalization → Message Queue (BullMQ)
  → Platform workers (parallel) → Status tracker with retry
```

Minimum viable cross-post: text (truncated per platform) + link + 1 image.

### Libraries to Install

| Package | Platform |
|---------|----------|
| `@lens-protocol/client` | Lens |
| `@atproto/api` | Bluesky |
| `nostr-tools` / `@nostr-dev-kit/ndk` | Nostr |
| `@hiveio/dhive` | Hive |
| `twitter-api-v2` | X/Twitter |
| `bullmq` + `ioredis` | Message queue for fan-out |
