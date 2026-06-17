---
topic: agents
type: guide
status: research-complete
last-validated: 2026-06-17
related-docs: 759, 770, 862, 863, 868
original-query: "can i get more feedback as its learning and figuring things out so i can prompt it midway thought he serach aswell like it can ask me for clarifiicing info as its looking and if i dont respond it continues but if i do it can add it to the contezt /zao-research what else we can do to make an agent more effective"
tier: STANDARD
---

# 872 — Making ZOE more effective: live feedback, mid-flight clarification, steering

> **Goal:** Zaal wants ZOE to show its work as it goes, ask clarifying questions mid-task that DON'T block (continue on no-answer, absorb the answer if it comes), and let him steer mid-run. Plus the other high-leverage things that make an agent effective. This doc maps each to ZOE's actual code and ranks by impact-for-effort.

## Key Decisions

| # | Decision | Why |
|---|----------|-----|
| 1 | Ship the 3 Zaal wants in this order: progress narration -> non-blocking clarify -> live steering | Narration is the cheapest visible win; clarify and steer need the turn to become pausable |
| 2 | Progress narration via streaming the CLI (`--output-format stream-json`) into ONE edited Telegram message | ZOE already sends a single ACK; upgrade it to a live "reading doc 364... drafting..." line. Don't spam new messages (Telegram rate limits) |
| 3 | Non-blocking clarify = ask + 60s window + proceed-with-stated-assumption | The exact behavior Zaal asked for. Reuse decompose's existing `plan.ambiguities` - it already detects "I'm unsure"; today it blocks, make it timeout-and-proceed |
| 4 | Live steering = a per-chat message queue ZOE drains before each sub-step | LangGraph's `check_message_queue_before_model` pattern. Mid-run Telegram messages get injected into the next worker's context, not lost |
| 5 | Lead with reflection + grounding (ZOE half-has both) before the hard streaming refactor | Highest impact-for-effort; the one-pager already proved grounding works |

## Part 1 - The 3 things Zaal asked for

### A. Live progress feedback (show the work)
- **Today:** ZOE goes quiet, sends ONE ack at 6s ("Got it. Working on this one") + a typing indicator (`index.ts:689`). The final answer lands all at once.
- **Want:** "reading doc 364... found the Acadia stats... drafting now" as it happens (Zaal saw a hint of this - ZOE said "Good material in docs 443 and 364" mid-turn, but only because the model emitted it, not because we stream).
- **How:** `callClaudeCli` runs the Claude CLI as a subprocess and waits for the final JSON. Switch to `--output-format stream-json`, parse tool-use + text events as they arrive, and EDIT a single Telegram message with the latest step. One message edited in place, not N new messages (Telegram throttles ~1 edit/sec).
- **Effort:** 6-7/10. Real refactor of the CLI wrapper's output handling. The visible payoff is high.

### B. Non-blocking clarification (the headline ask)
- **Want:** mid-task, ZOE asks "is this for the Oct 3 event or ZAOVille too?" - if Zaal answers in ~60s it folds the answer into context; if he stays quiet it proceeds with its best assumption and notes the assumption.
- **Today:** `decompose.ts` already produces `plan.ambiguities` and `handlePlanCommand` already pauses for them - but it BLOCKS (waits for y/n forever, TTL-expires). It also only happens before dispatch, not mid-search.
- **How:** when a worker hits an ambiguity, emit a `clarify` op -> ZOE DMs the question + starts a 60s timer -> on reply within the window, append the answer to the worker's context and resume; on timeout, the worker proceeds with the assumption it already stated and tags the output "(assumed X - say so if wrong)". The key is "ask but don't block" - the timeout is the default path, the answer is the bonus.
- **Effort:** 5-6/10. Needs the worker step to be resumable (checkpoint its partial state). Pairs naturally with live steering (C).

### C. Live steering / mid-run context injection
- **Want:** Zaal types something mid-run and the running agent uses it.
- **How:** a per-chat message queue (`~/.zao/zoe/queue/<chat>.jsonl`). While a turn runs, incoming DMs that aren't approvals get appended to the queue instead of starting a new turn. Before each worker sub-step (and before the next Claude call), ZOE drains the queue and injects new messages into context. This is LangGraph's `check_message_queue_before_model` pattern.
- **Effort:** 5-6/10. The queue is easy; the hard part is the dispatch loop checking it between steps.

