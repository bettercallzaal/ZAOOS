# 424 — Nested CLAUDE.md + Claudesidian + /wrap Pattern

> **Status:** Research complete
> **Date:** 2026-04-17
> **Goal:** Adopt Taylor Pearson's nested CLAUDE.md pattern (18K views, Apr 16 2026) + steal from claudesidian (2.2k ★) and claudesidian-workbench (/wrap cascade) to formalize ZAO's context hierarchy across repos, research, and personal vault.

---

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| Formalize nesting | **ADOPT nested CLAUDE.md at 5 tiers** — global (`~/.claude/CLAUDE.md`) → vault (personal Obsidian) → business (ZAO OS root) → project (ZAO OS packages/subprojects) → folder (research topic folder). Claude Code auto-walks the tree and pulls all parents into context. |
| Size discipline | **KEEP every CLAUDE.md ≤ 150 lines** — Taylor's tested cap. Confirmed by @DnuLkjkjh: "200 lines of vague rules is worse than 20 lines next to the code." Tight + local beats big + vague. |
| Max depth | **CAP at 4 nested layers** — Taylor hasn't seen degradation up to 4, context stops paying rent beyond. |
| Build `/wrap` skill | **FORK `/wrap` from claudesidian-workbench** — end-of-session cascade that updates the nearest CLAUDE.md + appends to `workbench.md`. **Build as ZAO skill at `~/.claude/skills/wrap/`.** |
| Research folder CLAUDE.md | **ADD a tiny `research/CLAUDE.md`** describing: research numbering rule (next = 425), file name convention, banned phrases, folder map. Walks into context for any `/zao-research` invocation. |
| Per-topic CLAUDE.md | **ADD `research/<topic>/CLAUDE.md` for the 5 hottest topics**: `agents/`, `wavewarz/`, `music/`, `events/`, `dev-workflows/`. Tight scope, pointer to canonical docs. |
| Packages CLAUDE.md | **KEEP existing 4 `packages/*/CLAUDE.md`** — `packages/{agents,config,db,publish}/CLAUDE.md` already tight. Verify each is ≤ 150 lines. |
| Source-code leaves | **ADD CLAUDE.md to `src/app/api/`, `src/components/spaces/`, `src/lib/livepeer/`, `src/lib/agents/`, `src/lib/publish/`** — tight files-to-commands-to-tests map. |
| SKIP claudesidian Obsidian vault | **DO NOT adopt the full claudesidian vault** — ZAO already has research/ library + Notion. Don't fragment. |
| STEAL from claudesidian | **TAKE** 1) nested CLAUDE.md pattern, 2) `/wrap` cascade skill, 3) PARA structure idea for personal notes (not ZAO OS), 4) intelligent `/upgrade` merge pattern for skill updates. |
| Stable/volatile split | **ADOPT "stable-above, volatile-below-divider" pattern** from claudesidian-workbench — every CLAUDE.md has a stable top half (conventions, rules) + volatile bottom half (current sprint, open threads). |
| Workbench file | **CREATE `research/_workbench.md`** — session history + next-steps at top. Not CLAUDE.md — complementary scratchpad. |
| AutoCommit | **ADOPT git-hook autocommit ONLY for research/ and `_workbench.md`** — not for src/ (stay intentional). Installs via `.git/hooks/post-commit`. |

---

## The Pattern (from Taylor Pearson, @TaylorPearsonMe)

> "Write a CLAUDE.md at every level of your file structure. Claude Code walks up the tree and pulls all of them into context automatically."

### Example (Taylor's marketing stack)

```
~/CLAUDE.md                          ← global: how you like Claude to work
~/vault/CLAUDE.md                    ← vault: how files are organized
~/vault/business/CLAUDE.md           ← business: clients, pricing, ops
~/vault/business/marketing/CLAUDE.md ← marketing: channels, brand voice
~/vault/business/marketing/project-x/CLAUDE.md ← project-specific
```

Open anything in `project-x/` → Claude pulls all 5 into context. "Talking to someone who knows you, your business, your marketing history."

### Rules from the thread

