### 462 — Hyperspell "Company Brain" Pattern: Build vs Buy for ZAO

> **Status:** Research complete + concrete ZAO adoption spec
> **Date:** 2026-04-20
> **Goal:** Translate Conor Brennan-Burke's [Hyperspell company-brain thesis](https://x.com/contextconor/status/1913839492836524032) (YC F25, 312K views) into a concrete ZAO build plan. Decide build vs buy. Identify which pieces ZAO already has, which to build, what to keep stealing from the post.
> **Builds on:** docs 234, 236, 297, 299, 300, 309, 460, 461

---

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **Buy Hyperspell?** | NO. YC F25 = 6 months old, vendor lock-in, our data is local + sensitive (signer keys, member CSV, fractal records). Our local-first build-in-public ethos demands the substrate be in our repo. |
| **Adopt the thesis?** | YES — wholesale. The retrieval-vs-synthesis distinction is the right frame. ZAO already does half of it (research library, .claude/memory.md, ADRs, openclaw MEMORY.md). The missing half is **the synthesis pass that resolves conflicts and tracks source authority**. |
| **Substrate for "company brain"** | USE `zao-memory` private git repo (already proposed in doc 460 Gap 1). Add `BRAIN/` directory structured by entity. Files agents read = exact pattern Conor proposes; we already do this with research/. |
| **Synthesis engine** | USE a daily Claude Routine (per doc 422 — already plan to migrate cron to Routines). Reads sources, applies conflict-resolution rules, writes BRAIN files. Cheap (~$0.50/run with Haiku). |
| **Source hierarchy** | USE 4-tier authority: (1) signed contracts + on-chain state + Supabase RLS-protected tables = TRUTH, (2) ADRs + .claude/memory.md = ARCHITECTURAL TRUTH, (3) committed research docs = INTENT, (4) chat logs (Telegram/email) = SIGNAL but not TRUTH. Higher tier wins on conflict. |
| **Identity resolution** | USE a `BRAIN/people/<canonical-fid>.md` per person. Aliases (email, X handle, Farcaster username, Telegram chat_id) all link to the canonical FID. ZAO already has FIDs as natural keys for community members — exploit this. |
| **Freshness tracking** | USE `last_confirmed_at` timestamp at top of every BRAIN file. Sources older than 30 days flagged "stale" in agent reads. ECC `continuous-learning-v2` decay mechanism is precedent. |
| **What to NOT build (yet)** | SKIP a "context benchmark" suite for now. Premature. Revisit after BRAIN/ has 30 days of synthesis to score against. |
| **First synthesis target** | START with `BRAIN/projects/zao-stock.md` — Oct 3 2026 event, sources scattered across research/events/, Telegram, Hannah interview prep, sponsor pitch decks, Steve Peer notes. Real conflicts (date drift, sponsor list churn). Highest ROI prototype. |

---

## What Hyperspell Pitches

