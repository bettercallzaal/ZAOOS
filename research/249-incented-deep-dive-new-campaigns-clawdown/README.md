# 249 — Incented Deep Dive, New Campaign Ideas & ClawDown Challenge for ZOE

> **Status:** Research complete
> **Date:** April 2, 2026
> **Goal:** Deep dive into Incented protocol mechanics, propose new ZABAL campaigns beyond the existing one, and evaluate ClawDown.xyz challenge for ZOE agent entry

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **Incented protocol understanding** | Incented has evolved from "4-stage staking" (Doc 64) to **conviction voting** with stake-based FOR/AGAINST, slash penalties (5-25%), and automated on-chain settlement via Safe (EVM) or Squads (Solana). Multi-chain: all EVM chains + Solana |
| **New ZABAL campaign #1** | RUN a **"ZAO OS Bug Bounty" campaign** — Quorum-based, 14-day cycles, Fixed awards ($25-100 USDC per valid bug), 10% slash. Members find and report bugs → community validates severity → rewards paid on Base via USDC |
| **New ZABAL campaign #2** | RUN a **"Weekly Music Curation" campaign** — Top 3 structure, 7-day cycles, Split Proportional awards. Members submit the best new track they found that week → community votes → top 3 curators get rewarded. Ties directly into ZAO's music-first identity |
| **New ZABAL campaign #3** | RUN a **"Research & Documentation" campaign** — Quorum 60%, 14-day cycles, Milestone awards. Submit research docs, guides, or ZAO OS documentation → validated by community. Already 248+ research docs — incentivize the community to contribute |
| **ClawDown.xyz for ZOE** | ENTER the **ClawDown Launch Challenge** (144 USDC bounty) — ClawDown is an AI agent competition platform ("Where Agents Level Up") running poker challenges on Base L2. ZOE can register via API, compete in No-Limit Hold'em, 90% of training fees fund prizes. USE the `/vps` skill to generate a prompt for ZOE to register and compete |
| **Existing ZABAL campaign** | The current ZABAL org at `incented.co/organizations/zabal` is already linked in ZAO OS at `src/app/(auth)/ecosystem/page.tsx:61` and `community.config.ts:154`. Expand with 3 new campaigns |

## Comparison of Campaign Structures for ZABAL

| Campaign | Structure | Cycle | Award Model | Slash % | Estimated Pool | Best For |
|----------|-----------|-------|-------------|---------|----------------|----------|
| **Bug Bounty** | Quorum (any good enough) | 14 days | Fixed ($25-100/bug) | 10% | $500/cycle | Clear deliverables, verifiable quality |
| **Weekly Music Curation** | Top 3 | 7 days | Split Proportional | 5% | $150/week | Engagement, music discovery, low barrier |
| **Research & Docs** | Quorum 60% | 14 days | Milestone | 15% | $300/cycle | Deeper work, accountability, higher quality |
| **Existing ZABAL campaign** | Unknown (check Incented) | Unknown | Unknown | Unknown | Unknown | General coordination |

## Incented Protocol Deep Dive (Updated from Doc 64)

### Conviction Voting — The Core Mechanism

Doc 64 described a "4-stage staking pipeline" (Propose → Prioritize → Execute → Validate). The current Incented protocol has evolved to **conviction voting with stake-based signaling**:

| Element | How It Works |
|---------|-------------|
| **FOR stake** | "I believe this submission deserves to win" — stake tokens to signal quality |
| **AGAINST stake** | "This shouldn't win" — stake against to signal low quality |
| **Net conviction** | FOR stakes minus AGAINST stakes determines ranking |
| **Correct vote reward** | If your vote aligns with outcome, earn from the voting reward pool proportional to your stake |
| **Incorrect vote slash** | If your vote opposes outcome, lose a percentage of your stake (configurable 0-25%) |
| **The carrot** | Correct votes earn rewards |
| **The stick** | Incorrect votes get slashed |

### Program Design Parameters (from Incented docs)

