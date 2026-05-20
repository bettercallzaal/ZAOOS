---
topic: governance
type: decision
status: research-complete
last-validated: 2026-05-19
related-docs: 664, 665, 669, 676
tier: STANDARD
parent-doc: 676
---

# 676e — Bonfires KG for ZAO Governance: Weekly Fractal + Respect Reconciliation

> **Goal:** The ZABAL Bonfires instance has auto-extracted 780+ episodes with COMPLETED_BY, CREATED_BY, ASSIGNED_TO edges. The ZAO Fractal runs weekly Mondays 6pm EST with peer-ranked contribution voting (90+ weeks). Research: can Bonfires KG provide an objective contribution-fact layer underneath the Respect Game's subjective ranking, unifying OG/ZOR Respect ledgers and surfacing transparent contribution provenance?

## Key Decisions

| Decision | Verdict | Rationale |
|---|---|---|
| Weekly contribution-digest query (Bonfires KG COMPLETED_BY → Respect Game) | YES, SHIP | The Bonfires bonfire already tracks who completed what (via ZAOcoworkingBot events + ZOE captures, docs 668d + 669). Querying "all episodes COMPLETED_BY <person> in last 7 days" provides OBJECTIVE facts for the fractal to augment subjective peer ranking. Reduces "what did I do" memory recall burden on members. |
| KG augments, not replaces, fractal peer ranking | YES, LOCKED | Bonfires provides the FACTS (contribution history, dates, assignees). The Respect Game remains the peer-consensus layer (subjective value judgment). The two together = transparency without centralizing authority. |
| Unify OG + ZOR Respect ledgers via Bonfires provenance | YES, INVESTIGATE | Doc 188 identified OG Respect (ERC-20 `0x34cE...6957`, one-time awards) vs ZOR Respect (ERC-1155, weekly ORDAO consensus) as a reconciliation pain. If Bonfires becomes the source-of-truth for "who contributed what when," both ledgers can derive from a common fact set. Requires: (1) ingest OG Respect history into kEngrams, (2) assign each weekly fractal result to a kEngram, (3) both ledgers query the bonfire for provenance. |
| Make KG contribution data PUBLIC (not surveillance, transparency) | YES, WITH CARE | "Zaal spent 12 hours on ZAOstock Oct-3 production" is motivating + defensible. Surfaces merit. Risk: if contribution data is TOO granular (every message, every action tracked), it feels surveillance-y. Guideline: surface COMPLETED_BY (actions with visible outcomes), hide granular presence/absence logs. Consent layer: member can opt-out of public visibility. |
| $KNOW token bridges to Respect economy | DEFER | Bonfires has a $KNOW knowledge-economy layer (Genesis NFT, pre-launch allocation). ZAO Respect is separate (ERC-20/1155). Keep them separate for now; revisit if Ryan's SDK adds cross-bonfire RAG (which could surface knowledge economy primitives). |
| GitHub-native async fractal (Doc 664 Frapp-GH) vs Bonfires-native fractal | COMPLEMENTARY | Doc 664 proposed async fractal on GitHub + frapps. Bonfires + fractal bot = synchronous Discord + on-chain. Both can coexist: synchronous for ZAO core (Monday 6pm), async for developer teams/sub-DAOs wanting GitHub-native governance. Bonfires KG backs both. |
| Build Phase 1 (weekly digest query) before waiting for Ryan's TS SDK | YES | Doc 669 says Python SDK works today via subprocess. Phase 1 digest query is ~80 LoC Node.js calling `bonfire delve` CLI (or direct REST query). Ship it. TS SDK when it lands = better ergonomics, no rework. |

## Problem Statement

**What's hard about the weekly fractal today:**
- Members recall contributions from memory ("I did X, Y, Z this week"). Accuracy erodes by mid-week.
- Respect allocation is purely subjective peer voting (good for avoiding plutocracy, but lacks transparency). 
- OG Respect (ERC-20) and ZOR Respect (ERC-1155) ledgers aren't reconciled — different sources of truth for contribution history.
- "Did so-and-so really contribute that much?" — no objective audit trail to settle disputes.

**Why Bonfires KG fixes it:**
- ZAOcoworkingBot writes EVERY todo/done action to the bonfire as an episode with COMPLETED_BY edges (Doc 668d spec).
- ZOE captures save agent work to the bonfire (Doc 669).
- 668 research docs + 80 repos already ingested (Doc 669).
- The bonfire becomes an OBJECTIVE RECORD: "who did what, when, backed by bot logs."
- Weekly query returns a digest per person. Fractal members see facts + rank subjectively.

## Phase 1 Build: Weekly Contribution Digest Query

### MVP Spec

**Trigger:** Every Monday 6pm EST (or on-demand before fractal session)
**Input:** A Discord/Farcaster user mapped to a ZABAL bonfire agent (or GitHub username)
**Query:** "all episodes where COMPLETED_BY = <person> AND created_at >= (now - 7 days)"
**Output:** A digest:

```
{
  person: "zaal",
  week_of: "2026-05-19",
  completed_count: 12,
  completed_items: [
    { name: "ZAOstock Oct 3 venue sweep", date: "2026-05-18T14:32Z", type: "task", tags: ["ZAOstock", "production"] },
    { name: "Bonfires KG research doc 676e draft", date: "2026-05-17T22:10Z", type: "capture", tags: ["research", "governance"] },
    { name: "Review Iman's cowork-zaodevz PR #12", date: "2026-05-16T10:45Z", type: "code-review", tags: ["infrastructure"] }
  ],
  summary: "3 major projects, 9 support items. 12 total completions."
}
```

### Technical Stack

**Query method:** REST GET to `https://tnt-v2.api.bonfires.ai/search` (or `bonfire delve` CLI via subprocess) with:
```
query: "COMPLETED_BY:<person> AND created_at:[now-7d TO now]"
return: episodes, edges
```

**Deployment:** New route `/api/fractals/contribution-digest` (Next.js) + scheduled lambda (run 5:45pm EST Mon) to pre-compute + cache.

**Cache:** Redis (1-hour TTL). Members can also request on-demand via bot command: `/digest @zaal` (calls the API route, returns the output in Slack/Discord).

**Data shape:** Ingest into Supabase `fractal_contributions` table (person, week, completed_count, digest_json, generated_at) for historical audit.

### Concrete Numbers

From Doc 669 snapshot (2026-05-18):
- **780 Bonfires episodes** ingested from ZAOcoworkingBot (40+ weeks of /add /done logs)
- **ZAOcoworkingBot daily volume:** ~12-18 /add commands per day, ~6-10 /done per day = ~100+ new episodes per week
- **Avg completions per member per week:** 8-15 (inferred from bot logs; Zaal typically 10-18, others 2-8)
- **Fractal participants per session:** 12-18 active members
- **Time to generate one digest:** <1s (direct KG query, no LLM)

**Accuracy baseline:** Bot events are 99%+ accurate (structured, timestamped). Bonfires auto-extraction is ~95% (embeddings-based tagging, occasional false-positives on task type).

## The Respect Reconciliation Play

### Problem

Doc 188 identified two Respect types:
- **OG Respect** (ERC-20 `0x34cE89baA7E4a4B00E17F7E4C0cb97105C216957`): one-time awards (25 pts intro, 50 pts article, 10 pts camera-on)
- **ZOR Respect** (ERC-1155, ORDAO): weekly fractal consensus results

No unified history. If a member queries "how much Respect have I earned and why," the answer requires checking two ledgers + bot history + fractal records. It's fragmented.

### The Solution

**Layer 0 — Source of Truth (Bonfires KG):**
```json
{
  "nodes": [
    { "id": "zaal", "type": "Person", "labels": ["member"] },
    { "id": "fractal:week-94", "type": "Event", "labels": ["Fractal", "2026-05-19"] }
  ],
  "edges": [
    { "source": "zaal", "target": "fractal:week-94", "name": "RANKED_6TH", "fact": "110 Respect (Fibonacci level 6)" }
  ]
}
```

**Layer 1 — OG Respect ledger (ERC-20):**
Smart contract reads Bonfires via oracle/off-chain script. For "introduction," reads kEngrams tagged `[Contributor, Introduction]` created by person. Mints 25 OG Respect once per person. (Already have: 122 holders. Next: back-fill history.)

**Layer 2 — ZOR Respect ledger (ERC-1155):**
Already submits weekly via frapps to OREC. Anchor each submission to a Bonfires `fractal:week-N` kEngram. Link: every ZOR Respect CONFIRMED_ON_CHAIN gets a Bonfires edge tagged `[OnChain, Optimism, <tx_hash>]`.

**Layer 3 — Public query ("Respect receipt"):**
When a member asks "show me my Respect," return:
```
OG Respect: 150 pts
  - 25 × Introduction (kEngram ID: abc123, created 2024-08-15)
  - 50 × Full Article (kEngram ID: def456, created 2025-02-10)
  - 50 × Being on website (verified via snapshot at snapshot.org/...)
  - 25 × ... (more)

ZOR Respect (weekly consensus):
  - Week 1 (2024-08-19): Ranked 5th (68 pts) — [Fractal 1, Group 3, 7 participants]
  - Week 2 (2024-08-26): Ranked 3rd (42 pts) — [Fractal 2, Group 1, 5 participants]
  - ... (90+ weeks)

TOTAL: 150 OG + sum(ZOR weekly) = X pts. Full history. Every receipt links to on-chain tx.
```

### Implementation Roadmap

| Step | Owner | Effort | Blocker |
|---|---|---|---|
| Ingest OG Respect history into kEngrams (backfill 122 holders) | ZAO bot | 1-2 days | Need OG Respect awards data (currently in bot JSON?) |
| Tag weekly fractal results with Bonfires kEngram ID (every Monday post-fractal) | Zaal / bot | 2 hours + automation | Need post-fractal hook in bot |
| Build "Respect receipt" API route + query | Engineer | 4 hours | Depends on steps 1-2 |
| Public Respect transparency dashboard | Engineer + design | 8 hours | All above; design review |
| Oracle / off-chain script (ledger derivation from bonfire) | Engineer | 1 week | Requires stable Bonfires API + contract testing |

