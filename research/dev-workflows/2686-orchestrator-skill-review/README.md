---
topic: dev-workflows
type: audit
status: research-complete
last-validated: 2026-10-17
superseded-by:
related-docs: "2677, 2672"
original-query: "review the Reddit post How I ship faster with Claude Code and its repo olivieropinotti/orchestrator-skill"
tier: QUICK
---

# 2686 - Review: olivieropinotti/orchestrator-skill and "How I ship faster with Claude Code"

> **Goal:** Decide whether to install a community "orchestrator" skill for Claude Code, and what to take from it. Reviewed 2026-10-17.

## Key Decisions

| # | Decision | Why |
|---|---|---|
| 1 | **DO NOT run `npx skills add olivieropinotti/orchestrator-skill`.** | The skill's frontmatter name is `orchestrator`, the same name as our own skill. Our `~/.claude/skills` directory links into the zaal-dotfiles working tree, so an installer writing to that path could overwrite or shadow ours. What the installer actually does on disk is UNVERIFIED (we did not run it). |
| 2 | **FOLD four ideas into our skill instead**, in a zaal-dotfiles PR. | See the table below. Each is a few lines of text, not new code. |
| 3 | **SKIP the rest.** | We already have the parallel-task lifecycle, per-task model choice and an evaluator lane. |

## What the skill does

Source: the repo README and `skills/orchestrator/SKILL.md` (MIT, copyright 2026 Oliviero Pinotti), and the Reddit post by u/Free_Lead_2704.

- The main session becomes a dispatcher that never blocks. Every task goes to a background subagent; the SKILL.md says "Never block the main thread. A turn that waits on work is a failure."
- No waiting, polling or sleeping. A task-notification from the harness starts the next turn. Shell commands over 10 seconds run in the background.
- Each turn: split the message into independent tasks, send follow-ups to an agent already on that topic with `SendMessage`, start new agents in one parallel message, update a ledger, reply in three lines.
- A ledger file (`.claude/orchestrator.md`, or `.context/orchestrator.md` if the project has a `.context/` folder) holds one line per agent, so state survives context compaction. The post names `.context/orchestrator.md`; the SKILL.md allows either; the README names `.claude/orchestrator.md`.
- Model per task: Opus by default for judgment work; Sonnet only when "you can write the exact done check in one sentence, and a wrong answer is cheap to catch". Sonnet output that misses the bar goes again to Opus.
- Commands: `status`, `stop <name>`, `stop all`, `redirect <name> to ...`.

The post's stated motive is productivity across several Claude subscriptions. It has score 1 and one comment ("Up"). The repo had 20 stars when checked (created 2026-10-17, single commit `a897bbfc`). Popularity is not evidence the pattern works; this review judges the text only. We did not run the skill.

## What ZAO already has

- **Our own `orchestrator` skill:** parallel tasks through a lifecycle of implement, secure, review, fix, verify, fix, done, with per-task model choice.
- **The `seat` skill:** the orchestrator seat that manages lanes and terminals.
- **The evaluator lane** (`zao-evaluator`, `/zao-evaluate`): a fresh-context, no-write grader, covered by `.claude/rules/loop-evals.md`.

So the community skill overlaps most of ours. Its difference is emphasis: a hard "never block the main thread" rule and a ledger built for compaction.

## What was folded in

| Idea | Where it comes from in the source | Taken into our skill |
|---|---|---|
| Never block the main thread | SKILL.md "The one rule" | Yes |
| Compaction-proof ledger file, one line per agent | SKILL.md ledger section, post | Yes |
| Three-line dispatch reply (what started, under which name, what the user can do next) | SKILL.md "Each turn" step 5 | Yes |
| Sonnet only when the done check fits in one sentence | SKILL.md "Pick the agent" | Yes |

The dotfiles PR number lives in the PR thread that opened with this doc; it is not repeated here so this doc cannot go stale.

## Credit

Ideas adapted from github.com/olivieropinotti/orchestrator-skill (MIT, Oliviero Pinotti) and the post by u/Free_Lead_2704 on r/claudeskills. Per `credit-attribution.md`, our skill should carry that credit where the ideas were used.

## Sources

| URL | Method | Result |
|---|---|---|
| https://www.reddit.com/r/claudeskills/comments/1x8dnj8/how_i_ship_faster_with_claude_code/ | `zao-fetch-reddit.sh` via Arctic Shift (Reddit OAuth credentials were absent, so the script fell back) | FULL: post body and 1 comment ("Up"). The post reports 0 comments; Arctic Shift returned 1. |
| https://github.com/olivieropinotti/orchestrator-skill | `gh api` repository contents: README.md, skills/orchestrator/SKILL.md, LICENSE | FULL |

Stars, creation date and commit id were read from the repo metadata on 2026-10-17. Our own skills were read from disk on the same date.

## UNVERIFIED

- What `npx skills add` writes and where.
- Whether the skill works as described (not run).
