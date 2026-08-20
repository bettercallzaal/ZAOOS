---
topic: dev-workflows
type: guide
status: research-complete
last-validated: 2026-08-03
related-docs: "928, 2127, 2178, 2182"
original-query: "zao-research this Spotify episode - Ryan Carson on running teams of AI agents (a software factory that ships 24-7)"
tier: STANDARD
---

# 2187 - The agent-operator playbook (Ryan Carson) mapped to ZAO's fleet

> **Goal:** Distill Ryan Carson's "how to run teams of AI agents" episode into the operator
> principles, and map each to what ZAO's fleet already does + the real gaps. The thesis:
> "the people who know how to run teams of AI agents are going to outperform everyone else."

## The core reframe

"No matter what you used to do - people manager or IC - you are going to become a **manager
of agents** now. And you need to be the best in the world." The scarce skill is being a
world-class **agent operator**, not writing the code. This is the same reframe behind ZAO's
fleet (doc 2182): Zaal is the operator; the loops do the work.

## Carson's principles + where ZAO stands

| # | Carson's principle (quoted/paraphrased) | ZAO status | Evidence / gap |
|---|------------------------------------------|-----------|----------------|
| 1 | **You are a manager of agents** - run as many as you can, horizontally | STRONG | 16 managed loops, one per brand (doc 2182). |
| 2 | **Cloud agents, not laptop-bound** - "scale myself horizontally ... run as many agents as I possibly can" | STRONG | The fleet runs on the VPS (tmux loops), not Zaal's laptop. |
| 3 | **Work from your phone** - "I do almost 50%+ of my work from my phone ... grab it, talk to Devin in a browser" | PARTIAL | ZOE Telegram + `fleet --tg` + `zao "..."` capture give phone control; no full phone-driven coding yet. |
| 4 | **One notification surface for what agents are doing** - Slack top-left, "notifications about what my agents are doing" | STRONG (different tool) | ZAO uses Telegram: the watchdog/spend/stall tripwires + daily fleet snapshot are exactly this. |
| 5 | **Keep prod keys OUT of agents** - "I do not give my agents prod write keys ... they ask you for the key when they need to write to prod ... 1Password" | STRONG | `secret-hygiene.md` (stub keys on disk, real key at CLI only), the `setting-secrets` hidden-paste flow, and the rule that Claude never handles credential values. Carson independently arrived at ZAO's exact policy. |
| 6 | **Avoid collision pain** - "I don't want to ... figure out which code is colliding, which worktree am I on" | STRONG | Every autonomous build runs in a `git worktree` off origin/main (agent-loops rule 25); loops are PR-only. |
| 7 | **Check the work** - "how do you check the work?" | STRONG | The watchdog (frozen->restart, 3x-same->idle), loop-evals gate, and the default-FAIL fresh-context evaluator (doc PR #2802). |
| 8 | **Good harness + good models (2026)** - "when you have a good harness that is cloud-based, it's really good ... the models are definitely good enough now" | STRONG | The provider ladder claude->codex->openrouter->ollama; cheap-tier pinned + cost-governed. |
| 9 | **Voice input everywhere** - WhisperFlow button for "all of my stuff" | PARTIAL | ZOE voice-in (Groq Whisper) exists; not yet a one-button always-on capture. |
| 10 | **Learn by doing / ship** - "the best way to learn is to do ... this changes every 3-6 months" | STRONG | Build-in-public, ship-and-use (feedback_ship_and_use_not_meta). |

## The honest gaps (what Carson does that ZAO does not yet)

1. **A cloud coding harness (Devin/Factory-style)** - Carson runs cloud coding agents that
   ship real code 24-7 from his phone. ZAO's loops are cheap-tier TEXT loops (research/drafts)
   that PR-only; grounded code still happens in a Claude Code session. Gap: a cloud coding
   agent that lands real PRs unattended (ZOE's Hermes coder/critic pipeline is the seed).
2. **Phone-first operation** - Carson does 50%+ from his phone (land a PR from the shower).
   ZAO has phone capture + fleet visibility, but not phone-driven code review/merge yet.
3. **Multi-agent desk multitasking** - Carson runs 8 screens of agents at once. ZAO's operator
   surface is one `fleet` pane; a richer multi-agent live view is a candidate.

## What to steal now (cheap, high-leverage)

- **The 1Password prod-key handshake** - Carson's "agent asks, I paste from 1Password" is
  exactly the `setting-secrets` hidden-paste flow. Standardize it for every prod-write across
  the fleet (already the policy; make it the default habit). [validates existing rule]
- **Phone-land-a-PR** - the highest-leverage phone capability is not capture (have it) but
  reviewing + merging a loop's PR from the phone. A `fleet --prs` command + a one-tap merge
  path is the next phone-first step.
- **Notification discipline** - Carson's Slack is a single "what are my agents doing" feed.
  ZAO's tripwires + daily snapshot are that; keep them terse + actionable (done).

## Also See

- [Doc 2182](../../*/2182-*/) - per-brand terminals / the fleet
- [Doc 928](../../agents/928-agent-loop-best-practices/) + [Doc 2127](../../agents/2127-*/) - the loop rulebook
- [Doc 2178](../../*/2178-*/) - orchestrator-worker harness
- `.claude/rules/secret-hygiene.md`, `agent-loops.md`, `loop-evals.md`

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Add `fleet --prs` (list loop PRs) + a phone-friendly review/merge path | Zaal | build | 2026-08-17 |
| Evaluate a cloud coding agent (ZOE Hermes pipeline) that lands unattended PRs | Zaal | spike | 2026-08-24 |
| Keep the prod-key handshake (setting-secrets) as the fleet default | Zaal | policy (done) | wontfix |

## Sources

- Spotify episode 3AWVuvdlyQGyiMJZ3XMvJ3 - "Ryan Carson on running teams of AI agents", transcribed locally (mlx-whisper) 2026-08-03 [FULL]
