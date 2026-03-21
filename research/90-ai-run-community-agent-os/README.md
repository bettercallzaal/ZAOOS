# 90 — AI-Run Community: Self-Improving Agent OS for ZAO

> **Status:** Design complete (not yet implemented)
> **Date:** March 20, 2026
> **Goal:** Design a self-improving AI agent system that runs the ZAO community autonomously — daily digests, auto-onboarding, governance autopilot — using Paperclip + ElizaOS + autoresearch
> **Source:** Generated via gstack `/office-hours` skill (2 rounds adversarial review, 30 issues caught, 28 fixed, quality 8/10)

---

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **Architecture** | Paperclip (coordination) → ElizaOS on Railway (always-on runtime) → Farcaster /zao channel (output). Three layers, each independent |
| **Agent count** | 3 active agents initially: CEO, Community Manager, Dev Agent. Music Curator embedded in CM prompts. Content Publisher deferred |
| **Three core features** | Daily digest (8am ET), auto-onboarding (every 15min), governance autopilot (every 6h) — all handled by one Community Manager agent |
| **Self-improvement** | Autoresearch runs 3 parallel experiments/day on independent variables (digest format, welcome tone, proposal style). Optimized for directional learning, not statistical significance |
| **Budget** | $30/month estimated ($23 API + $7 Railway). Fits $50 cap with $20 headroom |
| **Approach chosen** | Approach A (Full Stack Agent OS) over B (API-only, 6/10 completeness) and C (+ taste graph, ocean territory) |
| **Implementation order** | Phase 0 (schema) → Phase 1 (personas) → Phase 2 (API routes) → Phase 3 (ElizaOS deploy) → Phase 4 (Paperclip wiring) → Phase 5 (autoresearch) |
| **Current status** | Design doc approved but deferred — too much to add in one sprint. Phases can be tackled independently |

---

## The Vision: AI as a Community Member

The "whoa" moment: ZAO members open the app and discover that while they slept, the AI posted a personalized daily digest in /zao, welcomed a new member with music recommendations, drafted a governance proposal based on yesterday's discussions, and — crucially — the AI got measurably *better* at all of this overnight. Not a demo. A real community where the AI is a productive member.

**What makes this different from existing Farcaster agents:** Standalone bots (Aethernet, Clanker, Larry) are single-purpose and float in the protocol. ZAO's agent is *integrated into the community OS* — it has access to the member list, music library, governance system, Respect scores, and full conversation history. Context is the differentiator.

---

## Architecture

```
┌─────────────────────────────────────────────────┐
│                 YOU (Board of Directors)         │
│    Review Paperclip dashboard from phone         │
│    Approve hires, budgets, strategy changes      │
└───────────────────┬─────────────────────────────┘
                    │
┌───────────────────▼─────────────────────────────┐
│            PAPERCLIP (Coordination Layer)        │
│  CEO Agent — assigns daily tasks to all agents   │
│  Budget: $50/month total                         │
│  Heartbeat: CEO 15min, others 60min              │
└───────────────────┬─────────────────────────────┘
                    │ assigns tasks
        ┌───────────┼────────────┐
        │           │            │
┌───────▼───┐ ┌─────▼─────┐ ┌───▼──────────────┐ ┌──────────────┐
│ Community │ │   Dev     │ │   Autoresearch   │ │ Music Curator│
│ Manager   │ │  Agent    │ │   Agent          │ │ (embedded in │
│           │ │           │ │                  │ │ CM prompts   │
│ ElizaOS   │ │ gstack    │ │ /autoresearch    │ │ initially)   │
│ on Railway│ │ /review   │ │ :fix :debug      │ └──────────────┘
│           │ │ /qa /ship │ │ :security        │
└─────┬─────┘ └───────────┘ └──────────────────┘
      │
      │ posts via Neynar SDK
      ▼
┌─────────────────────────────────────────────────┐
│              FARCASTER /zao CHANNEL              │
│  Daily digest · Welcome messages · Proposals     │
└─────────────────────────────────────────────────┘
      │ data flows back
      ▼
┌─────────────────────────────────────────────────┐
│            SUPABASE (State Layer)                │
│  agent_logs · member_onboarding ·                │
│  ai_governance_proposals                         │
└─────────────────────────────────────────────────┘
```

---

## Three Approaches Compared

| Aspect | A: Full Stack Agent OS | B: API-First (No ElizaOS) | C: Full Stack + Taste Graph |
|--------|----------------------|--------------------------|---------------------------|
| **Effort** | human ~3 weeks / CC ~6.5h | human ~1 week / CC ~4h | human ~1 month / CC ~4 days |
| **Runtime** | ElizaOS (always-on) + Paperclip (heartbeat) | Paperclip only (heartbeat) | ElizaOS + Paperclip + pgvector |
| **Real-time** | Yes — responds to @ mentions | No — heartbeat only | Yes |
| **Self-improving** | Yes — autoresearch on prompts | Possible but limited | Yes — autoresearch on prompts + taste model |
| **Risk** | Medium (ElizaOS stability) | Low | High (scope creep) |
| **Completeness** | 9/10 | 6/10 | 10/10 (ocean territory) |
| **Chosen?** | **YES** | No | Deferred as follow-on |