[Conor's thread](https://x.com/contextconor/status/1913839492836524032) (Apr 19 2026, 312K views) crystallizes a frame the rest of the agent industry is missing:

| Frame | Says |
|-------|------|
| Retrieval (today) | At runtime, search across tools (RAG, vector DB, MCP, semantic search). Every query starts from zero. Returns whichever fragment matches first. |
| Synthesis (Hyperspell pitch) | Maintain a continuously-updated representation of company truth. Files-on-disk that any agent reads. Conflicts resolved upstream, not at query time. |

Their product:
- Pre-built connectors (Gmail, Notion, Slack, etc.)
- "Agentic Memory Network" — proprietary synthesis layer
- Surfaces as filesystem any agent can read
- $30M ARR API exec + Tom Blomfield's YC group
- 6 months old, no public pricing

Their core technical claims (worth stealing regardless of buy decision):
1. **Conflict resolution belongs upstream** — pick a winner before agents query, don't punt
2. **Source authority hierarchy** — CEO email beats random Slack thread, signed contract beats CRM field
3. **Identity resolution across aliases** — Lisa Chen / @Lisa / Lisa.Chen@acme.com / "L. Chen" = one entity
4. **Freshness tracking** — 6-month-old strategy doc ≠ 10-min-old message
5. **Multi-source synthesis** — answers nobody wrote individually emerge from combination
6. **Filesystem as universal interface** — every agent reads files; no custom integration needed

---

## What ZAO Already Has (= half the system)

| Hyperspell concept | ZAO equivalent today |
|--------------------|----------------------|
| Files agents read | `research/` (240+ docs), `docs/adr/` (4 ADRs), `.claude/memory.md`, `~/.claude/projects/.../memory/`, `/home/node/openclaw-workspace/MEMORY.md` |
| Source authority | Implicit — Supabase RLS = truth, repo = intent, but no explicit tier table |
| Identity resolution | Partial — FIDs are natural keys for members; emails/Telegram chat_ids tracked separately, no canonical link |
| Freshness | Per-doc `Date:` header; no decay mechanism; ECC `continuous-learning-v2` adds confidence scores (passive) |
| Conflict resolution | NOT DONE. Today: 3 memory stores (project / per-user / openclaw) drift independently (doc 460 Gap 1 + 2) |
| Synthesis pass | NOT DONE. No process reads all sources + emits unified state |
| Connectors | Existing MCPs: Gmail, Calendar, Drive, grep, notion, context7, playwright + plugin-bundled (github, exa, memory, sequential-thinking). Telegram + Supabase via direct SDK. |

**Verdict:** ZAO is 50% there. Missing piece is the synthesis pass.

---

## What ZAO Needs to Build (the BRAIN layer)

### Substrate

Private git repo `zao-memory` (already proposed in doc 460 Gap 1). Add a top-level `BRAIN/` directory:

```
zao-memory/
├── BRAIN/
│   ├── people/
│   │   ├── 1447437687-zaal.md          # canonical FID -> identity
│   │   ├── <fid>-steve-peer.md
│   │   └── <fid>-tom-fellenz.md
│   ├── projects/
│   │   ├── zao-stock-2026-10-03.md     # event, sponsors, team, timeline
│   │   ├── farmdrop-soulbenders-may-24.md
│   │   ├── ecc-integration.md
│   │   └── zoe-agent-stack.md
│   ├── decisions/
│   │   └── (mirrors docs/adr/, with cross-source confirmations)
│   ├── relationships/
│   │   ├── ellsworth-network.md         # Steve, art council, Wallace Events
│   │   └── farmdrop.md                  # Hannah, Sam Lardner
│   └── _meta/
│       ├── source_authority.md          # the 4-tier table
│       ├── conflicts.md                 # unresolved conflicts log
│       └── freshness_report.md          # what's stale (>30d unconfirmed)
├── memory/                              # per-user auto-memory mirror (Gap 1)
└── workspace/                           # ZOE workspace mirror (Gap 2)
```

### Synthesis Engine

A nightly Claude Routine (per doc 422) — `synthesize-brain` — that:

1. **Pulls sources** in priority order:
   - GitHub repo (`research/`, `docs/adr/`, `.claude/memory.md`, `community.config.ts`, `src/lib/agents/config.ts`)
   - Supabase (`agent_events`, `audit_log`, `profiles`, `casts`)
   - openclaw workspace (`/home/node/openclaw-workspace/{SOUL,MEMORY,TASKS,HEARTBEAT}.md`)
   - Auto-memory dirs (after Gap 1 sync lands)
   - Telegram threads (via ZOE bot history)
   - Calendar events (via gcal MCP)
   - Email threads (via Gmail MCP, scoped to forwarded research/inbox)

2. **Applies the 4-tier authority** when sources conflict.

3. **Resolves identity** by matching aliases to canonical FID.

4. **Updates freshness** — bump `last_confirmed_at` if a source mentions an entity with new info; log to `_meta/freshness_report.md` if no confirmation in 30 days.

5. **Logs conflicts** to `_meta/conflicts.md` with sources + chosen winner + reasoning.

6. **Commits + pushes** to `zao-memory` repo. Every dev machine + ZOE container `git pull`s on session start.

Cost estimate: ~5K input tokens + 2K output per BRAIN file × 50 files × 1 run/day = 350K tokens/day on Haiku 4.5 = **~$0.50/day** ($15/mo).

### Source Authority Table (4 tiers)

```markdown
# BRAIN/_meta/source_authority.md

Tier 1 — TRUTH (immutable or RLS-enforced)
- Signed contracts (PDF in repo + counterparty signature)
- On-chain state (Base txs for ZABAL, staking, bounty board)
- Supabase tables with strict RLS (agent_events, audit_log)

Tier 2 — ARCHITECTURAL TRUTH (committed by Zaal)
- docs/adr/*.md (Architecture Decision Records)
- .claude/memory.md (project memory)
- community.config.ts (branding, channels, contracts)

Tier 3 — INTENT (committed by Zaal but mutable)
- research/**/*.md (240+ docs)
- src/lib/agents/config.ts
- ZOE workspace SOUL.md / AGENTS.md / TASKS.md

Tier 4 — SIGNAL (raw, unconfirmed)
- Telegram threads
- Email
- Slack (if added later)
- Casts on Farcaster
- Meeting transcripts

When sources conflict, higher tier wins. Tier 4 NEVER overrides Tier 1.
```

### Identity Resolution

Each `BRAIN/people/<FID>-<slug>.md`:

```markdown
---
fid: 1447437687
name: Zaal Panthaki
aliases:
  email: [zaalp99@gmail.com]
  telegram_chat_id: [1447437687]
  x_handle: ['@bettercallzaal']
  farcaster_username: ['bettercallzaal']
  ens: ['bettercallzaal.eth']
last_confirmed_at: 2026-04-20T16:00:00Z
---

## Role
Founder, The ZAO. ZAO Stock co-producer.

## Active relationships
- [Steve Peer](./1234-steve-peer.md) — co-curator, Ellsworth
- [Tom Fellenz](./5678-tom-fellenz.md) — Th Revolution, ZAOstock pitch
...
```

ZAO already uses FIDs as natural keys in `community.config.ts` (`adminFids`, `allowedFids`). Reuse, don't reinvent.

### Freshness Tracking

Every BRAIN file gets a `last_confirmed_at` timestamp. The synthesis engine bumps it when a source mentions the entity. After 30 days no confirmation → log to `_meta/freshness_report.md`. Agents reading a stale file see the warning in the frontmatter.

ECC `continuous-learning-v2` already does this for instincts (confidence decay). Steal the mechanism, apply to BRAIN files.

---

## Comparison of Options

| Option | Build vs Buy | Cost | Time | Lock-in | Verdict |
|--------|--------------|------|------|---------|---------|
| **A. Sign up for Hyperspell** | Buy | Unknown (closed beta), assume $50-200/mo | 1 hour signup | Vendor data lives at Hyperspell | REJECT — too early, our data is sensitive, their pricing opaque |
| **B. Build BRAIN/ in `zao-memory` repo + nightly Routine** | Build | ~$15/mo Anthropic Haiku | 2-3 days to first prototype | None (just files) | **ADOPT** — matches our local-first ethos, files agents already read |
| **C. Use Graphify (already installed) for synthesis** | Build (cheap) | $0 + LLM | 1 day | None | OPTIONAL companion — Graphify produces knowledge-graph viz, doesn't write BRAIN files. Use to visualize what BRAIN/ contains. |
| **D. Wait until Hyperspell hits GA** | Defer | $0 now | 6-12 months | TBD | REJECT — Conor's right that "you can't fast-forward" — the compounding starts on day 1 of synthesis |
| **E. Letta/MemGPT/Cognee/Graphiti as substrate** | Build with library | $0 + LLM + ops | 5-7 days, self-host | Library lock-in | OPTIONAL backend — start with plain markdown, swap in graph DB only when scale demands |

---

## ZAO Ecosystem Integration

Files / paths affected by adoption:
- New repo: `zao-memory` (private, per doc 460 Gap 1) — substrate for BRAIN/
- New Routine in `zao-routines` repo (per doc 422): `synthesize-brain.md`
- New skill: `~/.claude/skills/brain-query/SKILL.md` — convenience wrapper for "ask BRAIN about <X>"
- Source taps:
  - `community.config.ts` — adminFids, channels (already there)
  - `src/lib/db/supabase.ts` — agent_events, audit_log (already there)
  - `src/lib/agents/config.ts` — agent state
  - `/home/node/openclaw-workspace/{SOUL,MEMORY,TASKS,HEARTBEAT}.md` (after Gap 2 sync to git)
  - Telegram bot history (via ZOE)
  - gcal MCP (via Calendar)
  - Gmail MCP (via Gmail)
- Read by:
  - Every Claude Code session at boot (via `.claude/memory.md` pointing to BRAIN/)
  - ZOE on cron (via openclaw context loading)
  - ZOE learning pings (BRAIN files become a top-priority source)
  - Future agent additions (read files, no integration needed)

---

## First Concrete Prototype: `BRAIN/projects/zao-stock-2026-10-03.md`

Highest-ROI starting point. ZAO Stock has:
- 5+ research docs (`research/events/443`, `445`, `448`, `455`, etc.)
- Telegram threads with sponsors
- Steve Peer notes (`project_steve_peer.md`)
- Sponsor pitch deck variants
- Hannah Semler interview prep (doc 456)
- Farmdrop x SoulBenders crossover (doc 458)
- A canonical date that has shifted twice (per project_zao_stock_confirmed.md)

This means **real conflicts** the synthesis layer must resolve. If the synthesis works on this, it works.

Output the prototype manually first (1 hour Zaal + Claude pair). Then automate via Routine.

Acceptance: when Zaal asks "what's the current ZAO Stock state?" — open `BRAIN/projects/zao-stock-2026-10-03.md` and the answer is right there, current, sourced.

---

## Specific Numbers

| Metric | Value |
|--------|-------|
| Hyperspell YC batch | F25 (Fall 2025, ~6 months in) |
| Conor's prior role | $30M ARR API at Checkr |
| Thread views (2026-04-19 post) | 312.7K |
| ZAO existing memory stores | 3 (project / per-user / openclaw) — drift, no synthesis |
| ZAO existing research docs | 240+ |
| ZAO ADRs | 2 (more coming per ADR-001/002) |
| Doc 460 cross-machine memory drift gap | Identified, fix proposed (`zao-memory` repo) |
| Estimated BRAIN/ files at v1 | 30-50 (people: 10, projects: 15, decisions: 10, relationships: 5, meta: 4) |
| Synthesis cost on Haiku 4.5 | ~$0.50/day, ~$15/mo |
| Time to first BRAIN prototype | 1 hour (manual zao-stock.md), 2-3 days (full synthesis Routine) |

---

## Adoption Plan

### This Week
| # | Task | Difficulty |
|---|------|------------|
| 1 | Open private `zao-memory` repo (per doc 460 Gap 1) — block for everything else | 1/10 |
| 2 | Hand-write the prototype: `BRAIN/projects/zao-stock-2026-10-03.md` from existing scattered sources. Real conflict resolution. | 3/10 (1 hour pair) |
| 3 | Hand-write `BRAIN/_meta/source_authority.md` — codify the 4-tier hierarchy | 1/10 |
| 4 | Verify reading the BRAIN file from a Claude session is more useful than searching scattered sources for the same info | 1/10 |

### This Month
| # | Task | Difficulty |
|---|------|------------|
| 5 | Build `synthesize-brain` Claude Routine (per doc 422) — pulls 8 sources, applies authority, writes BRAIN files | 6/10 |
| 6 | Add identity-resolution: `BRAIN/people/<FID>-<slug>.md` for Zaal + 5 most-mentioned community members | 4/10 |
| 7 | Wire BRAIN/ as auto-loaded context: every Claude session reads `BRAIN/_meta/freshness_report.md` + relevant entity files | 3/10 |
| 8 | Add Graphify pass on BRAIN/ to produce visual graph (doc 297) | 2/10 |

### This Quarter
| # | Task | Difficulty |
|---|------|------------|
| 9 | Migrate openclaw workspace to be sourced FROM BRAIN/, not parallel to it (Gap 2 + this) | 7/10 |
| 10 | Conflict-resolution dashboard at `/admin/brain` showing `_meta/conflicts.md` with one-click resolution | 5/10 |
| 11 | Build the "context benchmark" Conor mentions — script asks 20 questions, scores BRAIN's answers vs ground-truth Zaal answers. Run weekly. | 6/10 |
| 12 | Open-source the BRAIN substrate pattern as a public template (matches build-in-public ethos) | 4/10 |

---

## Sources

- [Conor Brennan-Burke (@contextconor) — original thread, Apr 19 2026](https://x.com/contextconor/status/1913839492836524032)
- [Hyperspell official site](https://www.hyperspell.com/)
- [Hyperspell on Y Combinator](https://www.ycombinator.com/companies/hyperspell)
- [Conor on YouTube — AI Agent Memory talk](https://www.youtube.com/watch?v=oJblqCulVWU)
- ZAO doc 234 — OpenClaw memory + knowledge graphs
- ZAO doc 297 — Graphify for codebase knowledge graphs (already installed as `/graphify`)
- ZAO doc 299 — LLM knowledge bases + wiki systems
- ZAO doc 300 — AI memory + agent infrastructure (MemPalace, Archivist OSS)
- ZAO doc 309 — Karpathy's LLM-wiki / codebase-as-compiler
- ZAO doc 460 — agentic stack end-to-end design (Gap 1: cross-machine memory drift)
- ZAO doc 422 — Claude Routines automation stack

---

## Why This Matters For ZAO Specifically

1. **Build-in-public requires synthesis.** Newsletters, Year of the ZABAL daily posts, big-win documentation — all require pulling current state from scattered sources. Synthesis cuts 80% of the manual gathering.
2. **Multiple agents need shared context.** ZOE, ZOEY, WALLET, ROLO, VAULT, BANKER, DEALER — and Claude Code on Mac + Win + AO on VPS. Today they each have a partial view. BRAIN/ gives them one shared view.
3. **The compounding moat is real.** Conor's right that "you can't write a check and skip to month six." Day 1 of BRAIN/ synthesis is the start of an asset that grows daily.
4. **It maps to ZAO Master Context (doc 432).** The Tricky Buddha Space positioning ("music first, community second, tech third") is canonical AS LONG AS it's reaffirmed by recent activity. BRAIN/ keeps the doc 432 truth from going stale.
5. **It unblocks ZOE's 30-min learning pings (PR #240).** Today the pings draw from research/ random doc. With BRAIN/, pings can target "what changed today" — much more actionable.

---

## Next Action

**Step 1 only:** open the `zao-memory` private repo on GitHub. Everything else cascades from that. ETA: 5 minutes.

After repo exists, hand-write the `BRAIN/projects/zao-stock-2026-10-03.md` prototype (1 hour pair). If it feels useful, build the Routine. If not, kill the experiment cheaply.
