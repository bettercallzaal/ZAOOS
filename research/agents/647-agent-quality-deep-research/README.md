---
topic: agents
type: decision
status: research-complete
last-validated: 2026-05-14
related-docs: 460, 483, 523, 529, 541, 547
tier: DEEP
---

# 647 — Agent Quality Deep Research (Hub)

> **Goal:** Concrete, prioritized patterns to make ZOE, Hermes, and the ZAO child-bot fleet measurably better. Six dimensions researched in parallel; this hub synthesizes them into a shippable plan.

## Key Decisions (act on these)

| # | Decision | Source | Effort | Leverage |
|---|----------|--------|--------|----------|
| 1 | **Fix ZOE tool under-calling NOW.** Rewrite tool descriptions to say WHEN not just WHAT; add an explicit "grep research/ first on ZAO questions" instruction. ZOE skips Grep because of permission friction + generic descriptions. | 647d | LOW | HIGH |
| 2 | **Refactor persona.md into a Constitution + Persona split.** Immutable shared layer (voice, anti-patterns, output format) imported as a TypeScript module; child bots override only domain + tools. Text-copy inheritance is brittle and drifts. | 647c, 647a | HIGH | HIGH |
| 3 | **Convert system prompts from freeform text to XML structure.** `<role>`, `<constraints>`, `<output_format>`, `<failure_modes>`. Anthropic's 2026 standard; ~10x clearer instruction-following on multi-part tasks. | 647a | MED | HIGH |
| 4 | **Stand up Promptfoo evals before any more prompt changes.** 20-25 golden cases + rubric LLM-as-judge + GitHub Action pre-merge gate. ~$52/year, 4-6 hr setup. Without this every persona change ships blind. | 647f | MED | HIGH |
| 5 | **Add citation enforcement to research-library answers.** RAG + post-generation citation-overlap check. 60-80% hallucination reduction. Enforceable, not a platitude. | 647e | MED | MED |
| 6 | **Formalize bare-files memory into hot/warm/cold tiers.** 200-line hot-tier cap on persona/human; working memory becomes warm. Do NOT adopt a vector store yet — bare files are a strength at ZAO's scale. | 647b | MED | MED |
| 7 | **Restructure prompts for cache hits.** Static prefix (Constitution + persona) reused across turns; target 70%+ cache hit. Cache TTL dropped to 5 min in 2026. | 647a | LOW | MED |

## The Six Dimensions

| Doc | Dimension | One-line verdict |
|-----|-----------|------------------|
| [647a](647a-prompt-engineering.md) | Prompt engineering | XML structure beats markdown; kill hedging language; design for the 5-min prompt cache. |
| [647b](647b-memory-architectures.md) | Memory architectures | Hot/warm/cold tiers (4.7x cheaper, +29.6 temporal reasoning). Bare files stay until 15+ daily bots; then Mem0. |
| [647c](647c-persona-soul-inheritance.md) | Persona / soul / inheritance | Persona attention decays 30%->5% over 20 turns. Use the Constitution pattern (shared module), not text-copy. |
| [647d](647d-tool-use-prompting.md) | Tool-use prompting | Grounding is non-negotiable. "Think before tool" cuts tool errors 54%. ZOE under-calls due to permission friction. |
| [647e](647e-anti-hallucination.md) | Anti-hallucination | Claude 4.x baseline is 3% (strong). RAG + citation check = 60-80% reduction. Extended thinking spikes it to 10%+. |
| [647f](647f-agent-evals.md) | Agent evals | Promptfoo. Golden datasets beat synthetic 3:1. Pre-merge gate posts regression summary in 30s. |

## Synthesis: the convergence

All six dimensions point at the same two files: `bot/src/zoe/concierge.ts` and `~/.zao/zoe/persona.md`. They are not six separate projects; they are one refactor with an eval harness wrapped around it.

The dependency order is strict:

1. **Evals first (647f).** Without a regression gate, every change after this is unmeasured. Stand up Promptfoo + 20 golden cases. This is the gate for everything below.
2. **Tool grounding (647d).** Smallest diff, fixes a real observed bug (ZOE not greping the research library before answering ZAO questions). Ship as its own PR immediately - it is low-risk and independently valuable.
3. **Constitution refactor (647c + 647a + 647e).** The big one. persona.md becomes XML-structured, splits into immutable Constitution (shared TS module) + mutable Persona. Citation-enforcement rules (647e) live in the Constitution. Children import the Constitution. This is one PR, gated by the evals from step 1.
4. **Memory tiers (647b).** Independent of the above; can land in parallel. Formalize bare files, add the 200-line hot cap, scope working memory as warm tier.
5. **Cache optimization (647a).** Falls out naturally once the Constitution is a stable static prefix. Measure cache hit rate after step 3.

