---
topic: agents
type: market-research
status: research-complete
last-validated: 2026-05-20
original-query: What is the complete Bonfires landscape, canonical reference, and readiness gate for Phase 1 ZOE integration? (reconstructed)
related-docs: 601, 650, 665, 668
tier: DEEP
---

# 669 — Bonfires: Everything We Know (Consolidated + Extended)

> **Goal:** Pull everything we've learned about Bonfires into one doc, then push further. Doc 665 was the entry point; Doc 668d was the integration spec; this is the canonical reference + the landscape positioning + what Ryan's "compiled new ZOE" actually does + the readiness gate for Phase 1 build.

## Key Decisions

| Decision | Verdict | Why |
|---|---|---|
| Bonfires is ZAO's locked-in agent memory partner | YES, confirmed | Per Doc 601 primary surfaces, Doc 665 deep-dive, Ryan partnership active, ZABAL bonfire live, Phase 1 spec ready |
| Position Bonfires as "Letta-philosophy + Farcaster-native + $KNOW economy" | YES | The Mem0/Letta/Zep/Cognee landscape doesn't include Bonfires yet; its differentiator is the social + economic layer on top of an agent-runtime architecture |
| Ship Phase 1 (subprocess CLI) before Ryan's native SDK | YES | Doc 668d 4-hour scope. Zero rework when SDK drops (just swap subprocess for native call). Front-loads corpus value for the compiled-new-ZOE delivery. |
| Mint additional ZAO ecosystem bonfires (Wavewarz, FISHBOWLZ, BCZ Strategies, ZAOstock) | DEFER | 0.1 ETH × N is real cost. Start with one (ZABAL bonfire is live). Validate Phase 1 + 2 patterns first, then mint more or partition the existing one via ontology profiles. |
| Hold $KNOW token allocation via Genesis NFT | YES | Genesis NFT is the only way to get $KNOW allocation pre-public-launch. ZAO already minted for the ZABAL bonfire. |
| Evaluate vendor lock-in risk | LOW | kEngrams export to Canvas / OWL / Markdown — open standards. If Bonfires sunsets, ZAO has local Obsidian-compatible vaults. Safer than Letta + Mem0 SaaS-only options. |

## Canonical Facts (Consolidated)

### Identity + Surface

| Field | Value |
|---|---|
| Company name | Bonfires Labs (NERDDAO is the GitHub org) |
| Founder | Joshua.eth / Ryan ("Rskagy" on Telegram, in active ZAO Civilization GC) |
| Homepage | https://bonfires.ai |
| Docs | https://docs.bonfires.ai (Obsidian Publish — nav doesn't follow REST URL patterns; some sections 404 on direct GET) |
| Dashboard | https://app.bonfires.ai/dashboard |
| Mint | https://mint.bonfires.ai (Genesis NFT, 0.1 ETH per bonfire) |
| API base | https://tnt-v2.api.bonfires.ai |
| ZAO's live bonfire | https://zabal.bonfires.ai (auto-slug; custom rename pending Ryan) |
| GitHub org | https://github.com/NERDDAO (15+ active repos) |
| Token | $KNOW — knowledge economy layer; pre-launch allocation only via Genesis NFT mint |

### NERDDAO Ecosystem (15+ Repos, Categorized)

| Category | Repos | Purpose |
|---|---|---|
| **Core SDK** | bonfires-sdk | Python CLI + SDK. Default branch `canon`. `pip install bonfires`. |
| **Web** | bonfires-webapp (2.3 MB TS) | The dashboard at app.bonfires.ai |
| **Web** | synthesis-frontend | Hyperblog aggregator with track filtering |
| **Local tools** | bonfire-tools | 4 files: ingest.py (14 KB), memory-explorer.html (37 KB), pulse.html (41 KB), server.py (4 KB) |
| **Showcase** | bonfire-rpg (NERDDAO) | P2P multiplayer RPG using Bonfires KG as shared world memory |
| **Showcase** | memento-mori | Permadeath MUD powered by CrewAI, 42 AI agents narrate a dark-fantasy world backed by KG |
| **Adjacent** | trimtab | Context-aware grammar generation with cascading embedding search |
| **Adjacent** | obsidian-kengram | Obsidian integration (kEngram export pathway) |
| **Adjacent** | scaffold-x402-bonfires | x402 payments scaffolding for Bonfires |
| **Adjacent** | bonfire-fetch | Utility (description blank) |
| **Seasonal** | santa-bonfire | Holiday demo bonfire |
| External adopter | MesoReefDAO/pepo-the-polyp | "AI guide to the Coral Reef knowledge network, powered by Bonfires.ai" — first known external customer |

