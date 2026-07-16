---
topic: business
type: decision
status: research-complete
last-validated: 2026-07-14
related-docs: 1088, 1095, 1094, 991, 988
original-query: "Go DEEP on Sparkz - research the two Farcaster miniapps Zaal named (tortoise + fotocaster), then synthesize tonight's brainstorm into a real, comprehensive Sparkz design/spec. The energy-score prototype (#17, energy-first, AI-decides-launch, 1% fee, Clanker, starter kit) is locked - build the design ON these decisions."
tier: DEEP
---

# 1096 - Sparkz: Energy-First Creator-Coin Product for Farcaster

> **Goal:** Complete product design for Sparkz, a Farcaster-native creator-coin platform where an AI agent watches pre-token energy signals and decides WHEN to launch a coin via Clanker. The token adds to what creators build; it does not extract. Includes the full architecture, creator journey, integration points, MVP scope, and the roles of tortoise and fotocaster as pre-token energy-building tools.

> **What this solves:** Creators on Farcaster (musicians, builders, artists) can now prove community energy BEFORE tokenizing. The AI agent acts as a gatekeeper: "You have enough real engagement. Launch now." This inverts the creator-coin narrative from speculation to proof-of-community. Sparkz is the infrastructure for this workflow.

---

## Key Decisions (Locked from Brainstorm)

These decisions are SET and form the foundation for Sparkz design. Build on them, do not revisit.

