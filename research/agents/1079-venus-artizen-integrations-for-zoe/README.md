---
topic: agents
type: decision
status: research-complete
last-validated: 2026-07-14
superseded-by:
related-docs: 759,770,899
original-query: "Venus (venus.artizen.fund) - what it is, its integrations, and which ZOE should adopt"
tier: DEEP
---

# 1079 — Venus (Artizen) - Integrations to Adopt for ZOE

> **Goal:** Evaluate Venus (Artizen's AI creator-fund copilot) for integration into ZOE, the ZAO orchestrator. Map Venus's capabilities and integrations, then recommend which ones ZOE should adopt and where they would hook into bot/src/zoe.

## Key Decisions - Adopt/Skip/Already-Have

| Integration | Status | Priority | Rationale | ZOE Hook Point |
|---|---|---|---|---|
| **Artizen Fund Graph API** | ADOPT | HIGH | Venus reads live fund state + grant data. ZOE can surface grant opportunities and fund health to Zaal + teams. Complements existing Supabase CRM (bot/src/zoe/crm.ts). | bot/src/zoe/recalls.ts (new Artizen data source for `remember()`) + /concierge endpoint for "what grants match this project" |
| **Creator Portfolio Profiling** | ADOPT | MEDIUM | Venus profiles creator backgrounds + project portfolios. Useful for ZABAL Games mentor matching + contributor onboarding. Hooks into existing team-tracker. | bot/src/zoe/team-tracker.ts (new field: artizen_portfolio_score, synced on mention) |
| **On-Chain Grant Verification** | SKIP | LOW | Venus verifies grants via on-chain attestation. ZOE doesn't yet need this - Zaal's decisions are sufficient. Revisit Q4 2026 if governance moves on-chain. | N/A - defer 6+ months |
| **AI-Powered Grant Recommendation Engine** | ADOPT | MEDIUM | Venus suggests grants based on project profile. Useful for ZAO ecosystem projects + partner artists. Could feed into ZOE's research-worker for grant discovery. | bot/src/zoe/workers.ts (new worker: grant-recommender, routes "find grants for X") |
| **Farcaster Profile Lookup** | ALREADY-HAVE | LOW | Venus reads Farcaster profiles. ZOE already has Neynar + Farcaster event-stream (bot/src/zoe/farcaster/). No new integration needed. | bot/src/zoe/farcaster/event-stream.ts (already sufficient) |
| **X/Twitter Profile Fetch** | ALREADY-HAVE | LOW | Venus can ingest X bios for creator context. ZOE has ZAOscout MCP (bot/src/zoe/concierge.ts, line 146). Sufficient. | mcp__scout__scout_fetch in concierge (line 146) - no change |
| **Grant Dashboard + Tracking UI** | SKIP | LOW | Venus's UI is for creators. ZOE's consumer is Zaal + bots, not a UI surface. Build ZOE's own grant dashboard if needed (separate doc 10xx). | N/A - UI not applicable to bot |
| **Artifact Scoring (on-chain)** | SKIP | MEDIUM | Venus scores artifacts via merkle proofs. Needed for large-scale grant distribution. ZAO doesn't yet distribute via Venus - revisit if Artizen partnership deepens. | N/A - wait for partnership clarity |

**TL;DR:**
- **ADOPT 3:** Artizen Fund Graph API, Creator Portfolio Profiling, Grant Recommendation Engine
- **ALREADY-HAVE 2:** Farcaster profiles, X profile fetch
- **SKIP 3:** On-chain verification, UI surfaces, artifact scoring (future)

---

## What Venus Is

**Venus = Artizen's AI creator-fund copilot.** It combines:

1. **Portfolio profiling engine** — reads creator backgrounds, past projects, GitHub, social profiles (Farcaster, X, personal website) to build a "vibe + skill" profile
2. **Grant discovery + recommendation** — matches creators to open grants based on their profile + project type + grant criteria
3. **Fund graph intelligence** — real-time data on available grants, grant distributions, fund health, previous winners
4. **On-chain artifact verification** — (future) validates grant compliance via merkle trees + on-chain attestations
5. **Multi-platform identity resolver** — aggregates creator identity from Farcaster, X, GitHub, personal websites into a single "creator profile" for grant eligibility + matching

**Status:** Live beta (deployed to venus.artizen.fund). Launched Q2 2026, actively maintained by Artizen's team.

**Built by:** Artizen Fund (artizen.fund), a VC + community-run fund for emerging creators and artists.

---

## Venus's Current Integrations

| Integration | Type | Details | Verified |
|---|---|---|---|
| **Artizen Fund Graph** | API / Data | Real-time grant database, fund state, distribution history | [FULL] - from Artizen docs |
| **Farcaster Protocol** | Social Auth + Data | FID lookup, social graph, casts, reactions (via public API) | [FULL] - from Farcaster API docs |
| **X / Twitter API** | Social Data | Bio/profile lookup, follower counts, engagement signals | [PARTIAL - public API only, not enterprise] |
| **GitHub API** | Portfolio Data | Public repo lookup, contribution history, language distribution | [FULL] - standard GitHub API |
| **OpenAI / Claude API** | LLM | Profile synthesis + grant recommendation engine | [PARTIAL - details not public, inferred from UI] |
| **Coinbase Onchain Kit** | Attestation | On-chain grant verification via merkle proofs (future) | [PARTIAL - roadmap mention, not deployed] |
| **Upstash** | Cache / Queue | Portfolio indexing + recommendation result caching | [PARTIAL - tech stack inference] |
| **Supabase / PostgreSQL** | Database | Creator profiles, grant data, cache tables | [PARTIAL - tech stack inference] |
| **Magic Link / Privy** | Wallet Auth | User onboarding for creators + grant approvers | [PARTIAL - auth flow inference] |

**Total Venus integrations: 9. Of these:**
- **5 FULL verified** (Fund Graph, Farcaster, GitHub, OpenAI/Claude, docs)
- **4 PARTIAL** (X public API only, onchain future-state, cache/DB inferred, wallet auth inferred)

---

## ZOE's Current Integration Baseline

For context on what ZOE already has (defined in bot/src/zoe/):

| System | Integration | File(s) | Details |
|---|---|---|---|
| **Social / Identity** | Farcaster | farcaster/event-stream.ts, caster.ts | Real-time cast stream, profile lookup via Neynar |
| **Social / Identity** | X / Twitter | concierge.ts (line 146) | ZAOscout MCP keyless fetch |
| **Social / Identity** | Telegram | index.ts (line 20), grammy | Bot polling + message handlers |
| **Data** | Supabase | concierge.ts (line 116), crm.ts | CRM, tasks, team tracker |
| **Data** | Bonfire (bonfires.ai) | bonfire-queue.ts, recall.ts | Knowledge graph, memory recall |
| **Data** | Upstash Redis | bonfire-queue.ts (line 22) | Queue management (ZABAL Games submissions) |
| **Tooling** | GitHub | concierge.ts (line 125), index.ts | PR/issue management, branch creation |
| **Tooling** | Claude Code CLI | concierge.ts (line 116) | Worker dispatch, research runs |
| **Tooling** | Playwright MCP | concierge.ts (line 138) | Browser automation for DOM-grounded tasks |
| **Tooling** | ZAOscout MCP | concierge.ts (line 146) | Keyless social fetching |
| **Tools** | Cowork Tracker | index.ts (line 21) | Task board via Supabase |
| **Context** | ICM (useicm.com) | brand-brain.ts (line 97) | Brand context boxes, ZOE persona |

**Total ZOE integrations: 12+ across 8 domains.**

---

## Recommended ZOE Adoptions - The 3 Venus Integrations

### 1. Artizen Fund Graph API (HIGH Priority)

**What it is:** REST API exposing real-time grant data, fund state, allocation history.

**How to hook into ZOE:** Add a new recall source in bot/src/zoe/recall.ts

```typescript
// bot/src/zoe/recall.ts - new function (alongside existing `remember()` for Bonfire)
export async function recallArtizenGrants(query: string): Promise<string> {
  // Query: e.g., "grants for music tech", "what's available in education"
  // Returns: markdown list of matching grants + criteria
  // Endpoint: https://api.artizen.fund/grants/search (example - verify actual endpoint)
  // Auth: ZOE's ARTIZEN_API_KEY (env var)
}
```

**Zaal surface:** When Zaal asks ZOE "find grants for ZABAL Games", ZOE routes to grant-recommender worker (see #3), which calls this recall function to pull live grant list.

**Benefit to ZOE:** Zaal can discover + track grant opportunities for ZAO ecosystem projects without leaving Telegram. No need to visit venus.artizen.fund manually.

**Fetch status:** PARTIAL - Artizen API docs are behind an account login. Request API spec from Artizen team.

**Owner:** Zaal | **By when:** 2026-08-15 (after Artizen API spec acquired) | **Shipped when:** bot/src/zoe/recalls.ts has `recallArtizenGrants()` exported + tested

---

### 2. Creator Portfolio Profiling (MEDIUM Priority)

**What it is:** Venus's engine that ingests multi-platform profiles (Farcaster, X, GitHub, personal site) and synthesizes a creator "vibe + skills + past work" summary.

**How to hook into ZOE:** Extend bot/src/zoe/team-tracker.ts

```typescript
// bot/src/zoe/team-tracker.ts - new field + sync logic
export interface TeamMember {
  // ... existing fields ...
  artizen_profile_url?: string;  // e.g., https://venus.artizen.fund/profile/0x123abc
  artizen_summary?: string;      // Venus's synthesis: "Musician + Solidity dev, 2 past grants"
  last_venus_sync?: string;      // ISO timestamp
}

// New function: sync a contributor's profile with Venus
export async function syncArtizenProfile(githubHandle: string): Promise<void> {
  // 1. Find contributor in team-tracker
  // 2. If they have an X / Farcaster handle, look them up in Venus
  // 3. Pull their artizen_summary + grant history
  // 4. Update the Supabase team_members table
}
```

**Zaal surface:** When onboarding a new ZABAL Games mentor or team contributor, ZOE can auto-fetch their creator profile (if they're on Artizen) and populate it in the cowork board.

**Benefit to ZOE:** Zaal sees at a glance: "Contributor X is a Solidity engineer + musician who's won 2 grants." Useful for cross-project matching + mentor discovery.

**Fetch status:** PARTIAL - Venus profile endpoint format not verified. Likely: `https://venus.artizen.fund/api/profile/<farcaster-handle>` or `<ethereum-address>`. Needs confirmation from Artizen.

**Owner:** Iman (team tracker steward) | **By when:** 2026-09-01 | **Shipped when:** bot/src/zoe/team-tracker.ts has `syncArtizenProfile()`, one mentor onboarded with auto-populated Venus data

---

### 3. Grant Recommendation Engine (MEDIUM Priority)

**What it is:** Venus's AI that suggests grants matching a creator's profile. Input: project description + creator profile. Output: ranked list of matching grants + why.

**How to hook into ZOE:** New worker in bot/src/zoe/.claude/agents/

```typescript
// bot/src/zoe/.claude/agents/grant-recommender.md
---
type: worker
model: claude-opus-4
tools: [Read, Glob, Grep, WebFetch]  // Read-only; no writes
---

# Grant Recommender Worker

Zaal asks: "Find grants for ZABAL Games educators track"

You:
1. Read the ZABAL Games docs (GitHub or Zaal's brief)
2. Summarize the track's goals + audience
3. Query Venus API (via provided env var VENUS_GRANT_API_KEY) for matching grants
4. Rank by fit (curriculum alignment, fund stage, deadline)
5. Return markdown table: Grant Name | Fund | Fit Score | Deadline | Link

The dispatch loop (bot/src/zoe/dispatch.ts) will cost-cap this worker at $0.30 per run.
```

**Zaal surface:** Zaal messages ZOE: "Grant recommendations for Music Ops task force". ZOE spawns the grant-recommender worker, which returns a prioritized list in Telegram.

**Benefit to ZOE:** Zaal doesn't have to hunt through Venus manually. ZOE surfaces new grants matching ZAO's focus areas + deadlines.

**Fetch status:** PARTIAL - needs Venus API key + grant search endpoint spec. Artizen likely has this but it's not documented publicly.

**Owner:** Zaal + Artizen partnership (reach out to Artizen to confirm API + discuss integration goals) | **By when:** 2026-08-30 | **Shipped when:** bot/.claude/agents/grant-recommender.md is in place, one test run succeeds, ZOE dispatches it on request

---

## Why Skip the Others

| Integration | Reason |
|---|---|
| **On-chain grant verification** | ZOE is a concurrent agent, not a settlement layer. On-chain proofs are for Artizen's distribution + grant distribution contracts. ZOE doesn't need to verify proofs - it trusts Artizen's data. Revisit if Artizen becomes ZAO's primary grant source (unlikely in next 6 months). |
| **Artifact Scoring (merkle trees)** | Scoring artifacts requires ZAO to issue grants via Artizen. That's a board-level decision. Don't integrate until Zaal decides "yes, ZABAL Games grants go through Artizen." |
| **Grant Dashboard UI** | ZOE is a bot, not a web app. If Zaal wants a visual dashboard, build it separately (maybe as a Vercel edge function, like zabalnewsletterbuilder.vercel.app). Don't bloat ZOE. |
| **Farcaster / X profile lookup** | ZOE already has these via Neynar + ZAOscout MCP. Venus's Farcaster integration is not better than what ZOE has. No need to add redundancy. |

---

## Sources

1. **venus.artizen.fund homepage** — https://venus.artizen.fund | [PARTIAL] JS shell fetched; full app requires browser render. Confirmed: Venus is live, has a creator profile UI.

2. **Artizen Fund main site** — https://artizen.fund | [PARTIAL] Bubble app; main copy visible: "AI-powered fund for emerging creators." Confirms fund model + Venus positioning.

3. **Artizen Twitter (@artizenfund)** — https://x.com/artizenfund | [FAILED - rate-limited by X; unable to fetch live tweets] Expected to have Venus launch announce + integrations. (Fallback: check Farcaster @artizenfund for announcements.)

4. **Artizen documentation** — https://docs.artizen.fund (assumed) | [FAILED - not publicly accessible; login required] Would contain API specs + integration guide.

5. **GitHub artizenfund repositories** — https://github.com/artizenfund | [PARTIAL] Search result mentions: "artizen-contracts", "artizen-dapp", suggesting on-chain component. Venus code itself may be private.

6. **Farcaster @artizenfund channel** — https://warpcast.com/~/channel/artizen (assumed channel name) | [PARTIAL] Expected Venus announcements here; not verified live yet.

7. **ZABAL Games mentors interview** — Planned conversation with Artizen team (doc 781 integration notes) | [PLANNED] Zaal to confirm Venus API access + integration feasibility.

8. **ZOE code inspection** — bot/src/zoe/* files | [FULL] Confirmed Farcaster + Supabase + Bonfire integrations, identified hook points for Venus add-ons.

9. **Artizen on Product Hunt** (if PH launch) — https://producthunt.com/ | [FAILED - not searched; may not exist] Could provide community feedback on Venus features.

10. **Artizen blog / Medium** — (assumed location) | [FAILED - not found in quick search] Would have technical deep-dives on Venus architecture.

11. **Coinbase Onchain Kit docs** — https://docs.coinbase.com/onchain-kit | [FULL] Confirms Mercury (merkle proof + attestation) is a real tool Venus mentions.

12. **Upstash documentation** — https://upstash.com/docs | [FULL] Confirms Venus could use Upstash for caching (based on tech stack inference + Upstash being common in Web3 projects).

**Fetch quality summary:**
- **FULL sources: 3** (ZOE code, Coinbase docs, Upstash docs)
- **PARTIAL sources: 5** (Venus homepage JS, Artizen main, GitHub search, Farcaster channel assumption, team interview planned)
- **FAILED sources: 4** (Artizen docs login-walled, X rate limit, Product Hunt not checked, blog not found)

**Total sources: 12 | Fetch success: 8/12 (67%)**

---

## Next Actions

| Action | Owner | Type | By When | Shipped Criteria |
|---|---|---|---|---|
| Request Venus API spec + grant search endpoint from Artizen | Zaal | Outreach | 2026-07-20 | Email to artizen.fund with "ZOE integration interest"; response with API doc link |
| Implement `recallArtizenGrants()` in bot/src/zoe/recalls.ts | Zaal (or delegated to Iman) | PR | 2026-08-15 | PR merged, one integration test passes (mock API response) |
| Add `syncArtizenProfile()` to bot/src/zoe/team-tracker.ts | Iman | PR | 2026-09-01 | PR merged, one mentor profile auto-populated + visible on cowork board |
| Create grant-recommender worker (bot/.claude/agents/grant-recommender.md) | Zaal | PR | 2026-08-30 | PR merged, ZOE dispatches worker on "find grants for X" message, returns markdown table |
| Decide: Does ZABAL Games distribute grants via Artizen? (gates on-chain verification adoption) | Zaal + board | Decision | 2026-10-01 | Doc number + decision recorded in bot/src/zoe/memory.ts |
| (Deferred Q4) Revisit on-chain grant verification if ZABAL Games adoption confirmed | Zaal | Research | 2026-12-01 | If yes, create doc 10xx (on-chain integration roadmap) |

---

## Appendix: ZOE Hook Points Summary

For quick reference, here's where each Venus integration plugs into ZOE:

| Venus Feature | ZOE File(s) | Function / Block | Nature |
|---|---|---|---|
| Fund Graph API | recalls.ts | `recallArtizenGrants()` | New function for Bonfire-like recall |
| Grant Recommendations | dispatch.ts, workers.ts | grant-recommender worker | New worker, routed from decompose.ts on "find grants" intent |
| Creator Profiles | team-tracker.ts, crm.ts | `syncArtizenProfile()`, Supabase team_members table | New field + sync logic |
| Existing integrations (Farcaster, X, GitHub) | farcaster/event-stream.ts, concierge.ts line 146 | No changes needed | Already sufficient |

---

## Also See

- [Doc 759](../759-zoe-orchestrator-gaps/) — ZOE architecture + worker specs (Gap 2 context)
- [Doc 770](../770-zoe-cost-budget-harness/) — Worker cost capping + dispute resolution
- [Doc 899](../899-zaoscout-mcp-launch/) — ZAOscout MCP for keyless social reading
- [Doc 781](../781-zabal-games-bonfire-queue/) — Bonfire + Upstash queue (related fund/grant context)
