---
topic: agents
type: design
status: research-complete
last-validated: 2026-07-01
related-docs: 927, 918, 928
original-query: "get all our brands media control under ZOE so it can be autonomous and better"
tier: DISPATCH
---

# H2-2026 ZOE Autonomous Media Control for All ZAO Brands

**Date:** 2026-07-01  
**Goal:** Design the north-star roadmap for ZOE as a unified orchestrator of media outbound across The ZAO, WaveWarZ, COC Concertz, ZABAL Games, and BetterCallZaal Strategies.  
**Status:** Architecture design, ready for phased implementation  
**Key Finding:** ZOL (the working prototype per-brand agent) hallucinated stats on WaveWarZ artists. Root cause: Bonfire PROSE grounds in qualitative synthesis, not verified live data. Fix required before scaling to other brands.

---

## Executive Summary

ZOE, currently a personal concierge for Zaal, is nearly ready to become the media orchestrator for the entire ZAO brand family. The architecture is 80% built: the scheduler (7 pings/day), 4-category post slate, approval workflow, and per-brand persona pattern (ZOL) already work. H2-2026 requires three critical additions:

1. **Verified data grounding** - Replace Bonfire PROSE synthesis with live APIs (WaveWarZ intelligence, GitHub, The ZAO nexus, contract state)
2. **Multi-brand coordination** - Map 5 brands + 5 channels into 1 ZOE + 5 persona blocks
3. **Cross-platform approval flow** - Telegram draft + Farcaster/X post, with human gate for public outbound

The result: one agent orchestrator, five brand voices, every post grounded in real data, shipped through H2 in five two-week sprints.

---

## 1. Architecture: One Orchestrator, Five Personas, Five Channels

### Orchestration Layer (ZOE)

ZOE remains the single decision hub. Today she runs:

- **Scheduler** (`bot/src/zoe/scheduler.ts`): daily schedule roll, 7 pings/day, 5am-10pm ET window, 20-min gaps
- **Post slate drafters** (`bot/src/zoe/posts/drafters.ts`): 4 sources (build, ecosystem, event, personal) per Haiku model
- **Approval flow** (`bot/src/zoe/posts/buttons.ts`): Telegram POST/REGEN/SKIP keyboard, per draft
- **Memory blocks** (`bot/src/zoe/memory.ts`): persona, human, working_memory, tasks
- **Dispatch + workers** (`bot/src/zoe/dispatch.ts`, `workers.ts`): task decompose, parallel work, reflexion loop

The orchestrator does NOT change. It stays the hub.

### Per-Brand Persona Layer

Generalize the ZOL pattern. Each brand gets a folder + persona file:

```
bot/src/zoe/brands/
  zao/
    persona.md           source of truth (The ZAO voice + brand facts)
    data-sources.ts      APIs to fetch (nexus links, Farcaster /thezao channel, member roster)
    channels.ts          where to post (Farcaster cast, X post, Paragraph, Telegram)
  wavewarz/
    persona.md
    data-sources.ts      (WaveWarZ intelligence API, battle logs, artist stats)
    channels.ts          (Farcaster, X, Discord gaming channel)
  coc-concertz/
    persona.md
    data-sources.ts      (Vercel deploy + attendee roster)
    channels.ts          (Farcaster, Paragraph newsletter)
  zabal-games/
    persona.md
    data-sources.ts      (GitHub workshop PRs, Bonfire episode pool, Magnetiq attendees)
    channels.ts          (Farcaster, X, Lu.ma, Telegram ZABAL)
  bettercallzaal/
    persona.md
    data-sources.ts      (ZAOstock milestone calendar, sponsor pipeline)
    channels.ts          (Farcaster, X, Telegram Zaal DM for seasonal work)
```

Each persona inherits ZOE's voice rules (no emojis, no em dashes, 1-3 lines, 280 chars max, year-of-the-ZABAL tone). Override domain (what the agent does) and channels (where it posts).

### Posting Surface Coordination

Today, ZOE posts to Telegram only (Zaal copy-pastes to Firefly manually). Generalize to per-brand surfaces:

