---
topic: agents
type: audit
status: research-complete
last-validated: 2026-08-06
related-docs: 2225, 2228, 2231, 601
original-query: "do an audit on our agent (ZOE) vs other agents and toolkits out there"
tier: DISPATCH
---

# 2235 - ZOE vs the agent toolkits: an honest competitive audit

> **Goal:** Audit ZOE against the major agent frameworks/toolkits - grounded in ZOE's
> ACTUAL 102 modules and a real read of each competitor - to find where ZOE genuinely
> leads, where it lags, and a ranked adopt list.

## Method + honesty check

A parallel Workflow (run `wf_eddf1949-77d`): one agent inventoried ZOE's real
`bot/src/zoe/*.ts` (102 files, header docstrings), then 6 agents each audited ZOE against
a real toolkit (GitHub-first read). **7 agents, 6 completed, 121 tool_uses (~17/agent =
real reads), 628k tokens.** Two agents failed cleanly (claude-agent-sdk + autogen -
structured-output retry cap; autogen's `rm -rf` on its own /tmp clone was correctly
BLOCKED by `.claude/rules/no-rm-rf.md`, even inside a subagent - the guard works). 4
grounded audits kept: **Letta, OpenAI Agents SDK, LangGraph, CrewAI.**

Citations spot-checked (research-grounding rule): OpenAI `src/agents/guardrail.py` exists
(49 guardrail/handoff refs in agent.py); `letta-ai/letta` real (24.1k stars, Apache-2.0).
Auditors inflate - graded DOWN below.

## What ZOE actually is (from the 102-module inventory)

ZOE is NOT a framework - it's a **live, proactive, Telegram-native operator** with:
- **Memory:** 4-block concierge context (persona/human/working/tasks) + Bonfire knowledge-
  graph recall (`recall.ts`) + Letta-style self-improving memory (`reflexion.ts`).
- **Autonomy loops:** `error-remediation.ts` (app errors -> fix PRs), `work-loop.ts`
  (research queue -> docs+PRs), `repo-improver.ts` (cheap-AI audit loop), `verify-replan.ts`.
- **Safety:** `cost-governance.ts` (spend thresholds), `pii.ts`, `preflight.ts`, `fleet-health.ts`.
- **Proactivity:** `grill.ts`, `proactive.ts`, `escalation.ts`, `pending-decisions.ts`.
- **Trust/identity:** `receipts.ts`, `receipt-envelope.ts` (DreamNet), `identities.ts` (per-brand).
This is an operator, not a library. That framing decides the audit.

## The scoreboard (grounded, graded honestly)

| Toolkit | License | ZOE's real GAP vs it | ZOE's advantage over it |
|---------|---------|----------------------|--------------------------|
| **Letta/MemGPT** (24k) | Apache-2.0 | **Git-backed memory w/ commit-per-edit audit trail** - ZOE's `~/.zao/zoe/*.md` memory has no version history. REAL gap. | Bonfire knowledge-graph recall (decentralized); Letta is a local server. |
| **OpenAI Agents SDK** | Apache-2.0 | **Composable guardrails abstraction** (`InputGuardrail`/`OutputGuardrail` first-class) - ZOE's guards (cost/pii/preflight) are scattered, not a composable interface. REAL, moderate. | Long-running autonomy loops (error->fix-PR, research->docs) - the SDK is reactive. |
| **LangGraph** | MIT | Declarative graph-topology DSL - ZOE's flow is implicit in `dispatch.ts`/`topic-router.ts`, not a visual graph. LOW (ergonomics, not a capability gap). | Proactive/unsolicited decisions (`grill`/`proactive`); native Telegram; live cross-chat. |
| **CrewAI** | MIT | Declarative agent-role schema (`Agent(role, goal, backstory)` Pydantic) - ZOE's `identities.ts` personas are less formalized. LOW-MEDIUM. | Telegram-native orchestration + a real trust/identity layer; CrewAI is Python-lib-first. |

## The honest verdict

**ZOE leads exactly where a live operator should and these libraries can't follow:**
proactive autonomy loops (nothing here turns app-errors into fix-PRs unattended), a
decentralized knowledge graph (Bonfire), Telegram-native live steering, and a trust/
identity layer (tonight's receipts/erc8004/DreamNet). The frameworks are **reactive
libraries** - you call them; ZOE runs itself and pings you.

**ZOE lags in two real, worth-fixing spots** (the rest are ergonomics, not gaps):
1. **Memory has no version history** (Letta) - a plain-file memory that can't show "what
   changed, when, why" or roll back. This is the strongest finding and it rhymes with
   tonight's trust-chain work (receipts = audit trail for actions; git-backed memory =
   audit trail for beliefs).
2. **Guards aren't a composable abstraction** (OpenAI) - cost/pii/preflight each do their
   own thing; a single `Guardrail` interface would make them uniform + testable.

## Ranked adopt list (all PR-only, verify-first)

1. **Git-backed memory with commit-per-edit (from Letta). HIGH.** A `commitMemoryWrite(path,
   reason, author)` that versions every `~/.zao/zoe/*.md` write in a git repo - full history,
   diffs, rollback, and a `whyDidYouChangeThat` traversal. Cleanly on-theme with receipts.
2. **A composable Guardrail abstraction (from OpenAI Agents SDK). MEDIUM.** One
   `InputGuardrail`/`OutputGuardrail` interface that `cost-governance`/`pii`/`preflight`
   implement, run as a uniform pre/post check with a tripwire result.
3. **Formalize `identities.ts` personas as a first-class role schema (from CrewAI). LOW-MED.**
4. **Optional: a declarative view over ZOE's dispatch flow (from LangGraph). LOW.** Ergonomics.

Check-alternatives (feedback_check_alternatives_oss_first): all four are cleanly licensed
for pattern-adoption (Apache-2.0 / MIT) - adopt the PATTERN, don't vendor the framework;
ZOE stays a bespoke operator, not a framework port (that would lose its advantages).

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Build git-backed memory (commit-per-edit) for `~/.zao/zoe/*` - the #1 adopt | @Zaal (Claude) | PR | 2026-08-08 |
| Refactor ZOE's guards into a composable Guardrail interface (cost/pii/preflight) | @Zaal (Claude) | PR | 2026-08-10 |
| Keep the 102-module inventory as the living ZOE capability map (confirm-before-claiming-absence) | @Zaal (Claude) | Doc | 2026-08-08 |
| Review this audit in the morning browse pile | @Zaal | Review | 2026-08-07 |

## Sources

- **Workflow `wf_eddf1949-77d`** - inventory + 4 grounded audits, 121 tool_uses, spot-checked. [FULL]
- **letta-ai/letta** (Apache-2.0, 24.1k), **openai/openai-agents-python** (`src/agents/guardrail.py`,
  `agent.py`), **langchain-ai/langgraph** (MIT), **crewAIInc/crewAI** (MIT) - read this run. [FULL]
- ZOE ground truth: `bot/src/zoe/*.ts` (102 files, header docstrings, read this run). [FULL, in-repo]

## Also See

- [Doc 2225](2225-austin-griffith-clawd-agent-swarm/), [Doc 2228](2228-clawd-claude-p-agent-adopt-spec/) - the clawd "no framework" thesis this audit corroborates.