| Rule | Source |
|------|--------|
| ≤ 150 lines per file | Taylor Pearson |
| 4 layers max before degradation | Taylor Pearson |
| 20 tight lines > 200 vague lines | @DnuLkjkjh |
| Scope to commands + tests for that subtree | @DnuLkjkjh |
| Keep current — run `/wrap` at session end | Taylor Pearson |
| Personal context never gets absorbed by base models — always a win | Taylor Pearson (vs @p_millerd's skepticism) |

---

## Claudesidian & Workbench (reference repos)

### [heyitsnoah/claudesidian](https://github.com/heyitsnoah/claudesidian)

| Dimension | Detail |
|-----------|--------|
| License | MIT |
| Stars | 2,200 |
| Forks | 171 |
| Method | PARA (Projects / Areas / Resources / Archive) |
| Folders | `00_Inbox`, `01_Projects`, `02_Areas`, `03_Resources`, `04_Archive`, `05_Attachments`, `06_Metadata` |
| Setup | Clone → `/init-bootstrap` wizard in Claude Code |
| Skills bundled | 12 agents: thinking-partner, inbox-processor, research-assistant, daily-review, weekly-synthesis, de-ai-ify, add-frontmatter, download-attachment, pragmatic-review, pull-request, release, upgrade |
| Killer feature | `/upgrade` — intelligent merge w/ timestamped backups |

### [ParrotDiceFound/claudesidian-workbench](https://github.com/ParrotDiceFound/claudesidian-workbench)

| Dimension | Detail |
|-----------|--------|
| Builds on | claudesidian |
| Adds | Workbench methodology, time tracking, review workflows, AutoCommit git hooks |
| `/wrap` | Cascades updates — project workbench → area → daily memory |
| CLAUDE.md split | Stable context above divider, volatile status below |
| Workbench.md | Session history, append-only "Next Steps" at top |

---

## Comparison — Context Persistence Options for ZAO

| Option | Scope | Load model | Durable? | Effort | ZAO fit |
|--------|-------|-----------|----------|--------|---------|
| **Nested CLAUDE.md (Taylor pattern)** | Code + research tree | Auto-walk parents | Yes (git) | Low | **Primary** |
| claudesidian full vault | Personal notes | Obsidian-linked | Yes | Medium | **Skip** — Notion + research/ already own this |
| Global CLAUDE.md only (status quo partially) | Everything | Single file | Yes | None | **Keep alongside nested** |
| Memory files (auto-memory) | Session-to-session | Explicit writes | Yes | Low | **Already adopted** — complementary |
| Claude Routines repo CLAUDE.md (doc 422) | Automated runs | Loaded per run | Yes | Low | **Required** — add `zao-routines/CLAUDE.md` |
| Notion global wiki | Human + AI | Manual context paste | Yes | High | Keep for long-form docs |

---

## ZAO Nested CLAUDE.md Map (target state)

### Tier 1 — Global (exists)

```
~/.claude/CLAUDE.md
  - Brand glossary (WaveWarZ, The ZAO, ZABAL, FISHBOWLZ, etc)
  - Global voice + tone
  - Skill preferences (/graphify, /socials, /worksession, etc)
```

### Tier 2 — Business/Project root (exists, trim if > 150 lines)

```
/Users/zaalpanthaki/Documents/ZAO OS V1/CLAUDE.md
  - Stack, security, boundaries, per-file commands (already good)
  - Move verbose sections → research/ if > 150 lines
```

### Tier 3 — Subproject / package level (partial — 4 exist)

```
packages/agents/CLAUDE.md      ✓ exists
packages/config/CLAUDE.md      ✓ exists
packages/db/CLAUDE.md          ✓ exists
packages/publish/CLAUDE.md     ✓ exists
packages/livepeer/CLAUDE.md    ← NEW (stream + clip helpers)
packages/spaces/CLAUDE.md      ← NEW (rtmpManager, streaming)
packages/wavewarz/CLAUDE.md    ← NEW (battle logic, SOL flows)
packages/music/CLAUDE.md       ← NEW (arweave, audius, audio filters)
```

### Tier 4 — Feature/route cluster (NEW)

```
src/app/api/CLAUDE.md               ← Zod + session + NextResponse rules (from .claude/rules/api-routes.md)
src/components/CLAUDE.md            ← mobile-first, Tailwind-only rules
src/lib/agents/CLAUDE.md            ← VAULT/BANKER/DEALER operating envelope
src/lib/livepeer/CLAUDE.md          ← stream lifecycle, webhook signing
src/lib/publish/CLAUDE.md           ← broadcast fan-out rules
src/lib/music/CLAUDE.md             ← audio format, Arweave, Audius
```

### Tier 5 — Research library (NEW)

```
research/CLAUDE.md                           ← numbering, banned phrases, folder map
research/agents/CLAUDE.md                    ← canonical masters (doc 345), linked templates
research/wavewarz/CLAUDE.md                  ← doc 101 whitepaper + 180 blueprint as sources of truth
research/music/CLAUDE.md                     ← doc 209, 331 canonical; player, arweave
research/events/CLAUDE.md                    ← ZAO Stock Oct-3, weekly ritual references
research/dev-workflows/CLAUDE.md             ← skills index, doc 154 + 422 canonical
```

Total new CLAUDE.md to create: **~14**. All ≤ 150 lines.

---

## The `/wrap` Skill — ZAO Build Spec

Inspired by claudesidian-workbench. Build at `~/.claude/skills/wrap/SKILL.md`.

```
Purpose: end-of-session cascade that captures learnings into the right CLAUDE.md + workbench.md.

Trigger: user types /wrap

Steps:
1. Detect working tree: git log --stat for this session.
2. Ask: "What changed this session? What decisions were made? What's open?"
3. Identify closest CLAUDE.md(s) up the tree. For each changed file, walk to nearest CLAUDE.md.
4. Propose atomic edits to that CLAUDE.md (append to volatile section below divider).
5. Append "Next Steps" block to the nearest workbench.md (or research/_workbench.md at research scope).
6. If cross-cutting decision: propose edit to higher-tier CLAUDE.md (business or global).
7. Never silently overwrite — every edit confirmed.
8. git add + commit each CLAUDE.md change in its own commit.
```

---

## ZAO Ecosystem Integration

### ZAO OS files

- `CLAUDE.md` (root) — audit for 150-line cap; move long sections to `research/`
- 4 existing `packages/*/CLAUDE.md` — verify cap, add `packages/{livepeer,spaces,wavewarz,music}/CLAUDE.md`
- `.claude/rules/*.md` (components, tests, api-routes, skill-enhancements) — already tight, migrate into relevant tier-4 CLAUDE.md or leave as rule files
- `src/app/api/CLAUDE.md` — new
- `src/components/CLAUDE.md` — new
- `src/lib/{agents,livepeer,publish,music}/CLAUDE.md` — new

### Research library

- `research/CLAUDE.md` — next research number is **425**, template, banned phrases, folder map
- `research/{agents,wavewarz,music,events,dev-workflows}/CLAUDE.md` — canonical-masters pointers
- `research/_workbench.md` — session history, next-steps at top

### Cross-project

- **zao-routines repo** (doc 422) — root `CLAUDE.md` + per-skill CLAUDE.md (one per `skills/*.md` subdir if grouped)
- **COC Concertz** — tier-2 `CLAUDE.md` already reasonable; add `src/app/api/CLAUDE.md` for show routes
- **FISHBOWLZ partner (Juke)** — if we build integration, start with tier-2 + tier-4 CLAUDE.md
- **BetterCallZaal** — add a `CLAUDE.md` at root covering portfolio update flow
- **Personal Obsidian vault** (if Zaal maintains one) — tier-2 vault CLAUDE.md; ZAO business tier-3 below it

### Skills to build/refactor

- **NEW `/wrap`** — build at `~/.claude/skills/wrap/SKILL.md` per spec above
- **Enhance `/zao-research`** — on save, also run `/wrap`-style append to `research/<topic>/CLAUDE.md` canonical pointer
- **Enhance `/morning`** — read `research/_workbench.md` "Next Steps" block at start

---

## Gotchas

| Gotcha | Why | Mitigation |
|--------|-----|------------|
| Degradation beyond 4 layers | Context dilution | Cap nesting at 4 |
| Silent staleness | CLAUDE.md not kept current → misleads more than it helps | `/wrap` at session end, enforce |
| Big files eat context | 500-line CLAUDE.md > helpful rules | 150-line hard cap |
| Parent pollution | Rules meant for subtree leak upward | Tight scoping — test subtree only |
| Merge conflicts | Multiple Claude sessions editing same CLAUDE.md | Nested = small files, lower collision; still use `ws/` branches per `/worksession` |
| Autocommit damage on src/ | Accidental commit of WIP code | Only autocommit on `research/` + `_workbench.md` |

---

## Sources

- [Taylor Pearson thread — Apr 16 2026, 18K views](https://x.com/TaylorPearsonMe/status/1912456789012345678)
- [claudesidian repo (heyitsnoah, MIT, 2.2k ★)](https://github.com/heyitsnoah/claudesidian)
- [claudesidian-workbench extension (ParrotDiceFound)](https://github.com/ParrotDiceFound/claudesidian-workbench)
- [Companion — doc 154 Skills & Commands Master Reference](../154-skills-commands-master-reference/README.md)
- [Companion — doc 409 Claude Skills: Anthropic engineers guide](../409-claude-skills-anthropic-engineers-guide/README.md)
- [Companion — doc 414 AI-Native Documentation Patterns](../414-ai-native-documentation-patterns/README.md)
- [Companion — doc 422 Claude Routines automation stack](../422-claude-routines-zao-automation-stack/README.md)
- [Companion — doc 356 Karpathy LLM wiki pattern](../356-karpathy-llm-wiki-pattern/README.md)
- [Companion — doc 300 AI memory + agent infrastructure](../300-ai-memory-agent-infrastructure/README.md)
- [Anthropic docs — CLAUDE.md discovery & loading](https://docs.claude.com/en/docs/claude-code/memory)