| Brand | Telegram | Farcaster | X | Paragraph | Discord |
|-------|----------|-----------|---|-----------|---------|
| The ZAO | DM Zaal (draft) | self-signed (@zaoclaw_bot, FID 19640) | NO | NO | NO |
| WaveWarZ | #wavewarz approval | (@wavewarz_bot, FID TBD) | YES | NO | #gaming channel |
| COC Concertz | @ZAOstockTeamBot | (@coc_concertz_bot, FID TBD) | YES | YES (newsletter) | NO |
| ZABAL Games | @zabal_games_bot | (@zabal_games_bot, FID TBD) | YES | NO | @zabal_games_bot |
| BetterCallZaal | DM Zaal (seasonal) | (@bettercallzaal_bot, FID TBD) | YES | NO | NO |

Telegram remains approval gate. Public posts (Farcaster, X, Paragraph, Discord) are human-gated: draft in Telegram, human copy/approves/posts, or human clicks [PUBLISH] button in approval flow (Phase 2).

---

## 2. Verified Data Grounding (The #1 Fix)

### The ZOL Hallucination Bug

ZOL drafted: "WaveWarZ artist LUI hit 29.59 SOL volume this month."  
Reality: ~0.05-0.1 SOL/battle for that artist.  
Root cause: ZOL grounds on Bonfire PROSE (Carlos synthesizing Bonfire episodes), which invents specifics.

**Fix:** Query live APIs, not synthesis. Every brand-specific post must cite a real data source.

### Verified Data Sources Per Brand

| Brand | Source | Endpoint | Freshness | Responsibility |
|-------|--------|----------|-----------|-----------------|
| The ZAO | Nexus links + member roster | thezao.com/nexus.json + Supabase | daily | Zaal curates |
| WaveWarZ | Battle intelligence API | wavewarz-intelligence.vercel.app/battles, /artists | real-time | Brando/WW lead maintains |
| COC Concertz | GitHub deploy logs + attendee roster | GitHub API `#coc-concertz` repo releases + Supabase | per-deploy | COC Concertz team |
| ZABAL Games | Workshop GitHub + Bonfire episodes | GitHub PRs in `ZABAL Games` org + Bonfire read (episode titles only, no synthesis) | per-merge | Workshop maintainer |
| BetterCallZaal | ZAOstock calendar + sponsor stage | Cal.com API for event slots + CRM database | per-update | Zaal/failoften |

### Implementation Pattern

Each brand's `data-sources.ts` exports an async function:

```typescript
export async function gatherWaveWarzSignals(): Promise<VerifiedSignal[]> {
  const intelligence = await fetch('https://wavewarz-intelligence.vercel.app/artists')
    .then(r => r.json())
  
  return [
    {
      type: 'artist-milestone',
      artist: intelligence.hottest[0].name,
      metric: `${intelligence.hottest[0].battles} battles`,
      url: intelligence.hottest[0].profileUrl,
      source: 'wavewarz-intelligence-api',
      fetchedAt: new Date().toISOString(),
    }
  ]
}
```

The drafter receives these signals and MUST cite the source. No speculation.

### Bonfire Role (Read-Only)

Bonfire is still valuable: qualitative context + episodic memory. But the orchestrator uses it for background only:

- ✓ Read Bonfire episode titles to identify themes
- ✓ Recall past initiatives (did we post about COC Concertz V3 beta last month?)
- ✗ Do NOT synthesize stats from episode bodies
- ✗ Do NOT invent numbers or percentages from prose

---

## 3. Approval + Safety: Human-Gated Public Posts

### Telegram Approval Flow (Existing)

Drafts land in Telegram as a message block. Zaal (or per-brand manager) reviews. Current buttons:

```
POST     REGEN    SKIP     EDIT
```

Press POST for publish (once gated per Phase 2). This stays as-is.

### Publish Gate (Phase 2)

Outbound posts (Farcaster, X, Paragraph, Discord) are published via a Telegram approval channel:

