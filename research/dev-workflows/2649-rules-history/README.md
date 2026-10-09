---
topic: dev-workflows
type: decision
status: research-complete
last-validated: 2026-10-09
superseded-by:
related-docs: 2645, 2647, 2081, 2319
original-query: "cut the per-turn context weight: a short always-loaded core of the binding rules, history moved to research docs the core links to, no instruction lost"
tier: STANDARD
---

# 2649 - Rules history: the archive behind the slim `.claude/rules` core

> **Goal:** Cut what every ZAOOS session loads on every turn without losing a
> single binding instruction. The rule files keep only what a session must do;
> the incidents, measurements, examples and sources that justified each rule move
> here, verbatim.

Ruled by Zaal 2026-10-09 in the seat pane (vault `decisions/grill-2026-10-09-seat-morning.md`
items 1 and 3; review `notes/agentic-setup-review-2026-10-09.md`).

## The measurement (2026-10-09, origin/main `ccb1d0604`, after #3842)

Measured with `wc -c` on the files Claude Code loads into every ZAOOS session.
The total includes the user-level `~/.claude/CLAUDE.md` (12,445 bytes), because
it loads on every turn alongside the repo files, as the brief's 236,635 figure
did. The repo-only figure, `cat .claude/rules/*.md CLAUDE.md | wc -c`, is
**225,217 before and 89,446 after**; the two totals differ by exactly that
12,445.

| Surface | Before (bytes) | After (bytes) |
|---|---|---|
| 38 `.claude/rules/*.md` | 209,815 | 75,321 |
| `CLAUDE.md` (repo root) | 15,402 | 14,125 |
| `~/.claude/CLAUDE.md` (zaal-dotfiles, not in this PR) | 12,445 | 12,445 |
| **Total per turn** | **237,662** | **101,891** |

At roughly 4 bytes per token that is about 59k tokens before and 25k after. The
brief's figure of 236,635 bytes was taken at 06:30, before #3842 added about 1 kB
to `measurement-traps.md`.

Per-file bytes (archive = the original, core = the new rule file):

| File | Before | After |
|---|---|---|
| `agent-loops.md` | 14678 | 8390 |
| `agent-spend.md` | 4521 | 1171 |
| `anti-fabrication.md` | 4189 | 2209 |
| `api-routes.md` | 751 | 671 |
| `capture-quality.md` | 1921 | 1026 |
| `claude-usage.md` | 3673 | 1367 |
| `code-over-inference.md` | 5673 | 1544 |
| `code-restraint.md` | 3045 | 1304 |
| `components.md` | 625 | 543 |
| `confirm-before-claiming-absence.md` | 7094 | 1956 |
| `credit-attribution.md` | 3895 | 1455 |
| `documentation-in-repo.md` | 4883 | 1264 |
| `dreamnet-communication-standard.md` | 5154 | 2306 |
| `first-handler-wins.md` | 5024 | 1461 |
| `handoff-discipline.md` | 5711 | 3389 |
| `icm-grounding.md` | 3252 | 1550 |
| `idle-lane-audit.md` | 5661 | 1592 |
| `lane-autonomy.md` | 2519 | 1094 |
| `liveness-probe-guard.md` | 8262 | 1676 |
| `loop-evals.md` | 13549 | 3665 |
| `measurement-traps.md` | 16895 | 3804 |
| `no-rm-rf.md` | 2895 | 1432 |
| `noisy-signal-guard.md` | 4108 | 1274 |
| `pii-hygiene.md` | 13750 | 4663 |
| `pre-merge-security-and-suite.md` | 4020 | 1189 |
| `recap-followthrough.md` | 4324 | 1021 |
| `research-grounding.md` | 5371 | 2101 |
| `secret-hygiene.md` | 3329 | 2335 |
| `session-boundaries.md` | 5551 | 1234 |
| `silent-failure-guard.md` | 4795 | 2057 |
| `skill-enhancements.md` | 4119 | 4117 |
| `state-claims.md` | 14798 | 3538 |
| `tests.md` | 848 | 767 |
| `thread-discipline.md` | 4122 | 1059 |
| `typescript-hygiene.md` | 2832 | 1243 |
| `vanishing-dependencies.md` | 5241 | 1303 |
| `workflow-discipline.md` | 2914 | 1227 |
| `worktree-handoff.md` | 5823 | 1324 |
| `CLAUDE.md` | 15402 | 14125 |

`skill-enhancements.md`, `api-routes.md`, `components.md` and `tests.md` were
already pure instruction; they changed only by an em dash becoming a hyphen.

## How the split was made

1. **Every original file is copied verbatim** into [`archive/`](./archive/) as it
   stood on origin/main `ccb1d0604`. Nothing was summarised on the way in, so the
   archive is a complete record and the history of each rule survives intact.
   `archive/CLAUDE-md.md` is the original root `CLAUDE.md` (renamed so Claude Code
   does not load it as a nested CLAUDE.md). **One kind of redaction:** every
   name of a retired partner (and the lane, repo and site named after one) reads
   `[retired partner]` - 8 occurrences in 3 files: `CLAUDE-md.md` lines 206-207,
   `liveness-probe-guard.md` (5, lines 13, 83, 100, 140) and
   `recap-followthrough.md` line 24. Nothing else differs from origin/main
   `ccb1d0604`. The live `CLAUDE.md` says "a retired partner" on its two
   decommissioned-list lines.