| Parameter | Options | ZAO Recommendation |
|-----------|---------|-------------------|
| **Structure** | Top X (competitive) vs Quorum (quality threshold) | Quorum for bugs/docs (anything good enough wins), Top X for curation (competitive) |
| **Cycle length** | 3-7 days (high engagement), 14-30 days (polished work), 30+ (major initiatives) | 7 days for curation, 14 days for bugs/docs |
| **Award model** | Fixed, Split Equal, Split Proportional, Milestone | Fixed for bugs (predictable), Split Proportional for curation (merit), Milestone for docs (deliverable-based) |
| **Slash %** | 0-5% (casual), 5-15% (balanced), 15-25% (high stakes) | 5% for curation (low friction), 10-15% for bugs/docs (quality matters) |
| **Token config** | Same token or different | Different: governance token (Respect/ZABAL) for voting, USDC for awards |

### Chain Support

| Chain | Multisig | Status |
|-------|----------|--------|
| **All EVM chains** (Ethereum, Base, Optimism, Arbitrum) | Safe Protocol | Live |
| **Solana** (mainnet + devnet) | Squads Protocol | Live |
| **New chains** | On request | Available |

**For ZABAL:** USE Base (where $ZABAL token lives at `0xbB48f19B0494Ff7C1fE5Dc2032aeEE14312f0b07`) for settlement.

### Submission Flow

1. **Contributors submit** work — no wallet needed to submit, only to receive rewards
2. **Community stakes** FOR or AGAINST each submission
3. **Protocol resolves** — winners determined by net conviction
4. **Rewards distributed** — awards to contributors, voting rewards to correct voters
5. **Slashing applied** — incorrect voters lose staked percentage
6. **Settlement** — transactions queued to org multisig, approved, then settled on-chain

## Proposed New ZABAL Campaigns — Detailed Design

### Campaign 1: ZAO OS Bug Bounty

**Goal:** Incentivize the 188-member community to find and report bugs in ZAO OS, validated by community staking.

| Parameter | Value |
|-----------|-------|
| **Structure** | Quorum — any bug that meets quality threshold gets rewarded |
| **Quorum threshold** | 60% net conviction (FOR - AGAINST > 60% of total stakes) |
| **Cycle** | 14 days — enough time to find, document, and validate bugs |
| **Award model** | Fixed: P0 critical = $100, P1 high = $50, P2 medium = $25 |
| **Award pool** | $500 USDC per cycle |
| **Voting reward pool** | $50 USDC per cycle (10% of award pool) |
| **Slash %** | 10% — balanced, discourages lazy voting |
| **Token setup** | USDC for awards, $ZABAL for staking/voting |

**Submission requirements:**
- Bug description with steps to reproduce
- Screenshot or Network tab HAR export (see Doc 248)
- Severity classification (P0/P1/P2)
- Which ZAO OS route or component is affected

**Why this works for ZABAL:** Doc 248 (Network Tab Debugging Guide) just taught the community HOW to find bugs. This campaign incentivizes them to DO it.

### Campaign 2: Weekly Music Curation Challenge

**Goal:** Surface the best new music each week, curated and validated by the community.

| Parameter | Value |
|-----------|-------|
| **Structure** | Top 3 — competitive, only best curators rewarded |
| **Cycle** | 7 days (weekly rhythm matches fractal meetings) |
| **Award model** | Split Proportional — #1 gets more than #3 based on net conviction |
| **Award pool** | $150 USDC per week |
| **Voting reward pool** | $30 USDC per week |
| **Slash %** | 5% — low friction, encourage participation |
| **Token setup** | USDC for awards, $ZABAL for staking |

**Submission requirements:**
- Link to a track (any platform: Audius, Spotify, SoundCloud, YouTube, etc.)
- 2-3 sentence pitch: why this track matters for The ZAO
- Genre tag (matches `src/components/music/AiMusicGenerator.tsx` genre pills)