```
[PUBLISH] — confirm and post to @wavewarz_bot on Farcaster + X
[RESCHEDULE] — hold draft, fire tomorrow
[ARCHIVE] — keep but don't post
[EDIT] — show text editor
```

Same pattern as current ZOE posts, scaled to 5 brands.

### Rate Limits (Safety)

Per brand per day:

| Brand | Daily Posts | Cooldown |
|-------|-------------|----------|
| The ZAO | 3-5 | 1 hour |
| WaveWarZ | 2-4 | 2 hours |
| COC Concertz | 1-2 | 4 hours |
| ZABAL Games | 2-3 | 1.5 hours |
| BetterCallZaal | 1-2 (seasonal) | 6 hours |

Enforced in `bot/src/zoe/posts/rate-limit.ts`.

### Cross-Platform Consistency

If a post goes to both Farcaster and X, it's the same text (verified signal cite). No platform-specific threading or rephrasing yet. Platform-specific variants are Phase 3.

---

## 4. Sharing & Build-in-Public: The Fleet as Proof

The H2 media-orchestrator rollout itself is a build-in-public artifact. As ZOE's agent fleet works, we document it:

### Weekly Recap (Bonfire Episode)

Every Sunday, ZOE writes a Bonfire episode:

```
# Week of Jun 30 - Jul 6

Posts published: 23 across 5 brands
Top performer: COC Concertz (2.1k impressions on "V3 beta live")
Data sources queried: 47 (WaveWarZ API 18, GitHub 15, Bonfire 8, nexus 6)
Zero hallucinations (all posts verified before publish)
Approval flow: 23 reviewed, 2 rescheduled, 1 archived

Next week: Scale WaveWarZ to 3-5 daily posts, wire COC sponsorship stage.
```

This becomes social proof: "Look, one agent, five brands, real data, zero hallucinations."

### GitHub Metrics Dashboard

Commit to research/ a weekly metrics snapshot:

```json
{
  "week": "2026-07-06",
  "brands": {
    "zao": { "posts": 4, "impressions": 1240, "sources": 8 },
    "wavewarz": { "posts": 5, "impressions": 2890, "sources": 18 },
    "coc": { "posts": 2, "impressions": 890, "sources": 4 },
    "zabal": { "posts": 3, "impressions": 1120, "sources": 12 },
    "bcz": { "posts": 1, "impressions": 340, "sources": 2 }
  },
  "hallucinations": 0,
  "approval_cycle_min": 2,
  "approval_cycle_max": 15
}
```

Stored at `research/agents/950-h2-metrics/metrics.jsonl`.

---

## 5. Phased H2-2026 Roadmap

Each phase is 2 weeks. Dependency: Phase N ships working before Phase N+1 starts.

### Phase 1: ZOL Verified Data Fix (Jun 30 - Jul 13)

Objective: ZOL posts grounded in live WaveWarZ intelligence, zero fabricated stats.

Tasks:
- [ ] Wire wavewarz-intelligence.vercel.app API into ZOL's `data-sources.ts`
- [ ] Refactor `bot/src/zol/caster-template.ts` to cite source on every post
- [ ] Add test: draft WaveWarZ post, verify "Source: wavewarz-intelligence-api" appears
- [ ] Run ZOL daily cron for 5 days, spot-check 10 posts for accuracy
- [ ] Write Phase 1 recap doc (sources, accuracy findings, lessons)

Approval: Zaal spot-checks daily posts. If hallucinations found, rollback.

### Phase 2: The ZAO + CronPost Integration (Jul 14 - Jul 27)

Objective: The ZAO brand voice posts 3-5 times daily, via Farcaster/X/Telegram approval flow.

Tasks:
- [ ] Create `bot/src/zoe/brands/zao/` folder, persona.md, data-sources.ts
- [ ] Wire The ZAO nexus.json + Farcaster /thezao channel activity as signals
- [ ] Add ZAO drafter to posts scheduler (1/7 of daily pings = 1 per day)
- [ ] Wire @zaoclaw_bot for The ZAO posts (use existing Farcaster signer)
- [ ] Test: post 5 ZAO drafts, verify they cite sources, appear on Farcaster
- [ ] Add approval buttons for public posts (not just Telegram preview)