---

## Implementation Phases

### Phase 0: Supabase Schema (~15 min CC)

Three new tables with full RLS (must run first — API routes depend on these):

- **`agent_logs`** — tracks every agent action (digest, onboard, governance, error). Admin-read only. Service-role insert only.
- **`member_onboarding`** — tracks welcome status, first cast, recommended members/music. Member can read own record.
- **`ai_governance_proposals`** — AI-drafted proposals with source cast hashes, vote counts, Respect-weighted scores. Readable by all authenticated members.

All tables use `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` with policies scoped to `service_role` for inserts/updates. Full SQL in the design doc at `~/.gstack/projects/bettercallzaal-ZAOOS/zaalpanthaki-main-design-20260320-office-hours.md`.

### Phase 1: Agent Personas (~30 min CC)

Create `agents/community-manager/` with SOUL.md, HEARTBEAT.md, TOOLS.md, AGENTS.md. Music curation embedded in CM prompts initially (not a separate agent). Content Publisher deferred to future work.

### Phase 2: API Routes (~1 hour CC)

Four new routes under `src/app/api/agent/`:

| Route | Purpose | Schedule |
|-------|---------|----------|
| `/api/agent/digest` | Compose + post daily digest cast | Every 24h at 8am ET |
| `/api/agent/onboard` | Detect + welcome new members | Every 15 min |
| `/api/agent/governance` | Analyze discussions + draft proposals | Every 6h |
| `/api/agent/metrics` | Return engagement metrics for autoresearch | On demand |

**Agent auth:** `Authorization: Bearer ${AGENT_SERVICE_KEY}` header. Single shared secret for all agent infrastructure. Generate with `openssl rand -hex 32`. Add to `.env.example`.

**ElizaOS boundary:** ElizaOS posts directly via its Farcaster plugin (always-on). These API routes exist for: (a) Paperclip heartbeat actions, (b) fallback when ElizaOS is down, (c) metrics collection.

**Failure handling:** Exponential backoff (3 retries), error logging to `agent_logs`, CEO agent monitors for anomalies.

### Phase 3: ElizaOS Deployment (~2 hours CC + debugging buffer)

- Character file at `agents/community-manager/character.json`
- Railway Dockerfile based on ElizaOS v1.7.2 (doc 83)
- Neynar webhook for @ mention responses
- Health check endpoint for monitoring
- **Budget 2-4 extra hours** for ElizaOS plugin debugging

### Phase 4: Paperclip Wiring (~1 hour CC)

Update `promptTemplate` for CEO and Community Manager agents. Wire heartbeat schedules. Music curation uses existing `songs` table + `community.config.ts` radio playlists.

### Phase 5: Autoresearch Loop (~2 hours CC)

**Metric:** `engagement_score = (reply_rate × 0.4) + (reaction_rate × 0.3) + (vote_rate × 0.3)`

**Binary assertions:**
1. Daily digest gets ≥1 reply?
2. Daily digest gets ≥3 reactions?
3. New member first-casts within 24h?
4. Governance proposal gets ≥5 votes?
5. Agent cost under $2/run?

**Targets:** SOUL.md (tone), HEARTBEAT.md (timing), prompt templates (composition).

**Cadence:** 3 parallel experiments/day on independent variables. ~21 data points in week one. Compare weekday-to-weekday only. After 30+ experiments (~2 weeks), trends emerge.

---

## Cost Model

| Agent | Heartbeat | Cycles/month | Cost/month |
|-------|-----------|-------------|------------|
| CEO | 15 min | 2,880 | ~$12 |
| Community Manager (digest) | 24h | 30 | ~$0.50 |
| Community Manager (onboard) | 15 min | 2,880 | ~$5 |
| Community Manager (governance) | 6h | 120 | ~$1 |
| Dev Agent | 60 min | 720 | ~$4 |
| Autoresearch | 24h | 30 | ~$0.50 |
| **API subtotal** | | | **~$23** |
| Railway hosting | | | **~$7** |
| **Grand total** | | | **~$30/month** |

Fits $50 budget cap with $20 headroom. Reduce CEO to 30-min heartbeat if needed (halves to ~$6).

---

## Respect Score Integration

1. **Read:** Viem multicall → OG contract (`0x34cE...`) + ZOR contract (`0x9885...`) on Optimism
2. **Cache:** Store in Supabase `profiles` table. Refresh every 6h (aligned with governance heartbeat)
3. **Weight:** `weighted_vote = vote × (respect_balance / total_respect)`

---

## Failure Modes & Recovery