## Cross-cutting numbers

- Persona attention decay: 30% -> 5% over 20 turns ([647c](647c-persona-soul-inheritance.md), Li et al. ICML 2024)
- "Think before tool" error reduction: 54% ([647d](647d-tool-use-prompting.md))
- RAG + citation hallucination reduction: 60-80% ([647e](647e-anti-hallucination.md))
- Claude 4.x factual hallucination baseline: 3% (vs 6-82% ungrounded) ([647e](647e-anti-hallucination.md))
- Extended-thinking hallucination spike: 10%+ (FACTS Dec 2025) ([647e](647e-anti-hallucination.md))
- Hierarchical memory: 4.7x cheaper tokens, +29.6 temporal reasoning ([647b](647b-memory-architectures.md))
- Promptfoo eval cost: ~$52/year in judge tokens, 4-6 hr setup ([647f](647f-agent-evals.md))
- Prompt cache TTL: 5 minutes (down from 60 in late 2025) ([647a](647a-prompt-engineering.md))
- Golden datasets vs synthetic: 3:1 regression-catch ratio ([647f](647f-agent-evals.md))

## Codebase grounding

This research maps to real files in the ZAO OS repo:

- `bot/src/zoe/concierge.ts` - the Claude CLI call; target for tool-grounding + XML restructure
- `bot/src/zoe/memory.ts` - the 4-block builder; target for hot/warm/cold tiers
- `~/.zao/zoe/persona.md` (VPS) - the persona; target for Constitution split
- `~/.zao/zoe/bootloader-template.md` (VPS) - child-bot seed; target for Constitution-import pattern
- `evals/zoe/` - barely-used eval dir; target for Promptfoo golden dataset
- `bot/src/hermes/claude-cli.ts` - shared CLI wrapper; benefits from cache restructure

## Also See

- [Doc 460](../460-zao-agentic-stack-end-to-end-design/) - the agentic stack design this refines
- [Doc 483](../483-hermes-agent-local-llm-framework/) - Hermes framework
- [Doc 523](../523-zao-agentic-systems-full-audit-fix-pr-pipeline/) - prior full audit
- [Doc 529](../529-hermes-quality-pipeline-pre-critic-gates/) - Hermes quality gates
- [Doc 541](../541-hermes-gaps-vs-industry-best-practices/) - Hermes gap analysis
- [Doc 547](../547-multi-agent-coordination-bonfire-zoe-hermes/) - Bonfire/ZOE/Hermes coordination

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Ship tool-grounding fix (Decision 1) - rewrite Grep/Read descriptions + add grounding instruction in concierge.ts | @Zaal | PR | This session (immediate) |
| Stand up Promptfoo eval harness in evals/zoe/ (Decision 4) | @Zaal | PR | Before any persona refactor |
| Constitution + Persona refactor of persona.md (Decision 2+3+5) | @Zaal | PR | After eval gate is live |
| Memory hot/warm/cold tiers in memory.ts (Decision 6) | @Zaal | PR | Parallel with Constitution refactor |
| Measure prompt cache hit rate after Constitution lands (Decision 7) | @Zaal | Bot task | After Constitution PR merges |
| Backport Constitution-import pattern to bootloader-template.md so Magnetiq/Attabotty inherit it | @Zaal | PR | After Constitution refactor |

## Sources

Aggregate across all 6 sub-docs: 46 unique sources verified 2026-05-14. Breakdown:

- Anthropic official docs + cookbook (prompt engineering, tool use, extended thinking, prompt caching)
- Letta / MemGPT, Mem0, Zep documentation + benchmarks (LoCoMo)
- ElizaOS persona/character-file architecture
- Promptfoo, Braintrust, Langsmith eval framework docs
- Academic: Li et al. ICML 2024 (attention decay), FACTS Dec 2025 (hallucination benchmark)
- Community: Hacker News threads, Reddit r/ClaudeAI + r/LocalLLaMA, GitHub Discussions/Issues
- Practitioner blogs: DEV Community, Medium, Substack (Neural Horizons)

Per-source detail in each sub-doc's Sources section ([647a](647a-prompt-engineering.md), [647b](647b-memory-architectures.md), [647c](647c-persona-soul-inheritance.md), [647d](647d-tool-use-prompting.md), [647e](647e-anti-hallucination.md), [647f](647f-agent-evals.md)).