Approval: Zaal approves daily ZAO post before it hits Farcaster. Same Telegram flow as current drafts.

### Phase 3: WaveWarZ + X Integration (Jul 28 - Aug 10)

Objective: WaveWarZ posts 2-4 times daily, cross-platform (Farcaster + X).

Tasks:
- [ ] Register WaveWarZ Farcaster bot (@wavewarz_bot or similar), get FID
- [ ] Create `bot/src/zoe/brands/wavewarz/` folder, persona, data-sources
- [ ] Wire X API (via Hermes pattern) for cross-post
- [ ] Add rate limit: 4 posts/day, 2-hour cooldown
- [ ] Test: post 10 WaveWarZ posts over 3 days, verify Farcaster + X delivery
- [ ] Spot-check stats accuracy (vs wavewarz-intelligence.vercel.app)

Approval: WaveWarZ lead (@brando or assigned) approves drafts in Telegram before publish.

### Phase 4: ZABAL Games + COC Concertz (Aug 11 - Aug 24)

Objective: ZABAL Games (2-3 posts/day) + COC Concertz (1-2 posts/day), Farcaster + Paragraph.

Tasks:
- [ ] Create `bot/src/zoe/brands/zabal-games/` and `coc-concertz/` folders
- [ ] Wire GitHub workshop repo activity + Bonfire episode titles as signals
- [ ] Register ZABAL Games Farcaster bot, get FID
- [ ] Wire Paragraph API for COC Concertz newsletter posts
- [ ] Test: 15 posts over 5 days across both brands
- [ ] Verify approval flow splits per brand (ZABAL team + COC team)

Approval: ZABAL Games lead + COC Concertz lead each approve their drafts.

### Phase 5: BetterCallZaal Seasonal + Optimization (Aug 25 - Sep 7)

Objective: ZAOstock seasonal posts (1-2/day during ZAOstock sprint), final optimizations.

Tasks:
- [ ] Create `bot/src/zoe/brands/bettercallzaal/` folder
- [ ] Wire ZAOstock calendar + sponsor pipeline as signals
- [ ] Add seasonal gate: only post during ZAOstock weeks (e.g., sprint 2026-08-25 to 2026-09-07)
- [ ] Add skip-rate learning: if skip% > 60% for a brand, lower its category weight in scheduler
- [ ] Add Bonfire weekly recap automation
- [ ] Add metrics dashboard (research/agents/950-h2-metrics/metrics.jsonl)
- [ ] Test: full 5-brand orchestration for 1 week
- [ ] Write final H2 retrospective doc

Approval: Zaal + Iman review combined weekly metrics. If hallucination rate climbs, pause Phase X.

---

## Next Actions (H2 Sprint Table)

| Phase | Dates | Owner | Blocker | Success Criteria |
|-------|-------|-------|---------|------------------|
| Phase 1: ZOL Fix | Jun 30 - Jul 13 | Brando/WaveWarZ | WaveWarZ intelligence API stability | 10 posts, zero fabricated stats verified |
| Phase 2: ZAO | Jul 14 - Jul 27 | Zaal/Claude | @zaoclaw_bot Farcaster signer live | 5 posts/week, all cite sources |
| Phase 3: WaveWarZ | Jul 28 - Aug 10 | Brando/WaveWarZ | @wavewarz_bot FID + X API ready | 20 posts/week, 99% accuracy vs intelligence API |
| Phase 4: ZABAL + COC | Aug 11 - Aug 24 | Iman/Thy Rev | GitHub workshop repo + Paragraph API | 25 posts/week combined |
| Phase 5: BCZ + Optimize | Aug 25 - Sep 7 | Zaal/failoften | ZAOstock calendar frozen | 30 posts/week, metrics dashboard live |

---

## Source Files & Implementation References

### Core Architecture (Already Built)

