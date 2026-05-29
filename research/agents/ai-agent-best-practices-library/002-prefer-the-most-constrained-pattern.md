---
id: agent-002
category: agent-architecture
tier: core
severity: high
applies_to: [llm, multi-agent, autonomous]
deprecated_since: null
sources: ["Anthropic Building Effective Agents (Schluntz + Zhang 2024)", doc-759]
---

## USE the most-constrained pattern that solves the problem

Single-LLM-call beats prompt-chain. Prompt-chain beats workflow. Workflow beats agent. Agent (autonomous loop) beats nothing - it solves only the cases where genuine open-ended reasoning is required.

Anthropic's stance across blog + docs is consistent: pick the simplest pattern that works. Each step up the ladder adds non-determinism, cost, and failure modes (infinite loops, hallucinated tool calls, context overflow, prompt injection at boundaries).

The mistake people make is reaching for "multi-agent debate" or "autonomous agent" because it sounds smart, when a routing classifier or a 3-step prompt chain would have been better.

### When NOT to do this

Truly open-ended goals (research without a known shape, exploratory coding, novel debugging) need agentic loops because the path is genuinely unknown upfront. Don't force a workflow on those.

### Example

```
Goal: "categorize incoming emails as urgent / normal / spam"
- Single LLM call with classification prompt. DONE.

Goal: "research X then write a doc citing 5+ sources"
- Prompt chain: research-call -> outline-call -> draft-call. Each step deterministic.

Goal: "fix this failing test"
- Evaluator-optimizer (Hermes pattern): coder writes diff, critic scores, retry until score >= 70.

Goal: "build me a Twitter clone over the weekend"
- Autonomous agent loop. Genuinely open-ended.
```
