---
topic: agents
type: audit
status: research-complete
last-validated: 2026-06-21
superseded-by:
related-docs: 601, 759, 883, 887
original-query: "https://github.com/alexcheuk/proof-531 also research this /zao-research"
tier: STANDARD
---

# 888 — proof-531: A Claude Agent Shipping a Real App on a /loop Cron (What ZAO Steals)

> **Goal:** Audit alexcheuk/proof-531 - a real iOS/Android app built entirely by a Claude coding agent on a `/loop 30m /do-work` cron - and extract the loop-architecture patterns worth pulling into ZAO's Hermes/ZOE stack and Zaal's own running loop.

## Key Decisions (recommendations first)

| # | Decision | Why |
|---|----------|-----|
| 1 | **STEAL the SOUL + DOCTRINE constitution pattern for ZAO's loops** | proof-531's loop reads a `SOUL.md` (north-star prioritization lens) + `DOCTRINE.md` (immutable invariants + audited operating decisions) every tick. This is the disciplined version of ZAO's `bot/src/zoe/` `human.md` persona blocks. Gives an unattended loop a spine it can't drift from. Directly upgrades the ZOE/Hermes locked architecture (Doc 759). |
| 2 | **ADOPT "proof-by-type: never claim done without the proof its type requires"** | This is ZAO's "verification before done" rule (CLAUDE.md) made mechanical + per-work-item. proof-531 refuses to mark anything done without the proof its category demands (test, screenshot, etc). Bake the same gate into Hermes' fix-PR pipeline. |
| 3 | **ADOPT the scoped self-edit gate (auditor agent)** | proof-531 lets the loop freely edit learnings + the backlog, but routes SOUL/DOCTRINE/skill edits through a `do-work-auditor` agent, and constitution changes escalate to the human in Discord `#needs-input`. This is exactly the guardrail ZAO needs before letting ZOE self-modify - solves the "autonomous but safe" problem the openclaw squad failed (Doc 601). |
| 4 | **MIRROR the escalation discipline for Zaal's own running loop** | proof-531's loop "does not pause for clarification" on normal work but HARD-escalates 4 classes: irreversible/external actions, constitution changes, public posting, store publishing. Zaal's current `/loop` should encode the same - act freely on safe fixes, escalate only those 4 classes. (This loop already does: it PRs freely, asks before risky route changes.) |
| 5 | **DO NOT rebuild proof-531's stack; it validates ZAO's direction** | It's a solo fitness app, not infra to fork. Its value is as a working reference implementation of the exact loop ZAO is already building. Same lineage as KORRO (Doc 883). Watch it; borrow patterns; don't clone. |

## What proof-531 Is

- **531 Strength** (github.com/alexcheuk/proof-531): a free, local-first 5/3/1 Wendler + BBB barbell-training tracker for iOS + Android. React Native / Expo SDK 55, SQLite, offline-first, no account, no ads, source-available license. Live at **531strength.com**; Android APK on GitHub Releases. Created 2026-05-20, 3 stars (tiny, new).
- **The real product is the experiment.** Per its `SOUL.md`: "There is a second product underneath the first. The app is also the proof that a fully vibe-coded ecosystem can ship real software: idea to text prompt to production, an app that improves itself, markets itself, and documents itself through agent loops, and is honest out loud about being agent-built. The tracker is the artifact; the experiment is the point."
- **Built by a Claude coding agent on a 30-minute cron loop** (`/loop 30m /do-work`). Self-described "agentic-engineering" repo (its own GitHub topics).

## The Loop Architecture (the part ZAO wants)

The `.claude/` directory IS the company. Structure:

- **`/do-work` skill** = the loop. "Autonomous staff-frontend-engineer loop... each tick orients on SOUL.md + DOCTRINE.md + the work-graph (backlog.md), prioritizes via the impact-rubric, ships 12-15 substantive items end-to-end, and never claims an item done without the proof its type requires." Runs unattended: **"do not pause for clarification."** 7 phases per tick, phase 0 = orient/read-memory first.
- **Two durable knowledge layers:**
  1. **Constitution + work-graph** under `do-work/`: `SOUL.md` (north star, human-owned, confirm-before-edit), `DOCTRINE.md` (immutable invariants + audited operating decisions), `work/backlog.md` (the work-graph).
  2. **Learnings** under `loop-memory/` (24 files): gotchas, patterns, cached Discord IDs, loop pacing, persona/lore canon.
- **The Constitution (immutable, verbatim invariants):**
  1. Never claim done without the proof its type requires.
  2. Never weaken the validation bar or audit requirement to ship faster.
  3. Never commit or leak secrets.
  4. Never take an irreversible or external action without escalation.
  5. Never edit the constitution without the human's approval.
  6. SOUL is always the prioritization lens.