### kEngram Architecture

The unit of knowledge in Bonfires. Verbatim from `bonfires-sdk/.claude/skills/bonfires/bonfires-cli/SKILL.md`:

> "kEngrams are verifiable knowledge subgraphs — curated projections of the KG with content-addressed hashing (SHA-256) and merkle roots for integrity proof."

Two types:
- `session` — bounded to a conversation / event
- `topic` — bounded to a concept that accrues over time

Lifecycle commands:
- `bonfire kengram new "name" [--type session|topic]`
- `bonfire kengram use <id>` (set active)
- `bonfire kengram pin <uuid>` (anchor a KG entity)
- `bonfire kengram create "name"` (create + pin in one step)
- `bonfire kengram edge <src> <tgt> --name REL --fact "..."` (relationships)
- `bonfire kengram batch [--canvas] [--sync] [--json] FILE | -` (the recommended automation path — JSON changeset with nodes + edges + single merkle recompute)
- `bonfire kengram export` (Canvas / OWL / Markdown — vendor-lock-out safety valve)

Critical rule (verbatim from skill): "NEVER edit kEngram manifest JSON or canvas files directly. Use batch."

### Agent System

Agents are LLM-backed personas that live on a bonfire. Per the docs nav (some pages 404, partial inference):
- Multiple agents per bonfire
- Configurable traits (persona, voice)
- Tagging on Telegram + Discord with `@agentname`
- Created from app.bonfires.ai/dashboard (UI-driven; new feature post-2026-05)
- Automated knowledge graph extraction every 20 minutes (from homepage)
- Semantic search via SDK `client.agents.chat()` with `graph_mode`:
  - `adaptive` — LLM decides if KG query needed
  - `static` — no graph ops
  - `regenerate` — fresh KG
  - `append` — add to existing
- MCP integration with Claude Desktop + Cursor (referenced; install pattern not yet documented publicly)

### Auth Model

| Layer | Mechanism |
|---|---|
| Public listening | Anonymous via SIWF (Sign In With Farcaster) |
| Participation | Authenticated SIWF flow |
| Mic / role promotion | Server-side enforcement; host has to approve |
| Developer access | `X-Juke-Api-Key` header per request (NB: that's Juke's pattern; Bonfires is `BONFIRE_API_KEY` env var consumed by the CLI) |
| Key reveal | One-time signed message on app.bonfires.ai/dashboard |

### Bonfire Tools (Local Dev Stack)

Per `gh api repos/NERDDAO/bonfire-tools/contents/`:

| File | Size | Purpose |
|---|---|---|
| `ingest.py` | 14 KB | Document ingestion CLI — takes files / URLs and writes to a bonfire |
| `memory-explorer.html` | 37 KB | Visual knowledge graph explorer (runs against the proxy `server.py`) |
| `pulse.html` | 41 KB | Activity monitor for a bonfire (event stream visualization) |
| `server.py` | 4 KB | Local proxy server (avoids CORS for the HTML tools) |

These are dev-ergonomics tools, not production infra. Useful for: testing a bonfire locally, visualizing the KG before/after a kEngram update, debugging ingest pipelines.

### $KNOW Token + Economy

| Field | Status |
|---|---|
| Token name | $KNOW |
| Layer | Knowledge economy across all bonfires (network-level, not per-bonfire) |
| Pre-launch allocation | Genesis NFT mint = the ONLY way to receive $KNOW pre-public-launch |
| Mint cost | 0.1 ETH per Genesis NFT |
| Network effect | Each bonfire is a node; cross-bonfire RAG = the network |
| ZAO position | ZABAL bonfire already minted; allocation eligible |

## 2026 Agent Memory Landscape — Where Bonfires Sits

Major comparison roundups (Mem0 vs Letta vs Zep vs Cognee) do NOT yet include Bonfires. That's signal — Bonfires is early-stage in the public agent-memory discourse, despite being in production with paying customers. Positioning:

