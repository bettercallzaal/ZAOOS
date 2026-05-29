---
id: agent-003
category: prompt-engineering
tier: core
severity: critical
applies_to: [multi-agent, llm]
deprecated_since: null
sources: [memory:feedback_no_sub_agent_context_fabrication, doc-766, "research/community/758e-mentor-handbook-patterns/README.md FABRICATION CORRECTION section"]
---

## NEVER invent specifics in a sub-agent's prompt context block

When writing the prompt for a sub-agent (Task tool, /zao-research dispatch, etc.), the CONTEXT block must contain ONLY facts the user has explicitly stated or that are demonstrably true from the codebase / git history / verified source.

The sub-agent treats the context as ground truth. If you write "Compensation: $2k USDC + 5 ETH pool" into the context because it sounds reasonable, the sub-agent bakes those numbers into its output. The output launders through a research doc into external-facing copy and ships as if user-approved.

This is the load-bearing failure mode of multi-agent systems with operator-written prompts. Every specific number, date, percent, name, cadence in a context block must trace to a real source.

### When NOT to do this

Single-agent flows where you write + read in one turn: less risk, but still avoid inventing.

### Example

```text
WRONG (the 758e incident pattern):
"Compensation: USDC honorarium + 5 ETH split-pool for Top-3 Champions.
Time commitment: ~3-5 hr/week for 3 months. Mostly async Telegram + 1 weekly call."

CORRECT:
"Compensation: TBD by Zaal. Time commitment: TBD by Zaal.
If you need a specific number for X, write [TBD by Zaal] not a guessed value."
```
