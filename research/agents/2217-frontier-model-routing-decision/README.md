---
topic: agents
type: decision
status: research-complete
last-validated: 2026-08-06
related-docs: "2216, 2214, 2188, 601"
original-query: "Which frontier model for the high-tier OpenRouter escalation, and when to escalate vs use Claude Max / cheap models - decide from community-validated evidence (GitHub, benchmarks, Reddit/X) and upgrade the infra."
tier: DEEP
---

# 2217 - Frontier Model Routing Decision (high-tier escalation)

> **Goal:** Decide, from community-validated evidence, WHICH frontier model ZAO
> escalates to on OpenRouter when it needs the best - and WHEN to escalate vs stay
> on Claude Max / cheap models. Shipped as `OPENROUTER_HIGH_MODEL` + a tier param
> (PR #2900).

## Key Decisions (recommendations first)

| # | Decision | Why (evidence) |
|---|----------|----------------|
| 1 | **High-tier cross-family escalation = GPT-5.5** (`OPENROUTER_HIGH_MODEL` default `openai/gpt-5.5`). | GPT-5.5 is the strongest NON-Claude agentic coder in Aug-2026 benchmarks. Gemini 3.1 Pro clearly trails on multi-file/tool-call work ("don't use it for an agent yet"). Opus 4.8 is best OVERALL but is Claude-family - not a cross-family reviewer. |
| 2 | **Claude Max stays the default** for everything it can do; escalate to frontier only for HIGH-STAKES work; cheap tasks stay DeepSeek. | The routing literature is unanimous: send-everything-to-frontier is the most expensive + often the wrong call. Cost-aware cascade: cheapest that clears the bar, escalate high-stakes only. |
| 3 | **The escalation is money-gated (ZOE_CRITIC_HIGH_TIER, default OFF).** | A frontier-per-review is a real per-call cost; turning it on is Zaal's decision (money), the model choice + wiring is Claude's (technical). |
| 4 | **Monitor the escalation RATE, not just errors.** A drifting verifier silently escalates everything -> pays cheap + frontier on every call. | Two production postmortems: a router that mis-calibrated escalated 60% not 30% and cost went UP 12%. |
| 5 | **For the highest-stakes REVIEW (catching a subtle bug), Opus 4.8 is actually the best** - it caught a planted race condition GPT-5.5 missed and Gemini false-flagged. So the Claude-family critic (same-family) is not worthless; the VALUE of the cross-family GPT-5.5 seat is DIVERSITY + a strong second opinion, not being strictly better than Opus. |

## The evidence (GitHub-first, per the source-hierarchy rule)

### Primary (GitHub - the real harnesses + routers)
- **`vllm-project/semantic-router`** - the reference production router. Its `config.yaml`
  encodes exactly the cascade design we adopted: `request_difficulty` bands
  (fast/balanced/escalated), confidence-threshold escalation (`threshold: 0.72`,
  `escalation_order: small_to_large`, `cost_quality_tradeoff`), `max_escalations: 2`,
  and hallucination/verification plugins. This is the community-validated shape of
  "escalate to the strong model only when confidence is weak."
- Benchmark harnesses referenced: **SWE-bench Verified / Pro**, **Aider Polyglot**,
  **Terminal-Bench 2.1**, **LiveCodeBench** - all public GitHub eval suites; the blog
  tables below are syntheses of these harness runs.
- **`stet` (real-repo coding-agent eval)** - Ben Redmond ran GPT-5.5 vs Opus 4.7 on 56
  real tasks from Zod + graphql-go-tools; GPT-5.5 was the "best shipping default" (28
  clean passes vs Opus 11), Opus wrote smaller but sometimes incomplete patches.

### Benchmark synthesis (Aug 2026, treat single numbers with skepticism - SWE-bench is saturated/contaminated for frontier)
| Model | SWE-bench Verified | SWE-bench Pro (harder, less contaminated) | Terminal-Bench 2.1 | Tool-call acc | $/1M in-out | Family |
|-------|-------------------|-------------------------------------------|--------------------|---------------|-------------|--------|
| **Claude Opus 4.8** | 88.6% | **69.2% (clear lead)** | 74.6% | **94.6%** | $5 / $25 | Claude |
| **GPT-5.5** | ~88.7% | 58.6% | **78.2% (lead)** | 92.1% | $5 / $30 | OpenAI (cross) |
| Gemini 3.1 Pro | 80.6% | 54.2% | 70.3% | 88.4% | $2 / $12 | Google (cross) |

- On the SATURATED SWE-bench Verified, Opus 4.8 (88.6) and GPT-5.5 (88.7) are tied
  (0.1 = noise). On the HARDER SWE-bench Pro (messy real codebases), **Opus leads by
  >10 points** - the number that actually predicts production agentic coding.
- GPT-5.5 wins Terminal-Bench (CI/DevOps/bash) + raw single-hard-problem + speed.
- Gemini 3.1 Pro is cheapest frontier + 1M-2M context, but weakest agentic/tool-call -
  a real 20-task test failed all 4 agentic-computer-use tasks; skip it for an agent.

### Why GPT-5.5 for the CROSS-family seat (not Opus, not Gemini)
- Opus 4.8 is the best coder but is Claude-family - a Claude critic reviewing Claude
  code has family-bias (doc 2214). We want a DIFFERENT family for the cross-family seat.
- Among non-Claude, GPT-5.5 >> Gemini on agentic/multi-file coding + tool-calls.
- So: `OPENROUTER_HIGH_MODEL = openai/gpt-5.5`. (Cheaper code-specialized alt:
  `openai/gpt-5.3-codex` at $1.75/$14, leads Terminal-Bench - a tunable option.)

## The routing design we shipped (matches the literature)

- **Ladder:** Claude Max (default, flat cap) -> cheap DeepSeek (fleet + general cap-fallback)
  -> **frontier cross-family GPT-5.5 (high-stakes only, gated)**. Never blanket-escalate.
- `callCapFallback(system, user, { tier })`: `tier:'high'` routes the OpenRouter attempt
  to `OPENROUTER_HIGH_MODEL`; default `'cheap'` stays DeepSeek. The cross-family critic
  opts into `'high'` only when `ZOE_CRITIC_HIGH_TIER=1`.
- **Cost guard (from the postmortems):** the escalation is default-OFF; when on, watch
  the rate (a drifting trigger silently escalates everything). The critic only escalates
  on complex diffs (the complexity gate, doc 2215) - a natural rate limiter.

## Also See
- [Doc 2216](../../business/2216-cheapest-ai-inference-credits/) - cheapest hosts + credits.
- [Doc 2214](../2214-multimodel-code-review-panel/) - the cross-family panel this feeds.
- `bot/src/zoe/models/router.ts` - `OPENROUTER_HIGH_MODEL`, `callCapFallback` tier (live, PR #2900).

## Next Actions
| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Decide whether to flip ZOE_CRITIC_HIGH_TIER=1 (frontier cross-family review vs cheap DeepSeek) - it's a per-review cost | Zaal | decision | 2026-08-13 |
| If flipped, watch the escalation rate + panel cost in /budget (drift = silent overspend) | Zaal | monitor | ongoing |
| Re-check the frontier leaderboard monthly (Claude Fable 5 at 95% SWE-bench is not yet in tool pickers; revisit when it is) | Zaal | eval | 2026-09-06 |

## Sources

GitHub (primary, per source-hierarchy rule):
- [vllm-project/semantic-router](https://github.com/vllm-project/semantic-router) + its `config/config.yaml` [FULL] - the production cascade/escalation reference.
- Benchmark harnesses (SWE-bench, Aider, Terminal-Bench, LiveCodeBench, stet) - public evals underlying the tables [referenced].

Benchmark syntheses [FULL, exa-read]:
- [Opus 4.8 vs GPT-5.5 vs Gemini 3.1 Pro agentic coding benchmarks - Contra Collective](https://contracollective.com/blog/opus-4-8-vs-gpt-5-5-vs-gemini-3-1-pro-agentic-coding-benchmarks-2026)
- [Best AI for Code Review 2026 - Git AutoReview](https://gitautoreview.com/blog/claude-vs-gemini-vs-chatgpt-code-review)
- [GPT-5.5 vs Opus 4.7 on 56 real coding tasks - Stet (Ben Redmond)](https://www.stet.sh/blog/gpt-55-vs-opus-47)
- [Best AI Model for Coding 2026 - Omid Saffari](https://omidsaffari.com/blog/best-ai-model-for-coding-2026)
- [I Tested Opus 4.8 vs GPT-5.5 vs Gemini on 20 Tasks - Towards AI](https://pub.towardsai.net/i-tested-opus-4-8-vs-gpt-5-5-vs-gemini-3-1-pro-on-20-tasks-opus-embarrassed-both-on-long-context-00a1092ad365)

Routing literature [FULL]:
- [Dynamic Model Routing and Cascading - arXiv 2603.04445](https://arxiv.org/html/2603.04445v2) - routing+cascading survey (FrugalGPT, AutoMix, cascade routing).
- [Intelligent LLM Routing - TrueFoundry](https://www.truefoundry.com/blog/llm-routing-cost-quality-aware-model-selection) - the cost/quality ladder + escalation-rate SLO.
- [Model Routing in Production: When the Router Costs More - tianpan.co](https://tianpan.co/blog/2026-04-18-model-routing-production-when-router-costs-more) - the 12%-cost-increase postmortem.