2. **Each rule file was rewritten to its binding instructions**: the do, never,
   always and must; every gate step, threshold, command, path, allowlist entry and
   who-does-what table. Rule numbers that other files cite (agent-loops 1-37,
   silent-failure 1-9, state-claims 1-5, measurement traps 1-13, anti-fabrication
   1-7, handoff 1-10, liveness 1-7, vanishing-dependencies 1-5) are unchanged.
3. **Every rule file links to its archive** in its first lines, and `CLAUDE.md`
   gained a "Rules archive" section pointing here. A session that needs the why
   reads the archive; a session that only needs the rule does not pay for it.
4. **File names are unchanged**, so every cross-reference of the form
   `state-claims.md` rule 4 still resolves. No file was deleted.

## Where every sentence went

[`ledger.md`](./ledger.md) is generated by [`ledger.py`](./ledger.py)
(`python3 -I research/dev-workflows/2649-rules-history/ledger.py . <out.md> <review.txt>`
from the repo root; it also writes the list of imperative-sounding archive-only
sentences used for the hand check). The script splits each archive file
into sentences (table rows and list items count as one) and checks each against
its new core file:

- A sentence still present verbatim in the core is not listed.
- `reworded`: at least half its words appear on one core line; the ledger names
  that line. This is a match heuristic, not proof the meaning held.
- `archive-only`: it now lives only in the archive, at the line named.

The script's output is the complete list of sentences that left a core file. The
second check was by hand: every `archive-only` sentence containing never, must,
always, do not, banned, required or ask first (150 of them) was read, and 15
instructions that the first draft had dropped or blurred were restored to the
cores: agent-loops 21, 22, 32 and 35; anti-fabrication 6; capture-quality 3;
claude-usage (twice); credit-attribution (music clearance); loop-evals guards;
secret-hygiene 4; silent-failure 4; thread-discipline 3; workflow-discipline 1
and 2. The rest are incident narrative or rationale.

The third check was a fresh-context evaluator with no write tools (18 tool calls)
that read every archive and core pair for a missing or changed instruction. Its
verdict: 37 of 39 pairs PASS, 2 with minor findings, nothing high or medium. It
named 5 minor items and 4 nits; all 9 were restored: agent-loops 18 (the `.py`
method), 25 (the worktree recipe), 28 (confirm a board task is not already
`in_progress`), 36 (Zaal's phone via ZOE rides the relay); the anti-fabrication
checklist consequences ("absent = the claim is false, author it yourself", "not
there = drop or downgrade"); handoff-discipline's morning order; pii-hygiene's
`/inbox` note; confirm-before-claiming-absence's "once confirmed, ship"; and
state-claims' "applies hardest to autonomous and overnight work".

## What changed in meaning (none intended)

No instruction was intentionally removed, weakened or broadened. Three edits
re-state dated claims as dated rather than current, because a rule loaded every
turn should not assert a stale fact as now:

- `icm-grounding.md`: "the `icm` CLI, `zao-icm.py` and `/icm` skill are ALL
  ABSENT" became "were absent on 2026-08-19; check with `command -v`".
- `thread-discipline.md`: the TOOL STATUS block became "`todo` present as of
  2026-08-23", plus its own lesson as an instruction: re-verify any rule note that
  asserts a tool is missing before acting on it.
- `CLAUDE.md`: farscout "STILL RUNNING ... as of 2026-08-22" kept its date and
  its instruction (do not trust its heartbeat; stopping it is Zaal's).

## Not in this PR (proposals for Zaal)

- **`~/.claude/CLAUDE.md` (12,445 bytes, zaal-dotfiles).** About a third of it is
  history: the "regressed once and was restored" note on the retired-names
  section and the 2026-09-17 / 09-19 incident paragraphs. The same split would
  apply there, in the zaal-dotfiles repo, as its own PR.
- **`paths:` frontmatter** on `api-routes.md`, `components.md`, `tests.md` and
  `typescript-hygiene.md` would load them only when a session touches matching
  files. That saves about 3 kB more but changes when those rules are seen, so it
  is a decision, not a cleanup.
- **A size guard**: a CI check that fails when `.claude/rules` grows past a
  ceiling, so the weight does not creep back. Proposed, not built.

## Sources

- Byte counts: `wc -c` on origin/main `ccb1d0604` and on this branch, 2026-10-09.
- Ledger: `ledger.py` in this directory, run against `archive/` and the cores;
  output `ledger.md`.
- An earlier attempt at this split (same lane, same morning, uncommitted, based
  on `0a09e3f8d` before #3842) cut about 26% and moved only fragments. It was
  superseded by this one, which archives whole files so nothing can be lost in
  the move. Its scratch worktree was left in place for Zaal; nothing was deleted.
