# Claude Usage - surface tiering + spend discipline

How to spend Claude effort well. Complements CLAUDE.md "Workflow Orchestration"
(plan first, subagents over inline) and "Token Budget" (compact, grep-not-bulk).
This file adds the CROSS-SURFACE decision: which surface does which task, so the
Claude Code weekly cap is spent only on what actually needs it.

Origin: Brandon's 2026-07-21 note ("plan in the free chat, hand the agent the
plan, don't burn the agent thinking") + the ZAO cheap-AI cost ladder
(`research/.../cheap_ai_stack`, the fleet failover). Behavior-changing.

## The one principle

**Match each task to the cheapest surface that can do it WELL, and reserve the
Claude Code weekly cap for grounded live-code work.** Zaal is on Claude Max -
the constraint is not per-token cost, it is the **weekly usage cap** (that is
what caps the fleet). Every agent turn spent thinking, researching, or drafting
is cap that is not available for editing real code.

## The surface ladder (task -> surface -> why)

| Task | Surface | Why |
|------|---------|-----|
| Architecture, approach, "what should we build", spec-writing | **Claude chat / plan mode** | Thinking is cheap here; keeps agent turn-count down. If chat is a looser pool than Code on the Max plan, it is a pure win. |
| Research, docs, summaries, drafts, classification | **OpenRouter (DeepSeek) / Ollama** via the fleet loops | Off the Claude cap entirely. Research loops are already pinned to OpenRouter. |
| Well-specified, low-judgment mechanical code | **Codex** ($20 flat) when available | Cheap for rote transforms once the spec is clear. |
| Grounded edits + verify + PR on live code | **Claude Code** (the Max cap) | Only tier that reads the actual repo, edits in place, typechecks, opens a PR. Spend the cap HERE, not on the rows above. |

When Claude Code is capped, the fleet fails over (claude -> codex -> openrouter
-> ollama) automatically - see `.claude/rules/agent-loops.md` + provider-health.

## The plan-then-build pattern (Brandon's note, corrected)

Right: **plan/spec in chat, then hand the agent the spec** so the agent's turns
are tight (read -> edit -> verify -> PR), not exploratory.

Wrong for this repo: "write ALL the code in chat, paste it into the agent." Code
written blind to the live repo usually does not fit - wrong imports, stale APIs,
missed conventions - and the agent reworks it anyway, costing MORE. The agent's
value is that it reads live code first (`agent-loops.md` rule 3: code is ground
truth). So:

- **Greenfield / small standalone file:** prewriting in chat + pasting is fine.
- **Editing a live codebase (ZAOOS, the apps):** hand the agent the SPEC + file
  list, let it write the code grounded in the repo. Do not paste blind code.

## Do NOT spend the Claude Code cap on

- Reading whole files/dirs each pass (agent-loops rule 2: open only what the task
  touches; grep `research/*/README.md`, never bulk-read).
- Research/summarization a cheaper tier can do - push it to the fleet.
- Long exploratory "figure it out live" sessions - plan in chat first, then the
  agent executes a known plan.
- Re-deriving context already established - read the session state / progress
  note, do not re-explore.

## Do spend it on

- Grounded multi-file edits with verify + PR (the thing only the agent does well).
- Subagents for bounded research/audit/parallel work (context isolation is
  cheaper than growing one giant prompt - agent-loops rule 7). Tonight's 3-way
  cowork audit is the pattern.

## Source

Brandon 2026-07-21 (plan-free, build-cheap). Ladder = ZAO cheap-AI stack + the
multi-provider fleet failover. Sibling: `.claude/rules/agent-loops.md`.