- **Scoped self-editing:** learnings + backlog are free to edit; SOUL/DOCTRINE/the-skill go through the `do-work-auditor` agent; constitution changes are escalation-class (human-approved in Discord `#needs-input`).
- **Human-in-the-loop via Discord:** pulls `#task-queue`, reads `#loop-criteria` pins + `#needs-input` answers, posts a humanized summary to `#auto-improvements`. SOUL ranks the work; `docs/INTENT.md` is the drift-check re-read when a call feels load-bearing.
- **Agent roster** (`.claude/agents/`): rn-frontend, rn-qa, rn-designer, fitness-research, do-work-auditor, do-work-distiller, verso (TTS), organic-marketing. Plus a `vercel-react-native-skills` bundle of ~25 RN performance/design rule files.
- **CI/CD:** `ci.yml`, `ota.yml` (over-the-air RN updates), `preview-apk.yml`.

## Findings

### 1. This is the same loop ZAO (and Zaal, right now) is running

proof-531 runs `/loop 30m /do-work`. Zaal is running `/loop ... fix this and research weaknesses and PR`. Both are unattended self-paced Claude loops that read a constitution, pick high-impact work, ship with proof, and escalate the dangerous classes. proof-531 is a more mature, codified version - it has the SOUL/DOCTRINE/auditor scaffolding that ZAO's loops (and this session's `~/.zao/loop-zaoos-fixes.md`) are doing ad-hoc. The lesson: **formalize the loop's constitution + memory layers** instead of carrying them in chat/scratch files.

### 2. Same house style as Zaal - independently

proof-531's DOCTRINE hard-lines: "no em dash character in any output (prose, comments, code strings, marketing copy)... use a colon, period, comma, semicolon, parentheses, or a spaced hyphen" and "no color emoji in app text." This is Zaal's exact global output rule. Convergent discovery that agent-built output needs an explicit anti-em-dash / anti-emoji rule to not read as AI slop.

### 3. The honesty/escalation invariants are the safety model ZAO lacked

The openclaw 7-agent squad was killed (Doc 601) for being autonomous-without-guardrails. proof-531 shows the missing piece: a small immutable constitution (6 invariants) + a scoped self-edit gate (auditor agent) + 4 hard-escalation classes (irreversible, constitution, public post, store publish). That is a concrete, copyable answer to "how do you let an agent self-improve without it going off the rails."

### Staleness / caveats

- Current as of 2026-06-21. Tiny new repo (3 stars, created 2026-05-20); the experiment, not the stars, is the signal.
- Source-available (not OSI open-source) license - read it before lifting code verbatim; patterns/architecture are free to learn from.
- It's a solo-dev experiment, unproven at scale - treat as a reference implementation, not a battle-tested framework.

## Also See

- [Doc 601](../601-agent-stack-cleanup-decision/) - why ZAO killed autonomous-without-guardrails; proof-531 supplies the missing guardrail model
- [Doc 759](../759-zoe-orchestrator-locked/) - ZOE locked architecture; SOUL/DOCTRINE upgrades it
- [Doc 883](../883-korro-ai-agent-company-audit/) - KORRO (sibling agent-company audit)
- [Doc 887](../887-agentverse-fetchai-agent-platform/) - sibling external-agent-platform audit
- `~/.zao/loop-zaoos-fixes.md` - this session's ad-hoc loop state (candidate to formalize SOUL/DOCTRINE-style)

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Draft a `SOUL.md` + `DOCTRINE.md` (6 invariants + escalation classes) for the ZOE/Hermes loop, modeled on proof-531 | @Zaal | PR to `bot/src/zoe/` | Next sprint |
| Add proof-by-type ("no done without its proof") to Hermes' fix-PR pipeline | @Zaal | PR to `bot/src/hermes/` | Next sprint |
| Add a scoped self-edit gate (auditor agent) before any ZOE self-modification | @Zaal | Design + PR | Backlog |
| Re-validate proof-531 (active experiment, fast-moving) | @Zaal | Re-research | 2026-07-21 |

## Sources

- [alexcheuk/proof-531 (GitHub)](https://github.com/alexcheuk/proof-531) - `[FULL]` - repo meta + README via gh API
- [proof-531 `.claude/skills/do-work/SKILL.md`](https://github.com/alexcheuk/proof-531/blob/main/.claude/skills/do-work/SKILL.md) - `[FULL]` - the 7-phase loop
- [proof-531 `do-work/DOCTRINE.md`](https://github.com/alexcheuk/proof-531/blob/main/do-work/DOCTRINE.md) - `[FULL]` - constitution + invariants
- [proof-531 `do-work/SOUL.md`](https://github.com/alexcheuk/proof-531/blob/main/do-work/SOUL.md) - `[FULL]` - north star (head)
- [proof-531 `.claude/skills/auto-improve/SKILL.md`](https://github.com/alexcheuk/proof-531/blob/main/.claude/skills/auto-improve/SKILL.md) - `[FULL]` - deprecated alias, confirms the /do-work rename
- [531strength.com](https://531strength.com) - `[PARTIAL - app landing + /process dev blog not deep-fetched; repo was the primary source]`
