---
topic: agents
type: decision
status: research-complete
last-validated: 2026-08-02
superseded-by:
related-docs: 2178, 928, 601
original-query: "Set up per-brand boards / terminals to get all this done - each brand runs its own terminal that completes its tasks autonomously, everything rolls up to one screen Zaal watches, and only decisions come to him. Build it to 100%."
tier: STANDARD
---

# 2182 - Per-Brand Terminals: Dispatch + Boards (Divide & Conquer)

> **Goal:** Make the orchestrator-worker harness (doc 2178) operational for real work: each brand gets a worker terminal that completes its tasks PR-only, everything rolls up to one board Zaal watches, and only decisions route to him. This doc ships the SEND half + the board, and specs the one gated RECEIVE-half deploy.

## Key Decisions (recommendations first)

| # | Decision | Recommendation | Why |
|---|----------|----------------|-----|
| 1 | Build new infra or organize existing | **Organize existing.** 9 brand loops + relay + board + fleet dashboard already exist; only the dispatch link is missing. | Don't rebuild a working fleet. |
| 2 | Per-brand boards = new DBs? | **No - a per-brand VIEW of the one board**, classified by keyword. `brand-boards.py` renders it. | One searchable store; per-brand is a filter, not a fork. |
| 3 | How a task reaches a brand terminal | **`zao-dispatch <lane> "task"` posts a TASK to the brand's relay lane;** the loop's relay-autopull hook injects it and it works it PR-only. | The autopull hook already feeds a terminal's lane into its context - most of the wire exists. |
| 4 | Deploy the loop-side change how | **Gated verify-then-deploy on the VPS, never a hot-edit** (agent-loops rule 31/32). This doc specs it; Zaal deploys. | The loops are the live fleet; a bad edit split-brains 9 workers. |
| 5 | What can't be delegated | **Decisions, sends, merges, interactive grills -> the Questions topic**, never a terminal. | A worker can't decide for Zaal (rule 8, human gate). |

## The model (one line)

**Desktop orchestrator assigns -> `zao-dispatch` drops a TASK on a brand lane -> the brand's worker terminal pulls it, does it PR-only, reports back -> results roll up to `brand-boards.html` + decisions route to the Questions topic.**

## What already exists (verified 2026-08-02)

- **9 brand worker terminals** (VPS tmux loops): `zoe, ww, coc, zaostock, fractal, sparkz, zol, human, warpee` - each with provider failover (claude->codex->openrouter->ollama). (doc 2178 device audit.)
- **The relay hub + lanes** (`~/bin/zao-relay`, hub row legacy_id=9000, free-string lanes) = the dispatch bus.
- **The relay-autopull hook** (`~/bin/relay-autopull.sh`, a UserPromptSubmit hook) already injects a terminal's unread lane messages into its context, ack'd once. This is why a dispatched lane task can reach a terminal with no new plumbing on the interactive path.
- **The cowork board** (Supabase `tasks`) = the one task store.
- **The fleet dashboard** (`ztui` / `zfleet`) = the watch surface.
- **The Questions topic** (ZAAL BOTZ thread 5238) = where decisions collect.

## What this doc SHIPS (PR-only, this branch)

1. **`scripts/fleet/zao-dispatch.sh`** - the dispatch primitive. `zao-dispatch <lane> "<task>" [--doc]` posts a structured, guardrailed TASK to a brand lane. Every dispatch carries the PR-only / gated-stays-gated reminder in the message body, so a dispatched task never implies authority to merge/send/spend/deploy.
2. **`scripts/fleet/brand-boards.py`** - the per-brand board roll-up. Classifies every open board task into a brand terminal by keyword, folds in open ZAOOS PRs, renders `~/.zao/fleet/brand-boards.html`. Verified 2026-08-02: 339 open tasks -> WaveWarZ 25 / ZABAL 35 / ZAOstock 22 / Sparkz 16 / Fractal 12 / ZOL 7 / COC 8 / ZOE-dev 65(+5 PRs) / general 149.

## The one gated deploy (the RECEIVE half) - SPEC for Zaal

The loops today run in **scout mode** (they generate their own work). To make them drain dispatched tasks, add ONE step at the top of each loop tick, in `loop-agent.sh` (or the loop's prompt), on the VPS:

```
# at tick start, before the scout prompt:
DISPATCHED="$(zao-relay inbox "$ZAO_LANE" 2>/dev/null)"
# if DISPATCHED contains "TASK (dispatched by orchestrator)", prepend it to the
# loop's prompt as the priority instruction for this tick, ahead of scout work.
```

Guardrails that MUST hold in the loop prompt (they already do for scout mode - keep them): PR-only, never merge, never send outbound, never spend, never deploy; a gated action bounces to Zaal via `zao-ask-dm` / the Questions topic. A dispatched task inherits the SAME guardrails - it changes WHAT the loop works on, never WHAT it's allowed to do.

**Deploy discipline (agent-loops rules 31/32):** verify on a fresh checkout, restart one loop as a canary, watch it drain a test dispatch, then roll to all 9. Never hot-edit the live loop runtime. This is a `~/bin` operator action on the VPS - Zaal's gate, not the orchestrator's.

## The honest split (what CAN vs CAN'T be delegated)

| Delegatable to a brand terminal (PR-only) | NOT delegatable (-> Questions topic / Zaal) |
|---|---|
| research docs, audits, drafts | decisions (Finals prizes, token config) |
| code fixes, wiring, migrations-as-PRs | outbound sends (Iman, Brandon) |
| classification, data cleanup | merges to main / live deploys |
| — | interactive meeting grills / VERIFY |

Roughly half of today's board is each. The terminals clear the left column; Zaal answers the right in one topic.

## How Zaal watches

One page (`brand-boards.html`) + the Questions topic. Per brand: in-progress count, task list, open PRs. No babysitting nine terminals - review the roll-up, answer decisions.

## Also See

- [Doc 2178](2178-agent-harness-orchestrator-workers/) - the orchestrator-worker harness this operationalizes.
- [Doc 928](928-agent-loop-best-practices/) - rules 8 (human gate), 9 (one instance), 31/32 (verify-then-deploy).
- [Doc 601](601-agent-stack-cleanup-decision/) - no new bots; brand voices are personas, not new processes.

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Deploy the loop-side dispatch step to ONE loop as a canary, drain a test dispatch, then roll to 9 | @Zaal | Gated VPS deploy | 2026-08-05 |
| Symlink `scripts/fleet/zao-dispatch.sh` + `brand-boards.py` into `~/bin` on the fleet | @Zaal | Manual | 2026-08-04 |
| Wire `brand-boards.html` into the fleet dashboard (ztui) as a tab | @Zaal | PR | 2026-08-07 |
| Route today's delegatable open items to their brand lanes (done this session for the live set) | @Zaal | Dispatch | 2026-08-02 |

## Sources

- [FULL] `~/bin/relay-autopull.sh`, `~/bin/zao-relay` - the existing dispatch bus + autopull hook (read this session).
- [FULL] Doc 2178 device audit - the 9 VPS brand loops + relay + fleet dashboard.
- [FULL] `brand-boards.py` run 2026-08-02 - live 339-task classification across 9 brands (output above).