| System | Philosophy | Memory tiers | OSS / SaaS | Bench | Bonfires comparison |
|---|---|---|---|---|---|
| **Mem0** | Bolt-on memory library; passive extraction via `add()` | Single tier (vector + facts) | Open source + paid Pro for graph | Strong on "remember the user" recall | Bonfires is heavier; Mem0 is the "just remember things" library |
| **Letta (MemGPT)** | Agent runtime; agents self-edit memory via tool calls | 3 tiers: Core (in context) / Recall (searchable history) / Archival (long-term via tool) | OSS, self-host | ~83.2% on standard benchmarks | Closest philosophical sibling; Bonfires adds social / token layer Letta doesn't have |
| **Zep** | Memory server with temporal KG; async summarization + entity extraction | Temporal KG (timestamped facts + state changes) | Graphiti engine self-hostable | High on state-tracking tasks | Zep is purer KG; Bonfires has agents-as-first-class + multi-bonfire federation |
| **Cognee** | Knowledge graph + retrieval | Graph + vector hybrid | OSS | Mid-pack | Adjacent; Bonfires has more agent UX layer |
| **Supermemory / SuperLocalMemory** | Local-first memory | Layered Modes A/B/C | OSS | Mode C ~87.7% (highest OSS) | Local-only; Bonfires is networked |
| **Bonfires (NERDDAO)** | Agent runtime + Farcaster-native auth + multi-bonfire knowledge network + $KNOW token economy | kEngrams (content-addressed subgraphs) + KG nodes + agents-as-personas | Source-available SDK; SaaS API; ETH-gated bonfire ownership | Not in published benchmarks yet | Different positioning: "knowledge economy" + "social-graph-native" |

**ZAO's bet:** Bonfires is the right choice IF the network effect kicks in (cross-bonfire RAG, $KNOW economy delivering, agent marketplace developing). For pure "remember conversations" Mem0 would be simpler. For agent self-editing Letta would be the OSS choice. Bonfires wins for ZAO specifically because:
1. Farcaster-native auth (matches ZAO OS)
2. Multi-bonfire model fits ZAO's 25+ brands
3. ZAO is already partnered with Ryan (no negotiation cost)
4. Vendor-lock-in low (kEngrams export to Markdown/OWL/Canvas)

## What Ryan's "Compiled New ZOE" Actually Is

Reverse-engineered from Ryan's chat in the ZAO Civilization GC:

> "we are working on getting the SDK finalized so we can publish the first internal version then test before we send over a repo and Zoe's compiled new self"

Workflow inferred:

```
1. Zaal sends Ryan ZOE's session export (the 6-section dump shown earlier this session)
2. Ryan's pipeline:
   a. Parse persona.md + human.md + bootloader-template.md + recent/*.json + tasks.json
   b. Ingest each into a kEngram via bonfires-sdk
   c. Tag each entity (persona / human / task / message / project)
   d. Run the automated KG extraction (every-20-min loop)
   e. The bonfire becomes ZOE's new memory substrate
3. Ryan returns to Zaal:
   a. A NEW repo (the "compiled new ZOE" = ZOE rebuilt to read from bonfire instead of ring buffer)
   b. The SDK finalized version
   c. Probably an MCP server config so Claude Code can read the bonfire too
4. Zaal deploys the new ZOE — she now has persistent memory across all turns + topic recall via kEngrams
```

Net effect: ZOE's 8-turn window problem disappears. Inside jokes survive. Project history accumulates. Cross-thread context becomes possible. **The "compiled new self" = ZOE's persona + history rebuilt as a queryable graph she can read from on every turn.**

What ZAO can ship NOW to make this delivery land cleanly (Phase 1 of Doc 668d):
- ZAOcoworkingBot events writing to the ZABAL bonfire from this moment forward
- By the time Ryan ships, the bonfire has 1-2 weeks of real corpus instead of just ZOE's old export
- Compiled new ZOE reads + grounds in REAL recent context

## 7 Open Questions from Doc 665 — Resolution Status

| # | Question | Status now | Source |
|---|---|---|---|
| 1 | Is there a stable MCP server for Bonfires? | Docs reference it; install pattern not yet public. Ryan will ship with new SDK. | Doc 665 + Ryan chat |
| 2 | Is the founder's "episode on commit" skill shareable? | Public bash equivalent in Doc 665; Ryan may share his when sprint ends | Doc 665 |
| 3 | Custom slug for zabal.bonfires.ai | Pending Ryan (he said "tomorrow" earlier; still pending May 18) | Chat transcript |
| 4 | Agent trait propagation bug | Likely fixed in current sprint; Zaal needs to re-test | Chat transcript |
| 5 | Pricing for multiple bonfires | 0.1 ETH each per Genesis NFT confirmed; per-API-call pricing still unknown | Search 2026-05-18 |
| 6 | TypeScript SDK on roadmap? | Unknown; current SDK is Python only | Doc 665 |
| 7 | Webhook / event stream out (push, not poll) | Unknown — critical for V1 (ZOE recall latency) | Doc 665 |