| Failure | Recovery |
|---------|----------|
| Neynar API down | Retry 3x exponential backoff → log error → skip cycle |
| ElizaOS crash | Railway auto-restart → if 3+ in 1hr, fall back to API routes |
| Supabase unreachable | Retry 2x → CEO flags in Paperclip → pause heartbeat |
| Budget exceeded | Auto-pause at 100% (Paperclip hard ceiling) |
| Inappropriate content | Human approval queue for first 2 weeks, then full autonomy |
| Railway env compromise | Rotate all keys immediately; RLS limits blast radius |

---

## Success Criteria

- [ ] Daily digest in /zao at 8am ET for 7 consecutive days
- [ ] 3+ new members auto-onboarded without human intervention
- [ ] 1+ governance proposal drafted from community discussion
- [ ] Reply rate on AI casts > 10% (vs ~5% baseline)
- [ ] Onboarding completion (first cast within 24h) > 50%
- [ ] Total cost under $50/month
- [ ] 7+ autoresearch experiments in first week
- [ ] ≥1 measurable improvement from autoresearch

---

## Open Questions

1. **Agent FID:** Use existing app FID (19640) or register a dedicated agent FID? Dedicated separates human vs AI casts.
2. **Content moderation:** Human approval queue initially vs. full autonomy from day one?
3. **Autoresearch cadence:** 1 experiment/day (community-facing) vs. faster on non-public metrics?
4. **Onboarding trigger:** Polling (15-min heartbeat) vs. event-driven (Neynar webhook for channel joins)?

---

## Future Work (Deferred)

| Feature | Why Deferred | When to Revisit |
|---------|-------------|-----------------|
| Content Publisher (Bluesky cross-posting) | Doesn't contribute to self-improving loop | After core agent loop is proven |
| Music Curator as separate agent | Embedded in CM works for now | When curation complexity warrants own budget |
| AI Taste Graph (pgvector) | Ocean territory — research project in itself | After 30 days of successful agent operation |
| Autonomous treasury management | Requires more governance maturity | After governance autopilot has 3+ months of data |

---

## Cross-Reference with Existing Research

| Doc | Relationship |
|-----|-------------|
| **67** — Paperclip AI Agent Company | Foundation — 5 agent roles, budgets, heartbeats. This doc wires them to ElizaOS |
| **72** — Paperclip Functionality Deep Dive | Heartbeat mechanics, "Standing By" fix. CM agent avoids this by always having tasks |
| **83** — ElizaOS 2026 Update | Runtime selection — v1.7.2 stable, Farcaster plugin confirmed, Supabase adapter |
| **63** — Autoresearch Deep Dive | Binary assertions pattern, eval loop mechanics. Applied here to community metrics |
| **89** — Paperclip + gstack + autoresearch Stack | The infrastructure this design runs on. gstack for dev agent, Paperclip for coordination |
| **71** — Paperclip Rate Limits | Neynar API credit budget. Current plan covers 3-5 daily casts |
| **24** — ZAO AI Agent Plan | Original ElizaOS + Claude + Hindsight agent plan. This doc is the concrete implementation |
| **56** — ORDAO Respect System | Respect1155 scoring used for governance vote weighting |
| **85** — Farcaster Agent Technical Setup | Neynar agent FID registration, managed signers — needed for Phase 3 |

---

## gstack `/office-hours` Process Notes

This design was generated using gstack's `/office-hours` skill — the first time it was used on ZAO OS. Key observations:

**What worked well:**
- Builder mode (vs. Startup mode) was the right fit — exploratory, enthusiastic, no business validation pressure
- The 5-question brainstorming flow (coolest version → audience → fastest "whoa" → differentiator → 10x vision) efficiently narrowed from "everything" to a focused design
- 3 implementation approaches with effort estimates on both human and CC+gstack scales
- Adversarial spec review caught 30 real issues (missing RLS enablement, auth mechanism gaps, phase ordering, scope creep)

**What to do differently next time:**
- Start with a narrower scope — "all 3 features" was ambitious. Could have started with just daily digest
- The spec review loop was valuable but added ~15 min. Worth it for foundational architecture, skip for smaller features

**Effort compression observed:**
- Design doc that would take a human team 2-3 days of meetings + 1 day of writing → completed in ~30 min with /office-hours
- Adversarial review that would require 2-3 senior engineers → completed in ~5 min with subagent

---

## Sources

- [gstack `/office-hours` skill](https://github.com/garrytan/gstack/tree/main/office-hours) — YC Office Hours design partner
- [Design doc](~/.gstack/projects/bettercallzaal-ZAOOS/zaalpanthaki-main-design-20260320-office-hours.md) — full design with SQL schemas
- [Doc 67 — Paperclip AI Agent Company](../67-paperclip-ai-agent-company/)
- [Doc 83 — ElizaOS 2026 Update](../83-elizaos-2026-update/)
- [Doc 63 — Autoresearch Deep Dive](../63-autoresearch-deep-dive-zao-applications/)
- [Doc 89 — Paperclip + gstack + autoresearch Stack](../89-paperclip-gstack-autoresearch-stack/)
- [Doc 85 — Farcaster Agent Technical Setup](../85-farcaster-agent-technical-setup/)
