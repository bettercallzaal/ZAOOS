---
topic: agents
type: decision
status: research-complete
last-validated: 2026-05-17
related-docs: 460, 601, 657, 663, 664
tier: DEEP
---

# 665 — Bonfires Deep Dive + ZAO Integration Plan

> **Goal:** Bonfires.ai (built by **NERDDAO** / Bonfires Labs) is ZAO's locked-in knowledge-graph + agent-memory partner per Doc 601 primary surfaces. Zaal has a live ZABAL bonfire at zabal.bonfires.ai. This doc captures (1) the full Bonfires architecture from their public repos + docs, (2) the bonfires-sdk CLI + Python API surface verbatim, (3) the GitNexus code-intelligence companion, (4) **6 concrete ZAO integration vectors**, (5) the implementation plan to make ZOE use Bonfires as its canonical memory, (6) replication of the founder's "episode on commit" pattern as a git post-commit hook. Triggered by Zaal pivoting mid-autoresearch loop after the textsplitter grill revealed it was a Bonfires-feeder, not a dead utility.

## Key Decisions

| Decision | Verdict | Why |
|---|---|---|
| Use Bonfires as ZOE's long-term memory layer | YES, locked | Per Doc 601 primary surfaces. Replaces / augments the current Letta 4-block memory at `bot/src/zoe/`. |
| Use the Python `bonfires` SDK from a TypeScript / Node bot | VIA CLI SUBPROCESS first, native TS later | Python SDK is the canonical path. TS bot calls the `bonfire` CLI via subprocess. Build a TypeScript wrapper around the REST API only if subprocess latency / DX is bad. |
| Adopt the kEngram model for ZOE captures | YES | Each ZOE capture session = 1 kEngram. Content-addressed (SHA-256 + merkle root) means we get provenance + integrity proofs for free. |
| Build "episode on commit" for ZAOOS as a git post-commit hook | YES, MVP this week | The founder mentioned a custom Claude skill that creates an episode on every commit. Reverse-engineer from kEngram batch API + git post-commit hook. Doesn't need the founder's exact code. |
| Adopt GitNexus MCP for codebase intelligence | YES, alongside Bonfires | GitNexus indexes code structure (Files, Functions, Classes, processes, CALLS edges). Complements Bonfires (which is general knowledge graph). Index refresh: `npx gitnexus analyze`. |
| Wait for the founder's new-sprint skill before deep CLI adoption | PARTIAL | Per the chat transcript Zaal shared: "skills will change soon, pointless to give you old stuff." Use the CURRENT public skills (bonfires-cli + gitnexus) as the MVP baseline; expect post-sprint upgrade. |
| Mint additional bonfires for ZAO sub-surfaces (Wavewarz / Hermes / Devz / per-repo) | DEFER | Genesis NFT mint = 0.1 ETH per bonfire. Start with the existing ZABAL bonfire + 1 new (Wavewarz, per textsplitter's original intent). Add more once integration patterns are proven. |
| `textsplitter` repo classification | KEEP, NOT archive | Doc 663e said "purpose unclear, possibly archive" — that was wrong. textsplitter is the X Spaces audio → kEngram ingest preprocessor for the Wavewarz bonfire. Add a README. |

## Bonfires Architecture (from public repos + docs)

### Org + Identity

- **Org name:** NERDDAO (GitHub org). "Bonfires Labs" is the team name per docs nav.
- **Repos:** 15+ active under NERDDAO. Key ones below.
- **Domain:** bonfires.ai (homepage). app.bonfires.ai/dashboard (dashboard). mint.bonfires.ai (Genesis NFT). docs.bonfires.ai (Obsidian Publish). tnt-v2.api.bonfires.ai (API base).
- **Token:** $KNOW (knowledge economy layer). Not yet integrated into ZAO planning per `project_bonfires_zao_integration` memory.

### Public Repos (verified via gh repo list NERDDAO, 2026-05-17)

| Repo | Updated | Purpose |
|---|---|---|
| **bonfires-sdk** | 2026-05-18 | Python SDK + CLI for the Bonfires API. Beautiful terminal interface. `pip install bonfires`. Default branch `canon`. |
| **bonfires-webapp** | 2026-04-11 | Main TypeScript dashboard frontend (2.3 MB). |
| **bonfire-tools** | 2026-03-18 | Local dev tools: proxy server, knowledge graph explorer, activity monitor (pulse.html), document ingestion (ingest.py). |
| **synthesis-frontend** | 2026-03-18 | Hyperblog aggregator with track filtering for Bonfires synthesis events. |
| **trimtab** | 2026-04-22 | Context-aware grammar generation with cascading embedding search. (Adjacent capability.) |
| **bonfire-rpg** | 2026-04-17 | P2P multiplayer RPG mod using Bonfires KG as shared world memory. |
| **memento-mori** | 2026-04-14 | Permadeath MUD powered by CrewAI; 42 AI agents narrate a dark-fantasy world backed by a knowledge graph. Demonstrates agent-network capabilities. |
| **obsidian-kengram** | 2026-03-17 | (description blank) — likely the Obsidian export integration. |
| **santa-bonfire** | 2026-01-22 | Seasonal demo bonfire. |
| **scaffold-x402-bonfires** | 2025-12-26 | x402 payments scaffolding for Bonfires. |
| **bonfire-fetch** | 2025-09-04 | (description blank) — utility. |

External repos that depend on / showcase Bonfires:
- MesoReefDAO/pepo-the-polyp (AI guide to a coral reef knowledge network, "powered by Bonfires.ai")
- (Zaal's) bettercallzaal/textsplitter (Wavewarz Spaces transcript → kEngram preprocessor, per memory `project_bonfires_zao_integration`)

### Core Concepts

| Concept | What it is |
|---|---|
| **Bonfire** | A knowledge-graph instance, wallet-gated via Genesis NFT mint (0.1 ETH at `mint.bonfires.ai`). One bonfire per project/community/domain. |
| **Agent** | An LLM-backed persona that lives on a bonfire. Configurable traits. Tagging on Telegram/Discord with `@agentname`. Created from app.bonfires.ai/dashboard. |
| **kEngram** | A verifiable knowledge subgraph — a curated projection of the KG. Content-addressed (SHA-256). Merkle-rooted for integrity proof. Two types: `session` and `topic`. |
| **Episode** | Time-bounded knowledge update (referenced in docs nav as a workflow, not a CLI noun). The founder's "episode on commit" lives at this layer. |
| **Ontology** | Profile / namespace definitions for knowledge typing. Attached to kEngrams. Supports gap analysis. |
| **Knowledge Network** | The economic / network layer (multi-bonfire). $KNOW token economics live here. |
| **HyperBlogs** | Public publishing surface (synthesis-frontend renders these). |
| **Genesis NFT** | The wallet-gated provisioning token. Holder = bonfire admin. 0.1 ETH. |
| **Graph mode** | Per-chat parameter controlling KG behavior: `adaptive` (LLM decides) / `static` (no graph ops) / `regenerate` (fresh KG) / `append` (add). |

### SDK Surface (verbatim from `.claude/skills/bonfires/bonfires-cli/SKILL.md`, canon branch)

**Top-level commands:**
```
bonfire init                     Configure API URL, key, bonfire ID, agent ID
bonfire chat "message"           Chat with a Bonfire agent (queries KG)
bonfire delve "query"            Search the knowledge graph
bonfire sync "message" [-f md]   Push context to KG stack
bonfire agents                   List agents for configured bonfire
bonfire bonfires                 List all bonfires
bonfire graph [file]             Render graph data from JSON / stdin
```

**kEngram lifecycle:**
```
bonfire kengram new "name" [--type session|topic]
bonfire kengram use <id>
bonfire kengram show [id]
bonfire kengram list
bonfire kengram delete <id> [--force]
```

**kEngram content ops:**
```
bonfire kengram pin <uuid> [--to id]              # Pin existing KG entity
bonfire kengram pin <uuid> --name "X" --summary "Y" --labels "A,B"
bonfire kengram create "name" [--labels X]        # Create new + pin
bonfire kengram edge <src> <tgt> --name REL [--fact "..."] [--local]
bonfire kengram unpin <uuid>
bonfire kengram repin <uuid>                      # Re-fetch + update hash
bonfire kengram summary "text"
```

**kEngram batch (the recommended path for code/automation):**
```
bonfire kengram batch [--to <id>] [--canvas] [--sync] [--json] [FILE | -]
```

Accepts changeset JSON:
```json
{
  "nodes": [
    { "uuid": "auto", "name": "My Entity", "summary": "...", "labels": ["Entity"] }
  ],
  "edges": [
    { "source": "My Entity", "target": "Existing Node", "name": "DEPENDS_ON", "fact": "reason" }
  ]
}
```

Key batch features:
- `uuid: "auto"` → UUID4
- Edge `source`/`target` resolves by name (changeset → existing manifest → raw UUID if hyphenated)
- Single merkle recompute for all ops (atomicity)
- `--canvas` regenerates Obsidian canvas
- `--sync` pushes edges to canonical KG
- `--json` returns machine-readable output with generated UUIDs

**Critical rule (verbatim):** "NEVER edit kEngram manifest JSON or canvas files directly. Use batch."

### Environment Variables

```
BONFIRE_API_URL    https://tnt-v2.api.bonfires.ai (default)
BONFIRE_ID         bonfire identifier
BONFIRE_AGENT_ID   target agent
BONFIRE_API_KEY    authentication credential
BONFIRE_VAULT_DIR  local storage path
```

Config priority: `~/.config/bonfires/config.env` → `.env` (current dir) → env vars → explicit params.

### Exception Types

`APIError`, `NotFoundError`, `ConfigError` — for programmatic error handling.

## GitNexus (Companion Code-Intelligence Layer)

Distinct from Bonfires proper. GitNexus is a code-graph MCP tool that ships INSIDE the bonfires-sdk repo as a Claude skill (`.claude/skills/gitnexus/*`). Refresh: `npx gitnexus analyze`. The bonfires-sdk skill set has 6 GitNexus sub-skills: `gitnexus-cli`, `gitnexus-debugging`, `gitnexus-exploring`, `gitnexus-guide`, `gitnexus-impact-analysis`, `gitnexus-refactoring`.

**MCP tools (verbatim from `gitnexus-guide/SKILL.md`):**

| Tool | What it does |
|---|---|
| `query` | Process-grouped code intelligence — execution flows related to a concept |
| `context` | 360° symbol view — categorized refs + participating processes |
| `impact` | Symbol blast radius — what breaks at depth 1/2/3 with confidence scores |
| `detect_changes` | Git-diff impact — what do current changes affect |
| `rename` | Multi-file coordinated rename with confidence-tagged edits |
| `cypher` | Raw graph queries |
| `list_repos` | Discover indexed repos |

**Graph schema (verbatim):**
- Nodes: File / Function / Class / Interface / Method / Community / Process
- Edges (CodeRelation.type): CALLS / IMPORTS / EXTENDS / IMPLEMENTS / DEFINES / MEMBER_OF / STEP_IN_PROCESS

**MCP resources** (lightweight reads, ~100-500 tokens):
- `gitnexus://repo/{name}/context` (stats + staleness)
- `gitnexus://repo/{name}/clusters` (functional areas with cohesion scores)
- `gitnexus://repo/{name}/cluster/{name}` (area members)
- `gitnexus://repo/{name}/processes` (execution flows)
- `gitnexus://repo/{name}/process/{name}` (step-by-step trace)
- `gitnexus://repo/{name}/schema` (graph schema for cypher)

**ZAO use:** install GitNexus + run `npx gitnexus analyze` on ZAOOS. The 324-route monorepo will benefit massively from `impact` analysis before refactors (per Doc 661's audit findings).

## ZAO Integration Vectors (6 Concrete)

| Vector | Description | Effort | Phase |
|---|---|---|---|
| **V1** | ZOE captures → kEngrams. Each Telegram `/capture` writes a kEngram via `bonfire kengram batch`. Replaces current local-only storage. | Medium | Phase 1 |
| **V2** | Episode-on-commit for ZAOOS. Git post-commit hook calls `bonfire kengram batch` with commit metadata + diff summary. Reproduces the founder's pattern from public APIs. | Small | Phase 1 |
| **V3** | Wavewarz bonfire + textsplitter integration. textsplitter chunks X Spaces transcripts → `bonfire kengram batch` → Wavewarz bonfire. Live use case for the existing textsplitter repo. | Medium | Phase 1 |
| **V4** | Bonfires MCP for /zao-research. Add Bonfires MCP server to `~/.claude.json` so /zao-research Step 2 (existing-research search) also queries the ZABAL bonfire. Doc 663a Step 2.5 already added cross-repo search; this is the logical Step 2.6. | Small (after MCP server exists; check NERDDAO repos) | Phase 1 |
| **V5** | Per-repo bonfires. Each major ZAOOS surface (ZOE, Hermes, ZAOstockBot, ZAO Devz, music player, governance) gets its own bonfire. Genesis NFT mint per surface. Provenance for everything. | Large (cost: 0.1 ETH × 5+ bonfires; staff time to manage) | Phase 3 |
| **V6** | GitNexus + Bonfires combined audit. GitNexus indexes ZAOOS code graph; Bonfires gives the queryable agent over it. Replaces parts of the audit pattern in Doc 661 + 663 with continuous indexing. | Medium | Phase 2 |

### Phase 1 Build Plan (this week / next sprint)

```
┌─────────────────────────────────────────────────────────────────┐
│ Local: ZAOOS git repo (Mac)                                     │
│                                                                 │
│   ┌──────────────────────┐    ┌────────────────────────────┐   │
│   │  .git/hooks/         │    │  bot/src/zoe/              │   │
│   │  post-commit         │    │  (Telegram bot, Node TS)   │   │
│   │  (V2 episode hook)   │    │  - /capture command        │   │
│   │  ↓                   │    │  - calls bonfire CLI       │   │
│   │  bonfire kengram     │    │    subprocess for memory   │   │
│   │  batch (subprocess)  │    │  (V1 captures)             │   │
│   └────────┬─────────────┘    └─────────┬──────────────────┘   │
│            │                            │                       │
│            └────────────┬───────────────┘                       │
│                         │                                       │
│              ┌──────────▼──────────┐                            │
│              │  bonfire CLI (pip)  │                            │
│              │  BONFIRE_API_KEY    │                            │
│              │  (env, never repo)  │                            │
│              └──────────┬──────────┘                            │
└─────────────────────────┼───────────────────────────────────────┘
                          │
                          ▼
                  https://tnt-v2.api.bonfires.ai
                          │
                          ▼
                  ZABAL bonfire (live)
                  (eventually zabal.bonfires.ai custom slug)
```

### Phase 1 Concrete Steps

1. **Get API key** — Zaal: open app.bonfires.ai/dashboard, sign the message, reveal `BONFIRE_API_KEY`. Store in `~/.config/bonfires/config.env` (chmod 600). Per memory `feedback_never_accept_pasted_secrets.md`: do NOT paste key into a chat with Claude; Zaal sets it locally.
2. **Install SDK** — `pip install bonfires`. Verify with `bonfire bonfires` (lists all bonfires the API key can see). Confirm ZABAL bonfire is visible.
3. **Init local config** — `bonfire init` to set BONFIRE_ID + BONFIRE_AGENT_ID.
4. **First chat test** — `bonfire chat "Hello, ZABAL. What do you know about ZAO OS?"` → verify response.
5. **Build the post-commit hook** — `.git/hooks/post-commit` script:
   ```bash
   #!/usr/bin/env bash
   set -euo pipefail
   SHA=$(git rev-parse --short HEAD)
   MSG=$(git log -1 --pretty=%B)
   AUTHOR=$(git log -1 --pretty=%an)
   FILES=$(git diff-tree --no-commit-id --name-only -r HEAD)
   cat <<EOF | bonfire kengram batch --to <ZAOOS-bonfire-id> --sync -
   {
     "nodes": [
       {
         "uuid": "auto",
         "name": "commit:$SHA",
         "summary": "$MSG",
         "labels": ["Commit", "ZAOOS"]
       }
     ],
     "edges": [
       {"source": "commit:$SHA", "target": "$AUTHOR", "name": "AUTHORED_BY", "fact": "$(date -u +%FT%TZ)"}
     ]
   }
   EOF
   ```
   Wire to repo as `.git/hooks/post-commit` (NOT tracked in repo; document in CLAUDE.md so other workstations replicate).
6. **Add V1 wrapper** to `bot/src/zoe/`. New file `bot/src/zoe/bonfire.ts` that shells out:
   ```typescript
   import { execFile } from 'node:child_process'
   import { promisify } from 'node:util'
   const exec = promisify(execFile)

   export async function captureToBonfire(
     summary: string,
     labels: string[],
     fact?: string
   ): Promise<{ uuid: string }> {
     const changeset = JSON.stringify({
       nodes: [{ uuid: 'auto', name: summary.slice(0, 60), summary, labels }],
       ...(fact ? { edges: [/* TODO based on context */] } : {})
     })
     const { stdout } = await exec('bonfire', [
       'kengram', 'batch', '--sync', '--json', '-'
     ], { input: changeset } as never)
     return JSON.parse(stdout)
   }
   ```
   Per `.claude/rules/typescript-hygiene.md`: validate the parsed stdout with Zod; type `any` is banned.
7. **Add MCP entry** to `~/.claude.json` so /zao-research can query the bonfire. Need to verify if Bonfires ships an MCP server — check NERDDAO repos. If not, ship `bonfire-mcp-zao` (TS wrapper around CLI).

### Open Questions (For Founder DM)

1. **Is there a stable MCP server for Bonfires?** docs.bonfires.ai mentions "MCP integration with Claude Desktop and Cursor" but I couldn't find the install pattern. Repo name / install command?
2. **The "episode on commit" custom skill** — is it shareable, or do you want me to reimplement from public APIs?
3. **Custom slug fix for zabal.bonfires.ai** — still pending per chat transcript ("I can change it once I'm back home tomorrow"). Bump.
4. **Agent traits propagation bug** Zaal observed — was it fixed in current sprint?
5. **Pricing for multiple bonfires** — Genesis NFT mint 0.1 ETH × N. Discount for ZAO ecosystem batch? Or is the multi-bonfire model the wrong shape (one big bonfire with ontology-partitioned domains)?
6. **TypeScript SDK** — is it on the roadmap, or stay Python-only?
7. **Webhook / event stream out** — when a kEngram updates, can ZOE subscribe rather than poll? Affects V1 latency.

### What's In Scope For The Founder Session vs. Now

Per the chat transcript, the founder said "this sprint is a bunch of new features, would love to do a joint session after." Sprint blockers visible from the chat:
- Custom slug rename for zabal.bonfires.ai
- Agent trait bug
- Skill rewrites in progress

**Now (don't wait):**
- Phase 1 V2 git post-commit hook (uses only stable CLI surface)
- Phase 1 V3 textsplitter + Wavewarz audio ingest (preprocessor side; doesn't depend on new features)
- Phase 1 V1 ZOE capture wrapper (uses stable `kengram batch`)

**After session:**
- V4 MCP integration (founder will know the right pattern post-sprint)
- V5 multi-bonfire economics conversation
- V6 GitNexus + Bonfires combined indexing

## What Already Exists vs. What To Build

| Surface | Status | Owner |
|---|---|---|
| ZABAL bonfire | LIVE at app.bonfires.ai (auto-slug). Custom slug `zabal.bonfires.ai` pending founder action. | Zaal |
| Wavewarz bonfire | Not yet minted | Zaal (decide whether to mint or partition the ZABAL bonfire with ontology profiles) |
| textsplitter repo | LIVE at bettercallzaal/textsplitter (39KB). Purpose was Wavewarz Spaces audio → KG. | Zaal |
| ZOE → Bonfires wrapper | NOT BUILT — Phase 1 task | Zaal + Hermes |
| Post-commit hook | NOT BUILT — Phase 1 task | Zaal + Hermes |
| MCP server | UNKNOWN — needs founder confirm | Founder (check repos) |
| ZAOOS-bonfire | NOT MINTED — should ZAOOS have its own bonfire vs use ZABAL? Decide post-session | Zaal |

## Replicating "Episode On Commit" Without The Founder's Code

The founder told Zaal: "I have a skill on my Claude. I make an episode when I commit on GitHub."

Public API can reproduce this. The pattern:
1. **Trigger:** `git commit -m "..."` (already happens every commit)
2. **Capture:** `.git/hooks/post-commit` runs after every commit
3. **Build payload:** commit SHA + message + author + changed files + diff summary
4. **Push to Bonfires:** `bonfire kengram batch --sync` with a changeset that creates a `Commit:<sha>` node + edges (`AUTHORED_BY`, `TOUCHES_FILE`, optionally `IMPLEMENTS_PROCESS` if GitNexus has indexed processes for the changed files)
5. **Result:** every commit is a content-addressed kEngram. Provenance forever. Queryable via `bonfire delve "what changed in src/lib/auth this month"`.

The neat property: kEngrams are merkle-rooted. The hash of the kEngram changes if ANY node/edge in it changes. So you can prove "this commit added the FISHBOWLZ revival doc" without trusting Bonfires server-side — the merkle root is the proof.

## How This Fits The Bigger ZAO Picture

- **Doc 601 primary surfaces:** Bonfires is already listed as one of the 5 surfaces. This doc grounds that line in actual implementation steps.
- **Doc 657 (Plural Events deliberation):** Polis / dembrane / Agora / RadxChange QV are TALKING infrastructure. Bonfires is REMEMBERING infrastructure. Together: "talk + remember" stack for The ZAO + ZAOstock + COC Concertz event ops.
- **Doc 660 (X content extraction v2):** The no-login fetcher is the perfect upstream feed for a Bonfires "X archive" kEngram. Every research session that scrapes X content can sync to a bonfire automatically.
- **Doc 661/663 (audits):** GitNexus + Bonfires could automate parts of these audits as continuous indexing instead of point-in-time snapshots.
- **Doc 664 (Frapp-GH async fractal):** The Frapp-GH ranking results could push to a `Fractal Session Week N` kEngram for permanent record + Respect provenance.
- **WaveWarZ:** textsplitter feeds X Spaces transcripts → Wavewarz bonfire → AI agents that know the full WaveWarZ history.
- **Newsletter / "Year of the ZABAL":** every newsletter issue = an episode in the ZABAL bonfire. Newsletter agent queries the bonfire for context when drafting next issue.

## Hard Numbers

- 15+ active public repos in NERDDAO org. bonfires-sdk last commit 2026-05-18.
- 7 main top-level CLI commands + 11 kEngram sub-commands + 1 batch command (the recommended path).
- 4 graph modes (adaptive / static / regenerate / append).
- 5 environment variables for bonfires-sdk config.
- 7 GitNexus MCP tools + 6 MCP resources.
- 7 graph-schema node types + 7 edge types in GitNexus.
- Genesis NFT mint price: 0.1 ETH at `mint.bonfires.ai`.
- API base: `https://tnt-v2.api.bonfires.ai`.
- ZOE current memory model: Letta 4-block (per `project_zoe_soul_architecture.md`).
- Bonfires-sdk install: `pip install bonfires`. Python 3.x.

## What Could Go Wrong (Risks)

| Risk | Mitigation |
|---|---|
| Founder's sprint changes the CLI surface, breaking the post-commit hook | Pin to a specific bonfires-sdk version (`pip install bonfires==X.Y.Z`); re-validate after each Bonfires release |
| API key leakage via repo commit | `~/.config/bonfires/config.env` chmod 600. Git pre-commit hook scans for `BONFIRE_API_KEY=` (per `.claude/rules/secret-hygiene.md` pattern) |
| Post-commit hook adds latency to git commit | Run the bonfire call in background (`& disown`); commit returns immediately |
| Subprocess latency for ZOE captures | If > 500ms median, ship a TS wrapper around REST API instead of CLI |
| Multi-session conflicts on kEngram updates | `--local` flag (kEngram edits without KG sync) + reconcile periodically with `kengram repin` |
| Vendor lock-in to Bonfires | kEngrams export to canvas / OWL / markdown — open standards. If Bonfires sunsets, we have local Obsidian-compatible vaults. |

## Next Actions

| Action | Owner | Type | By When |
|---|---|---|---|
| Update memory file `project_bonfires_zao_integration` with NERDDAO org name + bonfires-sdk install path + Phase 1 status | @Zaal | Memory update | After this PR merges |
| Get BONFIRE_API_KEY via dashboard signed message; store at `~/.config/bonfires/config.env` (chmod 600) | @Zaal | Local setup | This week |
| `pip install bonfires` + run `bonfire bonfires` to verify ZABAL is visible | @Zaal | Local setup | This week |
| Build + ship `.git/hooks/post-commit` for ZAOOS — Phase 1 V2 (episode on commit). Document in CLAUDE.md. | @Zaal + Hermes | PR | Next sprint |
| Build `bot/src/zoe/bonfire.ts` wrapper — Phase 1 V1 (ZOE captures → kEngrams) | @Zaal + Hermes | PR | Next sprint |
| textsplitter README — explain Wavewarz Spaces transcript → kEngram pipeline; mark KEEP-not-archive (corrects Doc 663e) | @Zaal | PR on bettercallzaal/textsplitter | This week |
| DM founder with the 7 open questions from this doc | @Zaal | DM | This week |
| Schedule the joint session post-sprint (founder offered) | @Zaal | Calendar | Next 2 weeks |
| After session: V4 MCP integration to make /zao-research query bonfire by default | @Zaal | Skill update | Post-session |
| Re-validate this doc 60 days out (Bonfires API will likely change) | @Zaal | Recurring | 2026-07-17 |

## Sources

- [bonfires.ai homepage](https://bonfires.ai)
- [docs.bonfires.ai](https://docs.bonfires.ai) — Obsidian Publish docs
- [app.bonfires.ai/dashboard](https://app.bonfires.ai/dashboard) — agent + bonfire management
- [mint.bonfires.ai](https://mint.bonfires.ai) — Genesis NFT mint
- [api.bonfires.ai (tnt-v2)](https://tnt-v2.api.bonfires.ai) — API base
- [NERDDAO org](https://github.com/NERDDAO) — GitHub org
- [NERDDAO/bonfires-sdk](https://github.com/NERDDAO/bonfires-sdk) — Python SDK + CLI (default branch `canon`)
- [NERDDAO/bonfires-webapp](https://github.com/NERDDAO/bonfires-webapp) — dashboard frontend
- [NERDDAO/bonfire-tools](https://github.com/NERDDAO/bonfire-tools) — dev tools (ingest.py, server.py, memory-explorer.html, pulse.html)
- [NERDDAO/synthesis-frontend](https://github.com/NERDDAO/synthesis-frontend) — hyperblog aggregator
- [NERDDAO/memento-mori](https://github.com/NERDDAO/memento-mori) — agent-network showcase (42 AI agents, CrewAI)
- [NERDDAO/bonfire-rpg](https://github.com/NERDDAO/bonfire-rpg) — shared-world-memory showcase
- [Bonfires-cli SKILL.md (verbatim)](https://github.com/NERDDAO/bonfires-sdk/blob/canon/.claude/skills/bonfires/bonfires-cli/SKILL.md) — primary source for CLI surface
- [GitNexus-guide SKILL.md (verbatim)](https://github.com/NERDDAO/bonfires-sdk/blob/canon/.claude/skills/gitnexus/gitnexus-guide/SKILL.md) — primary source for GitNexus
- ZAO chat transcript with founder (private; partial content in memory `project_bonfires_zao_integration.md`)
- Memory: `project_bonfires_zao_integration.md` (saved 2026-05-17)
- Memory: `project_zoe_soul_architecture.md` (current Letta 4-block memory model)
- Doc 601 — primary-surface decision listing Bonfire as canonical