**Why this works for ZABAL:** Ties directly into ZAO's music-first identity. Winners' picks get added to the ZAO OS community playlist (`src/app/api/music/playlists/`). Creates a weekly content cadence.

### Campaign 3: Research & Documentation Bounties

**Goal:** Grow the research library (248+ docs) and create user-facing documentation for ZAO OS.

| Parameter | Value |
|-----------|-------|
| **Structure** | Quorum 60% — quality threshold, not competitive |
| **Cycle** | 14 days — research takes time |
| **Award model** | Milestone — specific deliverables, tracked |
| **Milestones** | Research doc = $75, User guide = $50, Tutorial video = $100 |
| **Award pool** | $300 USDC per cycle |
| **Voting reward pool** | $45 USDC per cycle (15%) |
| **Slash %** | 15% — higher stakes for quality decisions |
| **Token setup** | USDC for awards, $ZABAL for staking |

**Submission requirements:**
- Follows research doc template (see `/zao-research` skill format)
- At least 3 specific numbers, 2+ sources, comparison table
- Saved to `research/` folder with PR or shared doc

**Why this works for ZABAL:** The research library is ZAO's competitive advantage. Incentivizing community contributions scales knowledge beyond what Zaal can write alone.

## ClawDown.xyz — ZOE Agent Entry Plan

### What ClawDown Is

**ClawDown** (`clawdown.xyz`) is an AI agent competition platform — "Where Agents Level Up." Agents develop real-world skills through head-to-head competition.

| Detail | Value |
|--------|-------|
| **Platform** | clawdown.xyz |
| **Chain** | Base L2 (USDC) |
| **Prize model** | 90% of combined training fees → prize pool, 10% → platform |
| **Registration** | Single API call with agent ID |
| **Competition** | Autonomous — agents receive moves via WebSocket, respond without human input |
| **Refund policy** | If insufficient agents register, training fees auto-refunded on-chain |

### The Specific Challenge

| Field | Detail |
|-------|--------|
| **Challenge URL** | `clawdown.xyz/challenges/86c40378-0774-4d0c-84e5-5681d757d24b` |
| **Name** | ClawDown Launch Challenge |
| **Bounty** | 144 USDC |
| **Game** | No-Limit Hold'em (heads-up poker) |
| **Skills tested** | Deception, risk assessment, game theory, probabilistic reasoning |

### Live Challenges

| Game | Status | Skills |
|------|--------|--------|
| **No-Limit Hold'em** | Live | Deception, risk, game theory |
| **Chess** | Coming Soon | Long-horizon planning |
| **Connect Four** | Coming Soon | Forced-win calculation |
| **Backgammon** | Coming Soon | Probabilistic decisions |

### ZOE Entry Plan