| File | Purpose | Status |
|------|---------|--------|
| `bot/src/zoe/scheduler.ts` | Daily schedule roll, 7 pings/day | LIVE |
| `bot/src/zoe/posts/scheduler.ts` | Post slate generation, category weights | LIVE |
| `bot/src/zoe/posts/drafters.ts` | 4-drafter system (build, ecosystem, event, personal) | LIVE |
| `bot/src/zoe/posts/buttons.ts` | Telegram POST/REGEN/SKIP keyboard | LIVE |
| `bot/src/zoe/posts/sources.ts` | Signal gathering (git, Bonfire, manual events) | LIVE |
| `bot/src/zoe/memory.ts` | 4-block persona/human/working_memory/tasks | LIVE |
| `bot/src/zoe/dispatch.ts` | Task decomposition + worker dispatch | LIVE |
| `bot/src/zoe/README.md` | ZOE architecture + file map | LIVE |

### Per-Brand Pattern (ZOL Prototype)

| File | Purpose | Status |
|------|---------|--------|
| `bot/src/zol/caster-template.ts` | ZOL Farcaster posting via Ed25519 signer | LIVE (needs data grounding) |
| `research/agents/zol-free-cast-posting-guide.md` | Signer setup + integration | VERIFIED |
| `research/agents/zol-ed25519-signer-setup.md` | Keypair generation checklist | VERIFIED |

### Phase 1 New Files (ZOL Fix)

| File | Purpose |
|------|---------|
| `bot/src/zol/data-sources.ts` | WaveWarZ intelligence API fetcher + verify stats |
| `research/agents/950-phase-1-zol-fix-report.md` | Recap: hallucination audit, accuracy findings |

### Phase 2+ New Files (Per-Brand Coordination)

| File | Purpose |
|------|---------|
| `bot/src/zoe/brands/zao/persona.md` | The ZAO voice source of truth |
| `bot/src/zoe/brands/zao/data-sources.ts` | Nexus + /thezao channel signals |
| `bot/src/zoe/brands/wavewarz/persona.md` | WaveWarZ voice |
| `bot/src/zoe/brands/wavewarz/data-sources.ts` | WaveWarZ intelligence API |
| ... (repeat for COC, ZABAL, BCZ) | |
| `bot/src/zoe/posts/rate-limit.ts` | Per-brand daily post caps |
| `research/agents/950-h2-metrics/metrics.jsonl` | Weekly metrics snapshots |

### Reference Documentation

- `CLAUDE.md` "Primary Surfaces" section: ZOE as single orchestrator rule
- `bot/src/zoe/posts/README.md` v4 spec: one best draft per day (not 30)
- `memory.md` "project_zol_farcaster_agent.md": ZOL live status
- `feedback_validate_bot_changes_with_boot.md`: ZOE/bot changes must pass esbuild (not just tsc)

---

## Risks & Mitigations

| Risk | Likelihood | Mitigation |
|------|------------|-----------|
| WaveWarZ intelligence API goes down | Medium | Add fallback to Bonfire PROSE + manual signal for 24h, auto-alert |
| Brand leads miss approval window (timezone) | Medium | Add Telegram reminder at 9am ET for each brand's lead |
| Hallucination creeps back in (new brands) | High | Enforce automated source citation in drafter prompt; fail drafts without `source:` field |
| Rate limits trigger from 5 bots posting | Low | Stagger posts, start with Phase 1 only, monitor Farcaster/X API quotas |
| Persona conflicts between brands | Low | Use inheritance: all inherit ZOE's voice rules, override domain only |

---

## Success Metrics (H2 End Goals)

1. **Accuracy:** 99%+ of posted stats verified against live APIs, zero hallucinations in 100 spot-checks
2. **Scale:** 30 posts/week across 5 brands (6/day average)
3. **Approval latency:** median 5 min from draft to published
4. **Build-in-public:** weekly Bonfire recap + GitHub metrics, proof artifact for ZABAL Games case studies
5. **Autonomy:** 80%+ of posts require zero human edits (copy-paste ready)

---

## Document Status

- Status: Architecture complete, ready for Phase 1 start
- Next review: Jul 1 EOD (Zaal grill on WaveWarZ intelligence API stability)
- Phase 1 kickoff: Jul 2, 2 weeks to ship
