# 2160 - "Founder Brain" (BrainDrive/David Twaring) vs the ZAO Agent Kit

**Date:** 2026-07-30
**Status:** Research (grounded - the full post is saved off-repo at `~/.zao/private/reddit-founder-brain-braindrive.json`, fetched via arctic_shift).
**Owner:** Zaal
**Source:** David Twaring (BrainDrive), r/EntrepreneurRideAlong, "My full 'founder brain' setup w/ skills, templates, and SOPs" (post 1vb3jhn, 2026-07). Zaal flagged it 2026-07-30.
**Siblings:** [[project_obsidian_second_brain]], `.claude/rules/agent-loops.md`, `.claude/rules/thread-discipline.md`, `.claude/rules/claude-usage.md`, [[project_zao_master_context]], [[project_icm_boxes]], doc 154 (skills reference), doc 606 (second-brain system).

---

## Why Zaal flagged it

A build-in-public founder posted his complete "turn AI into a second brain to run my company" system - model-agnostic, ownership-first, all prompts/templates/SOPs included. The interesting result on reading it: **ZAO already runs a more advanced version of this exact architecture.** So the value here is threefold - (1) external validation that ZAO's agent-kit design is right (an independent founder converged on the same shape), (2) 2-3 crisp framings worth adopting, (3) a clean reference for onboarding new ZAO teammates to the kit (build-in-public).

## His framework (6 steps + 4 SOPs + 7 templates)

- **Step 1 - Hire your AI:** intelligence (frontier model) + harness (hands). Agentic tools, not chatbots - Codex for code, Claude Code for business/writing, terminal > apps, no lock-in.
- **Step 2 - Workspace:** one owned place for all shared context - a private GitHub repo (`company-library`) synced locally, plain text. "Could you walk away to a different AI/harness/host and take everything?"
- **Step 3 - Structure:** `AGENT.md` (front door) + `company/` (mission, values, how-we-decide) + `projects/` (spec, plan, decisions, open-questions) + `operations/` (same shapes, never finish) + `process/` (SOPs) + `journal/` + `tasks.md` (Now/Next/Done). **"Projects ship, operations run"** - end state = project, runs-forever = operation.
- **Step 4 - Context:** feed it the real material (mission, plans, feedback, learnings).
- **Step 5 - Access:** connections/permissions - communication access first, execution second, minimum access, make the AI explain each connection before granting. Copy-paste works if you'd rather not connect.
- **Step 6 - SOPs (the compounding step):** after every session/meeting the record updates - decisions logged, board reconciled, docs trued up, learnings folded into the SOP. Four SOPs: session close-out, process-a-meeting, plan-a-project, weekly close-out.
- **Templates:** alignment interview, spec, plan, decision log, open questions, task board, AGENT.md front door.

## The mapping - ZAO already runs this (mostly more advanced)

| His piece | ZAO's equivalent | Verdict |
|-----------|------------------|---------|
| Harness (Codex/Claude Code, terminal, no lock-in) | Claude Code + Codex + the multi-provider fleet, surface-tiering (`claude-usage.md`) | ZAO more advanced (cost-tiered fleet, failover) |
| `company-library` GitHub repo, plain text, ownership test | ZAOOS repo (~1,275 research docs), OSS-first, plain-text | ZAO far more advanced |
| `AGENT.md` front door | `CLAUDE.md` + `AGENTS.md` + `.claude/rules/*` | Match; ZAO's is richer (12+ behavior-changing rule files) |
| `company/` (mission, values, how-we-decide) | ICM boxes (canonical brand/company truth) + brand canon | ZAO more advanced on mission/values; **how-we-decide is thinner** (see adopt #2) |
| `projects/` (spec/plan/decisions/open-q) | `research/` numbered docs + the brainstorming/writing-plans skills | Match |
| `process/` SOPs | 72 skills (`/end`, `/retro`, `/meeting`, `/plan-*`) + the rules | Match; ZAO's is a superset |
| `journal/` | `research/` + session summaries + MEMORY.md | Match |
| `tasks.md` (Now/Next/Done) | the cowork board + capture->triage->crush loop | ZAO more advanced (live board, TG bridge) |
| Access/permissions discipline | MCP connectors + the gating rules (prohibited/gated/regular) | ZAO far more rigorous |
| Session/weekly close-out SOP | `/end`, `/retro`, thread-discipline end-recap | Match; his weekly rhythm is crisper (adopt #3) |

## Worth adopting (the honest 3)

1. **"Projects ship, operations run."** A clean, missing distinction. ZAO's `research/` mixes finite projects with forever-operations (marketing, festivals, the fleet). Tagging each as project (has an end state) vs operation (runs forever, same doc shapes but never "done") would sharpen the board + research taxonomy. Low effort, real clarity.
2. **A crisp `how-we-decide` doc (fast vs careful).** His `company/how-we-decide.md` names what gets decided fast vs carefully. ZAO has the gating rules (prohibited/gated/regular) for AI actions, but not an explicit "which decisions are reversible/fast vs one-way-door/careful" for Zaal himself. Worth a short canon doc - it is the human-side complement to the AI gating rules.
3. **The weekly close-out rhythm as a standing SOP.** ZAO has `/retro` but his weekly close-out is a tighter loop: score planned-vs-done task-by-task, carry/drop/re-scope with a one-line reason, re-check the top of the board against the mission, set the 3-5 that matter, and fold learnings INTO the SOP. This is exactly `agent-loops.md` rule 10 (learn online, fold back) + `thread-discipline.md` end-recap, made a weekly cadence. Worth formalizing as a `/weekly` skill or a Friday cron.

## What ZAO already does better (do NOT regress toward his simpler version)

- Multi-agent fleet + cost-tiered provider failover (he runs one agent).
- Canonical upstream truth (ICM boxes) that downstream copy is generated FROM (`icm-grounding.md`) - he has static `company/` files that can drift.
- Rigorous action gating (prohibited/gated/regular) + secret/PII hygiene rules - his access section is good instinct but far lighter.
- Live board + Telegram bridge vs his flat `tasks.md`.
- Institutional memory at scale (~1,275 docs + numbered-doc reservation) vs a `journal/` folder.

## Verdict

Validation, not a blueprint to copy. An independent founder building in public arrived at the same architecture ZAO already runs - front door + context + projects + process + journal + board + close-out SOPs. Adopt the three crisp framings above (projects-vs-operations, how-we-decide, the weekly close-out cadence); keep everything ZAO already does more rigorously. Also a strong external artifact for build-in-public and for onboarding teammates to the ZAO agent kit ("here's a public version of what we run, here's how ours goes further").

## Source

Full post: `~/.zao/private/reddit-founder-brain-braindrive.json` (24,396-char body, fetched 2026-07-30 via `zao-fetch-reddit.sh` / arctic_shift). Author: David Twaring / BrainDrive.