ZOE (ZAO's OpenClaw agent on VPS at 31.97.148.88) can enter this challenge. Here's the plan:

**Step 1: Build a poker skill for ZOE**

Create a new OpenClaw skill at the VPS that:
- Connects to ClawDown's WebSocket API
- Implements basic poker strategy (pot odds, position, hand strength)
- Registers ZOE as an agent via the ClawDown API
- Handles autonomous play (no human input allowed)

**Step 2: Fund the training fee**

The challenge requires a USDC training fee on Base. ZOE needs a Base wallet funded with USDC.

**Step 3: Register and compete**

```
POST /api/register
{
  "agent_id": "zoe-zao",
  "agent_name": "ZOE (ZAO OS Agent)",
  "persona": "Music community AI agent with game theory skills"
}
```

**Step 4: Use `/vps` skill to deploy**

Generate a VPS prompt via `/vps` to set up:
- ClawDown WebSocket client
- Poker strategy engine (GTO-based or exploitative)
- USDC wallet on Base for training fee + prize collection
- Auto-play loop responding to WebSocket moves

### Poker Strategy Options for ZOE

| Strategy | Complexity | Expected Performance | Build Time |
|----------|-----------|---------------------|------------|
| **Rule-based (ABC poker)** | Low | Bottom 50% — predictable, exploitable | 1 day |
| **GTO solver (Nash equilibrium)** | Medium | Top 30% — balanced, hard to exploit | 3 days |
| **Exploitative (adaptive)** | High | Top 10% — reads opponent patterns | 1 week |
| **RL-trained (self-play)** | Very High | Top 5% — learns from competition | 2+ weeks |

**Recommendation:** Start with **GTO solver** — it's the sweet spot for a first entry. Use open-source poker libraries:
- `poker-engine` (npm, MIT) — hand evaluation, pot calculation
- `pokersolve` (npm) — hand ranking
- CounterFactual Regret Minimization (CFR) algorithm for strategy

## ZAO OS Integration

### Already Built

- **Ecosystem page:** Incented linked at `src/app/(auth)/ecosystem/page.tsx:61` with iframe to `incented.co/organizations/zabal`
- **EcosystemPanel:** Incented URL at `src/components/ecosystem/EcosystemPanel.tsx:26`
- **community.config.ts:154:** Incented listed as ecosystem partner
- **middleware.ts:** CSP allows `incented.co` in frame-src

### What to Build Next

| Feature | File Path | Priority |
|---------|-----------|----------|
| **Campaign creation UI** | New: `src/components/incented/CampaignCard.tsx` | P2 — after campaigns are live on Incented |
| **Active tasks feed** | New: `src/app/(auth)/contribute/page.tsx` upgrade | P2 — replace static GitHub link |
| **ZOE poker skill** | VPS: `/skills/clawdown-poker/` | P1 — time-sensitive challenge |
| **Respect → Incented voting weight** | `src/lib/respect/` + Incented API (when available) | P3 — requires Incented team collaboration |
| **Campaign results in chat** | `src/app/api/chat/` — `/campaigns` command | P3 — surface active tasks in /zao channel |

### Missing from Doc 64 (Now Answered)

Doc 64 had 5 "Unknown" questions. Here's what we now know:

| Question (Doc 64) | Answer (2026) |
|-------------------|---------------|
| Does Incented have a public API? | **Partial** — docs at `docs.incented.co` describe the protocol but no REST API docs found. Programs are created through the web UI. Contact Incented team for API access |
| What blockchain? | **Multi-chain:** All EVM (Safe Protocol multisig) + Solana (Squads Protocol). ZABAL should use Base |
| External reputation (Respect)? | **Token config supports it** — "Different tokens: governance/reputation token for voting, stablecoin for awards." $ZABAL or Respect tokens for voting, USDC for awards |
| Embedding support? | **Yes** — already embedded in ZAO OS ecosystem page via iframe |
| Webhook/event system? | **Unknown** — not documented. On-chain settlement means you can monitor contract events |

## Sources

- [Incented Documentation](https://docs.incented.co/) — Protocol overview, program design guide
- [Incented Program Design Guide](https://docs.incented.co/program-managers/program-design-guide) — Structure, cycles, award models, slash calibration
- [ZABAL on Incented](https://incented.co/organizations/zabal) — Active ZABAL organization
- [ClawDown.xyz](https://www.clawdown.xyz/) — AI agent competition platform, Base L2
- [ClawDown Challenge](https://www.clawdown.xyz/challenges/86c40378-0774-4d0c-84e5-5681d757d24b) — Launch Challenge, 144 USDC bounty
- [$ZABAL on BaseScan](https://basescan.org/token/0xbB48f19B0494Ff7C1fE5Dc2032aeEE14312f0b07) — Token contract on Base
- [Doc 64 — Incented ZABAL Campaigns](../064-incented-zabal-campaigns/) — Previous research (March 2026)
- [Doc 65 — ZABAL Partner Ecosystem](../065-zabal-partner-ecosystem/) — MAGNETIQ, SongJam, Empire Builder, Clanker
- [Conviction Voting TL;DR](https://forum.tecommons.org/t/conviction-voting-tl-dr/308) — Token Engineering Commons explainer
