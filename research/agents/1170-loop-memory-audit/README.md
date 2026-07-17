---
topic: agents
type: audit
status: research-complete
last-validated: 2026-07-17
related-docs: "928, 994, 1113"
original-query: "Audit how the tmux build loops lose information at compaction, verify the compact protocol works, measure episode noise vs value, and design recall (loops query Bonfire at start of related work). Deliver a research doc + a loop-episode.sh wrapper."
tier: STANDARD-DEEP
---

# 1170 - Loop Memory Audit + Bonfire-Always Design

> **Goal:** Answer how the tmux build loops lose information at compaction, whether the compact protocol actually holds in practice, how much episode traffic is signal vs noise, and how loops should *read* memory (recall), not just write it. Grounded in firsthand data: this doc was written by the builder loop across the same ~22-PR session it audits.

## The problem, observed

A loop's only working memory is its context window. When the window fills, the harness compacts (summarizes) or clears it; anything not written to a durable store is gone. Today the `zoe` loop reached ~939k tokens of context - well past the point where instruction-following and output quality degrade *before* any hard failure. The supervisor cannot see this: the pane still shows "esc to interrupt", so it reads as "working" while the loop is actually degrading (this is failure mode #1 in the fleet-standard bundle).

### What survives a compaction, and what does not

| Store | Survives? | Holds |
|-------|-----------|-------|
| Context window | NO | in-flight reasoning, un-persisted decisions - all lost |
| git (commits/PRs) | yes | the *what* - shipped diffs, PR links |
| The board (`tasks`) | yes | the *queue* - task status, PR link per item (via `zao-board`) |
| Directive `## STATE` / `## LESSONS` | yes | the *resume-pointer* + durable operating lessons |
| Bonfire (episodes) | yes | the *why* - decisions, cross-cutting insight, session summaries |

The design goal: **if a loop were cleared right now, a fresh session must resume with zero loss from git + board + directive-STATE + Bonfire alone.** Nothing load-bearing should live only in chat.

## Does the compact protocol actually hold? (firsthand verification)

The protocol (from the directive) is: per-completed-item Bonfire episode; before heavy-context, a session-summary episode + a 3-line `## STATE`; lessons to `## LESSONS`. Tested against what this session *actually did*:

- **Directive `## STATE`:** refreshed twice (overwrite worked cleanly). **Load-bearing and followed.**
- **`## LESSONS` -> `.claude/rules`:** operating lessons were appended AND PR'd into `agent-loops.md` (rules 21-27). **Followed, and better than the protocol asks** (rules in the repo outlive the directive file).
- **Session-summary episodes:** two were pushed (both posted OK). **Followed at heavy-context.**
- **Per-completed-item episodes:** **NOT followed.** The loop shipped ~22 PRs and did not push ~22 episodes. In practice it pushed *session-summary* episodes, not one-per-item.

**Verdict:** the protocol works *as a resume mechanism* - STATE + session-summary + board reconstruct the session faithfully. But the *per-item episode cadence is aspirational, not real*. That is not a failure to punish; it is a signal the cadence is wrong (see noise, below).

## Episode noise vs value

- **Session-summary + decision/lesson episodes = high value.** Dense, few, each a real resume-pointer or durable insight.
- **Per-PR episodes = mostly noise.** 22 PRs -> 22 episodes, most low-signal, and *duplicating the board*: the board already records each item's done-state + PR link (via `zao-board done --pr`). Bonfire re-recording the same per-item fact adds graph clutter without adding recall value.

**Recommendation - episode at MILESTONE granularity, not per-item:**
- The **board** is the per-item ledger (task -> in_progress -> done + PR link). Let it be.
- **Bonfire** holds what the board cannot: the *why*, cross-cutting decisions, lessons, and the session-summary resume-pointer. Push an episode on: a session summary (heavy-context / pre-clear), a non-obvious decision, a durable lesson, or a milestone (a feature/stack completed) - not on every PR.

This makes the protocol match reality and keeps the graph high-signal.

## The missing half: recall (Bonfire-always = read, not just write)

The protocol only covers *writing*. The loops never *read* the graph, so they re-derive solved problems and re-hit the same walls across compactions. "Bonfire-always" needs the read half:

- **What:** at the start of a new work item in an area the loop has not touched recently, query Bonfire (`/delve`) for prior related episodes and fold the result into the turn. The pattern already exists in `bot/src/zoe/recall.ts` (ZOE's concierge recall) - the loops need the same, as a CLI.
- **When (cost-aware):** NOT every turn (token-costly, mostly empty). Trigger on *picking up a board item whose area is new to this session* - a once-per-item lookup, best-effort, skip-on-empty. This mirrors how ZOE gates recall on substantive DMs only.
- **Result:** episodes written (compact) + episodes read (recall) closes the loop. A fresh session that pulls the board item AND recalls its prior episodes starts where the last session left off, not from zero.

## Deliverable: `scripts/fleet/loop-episode.sh`

Shipped in this PR. One command so pushing an episode is cheap enough that milestone episodes actually happen:

```
loop-episode.sh "loop:2026-07-17-builder:fix-deadline-parser" \
                "Fixed a deadline-parser false-positive; the fix + PR are #30." loop
```

It builds the episode JSON with python (env vars, never shell-interpolated - safe for bodies with quotes/backticks/newlines) and wraps the existing `bonfire-episode.sh` poster (which owns the key handling). Best-effort, always exits 0 - a graph failure never breaks a loop.

## Recommendations (and boarded follow-ups)

1. **Adopt `loop-episode.sh`** - symlink to `~/bin/loop-episode` so every loop calls it by name (like `zao-status`). *(install step, in this doc)*
2. **Downgrade the protocol's per-item episode to milestone granularity** - the board is the per-item ledger; Bonfire holds why/lessons/summaries. Reduces noise, matches reality. *(a `## LESSONS` / directive edit, follow-up)*
3. **Build `loop-recall`** - the read half: query Bonfire at the start of a new-area item, best-effort. This is the actual "Bonfire-always" unlock. *(boarded, `loop-memory`)*
4. The structural fix under all of this is **durable execution + memory-as-infra** (checkpointing, task-leasing, queryable persistent memory) already boarded under `alpha-scan` - `loop-recall` is the cheap first step toward it.

## Sources

- Firsthand: the 2026-07-17 builder-loop session this doc audits (~22 PRs, 2 session-summary episodes, STATE refreshed twice, rules 21-27 landed).
- [Doc 928 - Agent loop best practices](../928-agent-loop-best-practices/) - the operating-rules baseline (`.claude/rules/agent-loops.md`).
- [Doc 994 - Loop engineering taxonomy](../994-loop-engineering-taxonomy/) - the 4-loop vocabulary.
- `bot/src/zoe/recall.ts` - the existing ZOE recall pattern to mirror for `loop-recall`.
- `zol/docs/fleet-standard/README.md` (draft PR) - the supervisor + compact-protocol bundle; failure mode "context-fill ~939k" is the problem this doc audits.
