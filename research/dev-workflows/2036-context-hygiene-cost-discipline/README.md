---
topic: dev-workflows
type: audit
status: research-complete
last-validated: 2026-07-23
related-docs: 441
original-query: "https://www.reddit.com/r/vibecoding/s/oHoYsHfqPv research this"
tier: STANDARD
---

# 2036 - Context hygiene as cost discipline (TokenScope audit applied to ZAOOS)

> **Goal:** Take the r/vibecoding context-cost audit + TokenScope, apply its lens to ZAOOS's real numbers, and turn it into concrete safe fixes - without running untrusted code.

## Key Decisions (recommendations first)

| # | Decision | Why (grounded in ZAOOS numbers) |
|---|----------|-------------------------------|
| 1 | **Keep prompt caching as the #1 cost lever.** It is already the discipline in `.claude/rules/claude-usage.md` (cache-aware, no idle-heartbeat past the cache TTL). | The audit found prompt caching saved ~$15.6k - dwarfing every other optimization combined. This is the biggest win and ZAOOS already does it; do not regress it. |
| 2 | **Compact MEMORY.md now.** | MEMORY.md is ~20KB and a PostToolUse hook already warned it is approaching its 24.4KB read limit. It loads into context every session. One line per entry; move detail into topic files. |
| 3 | **Prune the 8+ stale agent worktrees.** | `.claude/worktrees/agent-*` and `worktrees/` each hold a full copy of the 59M research tree - the same 4,702-line transcript appears 8+ times on disk. `git worktree prune` + remove unchanged ones. Pure bloat, zero value. |
| 4 | **Give big docs a cheap entry point.** Large transcripts (4,702 lines) and hub docs should have a short summary at the top so an agent reads the summary, not the whole file. | The audit's top waste pattern: a 5,649-line append-only file re-read 118 times at full token cost. ZAOOS's rule "grep research/*/README.md, never bulk-read" is the right instinct - extend it with summary-first docs. |
| 5 | **Do NOT run TokenScope autonomously.** It is `npx`-run third-party code from a Reddit post. Zaal can run it himself (eyes-on) for a full per-file audit; an agent must not execute untrusted code on the repo/logs. | Safety: executing unknown code is out of scope for autonomous work. The safe ZAO-native signals in this doc were computed with local tools only. |

## The audit (r/vibecoding, verified)

A developer audited 3 months of Claude Code usage: **~$4,935 API-equivalent context cost across 60 sessions (4.2B context tokens)**, then released **TokenScope** (`github.com/AviVAvi/TokenScope`), a free local tool that scores "context hygiene" 0-100 from your own logs. Top waste patterns:

1. **Append-only docs** - a 5,649-line notes file re-read 118 times, full token cost each read.
2. **Retry waste** - 455 failed commands (~$201) from OS-incompatible commands; three lines in CLAUDE.md prevents the category.
3. **Unused MCP servers** stay loaded into every request (constant marginal cost).
4. **Prompt caching** was the single biggest saver (~$15.6k), far above everything else.

## ZAOOS real numbers (computed locally, 2026-07-23)

| Signal | Value | Note |
|--------|-------|------|
| `research/` size | **59M** | institutional memory; grows unbounded by design |
| research README files | **~1,914** | inflated by stale worktree copies; canonical count is lower |
| Always-loaded session context | **~915 lines** | CLAUDE.md (185) + AGENTS.md (162) + `.claude/rules/*` (568) - every session, before any work |
| MEMORY.md | **~20KB** | near its 24.4KB read limit; loads every session |
| Largest real doc | **4,702-line transcript** | `research/events/753-.../transcript.md` - re-read risk |
| Stale agent worktrees | **8+** | each duplicates the full 59M research tree on disk |

**Read-across:** ZAOOS already does the biggest thing right (prompt caching + grep-not-bulk-read). The concrete waste is (a) MEMORY.md near its limit, (b) stale worktrees duplicating everything, (c) a few very large docs with no cheap entry point. All three are cheap to fix and none require touching `.claude/settings.json`.

## Also See

- [Doc 441 - everything-claude-code integration](../441-everything-claude-code-integration/) (where the rules came from)
- `.claude/rules/claude-usage.md` (surface tiering + spend discipline - the existing policy this extends)
- Memory: `project_claude_usage_audit_jul3`, `project_cheap_ai_stack`

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Compact MEMORY.md to under ~17KB (one line per entry, detail to topic files) | Zaal | edit | 2026-07-30 |
| `git worktree prune` + remove the 8+ stale agent worktrees (unchanged only) | Zaal | chore | 2026-07-30 |
| Add a 3-line summary header to the 3 largest transcripts/hub docs | Zaal | edit | 2026-08-06 |
| (Optional, eyes-on) Zaal runs TokenScope on ZAOOS for a full per-file audit | Zaal | tool | when convenient |

## Sources

- [FULL] r/vibecoding thread (resolved from the /s/ shortlink), 2026-07-23 - the cost-audit post + top comments.
- [FULL] `github.com/AviVAvi/TokenScope` - the tool's README.
- [FULL] Local ZAOOS analysis (du/wc/find over the repo), 2026-07-23.