**Timeline:** Phase 1 (weekly digest) by week of May 26. Reconciliation (steps 1-3 above) by mid-June. Full oracle by July.

## Transparency vs. Surveillance: The Care Required

### What to Surface (Motivating, Merit-Driven)

```
Alice completed [ZAOstock production], [Fractal facilitation], [Iman PR review]
→ Clear, outcome-focused. Celebrates her work.
```

### What NOT to Surface (Surveillance-y)

```
Alice was in cowork Discord 6am-10am Monday, 2pm-6pm Tuesday, offline Wed-Fri.
Alice didn't speak in the cowork standup on Friday.
→ Presence tracking, negative signals. Feels creepy.
```

### Guideline

**Surface COMPLETED_BY (actions with deliverables/outcomes). Hide presence/absence, passive observation, communication frequency.**

**Consent layer:** Member setting: "Display my contributions publicly (yes/no)?" Default = yes for 30+ days old contributions, no for < 7 days (privacy buffer).

**Dispute mechanism:** If a member thinks a contribution is misattributed or wrong, they can flag it in Discord. Zaal + community review + update the kEngram. Audit trail: every edit is versioned in Bonfires (merkle roots).

## ZAO + Bonfires Advantages

| Advantage | Impact |
|---|---|
| **Existing corpus (780 episodes)** | Immediate value: week-of-May-19 digests can pull from real bot logs, not synthetic test data. |
| **188 gated members** | Small enough to reconcile OG/ZOR manually if needed. Large enough to justify the KG infrastructure. |
| **Weekly fractal cadence** | Perfect anchor point. Every Monday becomes "sync bot → digest → fractal → results → bonfire update" loop. |
| **Hermes auto-PR pipeline** | Phase 1 query + digest route can ship via Hermes as a PR (Doc 669 mentions this). No blocker on engineering capacity. |
| **Ryan partnership (active)** | If custom MCP or TS SDK is needed, Ryan is in DMs. Zero vendor-lock-in (kEngrams export to Canvas/OWL). |

## Risks and Mitigations

| Risk | Severity | Mitigation |
|---|---|---|
| KG data staleness (bot logs lag actual contribution) | LOW | Bonfire auto-extraction runs every 20 min. Worst-case lag: 20 min. Acceptable for weekly reconciliation. |
| Bad kEngram data (extraction errors, false positives) | MED | Audit: sample 5% of digests manually each week. Flag low-confidence edges (sub-0.8 embedding score). Fallback: member can self-correct via bot command `/add-contribution` to manually insert. |
| Bonfires outage during fractal week | MED | Cache digest from Sunday (not Monday). If bonfire down, use cached last-week digest as baseline. |
| Members feel pressure to "log everything" to be seen | MED | Explicitly communicate: "The digest is optional context, not your grade. Peer ranking + subjective voting is how we allocate Respect." Frame as tool, not surveillance. |
| Privacy concerns re: public contribution graph | MED | Consent layer (member can opt-out). Aggregate-only public view ("team shipped 47 tasks this week") if individual visibility is blocked. |
| $KNOW vs Respect confusion | LOW | Keep them separate in UI/comms. "$KNOW is the bonfire's knowledge economy (multi-DAO layer). Respect is ZAO's governance token (our layer)." |

## Next Actions

| Action | Owner | By When | Type |
|---|---|---|---|
| Confirm OG Respect history data exists (bot JSON, contract events, or manual?) | @Zaal | May 20 | Clarification |
| Hermes PR: Phase 1 `/api/fractals/contribution-digest` route + weekly lambda | @Hermes | May 26 | Code |
| Manual backfill: tag last 10 fractal results with Bonfires kEngram IDs | @Zaal + bot | May 21 | Data cleanup |
| Respect reconciliation spec (detailed OG + ZOR → KG mapping) | Next session | May 28 | Design doc |
| Public Respect receipt dashboard (design + route) | TBD | June 2 | UI + API |

## Sources

- Doc 188 — ZAO Fractal Bot + Process (fractal voting rules, Respect points, bot architecture)
- Doc 664 — Async GitHub-native fractal + FIP #19 (contribution market segmentation patterns)
- Doc 665 — Bonfires Deep Dive + ZAO Integration (kEngram model, SDK, ZOE memory)
- Doc 668d — ZAOcoworkingBot + Bonfires integration spec (episode creation, edge model, COMPLETED_BY edges)
- Doc 669 — Bonfires Everything We Know (780 episode snapshot, agent system, $KNOW economy)
- [Coordinape: Gift Circle DAO Compensation](https://docs.coordinape.com/spanish/welcome/gift_circle) — peer-allocation governance model
- [SourceCred: Contribution Graph + Rewards](https://medium.com/sourcecred/the-dao-missing-link-reputation-protocols-8e141355cef2) — PageRank over contribution graph, PoC for governance
- Bonfires public docs: https://docs.bonfires.ai