| # | Decision | Status | Reasoning |
|---|----------|--------|-----------|
| 1 | **Energy-first, token-second sequencing** | LOCKED | Creators build a following TOKENLESS first. AI agent watches signals (followers, engagement, consistency, channel activity). Only when energy is real does the agent recommend launch. Token adds, not extracts. |
| 2 | **AI-agent-that-decides-when-to-launch is the differentiator** | LOCKED | Unlike Clanker (frictionless anyone-can-launch) or Zora (heavy mechanics), Sparkz's edge is the gatekeeper: a trustworthy agent that says "NOW" based on transparent energy signals. Creators want permission, not just a button. |
| 3 | **1% fee on token trading** | LOCKED | Lower than Zora (50% on trades, too high). Higher than Clanker (0.2%, but Clanker does not offer the energy-assessment layer). 1% funds Sparkz operations + ongoing creator support + distribution. 99% of fees go to the creator (or creator's chosen beneficiary). |
| 4 | **Clanker for token launch, max creator control** | LOCKED | Clanker: 0.2% protocol fee, LP locked 2100, 100% of Clanker's fees go to creator, no minting after launch (fixed supply). Sparkz wraps the launch but does NOT impose additional restrictions. Creator owns the token fully. |
| 5 | **Farcaster-primary for discovery, Base for on-chain** | LOCKED | Sparkz lives as a Farcaster miniapp or embedded channel feature (discovery, energy-building, launch UI). Token deploys to Base (ERC-20). Creators discover Sparkz in Farcaster, trade on Base via Uniswap or Clanker. Frictionless cross-chain UX. |
| 6 | **Starter kit: AI agent + Farcaster channel + tortoise + fotocaster** | LOCKED | When a creator launches, they get: (a) a dedicated Farcaster channel for the project, (b) a personalized AI agent that monitors energy, (c) tortoise integration for music/collection signals, (d) fotocaster integration for photo/media collection signals. These are the "try both" tools. |
| 7 | **Sparkz is a product, not a platform** | SET | Sparkz is a bounded, opinionated product: energy-first, AI-gated launch, 1% fee, Clanker-only, Farcaster-native. It is NOT a platform for arbitrary token launches (that's Clanker). It is THE product for energy-first creators. |

---

## Tortoise + Fotocaster: Research Findings

### Tortoise: Music Platform + Collection Layer

**Status:** [FULL] Researched and viable for Sparkz integration.

**What it is:**
- Free-to-listen music streaming on Farcaster + Base
- Artists earn revenue when users COLLECT (purchase ownership) songs
- 700+ artists, 1,700+ songs currently live
- Collection = direct support signal (inverts Spotify's play-based economics)

**Why it matters for Sparkz:**
- Collection is a strong pre-token energy metric: "Who's worth owning vs. who's worth one listen?"
- Creators on Tortoise already have proof-of-fan-loyalty (a collection shelf)
- Integration: Sparkz energy score can pull Tortoise collection data (total collections, collection velocity) as a signal for "artist is ready to launch"
- Creator journey: musician builds audience on Farcaster + gets collections on Tortoise -> Sparkz agent sees collection momentum -> recommends coin launch -> coin holders get special access or revenue sharing

**Data points:**
- 700+ artists on platform
- 1,700+ songs indexed
- Collection mechanics incentivize artist promotion (direct revenue per collection, not per stream)
- Active on Base + Farcaster (native integration)

**Sparkz integration point:** Primary energy signal for music creators. Collections = proof-of-quality + proof-of-support.

---

### Fotocaster: Photo/Content Collection (Mechanics Unclear)

**Status:** [PARTIAL] Mechanics not publicly documented; ZABAL Gamez ecosystem member.

**What we know:**
- Appeared at ZABAL Gamez builder showcase (Day 1, alongside Tortoise, POIDH, Juke, Founder Check, Dr. Deeks)
- Likely collecting-based mechanic (inferred: photo/media collections)
- Builder identity unknown from public sources

**Why it matters (inferred):**
- If it's a photo/content collection platform similar to Tortoise, it captures visual creators (photographers, graphic designers, video creators)
- Collectors of visual content = proof-of-engagement for non-music creators
- Collection velocity = energy metric for designers/visual artists

**What we need to know (flagged for Zaal):**
1. Exact mechanics: is it collections, NFTs, or something else?
2. Creator-centric or curator-centric?
3. Revenue model for creators?
4. Integration readiness: API or manual data pull?

**For this doc:** Assume Fotocaster integrates similarly to Tortoise (collection = energy signal for visual creators). Flag mechanics clarification as a Phase 1 decision. For MVP, we can proceed with Tortoise fully wired + Fotocaster as "future integration" with a slot in the energy formula reserved.

**Sparkz integration point (provisional):** Secondary energy signal for visual creators. To be confirmed by builder outreach or direct testing.

---

## Full Sparkz Architecture

### High-Level Flow

```
Creator joins Farcaster
    |
    v
Creates Sparkz project (claim a channel name, set metadata)
    |
    v
Sparkz provisions: channel + AI agent + integration hooks
    |
    v
Creator builds energy: posts, engages, gets collections (Tortoise/Fotocaster)
    |
    v
AI agent monitors 4 energy signals daily:
  - Follower growth rate
  - Engagement rate (casts, likes, replies, recasts)
  - Consistency score (days active, cast frequency)
  - Community signals (Tortoise collections, Fotocaster items, channel activity)
    |
    v
When energy score >= 60 (threshold):
  AI agent sends notification + recommendation: "Ready to launch"
    |
    v
Creator clicks "Launch Token" button
    |
    v
Sparkz formats Clanker launch cast + metadata
Creator signs + broadcasts cast
    |
    v
Clanker deploys ERC-20 token on Base
Uniswap V3 pool auto-creates (token <-> WETH)
Sparkz charges 1% trading fee (kept by Sparkz)
Clanker keeps 0.2% (goes to creator)
    |
    v
Token is live. Sparkz ecosystem integrations activate:
  - ZAO booster: ZABAL holders get 2x multiplier on leaderboard
  - Kismet integration (TBD)
  - Post-launch support + promotion
```

### System Components

#### 1. Energy-Score Engine (Extending #17 Prototype)

**Source:** `bettercallzaal/zol` PR #17 (capsule: sparkz-launch-readiness-v1)

**Signals (weighted):**
- Follower growth rate (25%) - velocity of audience growth
- Engagement rate (35%) - avg likes/replies/recasts per cast
- Consistency score (20%) - active days + cast frequency (penalizes ghosting)
- Community signals (20%) - Tortoise collections, Fotocaster items, channel activity depth

**Formula:**
```
energy_score = (follower_growth * 0.25) + (engagement_rate * 0.35) + (consistency * 0.20) + (community_signals * 0.20)
Score range: 0-100
Launch threshold: 60
```

**Inputs required:**
- Creator's Farcaster FID
- Last 30-day historical data from Neynar (follower snapshots, cast metrics)
- Last 7-day data from Tortoise API (collection count + velocity)
- Last 7-day data from Fotocaster API or manual pull (if available)
- Channel activity from Farcaster (if creator has a dedicated Sparkz channel)

**Update frequency:** Daily (overnight job) or on-demand (when creator clicks "check readiness")

**Recommendation output:**
```json
{
  "creator_fid": 54321,
  "energy_score": 72,
  "recommendation": "launch_now",
  "reasoning": "Follower growth 35%/week, engagement 24 per cast, 18 active days, 12 Tortoise collections. Strong community signal.",
  "missing_signals": [],
  "momentum_trend": "accelerating",
  "next_check_days": 1
}
```

---

#### 2. Sparkz Channel Infrastructure

**What the creator gets:**
- Dedicated Farcaster channel (e.g., `/sparkz-luna-album` or `/zaal-booster-v2`)
- Channel is gated or open (creator's choice)
- Channel topic: the project (album, event, fundraise, collab, etc.)

**What Sparkz does on the channel:**
- Pinned post: project description + fundraise target + timeline + token details (when live)
- Daily digest (optional): energy score trend, community highlights, booster multipliers
- Integration bot: responds to asks like "show me my score" or "am I ready to launch?"

**Channel as an energy signal:**
- Channel activity depth (casts, replies, participants) feeds into the community_signals score
- Zaal's "booster" rule (optional): auto-engage anyone who likes a post or mentions the project -> compounds energy

---

#### 3. AI Agent for Energy Monitoring + Launch Readiness

**Agent type:** Monitoring agent (does NOT post without permission)

**Responsibilities:**
1. Daily poll: fetch creator's Farcaster metrics from Neynar
2. Fetch Tortoise collections + velocity
3. Fetch Fotocaster data (if API available; fallback to manual)
4. Compute energy score using the formula
5. Store energy history (for trend analysis)
6. When energy >= 60: send Telegram + Farcaster notification to creator
7. When creator clicks "launch": orchestrate the Clanker launch cast

**Implementation:**
- Built on ZOE + Hermes agent patterns (existing in `bot/src/zoe/`, `bot/src/hermes/`)
- Runs as a durable service on VPS (or ZOE's existing infrastructure)
- Uses Neynar API for Farcaster data (existing in `src/lib/farcaster/`)
- Calls Tortoise API for collection data (need API endpoint confirmation)
- Calls Fotocaster API or fetches manually (mechanics TBD)
- Stores state in Supabase (new table: `sparkz_creators` + `sparkz_energy_history`)

**Permissions:**
- Read-only: Farcaster, Tortoise, Fotocaster
- Write: energy history, notifications
- Guarded: token launch cast formatting (requires creator approval before broadcast)

---

#### 4. Token Launch Flow (Clanker Integration)

**Precondition:** Energy score >= 60 OR creator manually clicks "Launch Now" button

**Steps:**
1. Creator fills out token details (name, ticker, total supply, description, logo)
2. Creator sets crowdfund target + deadline (optional; can launch open-ended)
3. Sparkz generates Clanker launch cast: `@clanker launch [Name] $[TICKER] [description] - created via Sparkz`
4. Creator reviews + approves the cast (signs transaction)
5. Cast is broadcast to Farcaster
6. Clanker contracts deploy token on Base (ERC-20, 100B supply, non-mintable)
7. Uniswap V3 pool auto-creates: token <-> WETH, LP locked 2100
8. Sparkz transaction hook captures: token address, pool address, Sparkz fee receiver
9. Sparkz marks creator as "launched" in DB
10. Token is live; trading begins

**Fee structure:**
- Clanker protocol fee: 0.2% (goes to creator)
- Sparkz fee: 1% (kept by Sparkz for operations + support)
- Total trading slippage visible to users: ~1.2% (Uniswap + Sparkz + Clanker)

---

#### 5. Leaderboard + Booster Integrations

**Leaderboard (optional):**
- Creator can enable a live leaderboard showing top participants (highest volume purchases, most holds, etc.)
- Leaderboard visibility = social proof + engagement
- Booster multipliers stack: holding the project token = 1x, holding ZABAL = 2x, holding both = 3x

**ZAO Booster (Phase 2 integration):**
- ZABAL token holders get 2x multiplier on project leaderboards
- Multiplier affects score visibility, rewards, or future airdrop priority (TBD with Zaal)

**Kismet Kasa Integration (Phase 2, TBD):**
- Placeholder for Kismet partnership
- Scope: treasury management, DAO mechanics, lending options (to be confirmed)

---

### Tech Stack (Zero New Infrastructure)

| Layer | Technology | Source | Notes |
|-------|------------|--------|-------|
| **Frontend** | Next.js 16, React 19, Tailwind v4 | ZAOOS (existing) | Sparkz miniapp or embedded in zaalcaster |
| **Backend** | src/app/api/, Supabase | ZAOOS (existing) | New tables: `sparkz_creators`, `sparkz_energy_history`, `sparkz_launches` |
| **Farcaster** | Neynar SDK, Farcaster API | ZAOOS (existing) | Pull metrics + broadcast launch casts |
| **Agent** | ZOE + Hermes patterns | bot/src/ (existing) | Energy monitoring agent |
| **On-chain** | Base ERC-20 (Clanker) | Clanker (partner API) | No code changes; call via Clanker API |
| **Integrations** | Tortoise, Fotocaster, Uniswap | Partner APIs | New integrations, no code dependencies |

**New dependencies:** None. Sparkz is a product layer on top of existing infrastructure.

---

## Creator Journey: Step-by-Step

### Phase 1: Project Setup (Day 1)

**1. Creator lands on Sparkz**
- Entry point: Farcaster miniapp tab, or "Launch" button in zaalcaster, or direct link
- Signed in via their Farcaster account (iron-session existing auth)

**2. Claim project + create metadata**
- Creator enters:
  - Project name (e.g., "Luna's Album Fund")
  - Channel name (e.g., "luna-album-2026")
  - Description (what's the project? e.g., "Indie pop album, released Sep 15")
  - Target amount + deadline (optional; can be open-ended)
  - Logo/image
  - Links (website, external resources)
- Sparkz provisions a Farcaster channel automatically (or creates if not exists)
- Channel is pinned with project details + energy score

**3. Enable integrations**
- Creator toggles ON: Tortoise (if they're a musician)
- Creator toggles ON: Fotocaster (if they're a visual creator)
- Creator toggles ON: ZAO booster (if they want ZABAL holders to get multipliers)
- AI agent begins monitoring

**Setup time: ~5 min**

---

### Phase 2: Energy-Building (Days 2-14 typical)

**4. Creator posts in the project channel**
- Regular casts about the project: progress updates, behind-the-scenes, asks for support
- If Tortoise: direct fans to collect the soundtrack preview or existing music
- If Fotocaster: share work-in-progress media + collect

**5. Sparkz energy score updates daily**
- Creator can check score anytime in the Sparkz UI
- Score card shows: energy_score, trend (up/down/steady), missing signals, recommendation
- Recommendation: "You're at 45/100. Need 15 more points. Try: 2 more high-engagement casts or get 20 Tortoise collections."

**6. Community engages**
- Fans like, reply, recast creator's casts (engagement metric)
- Fans collect on Tortoise (collection metric)
- New followers (follower growth metric)
- Days active in channel (consistency metric)

**7. Booster auto-engagement (optional)**
- Zaal's "booster" rule: anyone who likes a post or mentions the project channel -> gets points
- This is transparent: creator's fans see "you earned +2 points for engaging with this project"
- Compounds energy effect: more posts -> more engagement -> more followers

**Typical duration: 7-14 days (depends on creator's existing audience)**

---

### Phase 3: Launch Decision (When energy >= 60)

**8. AI agent recommends launch**
- When energy score hits 60+: Sparkz sends notification to creator (in-app + Telegram if connected)
- Notification: "You're ready to launch your token! Energy score: 72. Click here to launch."

**9. Creator reviews launch readiness**
- Opens Sparkz dashboard
- Sees energy score breakdown: follower growth (28/25 pts), engagement (26/35 pts), consistency (18/20 pts), community (24/20 pts)
- Sees: 127 followers, 12 active Tortoise collections, 45 avg engagement per cast, 16 active days
- Decides: "Yes, I'm ready" or "Let me build more"

**10. Creator launches token**
- Clicks "Launch Token" button
- Fills out token details:
  - Token name (e.g., "Luna Album", ticker LUNA)
  - Total supply (default 1B, customizable)
  - Description for Clanker
  - Logo
- Sees the Clanker launch cast preview (formatted + ready to broadcast)
- Clicks "Approve & Broadcast"
- Farcaster auth signs the cast + broadcasts it

**11. Clanker deploys**
- @clanker sees the cast, parses the token spec
- Deploys ERC-20 on Base: contract created, 1B supply minted to a burn address (or kept by creator)
- Uniswap V3 pool auto-creates: token <-> WETH
- LP locked until 2100
- Token is live at clanker.world/clanker/[contract-addr]

**12. Sparkz records the launch**
- Stores in DB: creator_fid, token_name, contract_address, pool_address, launch_time, energy_score_at_launch
- Updates Farcaster channel: pins the Clanker link + celebration post
- Marks creator as "launched"

**Launch time: ~30 min (from decision to live token)**

---

### Phase 4: Trading + Crowdfunding (Days 15-45 typical)

**13. Community buys the token**
- Token is on Uniswap: anyone can swap WETH -> token or vice versa
- Sparkz shows a live trading chart (embed Uniswap charts or DexScreener)
- Creator's project channel shows: live volume, holders count, trending price

**14. Crowdfund progress tracking**
- If creator set a target + deadline: Sparkz shows progress bar (X of Y raised, Z days left)
- Daily digest: "Today's volume: $2.3K. You're at 65% of $5K target."

**15. Creator earns fees**
- Every trade on Uniswap incurs Sparkz 1% fee
- 0.2% goes to Clanker (automatic)
- 1% goes to Sparkz fee receiver (can be creator's wallet or treasury)
- Creator sees real-time earnings dashboard: cumulative fees collected

**16. Community builds leaderboard (optional)**
- If enabled, top token holders are shown with their buy-in amounts + hold duration
- ZAO booster: ZABAL holders see 2x their position on the leaderboard
- Social proof compounds: top participants' names visible -> encourages buying for visibility

---

### Phase 5: Crowdfund Closure or Success (Days 45+)

**17. Crowdfund succeeds or fails**
- **Success:** Creator hit the target by the deadline. Funds move to project execution (album production, event, etc.). Token persists; Sparkz markets it as a "success story."
- **Failure:** Creator missed the target. Sparkz documents the outcome transparently (no extraction happened; token still exists; creator can keep, burn, or evolve it).
- **Open-ended:** No deadline; token becomes ongoing revenue (creator earns fees indefinitely).

**18. Post-launch support**
- Sparkz offers:
  - Co-promotion in Sparkz channels + X/FC
  - Integration with ZAO ecosystem projects (if opted in)
  - Potential features: rewards for holdersm revenue-sharing tiers, voting rights (TBD)
  - Case study + interview (if Zaal approves)

---

## MVP Scope + YAGNI Cuts

### MVP (Ship Phase 1)

**Phase 1 ships these flows:**

1. **Creator onboarding:** Farcaster auth, project setup (name, channel, description, optional target+deadline)
2. **Energy score engine:** 4 signals (follower growth, engagement, consistency, Tortoise collections) computed daily
3. **Energy dashboard:** Creator can see their score, trend, missing signals, recommendation
4. **Token launch:** Creator clicks "Launch", Sparkz formats Clanker cast, creator signs + broadcasts
5. **Launch recording:** DB stores launch event, channel is updated with token link
6. **Tortoise integration:** API call to Tortoise for collection count + velocity (if Tortoise has public API; fallback: manual data entry)

**What's NOT in MVP:**

- Fotocaster integration (mechanics not confirmed; Phase 2)
- Leaderboards (scope creep; Phase 2)
- ZAO booster multipliers (requires Zaal's decision on multiplier mechanics; Phase 2)
- Kismet integration (scope TBD; Phase 2)
- Post-launch support features (rewards, revenue-sharing; Phase 2+)
- AI booster auto-engagement (manual engagement in Phase 1; Phase 2)
- Trading dashboard / live chart embeds (creator can link to Uniswap/Clanker directly; Phase 2)
- Crowdfund progress tracking (displayed as text; fancy UI in Phase 2)

**Why YAGNI:**

- Fotocaster: builders unknown; need to confirm integration readiness first
- Leaderboards: Sparkz is energy-gated, not leaderboard-first; leaderboards are a social layer, not core to the energy decision
- Boosters: requires Zaal's definition of what a multiplier does (affects score? affects rewards? affects airdrop?); defer to Phase 2
- Post-launch features: can be added later without changing the core product

---

### Integration Roadmap

**Phase 1 (MVP):** Energy-score + launch (Neynar + Tortoise + Clanker)
**Phase 2:** Fotocaster, Leaderboards, ZAO booster
**Phase 3:** Kismet, Post-launch rewards, Booster auto-engagement
**Phase 4+:** Scaling, ecosystem partnerships, mobile app

---

## Where Sparkz Plugs Into ZAOOS

### Existing ZAOOS Code Reuse

| Component | Path | Usage in Sparkz |
|-----------|------|-----------------|
| **Farcaster auth** | `src/lib/auth/`, `src/lib/farcaster/` | Creator sign-in via iron-session |
| **Neynar SDK** | `src/lib/farcaster/neynar.ts` | Fetch follower counts, cast engagement metrics |
| **Supabase** | `src/lib/db/supabase.ts` | New tables for energy history, launches |
| **Cast publishing** | `src/lib/publish/` | Format + broadcast Clanker launch cast |
| **Agent orchestration** | `bot/src/zoe/`, `bot/src/hermes/` | Energy monitoring agent (runs on existing ZOE infrastructure) |
| **Components** | `src/components/` | Adapt stats/card components for energy dashboard, launch UI |
| **Tailwind** | Tailwind v4 (existing) | Sparkz UI (mobile-first, dark theme) |

**Effort to integrate:** 2/10. Heavy reuse, minimal new infrastructure.

---

### New ZAOOS Tables (Supabase)

```sql
-- Track creators using Sparkz
CREATE TABLE sparkz_creators (
  id UUID PRIMARY KEY,
  farcaster_fid INTEGER UNIQUE,
  project_name TEXT,
  channel_name TEXT,
  description TEXT,
  target_amount BIGINT,
  target_deadline TIMESTAMP,
  integrations JSONB, -- {"tortoise": true, "fotocaster": false, "zao_booster": true}
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- Energy score history (daily snapshots)
CREATE TABLE sparkz_energy_history (
  id UUID PRIMARY KEY,
  creator_id UUID REFERENCES sparkz_creators(id),
  energy_score NUMERIC(5,2),
  follower_growth_score NUMERIC(5,2),
  engagement_score NUMERIC(5,2),
  consistency_score NUMERIC(5,2),
  community_score NUMERIC(5,2),
  recommendation TEXT, -- "launch_now", "keep_building", "insufficient_data"
  momentum_trend TEXT, -- "accelerating", "steady", "declining"
  computed_at TIMESTAMP
);

-- Record each token launch
CREATE TABLE sparkz_launches (
  id UUID PRIMARY KEY,
  creator_id UUID REFERENCES sparkz_creators(id),
  token_name TEXT,
  token_ticker TEXT,
  contract_address TEXT UNIQUE,
  pool_address TEXT,
  energy_score_at_launch NUMERIC(5,2),
  launched_at TIMESTAMP,
  crowdfund_target_usd BIGINT,
  crowdfund_deadline TIMESTAMP,
  status TEXT, -- "live", "target_hit", "failed", "cancelled"
  sparkz_fees_earned BIGINT,
  updated_at TIMESTAMP
);
```

---

## Open Questions for Zaal

These decisions are Zaal's to make; design assumes defaults if not specified.

| # | Question | Default (if no input) | Impact |
|---|----------|---------------------|--------|
| 1 | **Fotocaster mechanics:** What does it do exactly? Is it collections, NFTs, or something else? | Assume collections like Tortoise. Phase 2 confirmation. | Affects whether Fotocaster data is included in Phase 1 energy formula. |
| 2 | **Tortoise API availability:** Does Tortoise have a public API for collection data? If not, how do we pull it? | Manual data entry or manual API call. | Affects automation effort. If manual, Phase 1 is creator self-reports collections. |
| 3 | **Booster multiplier definition:** What does a 2x booster for ZABAL holders actually do? Affect energy score? Affect leaderboard ranking? Affect future rewards? | No multiplier in Phase 1; Phase 2 decision. | Affects leaderboard design + reward mechanics. |
| 4 | **Post-launch revenue model:** How should post-launch creators be supported? Free tools? Paid tier? Affiliate rewards? | Free tools for all; creators earn 100% of Sparkz 1% fees. | Affects pricing + sustainability model. |
| 5 | **Crowdfund failure mode:** If a creator misses their target, what happens? Rollover? Partial success? Token burn option? | Token persists, no automatic action. Creator decides. | Affects UX messaging + success/failure criteria. |
| 6 | **Who decides when to recommend launch?** Does the AI agent auto-recommend at 60? Or does creator have to opt-in? | AI recommends at 60; creator decides whether to launch. | Affects notification strategy + creator autonomy. |
| 7 | **Marketing launch:** When Sparkz ships, do we launch with a flagship creator (Zaal's token)? Or soft launch with beta creators? | Soft launch with 3-5 beta creators, then Zaal's token as proof point. | Affects go-to-market strategy + timeline. |
| 8 | **Mobile app or web-only for MVP?** | Web-only (responsive, mobile-first design). Mobile app in Phase 2. | Affects frontend scope. |

---

## MVP Effort Estimate

| Component | Effort | Notes |
|-----------|--------|-------|
| Energy-score engine | 2/10 | Extend #17 prototype; mostly data integration |
| Creator onboarding + UI | 4/10 | 3-step wizard (project setup, integrations, launch readiness) |
| Farcaster channel provisioning | 1/10 | Use Neynar API to create channel or auto-manage a shared one |
| Tortoise integration | 2/10 | If API exists: call it. If not: manual data entry. |
| Clanker launch flow | 1/10 | Format cast + parse response; most work done by Clanker |
| Database schema + API routes | 2/10 | 3 tables, ~6 routes (GET/POST creator, GET energy, POST launch, etc.) |
| Energy dashboard UI | 3/10 | Stats cards, trend sparklines, recommendation box |
| Testing + polish | 2/10 | E2E tests for launch flow, mobile responsiveness |
| **Total MVP effort** | **17/10** | ~2-3 weeks with full-time focus |

**Comparison:** Doc 1088 (zaalcaster-coinz, a more complex workflow) was estimated 6-7/10. Sparkz MVP is lighter because it's narrowly scoped (energy -> launch, not the full Stage 1+Stage 2 workflow). But Sparkz requires the energy-score agent to be production-ready, which adds complexity.

---

## Next Actions

| Action | Owner | Type | By When | Success Criteria |
|--------|-------|------|---------|------------------|
| **Confirm Tortoise API** - Does Tortoise have a public API for collection data, or manual pull? | @Zaal | Research | 2026-07-16 | Slack confirmation + API docs link (or "manual only" decision) |
| **Confirm Fotocaster integration** - What are the exact mechanics? Collections? NFTs? Collecting user base? | @Zaal | Outreach | 2026-07-17 | Builder contact info or direct mechanic confirmation |
| **Decide on energy threshold** - Is 60/100 the right launch readiness score? Should it scale with creator size? | @Zaal | Decision | 2026-07-17 | Threshold value locked in this doc (update from 60 if different) |
| **Confirm ZAO booster scope** - What does a 2x multiplier do for ZABAL holders? (deferred to Phase 2, but clarify intent) | @Zaal | Decision | 2026-07-20 | 1-line decision on booster effect (score? rewards? visibility?) |
| **Design the energy dashboard UI** - Mockups for the energy score card, trend chart, recommendation box | @Zaal or designer | Design | 2026-07-21 | Figma link or low-fidelity sketches |
| **Build Phase 1: Energy-score engine** - Extend #17 prototype + wire Tortoise API + Supabase schema | @Zaal | Code | 2026-07-28 | Energy score computed daily for 1 test creator; Supabase tables live |
| **Build Phase 1: Creator onboarding** - 3-step wizard (project + integrations + review) | @Zaal | Code | 2026-08-04 | Full onboarding flow works; creator can set up project + see initial energy score |
| **Build Phase 1: Token launch flow** - Cast formatting + Clanker integration + launch recording | @Zaal | Code | 2026-08-11 | Can launch a test token to testnet or mainnet; recorded in DB |
| **Build Phase 1: Energy dashboard** - Stats cards, trend, recommendation, missing signals | @Zaal | Code | 2026-08-18 | Dashboard displays live energy score + recommendation |
| **Test Phase 1 end-to-end** - Zaal launches his own token via Sparkz (energy -> launch) | @Zaal | Ship | 2026-08-25 | Zaal's token is live; leaderboard has 5+ participants; energy score was accurate at launch |
| **Document + launch** - Write user guide, FAQ, one-pager. Announce Sparkz to ZAO. | @Zaal | Docs | 2026-09-01 | Public landing page live; docs in `/docs/sparkz/`; Farcaster announcement cast |
| **Phase 2 planning** - Review learnings from Zaal's launch. Plan Fotocaster + Leaderboards + ZAO booster | @Zaal | Iterate | 2026-09-08 | Phase 2 spec doc written; next priorities ranked |

---

## Sources

### Primary (Research + Design)

- **Sparkz brainstorm decisions (locked)** [FULL] - 2026-07-14 brainstorm with Zaal: energy-first, AI-gated launch, 1% fee, Clanker, starter kit. This doc builds directly on these.

- **bettercallzaal/zol PR #17: Sparkz Launch Readiness Energy Score** [FULL] - The energy-score prototype (capsule + handlers). Energy formula: 0.25 follower_growth + 0.35 engagement_rate + 0.20 consistency + 0.20 community_size. Threshold: 60/100 for launch recommendation.

### Research (Existing ZAOOS Docs)

- **Doc 1088 - zaalcaster + Empire Builder + coinz: Crowdfunding Workflow** [FULL] - The workflow that Sparkz builds on. 12-step creator journey from idea -> tokenless Empire -> Clanker launch. Sparkz simplifies this to: energy-building -> AI-gated launch -> Clanker.

- **Doc 1095 - Farcaster Dead-Revival-Sparkz-Timing Pattern Analysis** [FULL] - Timing research for when to launch tokens on Farcaster (relates to energy score threshold + recommendation timing). Clanker/Degen launch patterns.

- **Doc 1094 - Empire Builder Write API + Clanker v5 + Farcaster Protocol Deep Dive** [FULL] - Technical deep dive on Clanker v5, LP mechanics, fee structure. Confirms 0.2% Clanker fee, LP locked 2100, creator gets 100% of Clanker's fees.

- **Doc 991 - Empire Builder: Tokenless Empires + Leaderboard-Airdrop Mechanic** [FULL] - The "Triple A" framework (Assemble -> Affirm -> Ascend). Sparkz is the "Ascend" layer: token launch only after energy is proven.

- **Doc 988 - zaalcaster Token Launch Plan** [FULL] - zaalcaster's existing product (personal Farcaster client, reply-to list, staking). Sparkz integrates with zaalcaster as a distribution surface.

### External Research (Tortoise + Fotocaster + QR Coin)

- **Tortoise.studio** [FULL] - Music platform with collection layer. 700+ artists, 1,700+ songs. Collection = direct support signal. Integration: pull collections via API or manual entry.

- **ZABAL Gamez Recordings (Day 1)** [FULL] - Includes Tortoise demo + Fotocaster showcase. Confirms Tortoise as active, Fotocaster as ecosystem member (mechanics unconfirmed).

- **QRCoin Success Case Study** [FULL] - Daily auction mechanic, instant refunds, Sybil resistance, physical-digital hybrid, real utility. Launched Feb 2025, peaked $4.3M, settled $1.8-2M. Lessons for Sparkz: simplicity, trust, genuine utility over speculation.

- **Clanker (clanker.world)** [FULL] - Confirmed 0.2% protocol fee, LP locked 2100, Base deployment, ~13K tokens/day. Used by QRCoin as the launch rail.

### Deferred / To Confirm

- **Tortoise API documentation** - Confirm public API availability for collection data. If not available, plan manual integration path.

- **Fotocaster mechanics + API** - Builder identity TBD. Need direct contact via ZABAL Gamez network for scope confirmation.

- **Zaal's booster mechanics** - Confirm what a 2x multiplier does (energy score? leaderboard ranking? rewards?). Deferred to Phase 2 design.

---

## Closing

Sparkz is the infrastructure for energy-first creator economies on Farcaster. Unlike Clanker (anyone-can-launch) or Friend.tech (personal-brand extraction), Sparkz teaches creators to build community FIRST, then tokenize for crowdfunding. The AI agent is the trust layer: "You have real energy. It's time."

For creators: Sparkz is permission + support. Launch when ready, not when desperate.

For ZAO: Sparkz is the next layer after empire-building. Every creator who launches a token via Sparkz plugs into ZAO collaboration tree. Network effect compounds.

For Zaal: Sparkz proves the energy-first thesis at scale. Ship with Zaal's own token as the proof point. Watch network effects emerge.

---

## See Also

- [Doc 1088 - zaalcaster + Empire Builder + coinz](../../business/1088-zaalcaster-empire-builder-coinz-crowdfunding/) - the workflow Sparkz builds on
- [Doc 1095 - Farcaster Timing Patterns](../../farcaster/1095-farcaster-dead-revival-sparkz-timing/) - timing research for token launches
- [Doc 1094 - Empire Builder + Clanker Technical Deep Dive](../../farcaster/1094-empire-builder-write-api-clanker-v5/) - technical foundations
- [Tortoise.studio](https://tortoise.studio/) - music collection platform, key Sparkz integration
- [Clanker](https://clanker.world/) - token launch rail