**Resolved this session:** 0 of 7. All still pending Ryan response. None block Phase 1 (subprocess CLI works today).

## Where ZAO Has Bonfires-Specific Advantages

| Advantage | Why it matters |
|---|---|
| 188 gated Farcaster members | Built-in audience for any bonfire-powered ZAO surface (Plural Events polling, Fractal Respect tracking) |
| 729 research docs | Pre-existing corpus that can ingest as kEngrams day-1 via `bonfire ingest` |
| Live ZOE on VPS already running | No greenfield bot to build; just swap memory backend |
| Hermes auto-PR pipeline (per memory `project_hermes_canonical.md`) | Hermes can ship the Phase 1 bonfire integration as a PR autonomously |
| Multiple brand surfaces (per brand kit) | Each brand can have its own ontology profile in the same bonfire OR mint its own bonfire |
| Active fractal governance | Weekly Respect events can write to the bonfire = governance provenance forever |
| Existing relationship with Ryan / Joshua.eth | Zero negotiation cost; daily DM channel; co-builder dynamic |

## Risks (Updated From Doc 665)

| Risk | Severity | Mitigation status |
|---|---|---|
| Vendor lock-in to Bonfires | LOW (was MED) | kEngram Markdown/OWL/Canvas export = open-standard escape hatch. Local Obsidian vault is the backup. |
| Sprint changes break the CLI | MED | Pin `pip install bonfires==X.Y.Z`; spool model for write retries; re-validate per Bonfires release |
| API key leakage | LOW | Pre-commit hook (Doc 663g P0 still pending) + chmod 600 + don't log |
| Pricing model uncertainty (per-API-call) | MED | Unknown beyond 0.1 ETH mint; Ryan to confirm. Spool model + non-blocking writes mitigate cost spikes |
| Latency for ZOE recall (poll vs webhook) | MED | If webhooks unavailable, cache aggressively in `<working_memory>` block and refresh on intent change |
| Bonfires shuts down | LOW | Open-export kEngrams + local Obsidian backups + local Letta fallback |
| $KNOW token doesn't deliver economic value | LOW (no skin lost) | ZAO didn't pay for token; got allocation via Genesis NFT mint cost (0.1 ETH = already considered sunk into the bonfire infra) |

## Phase 1 Build Readiness Gate

Before any code lands, these 3 confirmations must be in:

| # | Need | Source | Status |
|---|---|---|---|
| 1 | `BONFIRE_ID` (UUID) for ZABAL bonfire | app.bonfires.ai/dashboard | PENDING from Zaal |
| 2 | `BONFIRE_API_URL` is `https://tnt-v2.api.bonfires.ai` (default per SDK) | bonfires-sdk source | Confirmed default; Zaal to verify no override |
| 3 | API key works locally (`pip install bonfires && bonfire bonfires` lists ZABAL) | Zaal local terminal | PENDING from Zaal |

Once all 3 in, the next Claude Code session ships Phase 1 (~80 LoC `bot/src/teams/bonfire.ts` + spool) as a PR in 3-4 hours. Full spec is at Doc 668d.

## What This Doc Adds Beyond Doc 665

| Topic | Doc 665 | Doc 669 (new) |
|---|---|---|
| Org identity + repos | Surface-level inventory | Categorized 15+ repos with sizes + sub-roles + adjacent ecosystem |
| kEngram model | CLI commands listed | Same + critical-rule emphasis + export pathways named |
| Agent system | Hosted iframe + SDK | + automated 20-min KG extraction + 4 `graph_mode` values + MCP intent |
| Auth model | Brief | + signed-message reveal + `BONFIRE_API_KEY` env model |
| Bonfire-tools | Mentioned files | Bytes + role of each |
| $KNOW economy | "Genesis NFT mint" mention | + "only way pre-launch" gate confirmed + ZAO eligibility |
| Memory landscape comparison | None | Full 5-system comparison (Mem0 / Letta / Zep / Cognee / Supermemory) with where Bonfires sits |
| Ryan's "compiled new ZOE" | Mentioned | Reverse-engineered 4-step workflow + what ZAO can do NOW to make the delivery better |
| 7 open questions | Listed | Status update on each |
| ZAO-specific advantages | Implicit | Explicit 7-row table |
| Risk register | 6 items | 7 items with severity revisions + status |
| Build readiness gate | Implicit | Explicit 3-confirmation checklist before code |