## Part 2 - The other high-leverage effectiveness patterns (ranked impact-for-effort)

| Pattern | What | ZOE today | Effort |
|---------|------|-----------|--------|
| **Reflection / self-critique** | Agent critiques its own draft before returning (Reflexion: ~80%->91% on coding) | Partial - dispatch has critics (research-critic etc.), but single-turn concierge answers are uncritiqued | Easy (1-2 days, prompt-level) |
| **Grounding + citation discipline** | Drop any claim that can't cite a source (RAG alone still ~33% hallucination) | Strong - ZOE greps research/ + delves Bonfire, cites doc numbers (the one-pager cited 364/443 + Limone) | Already shipped, tighten the "no cite = drop it" rule |
| **Memory layers** | user/agent/run scoped persistence + retrieval | Strong - 4-block Letta memory + Bonfire graph + extractors (doc 862) | Mostly done |
| **Scoped tool allowlists per worker** | Each subagent gets only the tools it needs (least privilege) | Done - `workers.ts` sets per-worker allowlists | Done |
| **Cost + iteration caps** | Hard $ + turn caps so a run can't spiral | Done - `maxBudgetUsd`, dispatch budget pre-flight | Done |
| **Eval loop** | Score outputs against a rubric, catch regressions | Partial - watcher-agent does a pass/warn/fail sanity check; no standing eval set | Moderate |
| **Perspective-diverse verification** | N verifiers with different lenses, not N identical | Not yet - critics are single-lens | Moderate |

## Honest read

ZOE is already strong on the "quiet but correct" axis - grounding, memory, caps, critics. What it lacks is the "visible and steerable" axis Zaal is asking for: it works in the dark and hands back a finished result. The one-pager was excellent but Zaal couldn't watch it form or nudge it. A, B, C close exactly that gap. None are trivial (all touch the CLI-subprocess turn model), but B (non-blocking clarify) is the highest-value single feature and reuses the ambiguity detection that already exists.

## Also See

- [Doc 759](../759-agent-best-practices-and-zoe-orchestrator-gap/) - GATEWAY + 8-worker + critics lock
- [Doc 770](../770-zoe-orchestrator-audit/) - the dispatch loop, budget caps, approval gates
- [Doc 862](../862-zoe-multiagent-fanout-bonfire/) - extraction fan-out (memory layer)
- [Doc 868](../../business/868-brand-weakness-audit-zoe-agent-status/) - agent-builder status (plan: -> auto-decompose)

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| B: non-blocking clarify - emit a `clarify` op, 60s window, proceed-on-timeout with stated assumption | @Zaal | Claude Code | Next ZOE build |
| C: per-chat message queue drained between sub-steps (live steering) | @Zaal | Claude Code | With B |
| A: stream the CLI (`stream-json`) into one edited Telegram progress message | @Zaal | Claude Code | After B/C |
| Reflection pass on single-turn concierge answers (cheap, high impact) | @Zaal | Claude Code | Quick win |

## Sources

- [LangGraph - Human-in-the-Loop + interrupt()](https://docs.langchain.com/oss/python/langchain/human-in-the-loop) [FULL]
- [OpenAI Agents SDK - Streaming](https://openai.github.io/openai-agents-python/streaming/) [FULL]
- [Reflexion / agent self-critique](https://stackviv.ai/blog/reflection-ai-agents-self-improvement) [FULL]
- [AI Agent Memory 2026](https://www.digitalapplied.com/blog/ai-agent-memory-vector-graph-episodic-2026) [FULL]
- [RAG grounding - fake-citation tests](https://medium.com/@Nexumo_/rag-grounding-11-tests-that-expose-fake-citations-30d84140831a) [FULL]
- [The 11 fallback paths that trap agents](https://medium.com/@jickpatel611/the-11-fallback-paths-that-trap-agents-in-loops-a0be8a7835ba) [FULL]
- ZOE codebase: `bot/src/zoe/index.ts:689` (ack/typing), `decompose.ts` (plan.ambiguities), `workers.ts` (allowlists), `dispatch.ts` (budget caps) [FULL, local]
- Full research brief: `/tmp/agent_effectiveness_research.md` (35+ sources, this session) [FULL]
