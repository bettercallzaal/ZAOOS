---
topic: agents
type: decision
status: research-complete
last-validated: 2026-08-06
related-docs: 2225, 2910, 928, 2127
original-query: "gh repo clone clawdbotatg/claude-p-agent, read the actual agent.py + skills/loop code, write a concrete adopt-for-ZAO-swarm spec citing real file:line - what clawd's claude-p loop does that ZOE's loop doesn't, and the specific wire-up"
tier: STANDARD
---

# 2228 - clawd claude-p-agent: what to adopt for ZOE (grounded, file:line)

> **Goal:** Read Austin Griffith / clawd's `claude-p-agent` actual code and name the
> specific, grounded patterns ZOE's loop should adopt - with real file:line, not vibes.

## Grounding (real clone, this run)

`gh repo clone clawdbotatg/claude-p-agent /tmp/clawd-cpa --depth 1` succeeded
2026-08-06. Files read FULL: `README.md`, `ARCHITECTURE.md`, `agent.py` (668 lines),
`tools/self` (status + drift), `tools/vitals`, `tools/watchdog`, `tools/verify`,
`hooks.base.json`, `skills/self/SKILL.md`. License: **MIT** (`LICENSE`, "Copyright (c)
2026 claude-p-agent contributors"). This doc credits **clawdbotatg / Austin Griffith,
claude-p-agent (MIT)** as the source of every pattern below.

The thesis matches doc 2225 (#2910): "**An agent is `claude -p` in a directory, with a
persona and tools. No framework. Claude Code is the loop.**" (`README.md`). ZOE is a
Node/Telegram bot, not a `claude -p` spawner - so we do NOT adopt the engine. What we
adopt is the **operational self-knowledge + self-healing tooling** wrapped around it,
which is engine-agnostic and maps onto ZAO rules we already wrote but never automated.

## The one big finding: clawd has TOOLED what ZAO only has as a RULE

ZAO's `confirm-before-claiming-absence.md` says "never assert X is missing from a
partial read; a confident wrong self-image causes confident wrong edits." clawd states
the identical principle - "**Know yourself by reading, not remembering**... a stale
self-image causes confident wrong edits" (`skills/self/SKILL.md`; `ARCHITECTURE.md`) -
and then **turns it into a script that fails CI** (`tools/self drift`). ZAO has the
rule as prose a human must remember; clawd has the enforcement as an exit code. That
gap is the highest-value adopt.

## Adopt list (ranked, each grounded)

### 1. A doc-drift check that FAILS - `tools/self drift` (tools/self:103-167). ADOPT.

What it does (read FULL): `cmd_drift()` walks the core docs and, for **every repo path
mentioned in backticks**, asserts the path exists on disk; any missing path is a FAIL
(`tools/self:116-117` collects `f"{rel} references missing {p}"`; `:163-166` prints
`drift: FAIL` to stderr and `return 1`). It also asserts every `hooks.base.json`
command exists + is executable (`tools/self:120-133`). Untracked state (modules) only
WARNs, never fails (`tools/self:135-158`) - so the healer never resets tracked files
over an untracked problem. `tools/verify` runs it, so "docs that lie about the code
fail verify" (`skills/self/SKILL.md`).

**Why ZAO wants it:** this is the *enforcement teeth* `confirm-before-claiming-absence.md`
asks for and `anti-fabrication.md` rule 5 (measure, don't guess) implies. Our failure
mode was exactly a doc/rule referencing a file that had moved or a capability claimed
absent that existed. A committed `scripts/agents/zoe-drift.py` that greps every
backtick-path in `.claude/rules/*.md` + `CLAUDE.md` + the ZOE capability map and exits
1 on a missing path would have caught the two same-session misses that motivated
`confirm-before-claiming-absence.md`. **Wire-up:** a Python script mirroring
`cmd_drift`'s path-existence loop, run in CI (husky pre-commit or a GitHub Action) over
ZAO's rule files. This is a clean net-new PR-only build, no live-infra touch.

### 2. A no-AI external healer - `tools/watchdog` (tools/watchdog, /bin/sh). PARTIAL-ADOPT.

What it does (read FULL): a cron shell script (`*/30`) that runs `tools/verify`; on 2
**consecutive** failures it `git reset --hard known-good` (a git tag) and logs loudly;
if no `known-good` tag exists it says "human needed" and exits 1. Deliberately **no AI**
- "the failure it exists for is 'AI unavailable.'" Untracked persona/.env never touched.

**Why ZAO:** we already have this shape - `zoe-autodeploy.sh` verifies a fresh checkout
and auto-rolls-back on boot error (`agent-loops.md` rule 31). What clawd adds is the
**`known-good` git tag as the rollback target + the 2-consecutive-fail debounce + the
"no AI on purpose" framing**. Our rollback targets the previous commit; a moving
`known-good` tag that only advances after a *clean* run is more robust (it can't roll
back onto another broken commit). **This is a refinement to an operator script (gated,
`agent-loops.md` rule 32 - never hot-edit the live deploy script), so it is a SPEC here,
not an autonomous change.** Recommend: add a `known-good` tag advance to
`zoe-autodeploy.sh` on green, and a 2-fail debounce before rollback.

### 3. Runtime self-diagnostic - `tools/vitals` (tools/vitals). CONSIDER.

Reads, per turn, read-only, no network: **model + exact context fullness** from the
live `claude -p` transcript jsonl (each assistant message carries token usage),
**subscription + plan usage %** from the router cache, **engine + conversation key**
from the kernel's own env stamp (`agent.py` sets `CLAUDE_P_ENGINE` / `CLAUDE_P_REMEMBER`
/ `CLAUDE_P_AUTO_MEMORY`). Everything "degrades to unknown (why)", never exits non-zero
on a missing source (`tools/vitals` docstring).

**Why ZAO:** ZOE has `cost-ledger.ts` (spend) but not a "how full is my context / which
plan tier am I on THIS turn" read. This is less critical for a Node bot than for a
`claude -p` agent, but the **"context fullness from the live transcript"** idea is
relevant to `claude-usage.md` cap discipline. CONSIDER, not adopt - lower value than 1-2.

### 4. The principle, validated externally. NO BUILD - it confirms a rule we have.

clawd independently arrived at "know yourself by reading, not remembering" and "the
engine never imports module code - a broken module costs one capability, the mind always
spawns" (`ARCHITECTURE.md`). The second is the same fault-isolation as ZOE's
`Promise.allSettled` + one-instance-lock discipline. This is corroboration for
`confirm-before-claiming-absence.md` + `agent-loops.md` rule 9, not a new build.

## What we do NOT adopt (and why)

- **The `claude -p` engine / two-extension-point module system** (`agent.py`,
  `ARCHITECTURE.md`). ZOE is a persistent Node/Telegram process, not a per-turn spawner.
  The env-hook + settings-merge module model is elegant but solves a problem ZOE does
  not have. Do not port it.
- **`tools/guard-check` PreToolUse hook** (`hooks.base.json`). ZAO's equivalent is
  `.claude/settings.json` deny rules + husky; we already have this seam.

## Decision

The single grounded adopt is **#1: a committed `zoe-drift` doc-path check that fails
CI** - it is the automation `confirm-before-claiming-absence.md` was written to demand,
it is net-new + PR-only + no live-infra, and clawd's `tools/self:103-167` is a working
MIT-licensed reference to mirror. #2 (`known-good` tag rollback) is a gated refinement
spec for `zoe-autodeploy.sh`. #3-4 are consider/corroborate.

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Build `scripts/agents/zoe-drift.py` (fails CI on any backtick-path in `.claude/rules/*.md` + CLAUDE.md that is missing on disk), mirroring clawd `tools/self:103-133` | @Zaal (Claude, PR-only) | PR | 2026-08-07 |
| Spec: add a `known-good` git tag advance-on-green + 2-fail debounce to `zoe-autodeploy.sh` (gated operator script, do not hot-edit) | @Zaal | Spec-then-gated | 2026-08-08 |
| Review this adopt-spec in the morning browse pile | @Zaal | Review | 2026-08-07 |

## Sources

- **clawdbotatg/claude-p-agent (MIT)** - cloned `--depth 1` 2026-08-06, read FULL:
  `agent.py`, `tools/self` (drift at lines 103-167), `tools/vitals`, `tools/watchdog`,
  `tools/verify`, `hooks.base.json`, `skills/self/SKILL.md`, `README.md`,
  `ARCHITECTURE.md`, `LICENSE`. [FULL]
- Doc 2225 (#2910) - Austin Griffith / clawd deep research (the thesis this grounds). [FULL]
- ZAO rules: `confirm-before-claiming-absence.md`, `anti-fabrication.md` (rule 5),
  `agent-loops.md` (rules 9, 31, 32). [FULL, in-repo]

## Also See

- [Doc 2225](../2225-austin-griffith-clawd-agent-swarm/) - the clawd/Austin research.