## Next Actions

| Action | Owner | Type | By When |
|---|---|---|---|
| Zaal sends 3 confirmations (BONFIRE_ID + API URL + key works) to next Claude Code session | @Zaal | Local action | Today |
| Next Claude Code ships Phase 1 bot/src/teams/bonfire.ts + spool.ts PR | Next session + Hermes | PR | Day after confirmations land |
| Ryan answers the 7 open questions when sprint ends | @Ryan (joshua.eth) | DM response | This week |
| Zaal mints additional bonfires per brand (Wavewarz, FISHBOWLZ, ZAOstock, BCZ Strategies) | @Zaal | Decision | After Phase 1 + 2 validation |
| Ship per-brand ontology profiles instead of multi-bonfire OR alongside | @Zaal + Ryan | Decision | Same trigger as above |
| Add a "Bonfires status" entry to morning brief | @Zaal | Automation | Optional |
| Re-validate this doc when Ryan ships SDK | @Zaal | Recurring check | Trigger on Ryan |
| Validate kEngram export round-trip (write → export Markdown → re-ingest → verify merkle) | @Zaal + Hermes | Test | Pre-Phase-3 |

## Cross-References

- [Doc 601](../601-agent-stack-cleanup-decision/) — primary surfaces, Bonfire listed canonical
- [Doc 650](../650-cowork-zaodevz-imanagent/) — ZAOcoworkingBot spec (the upstream of Phase 1)
- [Doc 665](../665-bonfires-deep-dive-zao-integration/) — original Bonfires deep-dive (this doc extends + updates)
- [Doc 668](../668-zao-agent-improvement-may-2026/) — agent improvement audit; 668d has the Phase 1 build spec
- `project_bonfires_zao_integration.md` — chat transcript with Ryan + ZABAL bonfire status
- `project_zoe_soul_architecture.md` — ZOE memory model (the 4-block Letta-style structure Bonfires replaces)
- `feedback_never_accept_pasted_secrets.md` — auth model rule

## Sources

- [bonfires.ai homepage](https://bonfires.ai)
- [Bonfires.ai @bonfiresai on X](https://x.com/bonfiresai)
- [Bonfires Labs business page (custom deployments)](https://www.bonfires.ai/)
- [Bonfires Early Adopters Farcaster NFT (Zora collect)](https://zora.co/collect/eth:0x8ac1a580e8636bf7f67240f8ef38bcafde0fe1a1)
- [NERDDAO GitHub org](https://github.com/NERDDAO) — primary repo source
- [NERDDAO/bonfires-sdk canon branch](https://github.com/NERDDAO/bonfires-sdk/tree/canon)
- [NERDDAO/bonfire-tools](https://github.com/NERDDAO/bonfire-tools)
- [NERDDAO/memento-mori](https://github.com/NERDDAO/memento-mori) — agent-network showcase
- [NERDDAO/bonfire-rpg](https://github.com/NERDDAO/bonfire-rpg) — shared-world-memory showcase
- [MesoReefDAO/pepo-the-polyp](https://github.com/MesoReefDAO/pepo-the-polyp) — first external customer reference
- [Mem0 vs Letta comparison (vectorize.io)](https://vectorize.io/articles/mem0-vs-letta)
- [Mem0 vs Letta vs MemGPT 2026 (TokenMix)](https://tokenmix.ai/blog/ai-agent-memory-mem0-vs-letta-vs-memgpt-2026)
- [Agent Memory Systems 2026 (n1n.ai)](https://explore.n1n.ai/blog/ai-agent-memory-comparison-2026-mem0-zep-letta-cognee-2026-04-23)
- [5 AI Agent Memory Systems Compared (DEV.to)](https://dev.to/varun_pratapbhardwaj_b13/5-ai-agent-memory-systems-compared-mem0-zep-letta-supermemory-superlocalmemory-2026-benchmark-59p3)
- [Letta forum: agent memory comparison thread](https://forum.letta.com/t/agent-memory-letta-vs-mem0-vs-zep-vs-cognee/88)
- Ryan / Joshua.eth chat transcript in ZAO Civilization GC (this session)
- ZOE's session export (this session's conversation history)
